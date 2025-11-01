/**
 * Unit tests for Slack actions
 */

import {
  slackPostMessage,
  slackListMessages,
  slackDeleteMessage,
  listSlackChannels,
  getSlackChannel,
  updateSlackMessage,
  getSlackMessage,
} from '../../../../src/integrations/actions/slack';
import { safeAction } from '../../../../src/integrations/actions/client';
import { env } from '../../../../src/env';

// Mock dependencies
jest.mock('../../../../src/integrations/actions/client');
jest.mock('../../../../src/env');
jest.mock('composio-core');
jest.mock('../../../../src/log', () => ({
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
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

describe('Slack Actions', () => {
  const mockSafeAction = safeAction as jest.MockedFunction<typeof safeAction>;

  beforeEach(() => {
    jest.clearAllMocks();

    (env as any).SLACK_CONNECTED_ACCOUNT_ID = 'ac_slack123';
    (env as any).COMPOSIO_USER_ID = 'user_test123';
    (env as any).COMPOSIO_API_KEY = 'key_test123';
    (env as any).SLACK_CHANNEL_ID = 'C123456';
  });

  describe('slackPostMessage', () => {
    it('should post a message successfully', async () => {
      const mockResult = {
        ok: true,
        mocked: false,
        type: 'slack',
        payload: {},
        result: {
          ts: '1234567890.123456',
          permalink: 'https://workspace.slack.com/archives/C123456/p1234567890',
        },
      };

      mockSafeAction.mockResolvedValue(mockResult);

      const result = await slackPostMessage('Hello, world!');

      expect(safeAction).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should support thread replies', async () => {
      mockSafeAction.mockResolvedValue({
        ok: true,
        mocked: false,
        type: 'slack',
        payload: {},
        result: { ts: '1234567890.123456' },
      });

      await slackPostMessage('Reply', 'C123456', '1234567890.000000');

      expect(safeAction).toHaveBeenCalledWith(
        'slack',
        expect.objectContaining({ threadTs: '1234567890.000000' }),
        expect.any(Function)
      );
    });

    it('should use default channel if not provided', async () => {
      mockSafeAction.mockResolvedValue({
        ok: true,
        mocked: false,
        type: 'slack',
        payload: {},
        result: {},
      });

      await slackPostMessage('Test');

      expect(safeAction).toHaveBeenCalledWith(
        'slack',
        expect.objectContaining({ channel: 'C123456' }),
        expect.any(Function)
      );
    });

    it('should throw error if channel ID is missing', async () => {
      (env as any).SLACK_CHANNEL_ID = undefined;

      await expect(slackPostMessage('Test')).rejects.toThrow();
    });
  });

  describe('slackListMessages', () => {
    it('should list messages in a channel', async () => {
      const mockMessages = [
        { ts: '1234567890.1', text: 'Message 1', user: 'U123' },
        { ts: '1234567890.2', text: 'Message 2', user: 'U456' },
      ];

      mockSafeAction.mockResolvedValue({
        ok: true,
        mocked: false,
        type: 'slack-list',
        payload: {},
        result: mockMessages,
      });

      const result = await slackListMessages('C123456', 100);

      expect(result).toEqual(mockMessages);
    });
  });

  describe('slackDeleteMessage', () => {
    it('should delete a message', async () => {
      mockSafeAction.mockResolvedValue({
        ok: true,
        mocked: false,
        type: 'slack-delete',
        payload: {},
        result: {},
      });

      const result = await slackDeleteMessage('C123456', '1234567890.123456');

      expect(result).toBeDefined();
      expect(safeAction).toHaveBeenCalled();
    });
  });

  describe('listSlackChannels', () => {
    it('should list channels', async () => {
      const mockChannels = [
        { id: 'C123', name: 'general' },
        { id: 'C456', name: 'random' },
      ];

      mockSafeAction.mockResolvedValue({
        ok: true,
        mocked: false,
        type: 'slack-list-channels',
        payload: {},
        result: mockChannels,
      });

      const result = await listSlackChannels();

      expect(result).toEqual(mockChannels);
    });
  });

  describe('getSlackChannel', () => {
    it('should get channel information', async () => {
      const mockChannel = {
        id: 'C123456',
        name: 'test-channel',
        is_archived: false,
      };

      mockSafeAction.mockResolvedValue({
        ok: true,
        mocked: false,
        type: 'slack-get-channel',
        payload: {},
        result: mockChannel,
      });

      const result = await getSlackChannel('C123456');

      expect(result).toEqual(mockChannel);
    });
  });

  describe('updateSlackMessage', () => {
    it('should update a message', async () => {
      mockSafeAction.mockResolvedValue({
        ok: true,
        mocked: false,
        type: 'slack-update-message',
        payload: {},
        result: { ts: '1234567890.123456' },
      });

      const result = await updateSlackMessage('C123456', '1234567890.123456', 'Updated text');

      expect(result).toBeDefined();
    });
  });

  describe('getSlackMessage', () => {
    it('should get a specific message', async () => {
      const mockMessage = {
        ts: '1234567890.123456',
        text: 'Test message',
        user: 'U123',
      };

      mockSafeAction.mockResolvedValue({
        ok: true,
        mocked: false,
        type: 'slack-get-message',
        payload: {},
        result: mockMessage,
      });

      const result = await getSlackMessage('C123456', '1234567890.123456');

      expect(result).toEqual(mockMessage);
    });

    it('should return null if message not found', async () => {
      mockSafeAction.mockResolvedValue({
        ok: true,
        mocked: false,
        type: 'slack-get-message',
        payload: {},
        result: null,
      });

      const result = await getSlackMessage('C123456', '1234567890.123456');

      expect(result).toBeNull();
    });
  });
});

