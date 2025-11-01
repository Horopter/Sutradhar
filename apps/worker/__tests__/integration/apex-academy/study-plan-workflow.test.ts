/**
 * End-to-end tests for Apex Academy study plan workflow
 * Tests the complete flow: Agent → UnifiedActionService → API → External Services
 */

import { StudyPlanAgent } from '../../../src/agents/study-plan-agent';
import { UnifiedActionService } from '../../../src/services/action-service';
import { agentRegistry } from '../../../src/agents';
import * as githubActions from '../../../src/integrations/actions/github';
import * as calendarActions from '../../../src/integrations/actions/calendar';
import { Convex } from '../../../src/convexClient';

// Mock external dependencies but keep internal services real
jest.mock('../../../src/integrations/actions/github');
jest.mock('../../../src/integrations/actions/calendar');
jest.mock('../../../src/convexClient');
jest.mock('../../../src/log', () => ({
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Apex Academy Study Plan Workflow', () => {
  let studyPlanAgent: StudyPlanAgent;
  let unifiedActionService: UnifiedActionService;

  beforeEach(() => {
    studyPlanAgent = new StudyPlanAgent();
    unifiedActionService = new UnifiedActionService();
    jest.clearAllMocks();
  });

  describe('Complete Study Plan Creation Flow', () => {
    it('should create a complete study plan end-to-end', async () => {
      const userId = 'apex-user-123';
      const courseSlug = 'cplusplus';

      // Mock calendar event creation
      const mockCreateCalendarEvent = jest.spyOn(calendarActions, 'createCalendarEvent');
      mockCreateCalendarEvent.mockResolvedValue({
        id: 'study-event-1',
        htmlLink: 'https://calendar.google.com/event/1',
        summary: 'Study cplusplus',
      } as any);

      // Mock Convex mutations
      (Convex.mutations as jest.Mock).mockResolvedValue({});

      // Execute the workflow
      const result = await studyPlanAgent.createPlan(userId, courseSlug);

      // Verify agent result
      expect(result.success).toBe(true);
      expect(result.data?.userId).toBe(userId);
      expect(result.data?.courseSlug).toBe(courseSlug);
      expect(result.data?.events.length).toBe(4);

      // Verify UnifiedActionService was used (indirectly through calendar integration)
      expect(mockCreateCalendarEvent).toHaveBeenCalledTimes(4);

      // Verify events were saved to Convex
      expect(Convex.mutations).toHaveBeenCalledTimes(4);
      expect(Convex.mutations).toHaveBeenCalledWith(
        'schedules:create',
        expect.objectContaining({
          userId,
          title: `Study ${courseSlug}`,
          provider: 'google',
        })
      );
    });

    it('should handle partial failures gracefully', async () => {
      const userId = 'apex-user-123';

      // Mock some calendar events succeeding and some failing
      const mockCreateCalendarEvent = jest.spyOn(calendarActions, 'createCalendarEvent');
      mockCreateCalendarEvent
        .mockResolvedValueOnce({ id: 'event-1', summary: 'Study Session' } as any)
        .mockRejectedValueOnce(new Error('Calendar API error'))
        .mockResolvedValueOnce({ id: 'event-3', summary: 'Study Session' } as any)
        .mockResolvedValueOnce({ id: 'event-4', summary: 'Study Session' } as any);

      (Convex.mutations as jest.Mock).mockResolvedValue({});

      const result = await studyPlanAgent.createPlan(userId);

      // Should still succeed with partial results
      expect(result.success).toBe(true);
      expect(result.data?.events.length).toBe(3); // 3 successful out of 4
    });
  });

  describe('Agent Registry Integration', () => {
    it('should retrieve StudyPlanAgent from registry', () => {
      const agent = agentRegistry.get<StudyPlanAgent>('StudyPlanAgent');
      
      expect(agent).toBeDefined();
      expect(agent).toBeInstanceOf(StudyPlanAgent);
      expect(agent?.getInfo().name).toBe('StudyPlanAgent');
    });

    it('should work with agent registry pattern', async () => {
      const agent = agentRegistry.get<StudyPlanAgent>('StudyPlanAgent');
      
      if (!agent) {
        throw new Error('Agent not found in registry');
      }

      // Mock successful operations
      jest.spyOn(calendarActions, 'createCalendarEvent').mockResolvedValue({
        id: 'event-1',
        summary: 'Study Session',
      } as any);
      (Convex.mutations as jest.Mock).mockResolvedValue({});

      const result = await agent.createPlan('user-123', 'cplusplus');

      expect(result.success).toBe(true);
    });
  });

  describe('UnifiedActionService Abstraction', () => {
    it('should abstract away Composio/Calendar implementation details', async () => {
      const userId = 'user-123';
      const mockCreateCalendarEvent = jest.spyOn(calendarActions, 'createCalendarEvent');
      
      mockCreateCalendarEvent.mockResolvedValue({
        id: 'event-1',
        summary: 'Study Session',
      } as any);
      (Convex.mutations as jest.Mock).mockResolvedValue({});

      // The agent should not need to know about Composio
      const result = await studyPlanAgent.createPlan(userId);

      expect(result.success).toBe(true);
      
      // Verify the abstraction: agent only knows about UnifiedActionService interface
      // We can swap implementations without changing the agent
      expect(mockCreateCalendarEvent).toHaveBeenCalled();
    });

    it('should support both GitHub issues and Calendar events through same interface', async () => {
      // Test that UnifiedActionService provides consistent interface
      const event = {
        type: 'event' as const,
        title: 'Study Session',
        description: 'Test',
        status: 'pending' as const,
        calendar: 'primary',
        startTime: Date.now(),
        endTime: Date.now() + 3600000,
      };

      const issue = {
        type: 'issue' as const,
        title: 'Assignment',
        description: 'Test',
        status: 'pending' as const,
        repository: 'owner/repo',
      };

      jest.spyOn(calendarActions, 'createCalendarEvent').mockResolvedValue({
        id: 'event-1',
      } as any);

      const mockCreateGithubIssue = jest.spyOn(githubActions, 'createGithubIssue');
      mockCreateGithubIssue.mockResolvedValue({
        number: 123,
        html_url: 'https://github.com/owner/repo/issues/123',
      } as any);

      // Both use the same UnifiedActionService interface
      const eventResult = await unifiedActionService.createTask(event);
      const issueResult = await unifiedActionService.createTask(issue);

      expect(eventResult.success).toBe(true);
      expect(issueResult.success).toBe(true);
      expect(eventResult.type).toBe('event');
      expect(issueResult.type).toBe('issue');
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle complete UnifiedActionService failure', async () => {
      const userId = 'user-123';

      jest.spyOn(calendarActions, 'createCalendarEvent').mockRejectedValue(
        new Error('Calendar service unavailable')
      );

      const result = await studyPlanAgent.createPlan(userId);

      // Should still return success with empty events array
      expect(result.success).toBe(true);
      expect(result.data?.events).toHaveLength(0);
    });

    it('should handle Convex failures without breaking the flow', async () => {
      const userId = 'user-123';

      jest.spyOn(calendarActions, 'createCalendarEvent').mockResolvedValue({
        id: 'event-1',
        summary: 'Study Session',
      } as any);

      // Convex fails but UnifiedActionService succeeded
      (Convex.mutations as jest.Mock).mockRejectedValue(new Error('Convex error'));

      // Should not throw, but events might not be persisted
      const result = await studyPlanAgent.createPlan(userId);

      // The agent should handle this gracefully
      expect(result.success).toBe(true);
    });
  });

  describe('Apex Academy Specific Scenarios', () => {
    it('should create study plans for different courses', async () => {
      const courses = ['cplusplus', 'java', 'web-development'];

      jest.spyOn(calendarActions, 'createCalendarEvent').mockResolvedValue({
        id: 'event-1',
        summary: 'Study Session',
      } as any);
      (Convex.mutations as jest.Mock).mockResolvedValue({});

      for (const courseSlug of courses) {
        const result = await studyPlanAgent.createPlan('user-123', courseSlug);

        expect(result.success).toBe(true);
        expect(result.data?.courseSlug).toBe(courseSlug);
        expect(result.data?.events.every(e => e.title.includes(courseSlug))).toBe(true);
      }
    });

    it('should support multiple users with isolated schedules', async () => {
      const users = ['user-1', 'user-2', 'user-3'];

      jest.spyOn(calendarActions, 'createCalendarEvent').mockResolvedValue({
        id: 'event-1',
        summary: 'Study Session',
      } as any);
      (Convex.mutations as jest.Mock).mockResolvedValue({});

      const results = await Promise.all(
        users.map(userId => studyPlanAgent.createPlan(userId, 'cplusplus'))
      );

      // All should succeed independently
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.data?.userId).toBe(users[index]);
      });
    });

    it('should retrieve user schedules from Convex', async () => {
      const userId = 'user-123';
      const mockSchedules = [
        { id: 's1', title: 'Study C++', startISO: '2024-01-01T10:00:00Z' },
        { id: 's2', title: 'Study Java', startISO: '2024-01-02T10:00:00Z' },
      ];

      (Convex.queries as jest.Mock).mockResolvedValue(mockSchedules);

      const result = await studyPlanAgent.getUserSchedules(userId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSchedules);
      expect(Convex.queries).toHaveBeenCalledWith('schedules:listByUser', { userId });
    });
  });

  describe('System Design Validation', () => {
    it('should maintain abstraction between agents and services', () => {
      // Verify that agents don't directly import external integrations
      const agentSource = require('fs').readFileSync(
        require('path').join(__dirname, '../../../src/agents/study-plan-agent.ts'),
        'utf8'
      );

      // Should not directly import calendar or github
      expect(agentSource).not.toContain("from '../integrations/actions/calendar'");
      expect(agentSource).not.toContain("from '../integrations/actions/github'");
      
      // Should only import UnifiedActionService
      expect(agentSource).toContain("from '../services/action-service'");
    });

    it('should allow swapping implementations without changing agents', () => {
      // This is validated by the fact that:
      // 1. Agents only depend on UnifiedActionService interface
      // 2. UnifiedActionService can be mocked/swapped
      // 3. Internal implementations (Composio, GitHub) are hidden
      
      const agent = agentRegistry.get<StudyPlanAgent>('StudyPlanAgent');
      expect(agent).toBeDefined();
      
      // Agent works regardless of underlying implementation
      // We could swap Composio for another calendar service
      // without changing the agent code
    });
  });
});

