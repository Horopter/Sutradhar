/**
 * Study Plan Agent - Optimus Layer
 * Uses Sutradhar orchestrator for calendar and scheduling
 */

import { BaseAgent, AgentResult, AgentContext } from './base-agent';
import { SutradharClient } from '../client/sutradhar-client';

export class StudyPlanAgent extends BaseAgent {
  constructor(sutradharClient: SutradharClient) {
    super('StudyPlanAgent', 'Creates spaced repetition study plans', sutradharClient);
  }

  async createPlan(userId: string, courseSlug?: string, context?: AgentContext): Promise<AgentResult<{ planId: string }>> {
    try {
      // TODO: Use Sutradhar to call action agent for calendar events
      // For now, create a simple plan ID
      const planId = `plan_${userId}_${Date.now()}`;
      
      // Use Sutradhar to create calendar events
      const result = await this.executeViaSutradhar(
        'action-agent',
        'execute',
        {
          actionType: 'calendar',
          payload: {
            title: `Study Plan: ${courseSlug || 'General'}`,
            description: 'Scheduled study session',
            startISO: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            endISO: new Date(Date.now() + 86400000 + 3600000).toISOString(),
            sessionId: context?.sessionId
          }
        },
        context
      );
      
      if (!result.success) {
        return this.error('Failed to create calendar events');
      }
      
      return this.success({ planId });
    } catch (error: any) {
      return this.error(error.message || 'Failed to create study plan');
    }
  }

  async getUserSchedules(userId: string, context?: AgentContext): Promise<AgentResult<any[]>> {
    try {
      // Use Sutradhar data-agent
      const schedules = await this.convexQuery('schedules:getByUser', { userId: userId }, context);
      
      return this.success(schedules || []);
    } catch (error: any) {
      return this.error(error.message || 'Failed to get user schedules');
    }
  }
}
