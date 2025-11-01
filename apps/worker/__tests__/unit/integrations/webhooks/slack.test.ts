/**
 * Unit tests for Slack webhook handler
 */

// Mock logger FIRST before any imports
jest.mock('../../../../src/core/logging/logger', () => ({
  logger: {
    child: jest.fn(() => ({
      verbose: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    })),
    verbose: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock log module
jest.mock('../../../../src/log', () => ({
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import { Request, Response } from 'express';
import { handleSlackWebhook } from '../../../../src/integrations/webhooks/slack';
import { slackPostMessage, getSlackChannel } from '../../../../src/integrations/actions/slack';
import { answerService } from '../../../../src/core/services/answer-service';

// Mock dependencies
jest.mock('../../../../src/integrations/actions/slack');
jest.mock('../../../../src/core/services/answer-service');

jest.mock('../../../../src/convexClient', () => ({
  Convex: {
    sessions: { start: jest.fn(), end: jest.fn(), list: jest.fn() },
    messages: { append: jest.fn(), bySession: jest.fn() },
    actions: { log: jest.fn(), listBySession: jest.fn() },
    escalations: { upsert: jest.fn() },
    logs: { append: jest.fn(), bySession: jest.fn(), recentSessions: jest.fn() },
  },
}));

jest.mock('../../../../src/env');

describe('Slack Webhook Handler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      body: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      headersSent: false,
    };
  });

  describe('URL Verification', () => {
    it('should handle URL verification challenge', async () => {
      mockReq.body = {
        type: 'url_verification',
        challenge: 'test_challenge_123',
      };

      await handleSlackWebhook(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({ challenge: 'test_challenge_123' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Message Events', () => {
    it('should process message events', async () => {
      const mockAnswer = {
        text: 'This is a test response',
        blocked: false,
      };

      (answerService.answerQuestion as jest.Mock).mockResolvedValue(mockAnswer);
      (getSlackChannel as jest.Mock).mockResolvedValue({ id: 'C123', name: 'test' });
      (slackPostMessage as jest.Mock).mockResolvedValue({ ok: true });

      mockReq.body = {
        type: 'event_callback',
        event: {
          type: 'message',
          channel: 'C123456',
          user: 'U123456',
          text: 'Hello, bot!',
          ts: '1234567890.123456',
        },
      };

      await handleSlackWebhook(mockReq as Request, mockRes as Response);

      expect(mockRes.send).toHaveBeenCalledWith('OK');
      expect(answerService.answerQuestion).toHaveBeenCalled();
      expect(slackPostMessage).toHaveBeenCalled();
    });

    it('should ignore bot messages', async () => {
      mockReq.body = {
        type: 'event_callback',
        event: {
          type: 'message',
          channel: 'C123456',
          user: 'U123456',
          text: 'Hello bot_id=123',
          ts: '1234567890.123456',
        },
      };

      await handleSlackWebhook(mockReq as Request, mockRes as Response);

      expect(answerService.answerQuestion).not.toHaveBeenCalled();
    });

    it('should handle thread replies', async () => {
      const mockAnswer = {
        text: 'Thread reply',
        blocked: false,
      };

      (answerService.answerQuestion as jest.Mock).mockResolvedValue(mockAnswer);
      (getSlackChannel as jest.Mock).mockResolvedValue({ id: 'C123', name: 'test' });
      (slackPostMessage as jest.Mock).mockResolvedValue({ ok: true });

      mockReq.body = {
        type: 'event_callback',
        event: {
          type: 'message',
          channel: 'C123456',
          user: 'U123456',
          text: 'Question?',
          ts: '1234567890.200000',
          thread_ts: '1234567890.100000',
        },
      };

      await handleSlackWebhook(mockReq as Request, mockRes as Response);

      expect(slackPostMessage).toHaveBeenCalledWith(
        expect.any(String),
        'C123456',
        '1234567890.100000'
      );
    });

    it('should not respond if message is blocked', async () => {
      const mockAnswer = {
        blocked: true,
        blockReason: 'Content filtered',
      };

      (answerService.answerQuestion as jest.Mock).mockResolvedValue(mockAnswer);
      (getSlackChannel as jest.Mock).mockResolvedValue({ id: 'C123', name: 'test' });

      mockReq.body = {
        type: 'event_callback',
        event: {
          type: 'message',
          channel: 'C123456',
          user: 'U123456',
          text: 'Blocked content',
          ts: '1234567890.123456',
        },
      };

      await handleSlackWebhook(mockReq as Request, mockRes as Response);

      expect(slackPostMessage).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      mockReq.body = {
        type: 'event_callback',
        event: {
          type: 'message',
          channel: 'C123456',
          user: 'U123456',
          text: 'Test',
          ts: '1234567890.123456',
        },
      };

      (answerService.answerQuestion as jest.Mock).mockRejectedValue(new Error('Test error'));

      await handleSlackWebhook(mockReq as Request, mockRes as Response);

      expect(mockRes.send).toHaveBeenCalledWith('OK');
    });

    it('should return 500 on critical errors', async () => {
      mockReq.body = null;

      await handleSlackWebhook(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});

