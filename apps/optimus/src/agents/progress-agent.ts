/**
 * Progress Agent - Optimus Layer
 * Uses Sutradhar orchestrator for data operations
 */

import { BaseAgent, AgentResult, AgentContext } from './base-agent';
import { SutradharClient } from '../client/sutradhar-client';

export class ProgressAgent extends BaseAgent {
  constructor(sutradharClient: SutradharClient) {
    super('ProgressAgent', 'Tracks and reports user progress', sutradharClient);
  }

  async getProgress(userId: string, context?: AgentContext): Promise<AgentResult<any>> {
    try {
      // Use Sutradhar data-agent
      const user = await this.convexQuery('users:get', { userId: userId }, context);
      
      if (!user) {
        return this.error('User not found');
      }
      
      return this.success({
        streak: user.streak || 0,
        badges: user.badges || [],
        recentEvents: []
      });
    } catch (error: any) {
      return this.error(error.message || 'Failed to get progress');
    }
  }

  async updateStreak(userId: string, increment: number, context?: AgentContext): Promise<AgentResult<{ streak: number }>> {
    try {
      // Use Sutradhar data-agent
      const result = await this.convexMutation('users:updateStreak', {
        userId: userId,
        increment: increment
      });
      
      return this.success({
        streak: result?.streak || 0
      });
    } catch (error: any) {
      return this.error(error.message || 'Failed to update streak');
    }
  }

  async awardBadge(userId: string, badge: string, context?: AgentContext): Promise<AgentResult<{ awarded: boolean }>> {
    try {
      // Use Sutradhar data-agent
      await this.convexMutation('users:awardBadge', {
        userId: userId,
        badge: badge
      });
      
      return this.success({ awarded: true });
    } catch (error: any) {
      return this.error(error.message || 'Failed to award badge');
    }
  }

  async logEvent(userId: string, type: string, payload: any, context?: AgentContext): Promise<AgentResult<{ logged: boolean }>> {
    try {
      // Use Sutradhar data-agent
      await this.convexMutation('events:create', {
        userId: userId,
        type: type,
        payload: payload,
        timestamp: Date.now()
      });
      
      return this.success({ logged: true });
    } catch (error: any) {
      return this.error(error.message || 'Failed to log event');
    }
  }
}
