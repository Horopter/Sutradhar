/**
 * Integration tests for Webhooks API endpoints
 */

import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';

// Mock webhook handlers
jest.mock('../../../../src/integrations/webhooks/slack', () => ({
  handleSlackWebhook: jest.fn(async (req: any, res: any) => {
    if (req.body?.type === 'url_verification') {
      return res.json({ challenge: req.body.challenge });
    }
    return res.status(200).send('OK');
  }),
}));

jest.mock('../../../../src/integrations/webhooks/github', () => ({
  handleGitHubWebhook: jest.fn(async (req: any, res: any) => {
    return res.status(200).send('OK');
  }),
}));

jest.mock('../../../../src/integrations/webhooks/calendar', () => ({
  handleCalendarWebhook: jest.fn(async (req: any, res: any) => {
    return res.status(200).send('OK');
  }),
}));

jest.mock('../../../../src/core/middleware', () => ({
  asyncHandler: (fn: any) => fn,
  rateLimiters: {
    perSession: jest.fn((req: any, res: any, next: any) => next()),
    standard: jest.fn((req: any, res: any, next: any) => next()),
    strict: jest.fn((req: any, res: any, next: any) => next()),
    lenient: jest.fn((req: any, res: any, next: any) => next()),
  },
  timeouts: {
    expensive: jest.fn((req: any, res: any, next: any) => next()),
    standard: jest.fn((req: any, res: any, next: any) => next()),
    indexing: jest.fn((req: any, res: any, next: any) => next()),
  },
  validate: () => jest.fn((req: any, res: any, next: any) => next()),
  deduplicateOperation: jest.fn((key: string, fn: any, ttl: number) => fn()),
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
import { v1Routes } from '../../../../src/routes/v1';

const app = express();
app.use(bodyParser.json());
app.use('/api/v1', v1Routes);

describe('Webhooks API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/webhooks', () => {
    it('should list available webhooks', async () => {
      const response = await request(app)
        .get('/api/v1/webhooks')
        .expect(200);

      expect(response.body.ok).toBe(true);
      expect(response.body.webhooks).toBeDefined();
      expect(Array.isArray(response.body.webhooks)).toBe(true);
    });
  });

  describe('POST /api/v1/webhooks/slack', () => {
    it('should handle Slack URL verification', async () => {
      const response = await request(app)
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
      const response = await request(app)
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
      const response = await request(app)
        .post('/api/v1/webhooks/calendar/primary')
        .send({
          type: 'sync',
        })
        .expect(200);

      expect(response.text).toBe('OK');
    });
  });
});

