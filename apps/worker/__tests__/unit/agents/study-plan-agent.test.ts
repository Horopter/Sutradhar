/**
 * Unit tests for StudyPlanAgent
 * Tests the agent's integration with UnifiedActionService
 */

import { StudyPlanAgent } from '../../../src/agents/study-plan-agent';
import { Convex } from '../../../src/convexClient';

// Create mock service that will be used
const mockCreateTask = jest.fn();
const mockUpdateTask = jest.fn();
const mockGetTask = jest.fn();
const mockDeleteTask = jest.fn();

const mockServiceInstance = {
  createTask: mockCreateTask,
  updateTask: mockUpdateTask,
  getTask: mockGetTask,
  deleteTask: mockDeleteTask,
};

// Mock dependencies BEFORE any imports
jest.mock('../../../src/services/action-service', () => {
  return {
    UnifiedActionService: jest.fn(() => mockServiceInstance),
    unifiedActionService: mockServiceInstance,
  };
});
jest.mock('../../../src/convexClient', () => ({
  Convex: {
    mutations: jest.fn(),
    queries: jest.fn(),
  },
}));
jest.mock('../../../src/log', () => ({
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('StudyPlanAgent', () => {
  let agent: StudyPlanAgent;

  beforeEach(() => {
    // Reset all mocks before each test
    mockCreateTask.mockReset();
    mockUpdateTask.mockReset();
    mockGetTask.mockReset();
    mockDeleteTask.mockReset();
    (Convex.mutations as jest.Mock).mockReset();
    (Convex.queries as jest.Mock).mockReset();
    
    // Create fresh agent instance
    agent = new StudyPlanAgent();
    
    // Clear the cached service instance in the agent by accessing it through dynamic import
    // The agent uses a module-level cache, so we need to clear it
    const agentModule = require('../../../src/agents/study-plan-agent');
    // Force re-import by deleting the cached instance
    if ((agentModule as any).actionServiceInstance !== undefined) {
      (agentModule as any).actionServiceInstance = null;
    }
  });

  describe('createPlan', () => {
    it('should create a spaced repetition study plan with 4 events', async () => {
      const userId = 'user-123';
      const courseSlug = 'cplusplus';

      // Mock successful event creation
      mockCreateTask.mockResolvedValue({
        success: true,
        taskId: 'event-1',
        type: 'event',
      });

      // Mock Convex mutation
      (Convex.mutations as jest.Mock).mockResolvedValue({});

      const result = await agent.createPlan(userId, courseSlug);

      expect(result.success).toBe(true);
      expect(result.data?.userId).toBe(userId);
      expect(result.data?.courseSlug).toBe(courseSlug);
      
      // Should create 4 events (for days 1, 3, 7, 14)
      expect(result.data?.events).toHaveLength(4);
      expect(mockCreateTask).toHaveBeenCalledTimes(4);
      
      // Verify each event has correct structure
      result.data?.events.forEach((event, index) => {
        expect(event.title).toBe(`Study ${courseSlug}`);
        expect(event.startISO).toBeDefined();
        expect(event.endISO).toBeDefined();
      });

      // Verify Convex mutations were called
      expect(Convex.mutations).toHaveBeenCalledTimes(4);
    });

    it('should create events with correct spaced repetition intervals', async () => {
      const userId = 'user-123';
      const now = Date.now();

      mockCreateTask.mockResolvedValue({
        success: true,
        taskId: 'event-1',
        type: 'event',
      });

      (Convex.mutations as jest.Mock).mockResolvedValue({});

      const result = await agent.createPlan(userId);

      expect(result.success).toBe(true);
      
      // Verify the events are scheduled for days 1, 3, 7, 14
      const days = [1, 3, 7, 14];
      result.data?.events.forEach((event, index) => {
        const eventStart = new Date(event.startISO).getTime();
        const expectedStart = now + days[index] * 24 * 60 * 60 * 1000;
        const dayDiff = Math.abs(eventStart - expectedStart) / (24 * 60 * 60 * 1000);
        
        // Allow 1 second tolerance
        expect(dayDiff).toBeLessThan(0.0001);
      });
    });

    it('should handle UnifiedActionService failures gracefully', async () => {
      const userId = 'user-123';

      // Mock some events succeeding and some failing
      mockCreateTask
        .mockResolvedValueOnce({ success: true, taskId: 'event-1' })
        .mockResolvedValueOnce({ success: false, error: 'Calendar API error' })
        .mockResolvedValueOnce({ success: true, taskId: 'event-3' })
        .mockResolvedValueOnce({ success: true, taskId: 'event-4' });

      (Convex.mutations as jest.Mock).mockResolvedValue({});

      const result = await agent.createPlan(userId);

      // Should still succeed but only include successfully created events
      expect(result.success).toBe(true);
      expect(result.data?.events.length).toBeGreaterThan(0);
      expect(result.data?.events.length).toBeLessThan(4);
    });

    it('should handle UnifiedActionService exceptions', async () => {
      const userId = 'user-123';

      mockCreateTask.mockRejectedValue(new Error('Service error'));
      (Convex.mutations as jest.Mock).mockResolvedValue({});

      const result = await agent.createPlan(userId);

      // Should still succeed but with empty events array
      expect(result.success).toBe(true);
      expect(result.data?.events).toHaveLength(0);
    });

    it('should use context.sessionId if provided', async () => {
      const userId = 'user-123';
      const context = { sessionId: 'custom-session-id' };

      mockCreateTask.mockResolvedValue({
        success: true,
        taskId: 'event-1',
        type: 'event',
      });

      (Convex.mutations as jest.Mock).mockResolvedValue({});

      await agent.createPlan(userId, undefined, context);

      // Verify the sessionId was passed in metadata
      expect(mockCreateTask).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            sessionId: 'custom-session-id',
          }),
        })
      );
    });

    it('should generate default sessionId if not provided in context', async () => {
      const userId = 'user-123';

      mockCreateTask.mockResolvedValue({
        success: true,
        taskId: 'event-1',
        type: 'event',
      });

      (Convex.mutations as jest.Mock).mockResolvedValue({});

      await agent.createPlan(userId);

      // Verify the default sessionId format
      expect(mockCreateTask).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            sessionId: `schedule_${userId}`,
          }),
        })
      );
    });

    it('should create events without courseSlug', async () => {
      const userId = 'user-123';

      mockCreateTask.mockResolvedValue({
        success: true,
        taskId: 'event-1',
        type: 'event',
      });

      (Convex.mutations as jest.Mock).mockResolvedValue({});

      const result = await agent.createPlan(userId);

      expect(result.success).toBe(true);
      
      // Verify event titles don't include course slug
      result.data?.events.forEach((event) => {
        expect(event.title).toBe('Study Session');
      });

      expect(mockCreateTask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Study Session',
        })
      );
    });

    it('should create events with proper timestamps (not ISO strings)', async () => {
      const userId = 'user-123';

      mockCreateTask.mockResolvedValue({
        success: true,
        taskId: 'event-1',
        type: 'event',
      });

      (Convex.mutations as jest.Mock).mockResolvedValue({});

      await agent.createPlan(userId);

      // Verify UnifiedActionService was called with numeric timestamps
      const calls = mockCreateTask.mock.calls;
      calls.forEach((call: any[]) => {
        const task = call[0] as any; // Cast to any to check Event-specific properties
        expect(task.type).toBe('event');
        expect(typeof task.startTime).toBe('number');
        expect(typeof task.endTime).toBe('number');
        expect(task.calendar).toBeDefined();
      });
    });

    it('should handle Convex mutation failures gracefully', async () => {
      const userId = 'user-123';

      mockCreateTask.mockResolvedValue({
        success: true,
        taskId: 'event-1',
        type: 'event',
      });

      // Mock Convex mutation failure
      (Convex.mutations as jest.Mock).mockRejectedValue(new Error('Convex error'));

      // Should not throw, but events won't be saved
      const result = await agent.createPlan(userId);

      // The agent should still return success, but events may not be in the result
      // if Convex fails after UnifiedActionService succeeds
      expect(result.success).toBe(true);
    });
  });

  describe('getUserSchedules', () => {
    it('should retrieve user schedules from Convex', async () => {
      const userId = 'user-123';
      const mockSchedules = [
        { id: 's1', title: 'Study C++', startISO: '2024-01-01T10:00:00Z' },
        { id: 's2', title: 'Study Java', startISO: '2024-01-02T10:00:00Z' },
      ];

      (Convex.queries as jest.Mock).mockResolvedValue(mockSchedules);

      const result = await agent.getUserSchedules(userId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSchedules);
      expect(Convex.queries).toHaveBeenCalledWith('schedules:listByUser', { userId });
    });

    it('should handle empty schedules', async () => {
      const userId = 'user-123';

      (Convex.queries as jest.Mock).mockResolvedValue([]);

      const result = await agent.getUserSchedules(userId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle null response from Convex', async () => {
      const userId = 'user-123';

      (Convex.queries as jest.Mock).mockResolvedValue(null);

      const result = await agent.getUserSchedules(userId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle Convex query errors', async () => {
      const userId = 'user-123';

      (Convex.queries as jest.Mock).mockRejectedValue(new Error('Convex query failed'));

      const result = await agent.getUserSchedules(userId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to get schedules');
    });

    it('should pass context if provided', async () => {
      const userId = 'user-123';
      const context = { sessionId: 'test-session' };

      (Convex.queries as jest.Mock).mockResolvedValue([]);

      const result = await agent.getUserSchedules(userId, context);

      // Context is not currently used, but test that it doesn't break
      expect(result.success).toBe(true);
    });
  });

  describe('Agent abstraction', () => {
    it('should properly abstract UnifiedActionService', async () => {
      const userId = 'user-123';

      mockCreateTask.mockResolvedValue({
        success: true,
        taskId: 'event-1',
        type: 'event',
      });

      (Convex.mutations as jest.Mock).mockResolvedValue({});

      await agent.createPlan(userId);

      // Verify that the agent doesn't need to know about Composio, GitHub, etc.
      // It only knows about UnifiedActionService
      expect(mockCreateTask).toHaveBeenCalled();
      
      // The agent should not directly import calendar or github integrations
      // This is verified by the fact that we only mock UnifiedActionService
    });

    it('should return consistent AgentResult format', async () => {
      const userId = 'user-123';

      mockCreateTask.mockResolvedValue({
        success: true,
        taskId: 'event-1',
        type: 'event',
      });

      (Convex.mutations as jest.Mock).mockResolvedValue({});

      const result = await agent.createPlan(userId);

      // Verify AgentResult structure
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('userId');
      expect(result.data).toHaveProperty('events');
      
      if (!result.success) {
        expect(result).toHaveProperty('error');
      }
    });
  });
});
