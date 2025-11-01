/**
 * Integration tests for GitHub API endpoints
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

import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';

// Mock all dependencies before imports
jest.mock('../../../../src/integrations/actions/github', () => ({
  createGithubIssue: jest.fn(),
  getGithubRepo: jest.fn(),
  listGithubIssues: jest.fn(),
  getGithubIssue: jest.fn(),
  updateGithubIssue: jest.fn(),
  addGithubIssueComment: jest.fn(),
}));

// Import real validate to test actual validation
const { validate: realValidate } = jest.requireActual('../../../../src/core/middleware/validation');

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
  validate: realValidate, // Use real validate function to test validation
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
jest.mock('../../../../src/core/cache', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    has: jest.fn(),
  },
}));

// Import after mocks
import { v1Routes } from '../../../../src/routes/v1';
import { errorHandler } from '../../../../src/core/middleware/error-handler';

const app = express();
app.use(bodyParser.json());
app.use('/api/v1', v1Routes);
app.use(errorHandler); // Add error handler to properly handle validation errors

describe('GitHub API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/github/issues', () => {
    it('should create an issue', async () => {
      const { createGithubIssue } = require('../../../../src/integrations/actions/github');
      (createGithubIssue as jest.Mock).mockResolvedValue({
        ok: true,
        number: 1,
        html_url: 'https://github.com/owner/repo/issues/1',
      });

      const response = await request(app)
        .post('/api/v1/github/issues')
        .send({
          title: 'Test Issue',
          body: 'Issue description',
        })
        .expect(200);

      expect(response.body.ok).toBe(true);
      expect(response.body.issue).toBeDefined();
      expect(createGithubIssue).toHaveBeenCalledWith('Test Issue', 'Issue description', undefined);
    });

    it('should validate required fields', async () => {
      await request(app)
        .post('/api/v1/github/issues')
        .send({
          body: 'Missing title',
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/github/repos/:owner/:repo', () => {
    it('should get repository information', async () => {
      const { getGithubRepo } = require('../../../../src/integrations/actions/github');
      (getGithubRepo as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'repo',
        full_name: 'owner/repo',
        html_url: 'https://github.com/owner/repo',
      });

      const response = await request(app)
        .get('/api/v1/github/repos/owner/repo')
        .expect(200);

      expect(response.body.ok).toBe(true);
      expect(getGithubRepo).toHaveBeenCalledWith('owner', 'repo');
    });
  });

  describe('GET /api/v1/github/repos/:owner/:repo/issues', () => {
    it('should list issues', async () => {
      const { listGithubIssues } = require('../../../../src/integrations/actions/github');
      (listGithubIssues as jest.Mock).mockResolvedValue([
        { number: 1, title: 'Issue 1' },
        { number: 2, title: 'Issue 2' },
      ]);

      const response = await request(app)
        .get('/api/v1/github/repos/owner/repo/issues')
        .expect(200);

      expect(response.body.ok).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.issues).toHaveLength(2);
    });
  });

  describe('GET /api/v1/github/repos/:owner/:repo/issues/:issueNumber', () => {
    it('should get a specific issue', async () => {
      const { getGithubIssue } = require('../../../../src/integrations/actions/github');
      (getGithubIssue as jest.Mock).mockResolvedValue({
        number: 123,
        title: 'Test Issue',
        state: 'open',
      });

      const response = await request(app)
        .get('/api/v1/github/repos/owner/repo/issues/123')
        .expect(200);

      expect(response.body.ok).toBe(true);
      expect(getGithubIssue).toHaveBeenCalledWith('owner', 'repo', 123);
    });
  });

  describe('PATCH /api/v1/github/repos/:owner/:repo/issues/:issueNumber', () => {
    it('should update an issue', async () => {
      const { updateGithubIssue } = require('../../../../src/integrations/actions/github');
      (updateGithubIssue as jest.Mock).mockResolvedValue({
        number: 123,
        title: 'Updated Title',
        state: 'closed',
      });

      const response = await request(app)
        .patch('/api/v1/github/repos/owner/repo/issues/123')
        .send({
          title: 'Updated Title',
          state: 'closed',
        })
        .expect(200);

      expect(response.body.ok).toBe(true);
      expect(updateGithubIssue).toHaveBeenCalledWith(
        'owner',
        'repo',
        123,
        expect.objectContaining({ title: 'Updated Title' })
      );
    });
  });

  describe('POST /api/v1/github/repos/:owner/:repo/issues/:issueNumber/comments', () => {
    it('should add a comment to an issue', async () => {
      const { addGithubIssueComment } = require('../../../../src/integrations/actions/github');
      (addGithubIssueComment as jest.Mock).mockResolvedValue({
        id: 1,
        body: 'Test comment',
      });

      const response = await request(app)
        .post('/api/v1/github/repos/owner/repo/issues/123/comments')
        .send({
          body: 'Test comment',
        })
        .expect(201); // 201 Created is the correct status for creating a comment

      expect(response.body.ok).toBe(true);
      expect(addGithubIssueComment).toHaveBeenCalledWith('owner', 'repo', 123, 'Test comment');
    });
  });
});

