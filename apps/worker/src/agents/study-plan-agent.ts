/**
 * Study Plan Agent
 * Single responsibility: Create spaced repetition study plans and calendar events
 */

import { BaseAgent, AgentResult, AgentContext } from './base-agent';
import { Convex } from '../convexClient';
import { log } from '../log';

export interface StudyPlan {
  userId: string;
  courseSlug?: string;
  events: Array<{
    title: string;
    startISO: string;
    endISO: string;
  }>;
}

// Import action service instance
let actionServiceInstance: any = null;

async function getActionService() {
  if (!actionServiceInstance) {
    const { UnifiedActionService } = await import('../services/action-service');
    actionServiceInstance = new UnifiedActionService();
  }
  return actionServiceInstance;
}

export class StudyPlanAgent extends BaseAgent {
  constructor() {
    super('StudyPlanAgent', 'Creates spaced repetition study plans and calendar events');
  }

  /**
   * Create a 2-week spaced repetition plan
   */
  async createPlan(userId: string, courseSlug?: string, context?: AgentContext): Promise<AgentResult<StudyPlan>> {
    try {
      const now = Date.now();
      const days = [1, 3, 7, 14]; // Spaced repetition intervals
      const events: StudyPlan['events'] = [];
      const createdEvents: StudyPlan['events'] = [];
      
      for (let i = 0; i < days.length; i++) {
        const startTime = new Date(now + days[i] * 24 * 60 * 60 * 1000);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour
        
        const event = {
          title: courseSlug ? `Study ${courseSlug}` : 'Study Session',
          startISO: startTime.toISOString(),
          endISO: endTime.toISOString()
        };
        
        events.push(event);
        
        // Create calendar event via Composio
        try {
          const actionService = await getActionService();
          const result = await actionService.createTask({
            type: 'event',
            title: event.title,
            startTime: startTime.getTime(), // Convert to timestamp
            endTime: endTime.getTime(), // Convert to timestamp
            description: 'Study session scheduled by Apex Academy',
            calendar: 'primary', // Default calendar, can be made configurable
            metadata: {
              userId,
              courseSlug,
              sessionId: context?.sessionId || `schedule_${userId}`
            }
          });
          
          if (result.success) {
            // Save to Convex
            await Convex.mutations('schedules:create', {
              userId,
              title: event.title,
              startISO: event.startISO,
              endISO: event.endISO,
              provider: 'google'
            });
            
            createdEvents.push(event);
          }
        } catch (error: any) {
          log.warn('Failed to create calendar event', { error, event });
        }
      }
      
      return this.success({
        userId,
        courseSlug,
        events: createdEvents
      });
    } catch (error: any) {
      log.error('StudyPlanAgent.createPlan failed', error);
      return this.error(error.message || 'Failed to create study plan');
    }
  }

  /**
   * Get user's study schedules
   */
  async getUserSchedules(userId: string, context?: AgentContext): Promise<AgentResult<any[]>> {
    try {
      const schedules = await Convex.queries('schedules:listByUser', { userId });
      return this.success(Array.isArray(schedules) ? schedules : []);
    } catch (error: any) {
      log.error('StudyPlanAgent.getUserSchedules failed', error);
      return this.error(error.message || 'Failed to get schedules');
    }
  }
}

