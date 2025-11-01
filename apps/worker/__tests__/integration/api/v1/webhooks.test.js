"use strict";
/**
 * Integration tests for Webhooks API endpoints
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
// Mock webhook handlers
jest.mock('../../../../src/integrations/webhooks/slack', () => ({
    handleSlackWebhook: jest.fn(async (req, res) => {
        if (req.body?.type === 'url_verification') {
            return res.json({ challenge: req.body.challenge });
        }
        return res.status(200).send('OK');
    }),
}));
jest.mock('../../../../src/integrations/webhooks/github', () => ({
    handleGitHubWebhook: jest.fn(async (req, res) => {
        return res.status(200).send('OK');
    }),
}));
jest.mock('../../../../src/integrations/webhooks/calendar', () => ({
    handleCalendarWebhook: jest.fn(async (req, res) => {
        return res.status(200).send('OK');
    }),
}));
jest.mock('../../../../src/core/middleware', () => ({
    asyncHandler: (fn) => fn,
    rateLimiters: {
        perSession: jest.fn((req, res, next) => next()),
        standard: jest.fn((req, res, next) => next()),
        strict: jest.fn((req, res, next) => next()),
        lenient: jest.fn((req, res, next) => next()),
    },
    timeouts: {
        expensive: jest.fn((req, res, next) => next()),
        standard: jest.fn((req, res, next) => next()),
        indexing: jest.fn((req, res, next) => next()),
    },
    validate: () => jest.fn((req, res, next) => next()),
    deduplicateOperation: jest.fn((key, fn, ttl) => fn()),
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
// Import after mocks
const v1_1 = require("../../../../src/routes/v1");
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
app.use('/api/v1', v1_1.v1Routes);
describe('Webhooks API Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('GET /api/v1/webhooks', () => {
        it('should list available webhooks', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/v1/webhooks')
                .expect(200);
            expect(response.body.ok).toBe(true);
            expect(response.body.webhooks).toBeDefined();
            expect(Array.isArray(response.body.webhooks)).toBe(true);
        });
    });
    describe('POST /api/v1/webhooks/slack', () => {
        it('should handle Slack URL verification', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/webhooks/slack')
                .send({
                type: 'url_verification',
                challenge: 'test_challenge_123',
            })
                .expect(200);
            expect(response.body.challenge).toBe('test_challenge_123');
        });
    });
    describe('POST /api/v1/webhooks/github', () => {
        it('should handle GitHub webhook events', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/webhooks/github')
                .set('X-GitHub-Event', 'issue_comment')
                .send({
                action: 'created',
                issue: { number: 123 },
            })
                .expect(200);
            expect(response.text).toBe('OK');
        });
    });
    describe('POST /api/v1/webhooks/calendar/:calendarId', () => {
        it('should handle Calendar webhook events', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/webhooks/calendar/primary')
                .send({
                type: 'sync',
            })
                .expect(200);
            expect(response.text).toBe('OK');
        });
    });
});
