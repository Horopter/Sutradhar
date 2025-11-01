/**
 * Unit tests for GitHub webhook handler
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
import { handleGitHubWebhook } from '../../../../src/integrations/webhooks/github';
import {
  addGithubIssueComment,
  getGithubIssue,
} from '../../../../src/integrations/actions/github';
import { answerService } from '../../../../src/core/services/answer-service';

// Mock dependencies
jest.mock('../../../../src/integrations/actions/github');
jest.mock('../../../../src/core/services/answer-service');
jest.mock('../../../../src/core/logging/logger', () => ({
  logger: {
    child: jest.fn(() => ({
      verbose: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    })),
  },
}));

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

describe('GitHub Webhook Handler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      body: {},
      headers: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      headersSent: false,
    };
  });

  describe('Issue Comment Events', () => {
    it('should process issue comment events', async () => {
      const mockAnswer = {
        finalText: 'This is a helpful response',
        blocked: false,
      };

      const mockIssue = {
        number: 123,
        title: 'Test Issue',
        body: 'Issue description',
      };

      (getGithubIssue as jest.Mock).mockResolvedValue(mockIssue);
      (answerService.answerQuestion as jest.Mock).mockResolvedValue(mockAnswer);
      (addGithubIssueComment as jest.Mock).mockResolvedValue({ ok: true });

      mockReq.headers = { 'x-github-event': 'issue_comment' };
      mockReq.body = {
        action: 'created',
        issue: {
          number: 123,
          title: 'Test Issue',
          body: 'Issue description',
          repository: {
            full_name: 'owner/repo',
            owner: { login: 'owner' },
            name: 'repo',
          },
        },
        comment: {
          id: 1,
          body: 'How do I fix this?',
          user: { login: 'user123' },
        },
      };

      await handleGitHubWebhook(mockReq as Request, mockRes as Response);

      expect(mockRes.send).toHaveBeenCalledWith('OK');
      expect(getGithubIssue).toHaveBeenCalled();
      expect(answerService.answerQuestion).toHaveBeenCalled();
      expect(addGithubIssueComment).toHaveBeenCalled();
    });

    it('should skip non-question comments', async () => {
      mockReq.headers = { 'x-github-event': 'issue_comment' };
      mockReq.body = {
        action: 'created',
        issue: {
          number: 123,
          repository: { full_name: 'owner/repo' },
        },
        comment: {
          body: 'Thanks!', // Not a question
        },
      };

      await handleGitHubWebhook(mockReq as Request, mockRes as Response);

      expect(answerService.answerQuestion).not.toHaveBeenCalled();
    });
  });

  describe('New Issue Events', () => {
    it('should process new issue events', async () => {
      const mockAnswer = {
        finalText: 'Thank you for opening this issue.',
        blocked: false,
      };

      (answerService.answerQuestion as jest.Mock).mockResolvedValue(mockAnswer);
      (addGithubIssueComment as jest.Mock).mockResolvedValue({ ok: true });

      mockReq.headers = { 'x-github-event': 'issues' };
      mockReq.body = {
        action: 'opened',
        issue: {
          number: 124,
          title: 'New Issue',
          body: 'Issue description',
          repository: {
            full_name: 'owner/repo',
            owner: { login: 'owner' },
            name: 'repo',
          },
        },
      };

      await handleGitHubWebhook(mockReq as Request, mockRes as Response);

      expect(answerService.answerQuestion).toHaveBeenCalled();
      expect(addGithubIssueComment).toHaveBeenCalled();
    });
  });

  describe('Issue Reopened Events', () => {
    it('should acknowledge reopened issues', async () => {
      (addGithubIssueComment as jest.Mock).mockResolvedValue({ ok: true });

      mockReq.headers = { 'x-github-event': 'issues' };
      mockReq.body = {
        action: 'reopened',
        issue: {
          number: 125,
          repository: {
            full_name: 'owner/repo',
            owner: { login: 'owner' },
            name: 'repo',
          },
        },
      };

      await handleGitHubWebhook(mockReq as Request, mockRes as Response);

      expect(addGithubIssueComment).toHaveBeenCalledWith(
        'owner',
        'repo',
        125,
        expect.stringContaining('reopened')
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      mockReq.headers = { 'x-github-event': 'issue_comment' };
      mockReq.body = {
        action: 'created',
        issue: { repository: { full_name: 'owner/repo' } },
        comment: { body: 'Test?' },
      };

      (getGithubIssue as jest.Mock).mockRejectedValue(new Error('Test error'));

      await handleGitHubWebhook(mockReq as Request, mockRes as Response);

      expect(mockRes.send).toHaveBeenCalledWith('OK');
    });

    it('should return 500 on critical errors', async () => {
      mockReq.body = null;

      await handleGitHubWebhook(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});

