/**
 * Gamification Agent - Optimus Layer
 * Manages badges, points, achievements, and leaderboards
 */

import { BaseAgent, AgentResult, AgentContext } from './base-agent';
import { SutradharClient } from '../client/sutradhar-client';

export interface Achievement {
  badgeId: string;
  badgeName: string;
  badgeType: 'completion' | 'mastery' | 'consistency' | 'special';
  badgeIcon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface PointsTransaction {
  userId: string;
  amount: number;
  source: string;
  description: string;
}

export interface LeaderboardEntry {
  userId: string;
  score: number;
  rank: number;
}

export class GamificationAgent extends BaseAgent {
  // Badge definitions
  private badgeDefinitions: Record<string, Achievement> = {
    // Completion badges
    'first_lesson': { badgeId: 'first_lesson', badgeName: 'First Steps', badgeType: 'completion', badgeIcon: '🎯', rarity: 'common' },
    'first_quiz': { badgeId: 'first_quiz', badgeName: 'Quiz Master', badgeType: 'completion', badgeIcon: '📝', rarity: 'common' },
    'first_code': { badgeId: 'first_code', badgeName: 'Code Warrior', badgeType: 'completion', badgeIcon: '💻', rarity: 'common' },
    'course_complete': { badgeId: 'course_complete', badgeName: 'Course Graduate', badgeType: 'completion', badgeIcon: '🎓', rarity: 'rare' },
    
    // Mastery badges
    'perfect_quiz': { badgeId: 'perfect_quiz', badgeName: 'Perfect Score', badgeType: 'mastery', badgeIcon: '⭐', rarity: 'rare' },
    'fast_learner': { badgeId: 'fast_learner', badgeName: 'Speed Demon', badgeType: 'mastery', badgeIcon: '⚡', rarity: 'rare' },
    'code_master': { badgeId: 'code_master', badgeName: 'Code Master', badgeType: 'mastery', badgeIcon: '👑', rarity: 'epic' },
    
    // Consistency badges
    'streak_7': { badgeId: 'streak_7', badgeName: 'Week Warrior', badgeType: 'consistency', badgeIcon: '🔥', rarity: 'common' },
    'streak_30': { badgeId: 'streak_30', badgeName: 'Monthly Master', badgeType: 'consistency', badgeIcon: '🔥🔥', rarity: 'rare' },
    'streak_100': { badgeId: 'streak_100', badgeName: 'Century Club', badgeType: 'consistency', badgeIcon: '🔥🔥🔥', rarity: 'epic' },
    
    // Special badges
    'early_adopter': { badgeId: 'early_adopter', badgeName: 'Early Adopter', badgeType: 'special', badgeIcon: '🌱', rarity: 'legendary' },
    'helper': { badgeId: 'helper', badgeName: 'Community Helper', badgeType: 'special', badgeIcon: '🤝', rarity: 'rare' },
    'mentor': { badgeId: 'mentor', badgeName: 'Mentor', badgeType: 'special', badgeIcon: '🎓', rarity: 'epic' }
  };

  constructor(sutradharClient: SutradharClient) {
    super('GamificationAgent', 'Manages achievements, points, and leaderboards', sutradharClient);
  }

  /**
   * Award a badge to a user
   */
  async awardBadge(
    userId: string,
    badgeId: string,
    context?: AgentContext
  ): Promise<AgentResult<Achievement>> {
    try {
      const badgeDef = this.badgeDefinitions[badgeId];
      if (!badgeDef) {
        return this.error(`Badge ${badgeId} not found`);
      }

      // Check if already earned
      const existing = await this.convexQuery('achievements:getByBadge', {
        userId,
        badgeId
      }, context);

      if (existing) {
        return this.success(badgeDef);
      }

      // Award badge
      await this.convexMutation('achievements:create', {
        userId,
        ...badgeDef,
        earnedAt: Date.now()
      }, context);

      // Award points for badge
      await this.addPoints(userId, this.getBadgePoints(badgeDef.rarity), `badge_${badgeId}`, context);

      return this.success(badgeDef);
    } catch (error: any) {
      return this.error(error.message || 'Failed to award badge');
    }
  }

