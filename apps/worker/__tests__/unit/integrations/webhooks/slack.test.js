"use strict";
/**
 * Unit tests for Slack webhook handler
 */
Object.defineProperty(exports, "__esModule", { value: true });
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
const slack_1 = require("../../../../src/integrations/webhooks/slack");
const slack_2 = require("../../../../src/integrations/actions/slack");
const answer_service_1 = require("../../../../src/core/services/answer-service");
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
    let mockReq;
    let mockRes;
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
            await (0, slack_1.handleSlackWebhook)(mockReq, mockRes);
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
            answer_service_1.answerService.answerQuestion.mockResolvedValue(mockAnswer);
            slack_2.getSlackChannel.mockResolvedValue({ id: 'C123', name: 'test' });
            slack_2.slackPostMessage.mockResolvedValue({ ok: true });
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
            await (0, slack_1.handleSlackWebhook)(mockReq, mockRes);
            expect(mockRes.send).toHaveBeenCalledWith('OK');
            expect(answer_service_1.answerService.answerQuestion).toHaveBeenCalled();
            expect(slack_2.slackPostMessage).toHaveBeenCalled();
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
            await (0, slack_1.handleSlackWebhook)(mockReq, mockRes);
            expect(answer_service_1.answerService.answerQuestion).not.toHaveBeenCalled();
        });
        it('should handle thread replies', async () => {
            const mockAnswer = {
                text: 'Thread reply',
                blocked: false,
            };
            answer_service_1.answerService.answerQuestion.mockResolvedValue(mockAnswer);
            slack_2.getSlackChannel.mockResolvedValue({ id: 'C123', name: 'test' });
            slack_2.slackPostMessage.mockResolvedValue({ ok: true });
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
            await (0, slack_1.handleSlackWebhook)(mockReq, mockRes);
            expect(slack_2.slackPostMessage).toHaveBeenCalledWith(expect.any(String), 'C123456', '1234567890.100000');
        });
        it('should not respond if message is blocked', async () => {
            const mockAnswer = {
                blocked: true,
                blockReason: 'Content filtered',
            };
            answer_service_1.answerService.answerQuestion.mockResolvedValue(mockAnswer);
            slack_2.getSlackChannel.mockResolvedValue({ id: 'C123', name: 'test' });
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
            await (0, slack_1.handleSlackWebhook)(mockReq, mockRes);
            expect(slack_2.slackPostMessage).not.toHaveBeenCalled();
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
            answer_service_1.answerService.answerQuestion.mockRejectedValue(new Error('Test error'));
            await (0, slack_1.handleSlackWebhook)(mockReq, mockRes);
            expect(mockRes.send).toHaveBeenCalledWith('OK');
        });
        it('should return 500 on critical errors', async () => {
            mockReq.body = null;
            await (0, slack_1.handleSlackWebhook)(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });
});
