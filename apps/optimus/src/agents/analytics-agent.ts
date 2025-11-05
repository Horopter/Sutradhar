/**
 * Analytics Agent - Optimus Layer
 * Provides learning analytics, predictions, and insights
 */

import { BaseAgent, AgentResult, AgentContext } from './base-agent';
import { SutradharClient } from '../client/sutradhar-client';

export interface LearningAnalytics {
  userId: string;
  date: string;
  timeSpent: number;
  lessonsCompleted: number;
  quizzesPassed: number;
  codeSubmissions: number;
  averageScore: number;
  engagementScore: number;
}

export interface LearningSession {
  userId: string;
  startedAt: number;
  endedAt: number;
  duration: number;
  activityType: string;
  itemsCompleted: string[];
  engagementScore: number;
}

export interface PredictiveInsight {
  type: 'completion_probability' | 'at_risk' | 'optimal_time' | 'difficulty_prediction';
  value: number;
  confidence: number;
  explanation: string;
}

export class AnalyticsAgent extends BaseAgent {
  constructor(sutradharClient: SutradharClient) {
    super('AnalyticsAgent', 'Provides learning analytics and predictive insights', sutradharClient);
  }

  /**
   * Get comprehensive learning analytics for a user
   */
  async getAnalytics(
    userId: string,
    startDate?: string,
    endDate?: string,
    context?: AgentContext
  ): Promise<AgentResult<LearningAnalytics[]>> {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const end = endDate || new Date().toISOString().split('T')[0];

      const analytics = await this.convexQuery('learningAnalytics:getRange', {
        userId,
        startDate: start,
        endDate: end
      }, context);

      return this.success(analytics || []);
    } catch (error: any) {
      return this.error(error.message || 'Failed to get analytics');
    }
  }

  /**
   * Track a learning session
   */
  async trackSession(
    userId: string,
    activityType: string,
    itemsCompleted: string[],
    context?: AgentContext
  ): Promise<AgentResult<LearningSession>> {
    try {
      const sessionStart = context?.sessionStartTime || Date.now();
      const sessionEnd = Date.now();
      const duration = Math.floor((sessionEnd - sessionStart) / 1000);

      // Calculate engagement score
      const engagementScore = await this.calculateEngagementScore(
        userId,
        duration,
        itemsCompleted.length,
        activityType,
        context
      );

      const session: LearningSession = {
        userId,
        startedAt: sessionStart,
        endedAt: sessionEnd,
        duration,
        activityType,
        itemsCompleted,
        engagementScore
      };

      await this.convexMutation('learningSessions:create', session, context);

      // Update daily analytics
      await this.updateDailyAnalytics(userId, session, context);

      return this.success(session);
    } catch (error: any) {
      return this.error(error.message || 'Failed to track session');
    }
  }

  /**
   * Predict course completion probability
   */
  async predictCompletion(
    userId: string,
    courseSlug: string,
    context?: AgentContext
  ): Promise<AgentResult<PredictiveInsight>> {
    try {
      // Get user progress
      const progress = await this.convexQuery('users:get', { userId }, context);
      const path = await this.convexQuery('learningPaths:get', { userId, courseSlug }, context);
      const events = await this.convexQuery('events:getByUserCourse', { userId, courseSlug, limit: 50 }, context);
      const analytics = await this.convexQuery('learningAnalytics:getRecent', { userId, days: 7 }, context);

      const analysisPrompt = `Predict course completion probability for a student:
- Streak: ${progress?.streak || 0}
- Current lesson: ${path?.currentLesson || 'none'}
- Recent activity: ${events?.length || 0} events
- Recent engagement: ${JSON.stringify(analytics?.slice(0, 7) || [])}

Return JSON: {type: "completion_probability", value: number (0-100), confidence: number (0-100), explanation: string}`;

      const llmResult = await this.executeViaSutradhar(
        'llm-agent',
        'chat',
        {
          system: 'You are an expert in educational analytics. Return only valid JSON.',
          user: analysisPrompt,
          provider: 'openai',
          model: 'gpt-4o-mini'
        },
        context
      );

      if (!llmResult.success || !llmResult.data) {
        return this.error('Failed to predict completion');
      }

      let insight: PredictiveInsight;
      try {
        const text = llmResult.data.text?.trim() || '{}';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        insight = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch (e) {
        insight = {
          type: 'completion_probability',
          value: 50,
          confidence: 50,
          explanation: 'Unable to determine'
        };
      }

      return this.success(insight);
    } catch (error: any) {
      return this.error(error.message || 'Failed to predict completion');
    }
  }

  /**
   * Detect at-risk students
   */
  async detectAtRisk(
    userId: string,
    courseSlug: string,
    context?: AgentContext
  ): Promise<AgentResult<PredictiveInsight>> {
    try {
      const analytics = await this.convexQuery('learningAnalytics:getRecent', { userId, days: 14 }, context);
      const sessions = await this.convexQuery('learningSessions:getRecent', { userId, days: 14 }, context);
      const progress = await this.convexQuery('users:get', { userId }, context);

      // Calculate risk factors
      const daysSinceLastActivity = sessions && sessions.length > 0
        ? Math.floor((Date.now() - sessions[sessions.length - 1].startedAt) / (1000 * 60 * 60 * 24))
        : 999;
      
      const avgEngagement = analytics && analytics.length > 0
        ? analytics.reduce((sum: number, a: any) => sum + (a.engagementScore || 0), 0) / analytics.length
        : 0;

      const streak = progress?.streak || 0;

      const riskFactors = {
        daysSinceLastActivity,
        avgEngagement,
        streak,
        recentDecline: analytics && analytics.length >= 2
          ? analytics[analytics.length - 1].engagementScore < analytics[0].engagementScore
          : false
      };

      const analysisPrompt = `Assess student risk level:
${JSON.stringify(riskFactors)}

Return JSON: {type: "at_risk", value: number (0-100, where 0=low risk, 100=high risk), confidence: number, explanation: string}`;

      const llmResult = await this.executeViaSutradhar(
        'llm-agent',
        'chat',
        {
          system: 'You are an expert in student retention. Return only valid JSON.',
          user: analysisPrompt,
          provider: 'openai',
          model: 'gpt-4o-mini'
        },
        context
      );

      if (!llmResult.success || !llmResult.data) {
        return this.error('Failed to detect risk');
      }

      let insight: PredictiveInsight;
      try {
        const text = llmResult.data.text?.trim() || '{}';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        insight = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch (e) {
        insight = {
          type: 'at_risk',
          value: daysSinceLastActivity > 7 ? 70 : 30,
          confidence: 60,
          explanation: daysSinceLastActivity > 7 ? 'No activity in over a week' : 'Active student'
        };
      }

      return this.success(insight);
    } catch (error: any) {
      return this.error(error.message || 'Failed to detect at-risk status');
    }
  }

  /**
   * Get optimal learning times
   */
  async getOptimalLearningTimes(
    userId: string,
    context?: AgentContext
  ): Promise<AgentResult<PredictiveInsight>> {
    try {
      const sessions = await this.convexQuery('learningSessions:getByUser', { userId, limit: 100 }, context);

      if (!sessions || sessions.length === 0) {
        return this.success({
          type: 'optimal_time',
          value: 14, // 2 PM default
          confidence: 30,
          explanation: 'Not enough data to determine optimal time'
        });
      }

      // Analyze session times
      const hourCounts: Record<number, number> = {};
      let totalEngagement = 0;

      for (const session of sessions) {
        const hour = new Date(session.startedAt).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + (session.engagementScore || 0);
        totalEngagement += session.engagementScore || 0;
      }

      // Find hour with highest engagement
      let bestHour = 14;
      let bestScore = 0;
      for (const [hour, score] of Object.entries(hourCounts)) {
        if (score > bestScore) {
          bestScore = score;
          bestHour = parseInt(hour);
        }
      }

      const confidence = Math.min(90, Math.max(50, sessions.length * 2));

      return this.success({
        type: 'optimal_time',
        value: bestHour,
        confidence,
        explanation: `Best learning time based on ${sessions.length} sessions`
      });
    } catch (error: any) {
      return this.error(error.message || 'Failed to get optimal learning times');
    }
  }

  /**
   * Generate weekly/monthly report
   */
  async generateReport(
    userId: string,
    period: 'week' | 'month',
    context?: AgentContext
  ): Promise<AgentResult<any>> {
    try {
      const days = period === 'week' ? 7 : 30;
      const analytics = await this.convexQuery('learningAnalytics:getRecent', { userId, days }, context);
      const sessions = await this.convexQuery('learningSessions:getRecent', { userId, days }, context);
      const progress = await this.convexQuery('users:get', { userId }, context);

      const totalTime = analytics?.reduce((sum: number, a: any) => sum + (a.timeSpent || 0), 0) || 0;
      const totalLessons = analytics?.reduce((sum: number, a: any) => sum + (a.lessonsCompleted || 0), 0) || 0;
      const totalQuizzes = analytics?.reduce((sum: number, a: any) => sum + (a.quizzesPassed || 0), 0) || 0;
      const avgScore = analytics && analytics.length > 0
        ? analytics.reduce((sum: number, a: any) => sum + (a.averageScore || 0), 0) / analytics.length
        : 0;

      const report = {
        period,
        totalTimeSpent: totalTime,
        lessonsCompleted: totalLessons,
        quizzesPassed: totalQuizzes,
        averageScore: Math.round(avgScore),
        currentStreak: progress?.streak || 0,
        sessions: sessions?.length || 0,
        engagementTrend: this.calculateTrend(analytics || [], 'engagementScore'),
        scoreTrend: this.calculateTrend(analytics || [], 'averageScore'),
        topActivities: this.getTopActivities(sessions || []),
        recommendations: await this.getRecommendationsForReport(userId, analytics, context)
      };

      return this.success(report);
    } catch (error: any) {
      return this.error(error.message || 'Failed to generate report');
    }
  }

  /**
   * Calculate engagement score
   */
  private async calculateEngagementScore(
    userId: string,
    duration: number,
    itemsCompleted: number,
    activityType: string,
    context?: AgentContext
  ): Promise<number> {
    // Base score from duration (max 60 points)
    const durationScore = Math.min(60, duration / 60);
    
    // Items completed (max 30 points)
    const itemsScore = Math.min(30, itemsCompleted * 5);
    
    // Activity type bonus (max 10 points)
    const typeBonus = activityType === 'code' ? 10 : activityType === 'quiz' ? 7 : 5;

    return Math.round(Math.min(100, durationScore + itemsScore + typeBonus));
  }

  /**
   * Update daily analytics
   */
  private async updateDailyAnalytics(
    userId: string,
    session: LearningSession,
    context?: AgentContext
  ): Promise<void> {
    const date = new Date().toISOString().split('T')[0];
    
    const existing = await this.convexQuery('learningAnalytics:getByDate', { userId, date }, context);
    
    if (existing) {
      await this.convexMutation('learningAnalytics:update', {
        userId,
        date,
        timeSpent: existing.timeSpent + Math.floor(session.duration / 60),
        lessonsCompleted: session.activityType === 'lesson' 
          ? existing.lessonsCompleted + session.itemsCompleted.length 
          : existing.lessonsCompleted,
        quizzesPassed: session.activityType === 'quiz'
          ? existing.quizzesPassed + session.itemsCompleted.length
          : existing.quizzesPassed,
        codeSubmissions: session.activityType === 'code'
          ? existing.codeSubmissions + session.itemsCompleted.length
          : existing.codeSubmissions,
        engagementScore: Math.round((existing.engagementScore + session.engagementScore) / 2)
      }, context);
    } else {
      await this.convexMutation('learningAnalytics:create', {
        userId,
        date,
        timeSpent: Math.floor(session.duration / 60),
        lessonsCompleted: session.activityType === 'lesson' ? session.itemsCompleted.length : 0,
        quizzesPassed: session.activityType === 'quiz' ? session.itemsCompleted.length : 0,
        codeSubmissions: session.activityType === 'code' ? session.itemsCompleted.length : 0,
        averageScore: 0,
        engagementScore: session.engagementScore
      }, context);
    }
  }

  /**
   * Calculate trend (improving/declining)
   */
  private calculateTrend(data: any[], field: string): 'improving' | 'declining' | 'stable' {
    if (data.length < 2) return 'stable';
    
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, d) => sum + (d[field] || 0), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + (d[field] || 0), 0) / secondHalf.length;
    
    const diff = secondAvg - firstAvg;
    if (diff > 5) return 'improving';
    if (diff < -5) return 'declining';
    return 'stable';
  }

  /**
   * Get top activities
   */
  private getTopActivities(sessions: LearningSession[]): string[] {
    const activityCounts: Record<string, number> = {};
    
    for (const session of sessions) {
      activityCounts[session.activityType] = (activityCounts[session.activityType] || 0) + 1;
    }
    
    return Object.entries(activityCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);
  }

  /**
   * Get recommendations for report
   */
  private async getRecommendationsForReport(
    userId: string,
    analytics: any[],
    context?: AgentContext
  ): Promise<string[]> {
    if (!analytics || analytics.length === 0) {
      return ['Start your learning journey!'];
    }

    const recent = analytics[analytics.length - 1];
    const recommendations: string[] = [];

    if (recent.engagementScore < 50) {
      recommendations.push('Try increasing your study time to improve engagement');
    }
    
    if (recent.averageScore < 60) {
      recommendations.push('Review previous lessons to strengthen your understanding');
    }

    if (recent.lessonsCompleted === 0) {
      recommendations.push('Complete at least one lesson this week');
    }

    return recommendations.length > 0 ? recommendations : ['Keep up the great work!'];
  }
}