  /**
   * Check and award badges based on user activity
   */
  async checkAndAwardBadges(
    userId: string,
    eventType: string,
    eventData: any,
    context?: AgentContext
  ): Promise<AgentResult<Achievement[]>> {
    try {
      const awarded: Achievement[] = [];
      const user = await this.convexQuery('users:get', { userId }, context);
      const events = await this.convexQuery('events:getByUser', { userId, limit: 100 }, context);
      const quizAttempts = await this.convexQuery('quizAttempts:getByUser', { userId }, context);
      const codeSubmissions = await this.convexQuery('codeSubmissions:getByUser', { userId }, context);

      // Check completion badges
      if (eventType === 'lesson_complete' && events?.filter((e: any) => e.type === 'lesson_complete').length === 1) {
        const result = await this.awardBadge(userId, 'first_lesson', context);
        if (result.success) awarded.push(result.data!);
      }

      if (eventType === 'quiz_attempt' && quizAttempts?.length === 1) {
        const result = await this.awardBadge(userId, 'first_quiz', context);
        if (result.success) awarded.push(result.data!);
      }

      if (eventType === 'code_submit' && codeSubmissions?.length === 1) {
        const result = await this.awardBadge(userId, 'first_code', context);
        if (result.success) awarded.push(result.data!);
      }

      // Check mastery badges
      if (eventType === 'quiz_attempt' && eventData?.score === 100) {
        const result = await this.awardBadge(userId, 'perfect_quiz', context);
        if (result.success) awarded.push(result.data!);
      }

      // Check consistency badges
      const streak = user?.streak || 0;
      if (streak === 7) {
        const result = await this.awardBadge(userId, 'streak_7', context);
        if (result.success) awarded.push(result.data!);
      } else if (streak === 30) {
        const result = await this.awardBadge(userId, 'streak_30', context);
        if (result.success) awarded.push(result.data!);
      } else if (streak === 100) {
        const result = await this.awardBadge(userId, 'streak_100', context);
        if (result.success) awarded.push(result.data!);
      }

      return this.success(awarded);
    } catch (error: any) {
      return this.error(error.message || 'Failed to check badges');
    }
  }

  /**
   * Add points to user
   */
  async addPoints(
    userId: string,
    amount: number,
    source: string,
    context?: AgentContext
  ): Promise<AgentResult<{ totalPoints: number }>> {
    try {
      const description = this.getPointsDescription(source, amount);
      
      await this.convexMutation('points:create', {
        userId,
        amount,
        source,
        description,
        createdAt: Date.now()
      }, context);

      // Update leaderboard
      await this.updateLeaderboard(userId, amount, context);

      const totalPoints = await this.getTotalPoints(userId, context);

      return this.success({ totalPoints });
    } catch (error: any) {
      return this.error(error.message || 'Failed to add points');
    }
  }

