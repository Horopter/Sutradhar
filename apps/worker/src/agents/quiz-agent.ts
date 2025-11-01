/**
 * Quiz Agent
 * Single responsibility: Manage quizzes and quiz attempts
 */

import { BaseAgent, AgentResult, AgentContext } from './base-agent';
import { Convex } from '../convexClient';
import { log } from '../log';

export interface QuizAttempt {
  userId: string;
  quizId: string;
  answers: any[];
  startedAt: number;
  finishedAt: number;
}

export interface QuizResult {
  score: number;
  passed: boolean;
  correct: number;
  total: number;
}

export class QuizAgent extends BaseAgent {
  constructor() {
    super('QuizAgent', 'Manages quizzes and quiz attempts');
  }

  /**
   * Get a quiz by ID
   */
  async getQuiz(quizId: string, context?: AgentContext): Promise<AgentResult<any>> {
    try {
      const quiz = await Convex.queries('quizzes:get', { quizId });
      
      if (!quiz) {
        return this.error('Quiz not found');
      }
      
      return this.success(quiz);
    } catch (error: any) {
      log.error('QuizAgent.getQuiz failed', error);
      return this.error(error.message || 'Failed to get quiz');
    }
  }

  /**
   * Submit a quiz attempt
   */
  async submitAttempt(attempt: QuizAttempt, context?: AgentContext): Promise<AgentResult<QuizResult>> {
    try {
      const quiz = await Convex.queries('quizzes:get', { quizId: attempt.quizId });
      
      if (!quiz) {
        return this.error('Quiz not found');
      }
      
      // Calculate score
      const questions = quiz.questions || [];
      let correct = 0;
      
      for (let i = 0; i < questions.length; i++) {
        const userAnswer = attempt.answers[i];
        const correctAnswer = questions[i].correctAnswer;
        
        if (userAnswer === correctAnswer || 
            JSON.stringify(userAnswer) === JSON.stringify(correctAnswer)) {
          correct++;
        }
      }
      
      const score = (correct / questions.length) * 100;
      const passed = score >= (quiz.passScore || 70);
      
      // Record attempt
      await Convex.mutations('quizzes:recordAttempt', {
        userId: attempt.userId,
        quizId: attempt.quizId,
        score,
        answers: attempt.answers,
        startedAt: attempt.startedAt,
        finishedAt: attempt.finishedAt
      });
      
      // Log event
      await Convex.mutations('events:log', {
        userId: attempt.userId,
        type: 'quiz_attempt',
        payload: { 
          quizId: attempt.quizId, 
          score, 
          passed 
        }
      });
      
      return this.success({
        score,
        passed,
        correct,
        total: questions.length
      });
    } catch (error: any) {
      log.error('QuizAgent.submitAttempt failed', error);
      return this.error(error.message || 'Failed to submit quiz attempt');
    }
  }

  /**
   * Get user's quiz attempts
   */
  async getUserAttempts(userId: string, context?: AgentContext): Promise<AgentResult<any[]>> {
    try {
      const attempts = await Convex.queries('quizzes:getAttempts', { userId });
      return this.success(attempts || []);
    } catch (error: any) {
      log.error('QuizAgent.getUserAttempts failed', error);
      return this.error(error.message || 'Failed to get quiz attempts');
    }
  }
}

