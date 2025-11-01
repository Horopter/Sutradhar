/**
 * Unit tests for UnifiedActionService
 * Tests the abstraction layer for GitHub, Calendar, and other action platforms
 */

import { UnifiedActionService } from '../../../src/services/action-service';
import { Issue, Event, TaskUpdate } from '../../../src/models/action';
import * as githubActions from '../../../src/integrations/actions/github';
import * as calendarActions from '../../../src/integrations/actions/calendar';

// Mock dependencies
jest.mock('../../../src/integrations/actions/github');
jest.mock('../../../src/integrations/actions/calendar');
jest.mock('../../../src/log', () => ({
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));
jest.mock('../../../src/core/logging/logger', () => ({
  logger: {
    child: jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    })),
  },
}));

describe('UnifiedActionService', () => {
  let service: UnifiedActionService;
  const mockCreateGithubIssue = githubActions.createGithubIssue as jest.MockedFunction<typeof githubActions.createGithubIssue>;
  const mockUpdateGithubIssue = githubActions.updateGithubIssue as jest.MockedFunction<typeof githubActions.updateGithubIssue>;
  const mockGetGithubIssue = githubActions.getGithubIssue as jest.MockedFunction<typeof githubActions.getGithubIssue>;

  beforeEach(() => {
    service = new UnifiedActionService();
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    describe('Issue creation', () => {
      it('should create a GitHub issue successfully', async () => {
        const issue: Issue = {
          type: 'issue',
          title: 'Test Issue',
          description: 'Test description',
          status: 'pending',
          repository: 'owner/repo',
        };

        mockCreateGithubIssue.mockResolvedValue({
          number: 123,
          html_url: 'https://github.com/owner/repo/issues/123',
          title: 'Test Issue',
        } as any);

        const result = await service.createTask(issue);

        expect(result.success).toBe(true);
        expect(result.taskId).toBe('123');
        expect(result.type).toBe('issue');
        expect(result.url).toContain('github.com');
        expect(result.metadata?.repository).toBe('owner/repo');
        expect(mockCreateGithubIssue).toHaveBeenCalledWith(
          'Test Issue',
          'Test description',
          'owner/repo'
        );
      });

      it('should handle different response formats', async () => {
        const issue: Issue = {
          type: 'issue',
          title: 'Test Issue',
          description: 'Test description',
          status: 'pending',
          repository: 'owner/repo',
        };

        // Test nested result structure
        mockCreateGithubIssue.mockResolvedValue({
          result: {
            data: {
              number: 456,
              html_url: 'https://github.com/owner/repo/issues/456',
            },
          },
        } as any);

        const result = await service.createTask(issue);

        expect(result.success).toBe(true);
        expect(result.taskId).toBe('456');
      });

      it('should handle invalid repository format', async () => {
        const issue: Issue = {
          type: 'issue',
          title: 'Test Issue',
          description: 'Test description',
          status: 'pending',
          repository: 'invalid-repo',
        };

        const result = await service.createTask(issue);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid repository format');
      });

      it('should handle GitHub API errors', async () => {
        const issue: Issue = {
          type: 'issue',
          title: 'Test Issue',
          description: 'Test description',
          status: 'pending',
          repository: 'owner/repo',
        };

        mockCreateGithubIssue.mockRejectedValue(new Error('GitHub API error'));

        const result = await service.createTask(issue);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Create issue failed');
      });
    });

    describe('Event creation', () => {
      it('should create a calendar event successfully', async () => {
        const event: Event = {
          type: 'event',
          title: 'Study Session',
          description: 'C++ Review',
          status: 'pending',
          calendar: 'primary',
          startTime: Date.now(),
          endTime: Date.now() + 3600000, // 1 hour later
        };

        const mockCreateCalendarEvent = jest.spyOn(calendarActions, 'createCalendarEvent').mockResolvedValue({
          id: 'event-123',
          htmlLink: 'https://calendar.google.com/event/123',
          summary: 'Study Session',
        } as any);

        const result = await service.createTask(event);

        expect(result.success).toBe(true);
        expect(result.taskId).toBe('event-123');
        expect(result.type).toBe('event');
        expect(result.url).toBeDefined();
        expect(result.metadata?.calendarId).toBe('primary');
        expect(mockCreateCalendarEvent).toHaveBeenCalled();
      });

      it('should handle different response formats for events', async () => {
        const event: Event = {
          type: 'event',
          title: 'Study Session',
          description: 'C++ Review',
          status: 'pending',
          calendar: 'primary',
          startTime: Date.now(),
          endTime: Date.now() + 3600000,
        };

        jest.spyOn(calendarActions, 'createCalendarEvent').mockResolvedValue({
          result: {
            data: {
              id: 'event-456',
              htmlLink: 'https://calendar.google.com/event/456',
            },
          },
        } as any);

        const result = await service.createTask(event);

        expect(result.success).toBe(true);
        expect(result.taskId).toBe('event-456');
      });

      it('should handle calendar API errors', async () => {
        const event: Event = {
          type: 'event',
          title: 'Study Session',
          description: 'C++ Review',
          status: 'pending',
          calendar: 'primary',
          startTime: Date.now(),
          endTime: Date.now() + 3600000,
        };

        jest.spyOn(calendarActions, 'createCalendarEvent').mockRejectedValue(new Error('Calendar API error'));

        const result = await service.createTask(event);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Create event failed');
      });
    });

    it('should reject unsupported task types', async () => {
      const task = {
        type: 'custom',
        title: 'Test',
        status: 'pending',
      } as any;

      const result = await service.createTask(task);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported task type');
    });
  });

  describe('updateTask', () => {
    describe('Issue updates', () => {
      it('should update a GitHub issue successfully', async () => {
        const issue: Issue = {
          type: 'issue',
          id: '123',
          title: 'Original Title',
          description: 'Original description',
          status: 'pending',
          repository: 'owner/repo',
        };

        const updates: TaskUpdate = {
          title: 'Updated Title',
          description: 'Updated description',
          status: 'completed',
        };

        mockUpdateGithubIssue.mockResolvedValue({
          html_url: 'https://github.com/owner/repo/issues/123',
          state: 'closed',
        } as any);

        const result = await service.updateTask('123', issue, updates);

        expect(result.success).toBe(true);
        expect(result.taskId).toBe('123');
        expect(mockUpdateGithubIssue).toHaveBeenCalledWith(
          'owner',
          'repo',
          123,
          expect.objectContaining({
            title: 'Updated Title',
            body: 'Updated description',
            state: 'closed',
          })
        );
      });

      it('should preserve existing fields when updating', async () => {
        const issue: Issue = {
          type: 'issue',
          id: '123',
          title: 'Original Title',
          description: 'Original description',
          status: 'pending',
          repository: 'owner/repo',
        };

        const updates: TaskUpdate = {
          status: 'completed',
        };

        mockUpdateGithubIssue.mockResolvedValue({} as any);

        await service.updateTask('123', issue, updates);

        expect(mockUpdateGithubIssue).toHaveBeenCalledWith(
          'owner',
          'repo',
          123,
          expect.objectContaining({
            title: 'Original Title',
            body: 'Original description',
            state: 'closed',
          })
        );
      });

      it('should handle invalid issue number', async () => {
        const issue: Issue = {
          type: 'issue',
          id: '123',
          title: 'Test',
          status: 'pending',
          repository: 'owner/repo',
        };

        const updates: TaskUpdate = { title: 'Updated' };

        const result = await service.updateTask('invalid', issue, updates);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid issue number');
      });
    });

    describe('Event updates', () => {
      it('should update a calendar event successfully', async () => {
        const event: Event = {
          type: 'event',
          id: 'event-123',
          title: 'Original Event',
          description: 'Original description',
          status: 'pending',
          calendar: 'primary',
          startTime: Date.now(),
          endTime: Date.now() + 3600000,
        };

        const updates: TaskUpdate = {
          title: 'Updated Event',
          description: 'Updated description',
        };

        const mockGetCalendarEvent = jest.spyOn(calendarActions, 'getCalendarEvent').mockResolvedValue({
          id: 'event-123',
          summary: 'Original Event',
        } as any);

        const mockUpdateCalendarEvent = jest.spyOn(calendarActions, 'updateCalendarEvent').mockResolvedValue({
          htmlLink: 'https://calendar.google.com/event/123',
        } as any);

        const result = await service.updateTask('event-123', event, updates);

        expect(result.success).toBe(true);
        expect(result.taskId).toBe('event-123');
        expect(mockUpdateCalendarEvent).toHaveBeenCalledWith(
          'primary',
          'event-123',
          expect.objectContaining({
            summary: 'Updated Event',
            description: 'Updated description',
          })
        );
      });

      it('should handle dueDate updates for events', async () => {
        const event: Event = {
          type: 'event',
          id: 'event-123',
          title: 'Test Event',
          status: 'pending',
          calendar: 'primary',
          startTime: Date.now(),
          endTime: Date.now() + 3600000,
        };

        const updates: TaskUpdate = {
          dueDate: Date.now() + 7200000, // 2 hours from now
        };

        jest.spyOn(calendarActions, 'getCalendarEvent').mockResolvedValue({} as any);
        const mockUpdateCalendarEvent = jest.spyOn(calendarActions, 'updateCalendarEvent').mockResolvedValue({} as any);

        await service.updateTask('event-123', event, updates);

        expect(mockUpdateCalendarEvent).toHaveBeenCalledWith(
          'primary',
          'event-123',
          expect.objectContaining({
            start_datetime: expect.any(String),
            end_datetime: expect.any(String),
          })
        );
      });
    });
  });

  describe('getTask', () => {
    it('should get a GitHub issue successfully', async () => {
      mockGetGithubIssue.mockResolvedValue({
        number: 123,
        title: 'Test Issue',
        body: 'Test body',
        state: 'open',
        html_url: 'https://github.com/owner/repo/issues/123',
        labels: [{ name: 'bug' }],
      } as any);

      const result = await service.getTask('123', 'issue', { repository: 'owner/repo' });

      expect(result).not.toBeNull();
      expect(result?.type).toBe('issue');
      expect(result?.title).toBe('Test Issue');
      expect((result as Issue).repository).toBe('owner/repo');
      expect(mockGetGithubIssue).toHaveBeenCalledWith('owner', 'repo', 123);
    });

    it('should require repository for issue retrieval', async () => {
      const result = await service.getTask('123', 'issue', {});

      expect(result).toBeNull();
    });

    it('should get a calendar event successfully', async () => {
      const mockGetCalendarEvent = jest.spyOn(calendarActions, 'getCalendarEvent').mockResolvedValue({
        id: 'event-123',
        summary: 'Test Event',
        description: 'Test description',
        start: { dateTime: new Date().toISOString() },
        end: { dateTime: new Date(Date.now() + 3600000).toISOString() },
        htmlLink: 'https://calendar.google.com/event/123',
        status: 'confirmed',
      } as any);

      const result = await service.getTask('event-123', 'event', { calendarId: 'primary' });

      expect(result).not.toBeNull();
      expect(result?.type).toBe('event');
      expect(result?.title).toBe('Test Event');
      expect((result as Event).calendar).toBe('primary');
      expect(mockGetCalendarEvent).toHaveBeenCalledWith('primary', 'event-123');
    });

    it('should require calendarId for event retrieval', async () => {
      const result = await service.getTask('event-123', 'event', {});

      expect(result).toBeNull();
    });

    it('should handle missing tasks', async () => {
      mockGetGithubIssue.mockResolvedValue(null as any);

      const result = await service.getTask('999', 'issue', { repository: 'owner/repo' });

      expect(result).toBeNull();
    });

    it('should handle invalid issue number format', async () => {
      const result = await service.getTask('not-a-number', 'issue', { repository: 'owner/repo' });

      expect(result).toBeNull();
    });
  });

  describe('deleteTask', () => {
    it('should delete a calendar event successfully', async () => {
      const mockDeleteCalendarEvent = jest.spyOn(calendarActions, 'deleteCalendarEvent').mockResolvedValue(undefined);

      const result = await service.deleteTask('event-123', 'event', { calendarId: 'primary' });

      expect(result).toBe(true);
      expect(mockDeleteCalendarEvent).toHaveBeenCalledWith('primary', 'event-123');
    });

    it('should require calendarId for event deletion', async () => {
      const result = await service.deleteTask('event-123', 'event', {});

      expect(result).toBe(false);
    });

    it('should not delete GitHub issues (they are closed, not deleted)', async () => {
      // Issues don't support deletion, only events do
      // The metadata for deleteTask only supports calendarId, not repository
      const result = await service.deleteTask('123', 'issue', {});

      expect(result).toBe(false);
    });

    it('should handle deletion errors gracefully', async () => {
      jest.spyOn(calendarActions, 'deleteCalendarEvent').mockRejectedValue(new Error('Delete failed'));

      const result = await service.deleteTask('event-123', 'event', { calendarId: 'primary' });

      expect(result).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle all error scenarios gracefully', async () => {
      // Test that errors don't crash the service
      const invalidTask = {
        type: 'issue',
        title: '',
        status: 'pending',
        repository: '',
      } as any;

      const result = await service.createTask(invalidTask);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should preserve error messages from underlying services', async () => {
      mockCreateGithubIssue.mockRejectedValue(new Error('Rate limit exceeded'));

      const issue: Issue = {
        type: 'issue',
        title: 'Test',
        status: 'pending',
        repository: 'owner/repo',
      };

      const result = await service.createTask(issue);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limit exceeded');
    });
  });

  describe('Integration with Apex Academy', () => {
    it('should support StudyPlanAgent use case (creating study events)', async () => {
      const event: Event = {
        type: 'event',
        title: 'Study C++',
        description: 'Study session scheduled by Apex Academy',
        status: 'pending',
        calendar: 'primary',
        startTime: Date.now(),
        endTime: Date.now() + 3600000,
        metadata: {
          userId: 'user-123',
          courseSlug: 'cplusplus',
          sessionId: 'schedule_user-123',
        },
      };

      jest.spyOn(calendarActions, 'createCalendarEvent').mockResolvedValue({
        id: 'study-event-123',
        htmlLink: 'https://calendar.google.com/event/123',
      } as any);

      const result = await service.createTask(event);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe('study-event-123');
      expect(result.metadata?.calendarId).toBe('primary');
    });

    it('should support creating GitHub issues from study plan assignments', async () => {
      const issue: Issue = {
        type: 'issue',
        title: 'Complete C++ Lesson 1 Assignment',
        description: 'Practice exercise from Apex Academy',
        status: 'pending',
        repository: 'apex-academy/assignments',
        metadata: {
          userId: 'user-123',
          courseSlug: 'cplusplus',
          lessonId: 'lesson-1',
        },
      };

      mockCreateGithubIssue.mockResolvedValue({
        number: 456,
        html_url: 'https://github.com/apex-academy/assignments/issues/456',
      } as any);

      const result = await service.createTask(issue);

      expect(result.success).toBe(true);
      expect(result.taskId).toBe('456');
      expect(result.metadata?.repository).toBe('apex-academy/assignments');
    });
  });
});
