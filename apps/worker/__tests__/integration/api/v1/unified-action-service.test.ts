/**
 * Integration tests for UnifiedActionService via API routes
 * Tests the full request/response cycle through Express routes
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

// Mock the unified action service dependencies BEFORE importing server
jest.mock('../../../../src/services/action-service');
jest.mock('../../../../src/integrations/actions/github');
jest.mock('../../../../src/integrations/actions/calendar');
jest.mock('../../../../src/convexClient', () => ({
  Convex: {
    mutations: jest.fn(),
    queries: jest.fn(),
  },
}));

// Mock environment to prevent server from trying to initialize plugins
jest.mock('../../../../src/env', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: '4001',
    MOCK_LLM: 'true',
    MOCK_ACTIONS: 'true',
    MOCK_RETRIEVAL: 'true',
    MOCK_BROWSER: 'true',
    RL_BYPASS: 'true',
  },
}));

import request from 'supertest';
import express from 'express';
import { unifiedActionService } from '../../../../src/services/action-service';
import * as githubActions from '../../../../src/integrations/actions/github';
import * as calendarActions from '../../../../src/integrations/actions/calendar';

// Import routes directly instead of full server to avoid initialization issues
import { router as collaborationRoutes } from '../../../../src/api/v1/collaboration';
import { router as schedulingRoutes } from '../../../../src/api/v1/scheduling';

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/v1', collaborationRoutes);
app.use('/api/unified/scheduling', schedulingRoutes);

const mockUnifiedActionService = unifiedActionService as jest.Mocked<typeof unifiedActionService>;

describe('UnifiedActionService API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Collaboration API (Issues)', () => {
    const baseUrl = '/api/v1/issues';

    describe('POST /api/v1/issues', () => {
      it('should create a GitHub issue via UnifiedActionService', async () => {
        mockUnifiedActionService.createTask = jest.fn().mockResolvedValue({
          success: true,
          taskId: '123',
          type: 'issue',
          url: 'https://github.com/owner/repo/issues/123',
          metadata: {
            repository: 'owner/repo',
            number: 123,
          },
        });

        const response = await request(app)
          .post(baseUrl)
          .send({
            repository: 'owner/repo',
            title: 'Test Issue',
            description: 'Test description',
          })
          .expect(201);

        expect(response.body.ok).toBe(true);
        expect(response.body.result.success).toBe(true);
        expect(response.body.result.taskId).toBe('123');
        expect(mockUnifiedActionService.createTask).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'issue',
            title: 'Test Issue',
            description: 'Test description',
            repository: 'owner/repo',
          })
        );
      });

      it('should validate request body', async () => {
        const response = await request(app)
          .post(baseUrl)
          .send({
            repository: 'owner/repo',
            // Missing title
          })
          .expect(400);

        expect(response.body.ok).toBe(false);
      });

      it('should handle UnifiedActionService errors', async () => {
        mockUnifiedActionService.createTask = jest.fn().mockResolvedValue({
          success: false,
          taskId: '',
          type: 'issue',
          error: 'GitHub API error',
        });

        const response = await request(app)
          .post(baseUrl)
          .send({
            repository: 'owner/repo',
            title: 'Test Issue',
          })
          .expect(500);

        expect(response.body.ok).toBe(false);
        expect(response.body.result.error).toBeDefined();
      });
    });

    describe('GET /api/v1/issues/:issueId', () => {
      it('should retrieve an issue via UnifiedActionService', async () => {
        mockUnifiedActionService.getTask = jest.fn().mockResolvedValue({
          id: '123',
          type: 'issue',
          title: 'Test Issue',
          description: 'Test description',
          status: 'pending',
          repository: 'owner/repo',
          metadata: {
            url: 'https://github.com/owner/repo/issues/123',
            number: 123,
            state: 'open',
          },
        });

        const response = await request(app)
          .get(`${baseUrl}/123`)
          .query({ repository: 'owner/repo' })
          .expect(200);

        expect(response.body.ok).toBe(true);
        expect(response.body.issue.id).toBe('123');
        expect(response.body.issue.title).toBe('Test Issue');
        expect(mockUnifiedActionService.getTask).toHaveBeenCalledWith(
          '123',
          'issue',
          { repository: 'owner/repo' }
        );
      });

      it('should return 404 for non-existent issues', async () => {
        mockUnifiedActionService.getTask = jest.fn().mockResolvedValue(null);

        const response = await request(app)
          .get(`${baseUrl}/999`)
          .query({ repository: 'owner/repo' })
          .expect(404);

        expect(response.body.ok).toBe(false);
        expect(response.body.error).toContain('not found');
      });

      it('should require repository query parameter', async () => {
        const response = await request(app)
          .get(`${baseUrl}/123`)
          .expect(400);

        expect(response.body.ok).toBe(false);
      });
    });

    describe('PUT /api/v1/issues/:issueId', () => {
      it('should update an issue via UnifiedActionService', async () => {
        const existingIssue = {
          id: '123',
          type: 'issue' as const,
          title: 'Original Title',
          description: 'Original description',
          status: 'pending' as const,
          repository: 'owner/repo',
        };

        mockUnifiedActionService.getTask = jest.fn().mockResolvedValue(existingIssue);
        mockUnifiedActionService.updateTask = jest.fn().mockResolvedValue({
          success: true,
          taskId: '123',
          type: 'issue',
          url: 'https://github.com/owner/repo/issues/123',
        });

        const response = await request(app)
          .put(`${baseUrl}/123`)
          .query({ repository: 'owner/repo' })
          .send({
            title: 'Updated Title',
            description: 'Updated description',
            status: 'completed',
          })
          .expect(200);

        expect(response.body.ok).toBe(true);
        expect(response.body.result.success).toBe(true);
        expect(mockUnifiedActionService.updateTask).toHaveBeenCalledWith(
          '123',
          existingIssue,
          expect.objectContaining({
            title: 'Updated Title',
            description: 'Updated description',
            status: 'completed',
          })
        );
      });

      it('should return 404 if issue does not exist', async () => {
        mockUnifiedActionService.getTask = jest.fn().mockResolvedValue(null);

        const response = await request(app)
          .put(`${baseUrl}/999`)
          .query({ repository: 'owner/repo' })
          .send({ title: 'Updated' })
          .expect(404);

        expect(response.body.ok).toBe(false);
      });
    });
  });

  describe('Scheduling API (Events)', () => {
    const baseUrl = '/api/unified/scheduling/events';

    describe('POST /api/unified/scheduling/events', () => {
      it('should create a calendar event via UnifiedActionService', async () => {
        const startTime = Date.now();
        const endTime = startTime + 3600000;

        mockUnifiedActionService.createTask = jest.fn().mockResolvedValue({
          success: true,
          taskId: 'event-123',
          type: 'event',
          url: 'https://calendar.google.com/event/123',
          metadata: {
            calendarId: 'primary',
            startTime,
            endTime,
          },
        });

        const response = await request(app)
          .post(baseUrl)
          .send({
            calendarId: 'primary',
            title: 'Study Session',
            description: 'C++ Review',
            startTime,
            endTime,
          })
          .expect(201);

        expect(response.body.ok).toBe(true);
        expect(response.body.result.success).toBe(true);
        expect(response.body.result.taskId).toBe('event-123');
        expect(mockUnifiedActionService.createTask).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'event',
            title: 'Study Session',
            description: 'C++ Review',
            calendar: 'primary',
            startTime,
            endTime,
          })
        );
      });

      it('should validate event creation request', async () => {
        const response = await request(app)
          .post(baseUrl)
          .send({
            calendarId: 'primary',
            // Missing title and times
          })
          .expect(400);

        expect(response.body.ok).toBe(false);
      });
    });

    describe('GET /api/unified/scheduling/events/:eventId', () => {
      it('should retrieve an event via UnifiedActionService', async () => {
        const event = {
          id: 'event-123',
          type: 'event' as const,
          title: 'Study Session',
          description: 'C++ Review',
          status: 'pending' as const,
          calendar: 'primary',
          startTime: Date.now(),
          endTime: Date.now() + 3600000,
        };

        mockUnifiedActionService.getTask = jest.fn().mockResolvedValue(event);

        const response = await request(app)
          .get(`${baseUrl}/event-123`)
          .query({ calendarId: 'primary' })
          .expect(200);

        expect(response.body.ok).toBe(true);
        expect(response.body.event.id).toBe('event-123');
        expect(response.body.event.title).toBe('Study Session');
        expect(mockUnifiedActionService.getTask).toHaveBeenCalledWith(
          'event-123',
          'event',
          { calendarId: 'primary' }
        );
      });

      it('should return 404 for non-existent events', async () => {
        mockUnifiedActionService.getTask = jest.fn().mockResolvedValue(null);

        const response = await request(app)
          .get(`${baseUrl}/nonexistent`)
          .query({ calendarId: 'primary' })
          .expect(404);

        expect(response.body.ok).toBe(false);
      });
    });

    describe('PUT /api/unified/scheduling/events/:eventId', () => {
      it('should update an event via UnifiedActionService', async () => {
        const existingEvent = {
          id: 'event-123',
          type: 'event' as const,
          title: 'Original Event',
          description: 'Original description',
          status: 'pending' as const,
          calendar: 'primary',
          startTime: Date.now(),
          endTime: Date.now() + 3600000,
        };

        mockUnifiedActionService.getTask = jest.fn().mockResolvedValue(existingEvent);
        mockUnifiedActionService.updateTask = jest.fn().mockResolvedValue({
          success: true,
          taskId: 'event-123',
          type: 'event',
          url: 'https://calendar.google.com/event/123',
        });

        const response = await request(app)
          .put(`${baseUrl}/event-123`)
          .query({ calendarId: 'primary' })
          .send({
            title: 'Updated Event',
            description: 'Updated description',
          })
          .expect(200);

        expect(response.body.ok).toBe(true);
        expect(response.body.result.success).toBe(true);
        expect(mockUnifiedActionService.updateTask).toHaveBeenCalledWith(
          'event-123',
          existingEvent,
          expect.objectContaining({
            title: 'Updated Event',
            description: 'Updated description',
          })
        );
      });
    });

    describe('DELETE /api/unified/scheduling/events/:eventId', () => {
      it('should delete an event via UnifiedActionService', async () => {
        mockUnifiedActionService.deleteTask = jest.fn().mockResolvedValue(true);

        const response = await request(app)
          .delete(`${baseUrl}/event-123`)
          .query({ calendarId: 'primary' })
          .expect(200);

        expect(response.body.ok).toBe(true);
        expect(mockUnifiedActionService.deleteTask).toHaveBeenCalledWith(
          'event-123',
          'event',
          { calendarId: 'primary' }
        );
      });

      it('should handle deletion failures', async () => {
        mockUnifiedActionService.deleteTask = jest.fn().mockResolvedValue(false);

        const response = await request(app)
          .delete(`${baseUrl}/event-123`)
          .query({ calendarId: 'primary' })
          .expect(200);

        expect(response.body.ok).toBe(false);
      });
    });
  });

  describe('Apex Academy Integration', () => {
    it('should support StudyPlanAgent creating study events', async () => {
      const startTime = Date.now();
      const endTime = startTime + 3600000;

      mockUnifiedActionService.createTask = jest.fn().mockResolvedValue({
        success: true,
        taskId: 'study-event-123',
        type: 'event',
        url: 'https://calendar.google.com/event/123',
        metadata: {
          calendarId: 'primary',
          startTime,
          endTime,
        },
      });

      const response = await request(app)
        .post('/api/unified/scheduling/events')
        .send({
          calendarId: 'primary',
          title: 'Study C++',
          description: 'Study session scheduled by Apex Academy',
          startTime,
          endTime,
        })
        .expect(201);

      expect(response.body.ok).toBe(true);
      expect(response.body.result.taskId).toBe('study-event-123');
    });

    it('should support creating assignment issues', async () => {
      mockUnifiedActionService.createTask = jest.fn().mockResolvedValue({
        success: true,
        taskId: '456',
        type: 'issue',
        url: 'https://github.com/apex-academy/assignments/issues/456',
        metadata: {
          repository: 'apex-academy/assignments',
          number: 456,
        },
      });

      const response = await request(app)
        .post('/api/v1/issues')
        .send({
          repository: 'apex-academy/assignments',
          title: 'Complete C++ Lesson 1 Assignment',
          description: 'Practice exercise from Apex Academy',
        })
        .expect(201);

      expect(response.body.ok).toBe(true);
      expect(response.body.result.taskId).toBe('456');
    });
  });

  describe('Error Handling', () => {
    it('should handle service exceptions gracefully', async () => {
      mockUnifiedActionService.createTask = jest.fn().mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/api/v1/issues')
        .send({
          repository: 'owner/repo',
          title: 'Test Issue',
        })
        .expect(500);

      expect(response.body.ok).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should handle validation errors', async () => {
      const response = await request(app)
        .post('/api/v1/issues')
        .send({
          repository: 'invalid', // Invalid format
          title: '', // Empty title
        })
        .expect(400);

      expect(response.body.ok).toBe(false);
    });
  });
});

