"use strict";
/**
 * Unit tests for Slack actions
 */
Object.defineProperty(exports, "__esModule", { value: true });
const slack_1 = require("../../../../src/integrations/actions/slack");
const client_1 = require("../../../../src/integrations/actions/client");
const env_1 = require("../../../../src/env");
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
    const mockSafeAction = client_1.safeAction;
    beforeEach(() => {
        jest.clearAllMocks();
        env_1.env.SLACK_CONNECTED_ACCOUNT_ID = 'ac_slack123';
        env_1.env.COMPOSIO_USER_ID = 'user_test123';
        env_1.env.COMPOSIO_API_KEY = 'key_test123';
        env_1.env.SLACK_CHANNEL_ID = 'C123456';
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
            const result = await (0, slack_1.slackPostMessage)('Hello, world!');
            expect(client_1.safeAction).toHaveBeenCalled();
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
            await (0, slack_1.slackPostMessage)('Reply', 'C123456', '1234567890.000000');
            expect(client_1.safeAction).toHaveBeenCalledWith('slack', expect.objectContaining({ threadTs: '1234567890.000000' }), expect.any(Function));
        });
        it('should use default channel if not provided', async () => {
            mockSafeAction.mockResolvedValue({
                ok: true,
                mocked: false,
                type: 'slack',
                payload: {},
                result: {},
            });
            await (0, slack_1.slackPostMessage)('Test');
            expect(client_1.safeAction).toHaveBeenCalledWith('slack', expect.objectContaining({ channel: 'C123456' }), expect.any(Function));
        });
        it('should throw error if channel ID is missing', async () => {
            env_1.env.SLACK_CHANNEL_ID = undefined;
            await expect((0, slack_1.slackPostMessage)('Test')).rejects.toThrow();
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
            const result = await (0, slack_1.slackListMessages)('C123456', 100);
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
            const result = await (0, slack_1.slackDeleteMessage)('C123456', '1234567890.123456');
            expect(result).toBeDefined();
            expect(client_1.safeAction).toHaveBeenCalled();
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
            const result = await (0, slack_1.listSlackChannels)();
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
            const result = await (0, slack_1.getSlackChannel)('C123456');
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
            const result = await (0, slack_1.updateSlackMessage)('C123456', '1234567890.123456', 'Updated text');
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
            const result = await (0, slack_1.getSlackMessage)('C123456', '1234567890.123456');
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
            const result = await (0, slack_1.getSlackMessage)('C123456', '1234567890.123456');
            expect(result).toBeNull();
        });
    });
});