  /**
   * Get user's total points
   */
  async getTotalPoints(
    userId: string,
    context?: AgentContext
  ): Promise<number> {
    try {
      const points = await this.convexQuery('points:getByUser', { userId }, context);
      return points?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get user's achievements
   */
  async getUserAchievements(
    userId: string,
    context?: AgentContext
  ): Promise<AgentResult<Achievement[]>> {
    try {
      const achievements = await this.convexQuery('achievements:getByUser', { userId }, context);
      return this.success(achievements || []);
    } catch (error: any) {
      return this.error(error.message || 'Failed to get achievements');
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(
    type: 'global' | 'course' | 'weekly' | 'monthly',
    courseSlug?: string,
    limit: number = 100,
    context?: AgentContext
  ): Promise<AgentResult<LeaderboardEntry[]>> {
    try {
      const period = type === 'weekly' ? 'week' : type === 'monthly' ? 'month' : 'all_time';
      
      const entries = await this.convexQuery('leaderboards:get', {
        type,
        courseSlug,
        period,
        limit
      }, context);

      return this.success(entries || []);
    } catch (error: any) {
      return this.error(error.message || 'Failed to get leaderboard');
    }
  }

  /**
   * Get user's rank
   */
  async getUserRank(
    userId: string,
    type: 'global' | 'course' | 'weekly' | 'monthly',
    courseSlug?: string,
    context?: AgentContext
  ): Promise<AgentResult<{ rank: number; score: number }>> {
    try {
      const leaderboard = await this.getLeaderboard(type, courseSlug, 1000, context);
      
      if (!leaderboard.success || !leaderboard.data) {
        return this.error('Failed to get leaderboard');
      }

      const entry = leaderboard.data.find((e: LeaderboardEntry) => e.userId === userId);
      
      if (!entry) {
        return this.success({ rank: 0, score: 0 });
      }

      return this.success({ rank: entry.rank, score: entry.score });
    } catch (error: any) {
      return this.error(error.message || 'Failed to get rank');
    }
  }

  /**
   * Update leaderboard
   */
  private async updateLeaderboard(
    userId: string,
    pointsAdded: number,
    context?: AgentContext
  ): Promise<void> {
    try {
      const totalPoints = await this.getTotalPoints(userId, context);
      
      // Update global leaderboard
      await this.convexMutation('leaderboards:upsert', {
        type: 'global',
        userId,
        score: totalPoints,
        period: 'all_time',
        updatedAt: Date.now()
      }, context);

      // Update weekly leaderboard
      await this.convexMutation('leaderboards:upsert', {
        type: 'weekly',
        userId,
        score: totalPoints,
        period: 'week',
        updatedAt: Date.now()
      }, context);

      // Recalculate ranks
      await this.recalculateRanks('global', undefined, context);
      await this.recalculateRanks('weekly', undefined, context);
    } catch (error) {
      // Non-fatal
    }
  }

  /**
   * Recalculate ranks for a leaderboard
   */
  private async recalculateRanks(
    type: string,
    courseSlug: string | undefined,
    context?: AgentContext
  ): Promise<void> {
    try {
      const period = type === 'weekly' ? 'week' : type === 'monthly' ? 'month' : 'all_time';
      const entries = await this.convexQuery('leaderboards:getAll', { type, courseSlug, period }, context);
      
      entries.sort((a: any, b: any) => b.score - a.score);
      
      for (let i = 0; i < entries.length; i++) {
        await this.convexMutation('leaderboards:updateRank', {
          type,
          courseSlug,
          userId: entries[i].userId,
          rank: i + 1,
          period
        }, context);
      }
    } catch (error) {
      // Non-fatal
    }
  }

  /**
   * Get points description
   */
  private getPointsDescription(source: string, amount: number): string {
    const descriptions: Record<string, string> = {
      'lesson_complete': `Completed a lesson (+${amount} points)`,
      'quiz_pass': `Passed a quiz (+${amount} points)`,
      'quiz_perfect': `Perfect quiz score! (+${amount} points)`,
      'code_submit': `Submitted code (+${amount} points)`,
      'code_pass': `Code passed all tests (+${amount} points)`,
      'streak_bonus': `Daily streak bonus (+${amount} points)`,
      'badge_common': `Earned a badge (+${amount} points)`,
      'badge_rare': `Earned a rare badge (+${amount} points)`,
      'badge_epic': `Earned an epic badge (+${amount} points)`,
      'badge_legendary': `Earned a legendary badge (+${amount} points)`
    };

    return descriptions[source] || `Earned ${amount} points`;
  }

  /**
   * Get badge points value
   */
  private getBadgePoints(rarity: string): number {
    const points: Record<string, number> = {
      'common': 10,
      'rare': 50,
      'epic': 100,
      'legendary': 500
    };
    return points[rarity] || 10;
  }

  /**
   * Get points for activity
   */
  getActivityPoints(activityType: string, performance?: number): number {
    const basePoints: Record<string, number> = {
      'lesson_complete': 10,
      'quiz_pass': 20,
      'quiz_perfect': 50,
      'code_submit': 15,
      'code_pass': 30,
      'forum_post': 5,
      'forum_reply': 3
    };

    const base = basePoints[activityType] || 5;
    
    // Bonus for performance
    if (performance !== undefined && performance >= 90) {
      return Math.round(base * 1.5);
    }
    
    return base;
  }
}

