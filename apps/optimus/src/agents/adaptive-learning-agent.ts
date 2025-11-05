/**
 * Adaptive Learning Agent - Optimus Layer
 * Provides personalized learning paths, recommendations, and adaptive difficulty
 */

import { BaseAgent, AgentResult, AgentContext } from './base-agent';
import { SutradharClient } from '../client/sutradhar-client';

export interface LearningPath {
  userId: string;
  courseSlug: string;
  lessons: string[];
  order: number[];
  difficulty: string;
  currentLesson: string;
  startedAt: number;
}

export interface Recommendation {
  type: 'course' | 'lesson' | 'practice';
  itemId: string;
  reason: string;
  score: number;
}

export interface LearningPreference {
  learningStyle: 'visual' | 'auditory' | 'reading' | 'kinesthetic';
  preferredFormat: string[];
  pace: 'slow' | 'normal' | 'fast';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export class AdaptiveLearningAgent extends BaseAgent {
  constructor(sutradharClient: SutradharClient) {
    super('AdaptiveLearningAgent', 'Personalizes learning paths and recommendations', sutradharClient);
  }

  /**
   * Create or update a personalized learning path
   */
  async createLearningPath(
    userId: string,
    courseSlug: string,
    context?: AgentContext
  ): Promise<AgentResult<LearningPath>> {
    try {
      // Get user's learning preferences
      const preferences = await this.convexQuery('learningPreferences:get', { userId }, context);
      
      // Get course lessons - try Convex first, fallback to CourseAgent
      let lessons: any[] = await this.convexQuery('lessons:listByCourse', { courseSlug }, context) || [];
      
      // If Convex has no lessons, get from CourseAgent (file system)
      if (!lessons || lessons.length === 0) {
        const { CourseAgent } = await import('./course-agent');
        const courseAgent = new CourseAgent(this.sutradharClient);
        const lessonsResult = await courseAgent.listLessons(courseSlug, context);
        if (lessonsResult.success && lessonsResult.data) {
          lessons = lessonsResult.data.map((l: any) => ({ lessonId: l.id, title: l.title }));
        }
      }
      
      // Analyze user's skill level
      const skillLevel = await this.assessSkillLevel(userId, courseSlug, context);
      
      // Generate personalized path using LLM
      const pathPrompt = `Create a personalized learning path for a user with:
- Learning style: ${preferences?.learningStyle || 'reading'}
- Preferred pace: ${preferences?.pace || 'normal'}
- Skill level: ${skillLevel}
- Course: ${courseSlug}
- Available lessons: ${lessons.map((l: any) => l.lessonId).join(', ')}

Generate an ordered list of lesson IDs that best fits this user's needs. Return JSON: {lessons: string[], order: number[], difficulty: string}`;

      const llmResult = await this.executeViaSutradhar(
        'llm-agent',
        'chat',
        {
          system: 'You are an expert learning path designer. Return only valid JSON.',
          user: pathPrompt,
          provider: 'openai',
          model: 'gpt-4o-mini'
        },
        context
      );

      if (!llmResult.success || !llmResult.data) {
        return this.error('Failed to generate learning path');
      }

      let pathData: any;
      try {
        const text = llmResult.data.text?.trim() || '{}';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        pathData = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch (e) {
        // Fallback to default path
        pathData = {
          lessons: lessons.map((l: any) => l.lessonId),
          order: lessons.map((_: any, i: number) => i),
          difficulty: preferences?.difficulty || 'intermediate'
        };
      }

      // Save or update learning path
      const existingPath = await this.convexQuery('learningPaths:get', { userId, courseSlug }, context);
      
      const path: LearningPath = {
        userId,
        courseSlug,
        lessons: pathData.lessons || [],
        order: pathData.order || [],
        difficulty: pathData.difficulty || 'intermediate',
        currentLesson: existingPath?.currentLesson || pathData.lessons[0] || '',
        startedAt: existingPath?.startedAt || Date.now()
      };

      await this.convexMutation('learningPaths:upsert', path, context);

      return this.success(path);
    } catch (error: any) {
      return this.error(error.message || 'Failed to create learning path');
    }
  }

  /**
   * Get personalized recommendations
   */
  async getRecommendations(
    userId: string,
    limit: number = 5,
    context?: AgentContext
  ): Promise<AgentResult<Recommendation[]>> {
    try {
      // Get user's progress and preferences
      const progress = await this.convexQuery('users:get', { userId }, context);
      const preferences = await this.convexQuery('learningPreferences:get', { userId }, context);
      const recentEvents = await this.convexQuery('events:getRecent', { userId, limit: 20 }, context);
      
      // Analyze learning patterns
      const analysisPrompt = `Analyze this student's learning pattern:
- Preferences: ${JSON.stringify(preferences)}
- Recent activity: ${JSON.stringify(recentEvents?.slice(0, 5) || [])}
- Streak: ${progress?.streak || 0}

Recommend ${limit} items (courses, lessons, or practice exercises) that would help this student continue learning effectively. 
Return JSON array: [{type: "course"|"lesson"|"practice", itemId: string, reason: string, score: number}]`;

      const llmResult = await this.executeViaSutradhar(
        'llm-agent',
        'chat',
        {
          system: 'You are an expert educational recommender. Return only valid JSON array.',
          user: analysisPrompt,
          provider: 'openai',
          model: 'gpt-4o-mini'
        },
        context
      );

      if (!llmResult.success || !llmResult.data) {
        return this.success([]);
      }

      let recommendations: Recommendation[] = [];
      try {
        const text = llmResult.data.text?.trim() || '[]';
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        recommendations = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch (e) {
        // Fallback: return empty
      }

      // Save recommendations
      for (const rec of recommendations) {
        await this.convexMutation('recommendations:create', {
          userId,
          ...rec,
          createdAt: Date.now()
        }, context);
      }

      return this.success(recommendations.slice(0, limit));
    } catch (error: any) {
      return this.error(error.message || 'Failed to get recommendations');
    }
  }

  /**
   * Update learning preferences
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<LearningPreference>,
    context?: AgentContext
  ): Promise<AgentResult<LearningPreference>> {
    try {
      const existing = await this.convexQuery('learningPreferences:get', { userId }, context);
      
      const updated: LearningPreference = {
        learningStyle: preferences.learningStyle || existing?.learningStyle || 'reading',
        preferredFormat: preferences.preferredFormat || existing?.preferredFormat || ['text'],
        pace: preferences.pace || existing?.pace || 'normal',
        difficulty: preferences.difficulty || existing?.difficulty || 'intermediate',
      };

      await this.convexMutation('learningPreferences:upsert', {
        userId,
        ...updated,
        updatedAt: Date.now()
      }, context);

      return this.success(updated);
    } catch (error: any) {
      return this.error(error.message || 'Failed to update preferences');
    }
  }

  /**
   * Assess user's skill level for a course
   */
  async assessSkillLevel(
    userId: string,
    courseSlug: string,
    context?: AgentContext
  ): Promise<string> {
    try {
      // Get quiz attempts and code submissions
      const quizAttempts = await this.convexQuery('quizAttempts:getByUserCourse', { userId, courseSlug }, context);
      const codeSubmissions = await this.convexQuery('codeSubmissions:getByUserCourse', { userId, courseSlug }, context);
      
      // Calculate average performance
      const quizScores = (quizAttempts || []).map((a: any) => a.score || 0);
      const codeScores = (codeSubmissions || []).map((s: any) => {
        const results = s.results || {};
        return results.passed && results.total ? (results.passed / results.total) * 100 : 0;
      });

      const avgQuizScore = quizScores.length > 0 
        ? quizScores.reduce((a: number, b: number) => a + b, 0) / quizScores.length 
        : 0;
      const avgCodeScore = codeScores.length > 0
        ? codeScores.reduce((a: number, b: number) => a + b, 0) / codeScores.length
        : 0;

      const overallScore = (avgQuizScore + avgCodeScore) / 2;

      if (overallScore >= 80) return 'advanced';
      if (overallScore >= 60) return 'intermediate';
      return 'beginner';
    } catch (error) {
      return 'beginner';
    }
  }

  /**
   * Adjust difficulty based on performance
   */
  async adjustDifficulty(
    userId: string,
    courseSlug: string,
    performance: number, // 0-100
    context?: AgentContext
  ): Promise<AgentResult<{ difficulty: string }>> {
    try {
      const currentPath = await this.convexQuery('learningPaths:get', { userId, courseSlug }, context);
      
      let newDifficulty = currentPath?.difficulty || 'intermediate';
      
      if (performance >= 85 && currentPath?.difficulty !== 'advanced') {
        newDifficulty = 'advanced';
      } else if (performance < 50 && currentPath?.difficulty !== 'beginner') {
        newDifficulty = 'beginner';
      }

      if (newDifficulty !== currentPath?.difficulty) {
        await this.convexMutation('learningPaths:updateDifficulty', {
          userId,
          courseSlug,
          difficulty: newDifficulty
        }, context);
      }

      return this.success({ difficulty: newDifficulty });
    } catch (error: any) {
      return this.error(error.message || 'Failed to adjust difficulty');
    }
  }

  /**
   * Detect learning style from behavior
   */
  async detectLearningStyle(
    userId: string,
    context?: AgentContext
  ): Promise<AgentResult<{ learningStyle: string; confidence: number }>> {
    try {
      // Analyze user's interaction patterns
      const events = await this.convexQuery('events:getByUser', { userId, limit: 100 }, context);
      
      const analysisPrompt = `Analyze this student's learning behavior:
${JSON.stringify(events?.slice(0, 20) || [])}

Determine their learning style (visual, auditory, reading, kinesthetic) and confidence (0-100).
Return JSON: {learningStyle: string, confidence: number}`;

      const llmResult = await this.executeViaSutradhar(
        'llm-agent',
        'chat',
        {
          system: 'You are an expert in learning psychology. Return only valid JSON.',
          user: analysisPrompt,
          provider: 'openai',
          model: 'gpt-4o-mini'
        },
        context
      );

      if (!llmResult.success || !llmResult.data) {
        return this.success({ learningStyle: 'reading', confidence: 50 });
      }

      let result: any;
      try {
        const text = llmResult.data.text?.trim() || '{}';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        result = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch (e) {
        result = { learningStyle: 'reading', confidence: 50 };
      }

      return this.success(result);
    } catch (error: any) {
      return this.error(error.message || 'Failed to detect learning style');
    }
  }
}

