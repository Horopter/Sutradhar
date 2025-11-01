/**
 * Progress Agent
 * Single responsibility: Track and report user progress
 */

import { BaseAgent, AgentResult, AgentContext } from './base-agent';
import { Convex } from '../convexClient';
import { log } from '../log';

export interface ProgressSummary {
  userId: string;
  streak: number;
  badges: string[];
  quizAttempts: number;
  passedQuizzes: number;
  recentEvents: any[];
}

export class ProgressAgent extends BaseAgent {
  constructor() {
    super('ProgressAgent', 'Tracks and reports user progress');
  }

  /**
   * Get user progress summary
   */
  async getProgress(userId: string, context?: AgentContext): Promise<AgentResult<ProgressSummary>> {
    try {
      const [user, attempts, events] = await Promise.all([
        Convex.queries('users:get', { userId: userId as any }),
        Convex.queries('quizzes:getAttempts', { userId }),
        Convex.queries('events:getByUser', { userId, limit: 100 })
      ]);
      
      if (!user) {
        return this.error('User not found');
      }
      
      const passedQuizzes = (attempts || []).filter((a: any) => a.passed).length;
      
      return this.success({
        userId,
        streak: user.streak || 0,
        badges: user.badges || [],
        quizAttempts: (attempts || []).length,
        passedQuizzes,
        recentEvents: (events || []).slice(0, 10)
      });
    } catch (error: any) {
      log.error('ProgressAgent.getProgress failed', error);
      return this.error(error.message || 'Failed to get progress');
    }
  }

  /**
   * Update user streak
   */
  async updateStreak(userId: string, increment: number = 1, context?: AgentContext): Promise<AgentResult<{ streak: number }>> {
    try {
      await Convex.mutations('users:updateStreak', { userId: userId as any, increment });
      const user = await Convex.queries('users:get', { userId: userId as any });
      
      return this.success({
        streak: user?.streak || 0
      });
    } catch (error: any) {
      log.error('ProgressAgent.updateStreak failed', error);
      return this.error(error.message || 'Failed to update streak');
    }
  }

  /**
   * Award a badge
   */
  async awardBadge(userId: string, badge: string, context?: AgentContext): Promise<AgentResult<{ badges: string[] }>> {
    try {
      await Convex.mutations('users:addBadge', { userId: userId as any, badge });
      const user = await Convex.queries('users:get', { userId: userId as any });
      
      return this.success({
        badges: user?.badges || []
      });
    } catch (error: any) {
      log.error('ProgressAgent.awardBadge failed', error);
      return this.error(error.message || 'Failed to award badge');
    }
  }

  /**
   * Log a user event
   */
  async logEvent(userId: string, type: string, payload?: any, context?: AgentContext): Promise<AgentResult<{ eventId: string }>> {
    try {
      await Convex.mutations('events:log', {
        userId,
        type,
        payload: payload || {}
      });
      
      return this.success({ eventId: 'logged' });
    } catch (error: any) {
      log.error('ProgressAgent.logEvent failed', error);
      return this.error(error.message || 'Failed to log event');
    }
  }
}

