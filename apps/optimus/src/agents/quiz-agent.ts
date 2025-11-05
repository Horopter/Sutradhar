/**
 * Quiz Agent - Optimus Layer
 * Uses Sutradhar orchestrator for data operations
 */

import { BaseAgent, AgentResult, AgentContext } from './base-agent';
import { SutradharClient } from '../client/sutradhar-client';

export interface QuizAttempt {
  userId: string;
  quizId: string;
  answers: Record<string, number>;
  startedAt: number;
  finishedAt: number;
}

export interface QuizResult {
  score: number;
  total: number;
  passed: boolean;
}

export class QuizAgent extends BaseAgent {
  constructor(sutradharClient: SutradharClient) {
    super('QuizAgent', 'Manages quizzes and quiz attempts', sutradharClient);
  }

  /**
   * Get quiz by ID
   */
  async getQuiz(quizId: string, context?: AgentContext): Promise<AgentResult<any>> {
    try {
      // Use Sutradhar data-agent for quiz retrieval
      const quiz = await this.convexQuery('quizzes:get', { quizId: quizId }, context);
      
      if (!quiz) {
        return this.error('Quiz not found');
      }
      
      return this.success(quiz);
    } catch (error: any) {
      return this.error(error.message || 'Failed to get quiz');
    }
  }

  /**
   * Submit quiz attempt
   */
  async submitAttempt(attempt: QuizAttempt, context?: AgentContext): Promise<AgentResult<QuizResult>> {
    try {
      // Get quiz first
      const quizResult = await this.getQuiz(attempt.quizId, context);
      if (!quizResult.success || !quizResult.data) {
        return this.error('Quiz not found');
      }
      
      const quiz: any = quizResult.data;
      const questions = quiz.questions || [];
      let correct = 0;
      
      // Calculate score
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const userAnswer = attempt.answers[i];
        if (question.correctAnswer === userAnswer) {
          correct++;
        }
      }
      
      const score = (correct / questions.length) * 100;
      const passed = score >= (quiz.passScore || 70);
      
      // Use Sutradhar data-agent for saving attempt
      await this.convexMutation('quizAttempts:create', {
        ...attempt,
        score,
        passed,
        correct,
        total: questions.length
      });
      
      return this.success({
        score,
        passed,
        correct,
        total: questions.length
      });
    } catch (error: any) {
      return this.error(error.message || 'Failed to submit attempt');
    }
  }

  /**
   * Get user's quiz attempts
   */
  async getUserAttempts(userId: string, context?: AgentContext): Promise<AgentResult<any[]>> {
    try {
      // Use Sutradhar data-agent
      const attempts = await this.convexQuery('quizAttempts:getByUser', { userId: userId }, context);
      
      return this.success(attempts || []);
    } catch (error: any) {
      return this.error(error.message || 'Failed to get user attempts');
    }
  }
}
