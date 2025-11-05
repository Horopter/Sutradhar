/**
 * Assessment Agent - Optimus Layer
 * Advanced quiz generation, dynamic assessment, and code review
 */

import { BaseAgent, AgentResult, AgentContext } from './base-agent';
import { SutradharClient } from '../client/sutradhar-client';

export interface DynamicQuiz {
  quizId: string;
  courseSlug: string;
  lessonId: string;
  questions: any[];
  difficulty: string;
}

export interface CodeReview {
  submissionId: string;
  style: any;
  correctness: any;
  suggestions: string[];
  score: number;
}

export class AssessmentAgent extends BaseAgent {
  constructor(sutradharClient: SutradharClient) {
    super('AssessmentAgent', 'Advanced assessment and dynamic quiz generation', sutradharClient);
  }

  /**
   * Generate adaptive quiz based on user performance
   */
  async generateAdaptiveQuiz(
    userId: string,
    courseSlug: string,
    lessonId: string,
    context?: AgentContext
  ): Promise<AgentResult<DynamicQuiz>> {
    try {
      // Get user's performance history
      const quizAttempts = await this.convexQuery('quizAttempts:getByUserCourse', {
        userId,
        courseSlug
      }, context);

      const avgScore = quizAttempts && quizAttempts.length > 0
        ? quizAttempts.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / quizAttempts.length
        : 50;

      // Determine difficulty
      let difficulty: string;
      if (avgScore >= 80) {
        difficulty = 'advanced';
      } else if (avgScore >= 60) {
        difficulty = 'intermediate';
      } else {
        difficulty = 'beginner';
      }

      // Get lesson content with fallback to file system
      let lesson: any = await this.convexQuery('lessons:get', { courseSlug, lessonId }, context);
      
      if (!lesson || !lesson.body) {
        // Fallback to CourseAgent (file system)
        const { CourseAgent } = await import('./course-agent');
        const courseAgent = new CourseAgent(this.sutradharClient);
        const lessonResult = await courseAgent.getLesson(courseSlug, lessonId, context);
        if (!lessonResult.success || !lessonResult.data) {
          return this.error('Lesson not found');
        }
        lesson = lessonResult.data;
      }

      // Generate questions using LLM
      const prompt = `Generate 5 ${difficulty}-level quiz questions based on this lesson. User's average score is ${avgScore.toFixed(1)}%.

Title: ${lesson.title}
Content: ${(lesson.body || '').substring(0, 3000)}

Create questions that:
- Match the user's skill level (${difficulty})
- Test understanding of key concepts
- Include 4 multiple choice options
- Provide clear explanations

Return JSON array: [{question: string, options: string[], correctAnswer: number, explanation: string}]`;

      const llmResult = await this.executeViaSutradhar(
        'llm-agent',
        'chat',
        {
          system: 'You are an expert quiz creator. Return only valid JSON array.',
          user: prompt,
          provider: 'openai',
          model: 'gpt-4o-mini'
        },
        context
      );

      if (!llmResult.success || !llmResult.data) {
        return this.error('Failed to generate quiz');
      }

      let questions: any[] = [];
      try {
        const text = llmResult.data.text?.trim() || '[]';
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        questions = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch (e) {
        return this.error('Failed to parse quiz questions');
      }

      const quizId = `adaptive-${lessonId}-${Date.now()}`;

      const quiz: DynamicQuiz = {
        quizId,
        courseSlug,
        lessonId,
        questions,
        difficulty
      };

      // Save quiz
      await this.convexMutation('dynamicQuizzes:create', {
        ...quiz,
        generatedAt: Date.now(),
        generatedBy: 'ai'
      }, context);

      return this.success(quiz);
    } catch (error: any) {
      return this.error(error.message || 'Failed to generate adaptive quiz');
    }
  }

  /**
   * Review code submission
   */
  async reviewCode(
    submissionId: string,
    code: string,
    assignmentPrompt: string,
    context?: AgentContext
  ): Promise<AgentResult<CodeReview>> {
    try {
      // Get submission
      const submission = await this.convexQuery('codeSubmissions:get', { submissionId }, context);
      
      if (!submission) {
        return this.error('Submission not found');
      }

      // Analyze code using LLM
      const reviewPrompt = `Review this code submission:

Assignment: ${assignmentPrompt}

Code:
\`\`\`
${code}
\`\`\`

Provide a comprehensive review covering:
1. Code style and readability
2. Correctness and logic
3. Suggestions for improvement
4. Overall score (0-100)

Return JSON: {
  style: {readability: number, formatting: number, comments: string},
  correctness: {logic: number, edgeCases: string, bugs: string[]},
  suggestions: string[],
  score: number
}`;

      const llmResult = await this.executeViaSutradhar(
        'llm-agent',
        'chat',
        {
          system: 'You are an expert code reviewer. Return only valid JSON.',
          user: reviewPrompt,
          provider: 'openai',
          model: 'gpt-4o-mini'
        },
        context
      );

      if (!llmResult.success || !llmResult.data) {
        return this.error('Failed to review code');
      }

      let review: CodeReview;
      try {
        const text = llmResult.data.text?.trim() || '{}';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const reviewData = JSON.parse(jsonMatch ? jsonMatch[0] : text);
        
        review = {
          submissionId,
          style: reviewData.style || {},
          correctness: reviewData.correctness || {},
          suggestions: reviewData.suggestions || [],
          score: reviewData.score || 70
        };
      } catch (e) {
        return this.error('Failed to parse code review');
      }

      // Save review
      await this.convexMutation('codeReviews:create', {
        submissionId,
        reviewerId: 'ai',
        feedback: review,
        score: review.score,
        createdAt: Date.now()
      }, context);

      return this.success(review);
    } catch (error: any) {
      return this.error(error.message || 'Failed to review code');
    }
  }

  /**
   * Generate feedback on quiz attempt
   */
  async generateQuizFeedback(
    userId: string,
    quizId: string,
    answers: Record<string, number>,
    context?: AgentContext
  ): Promise<AgentResult<{ feedback: string; strengths: string[]; weaknesses: string[] }>> {
    try {
      const quiz = await this.convexQuery('quizzes:get', { quizId }, context);
      
      if (!quiz) {
        return this.error('Quiz not found');
      }

      // Calculate score
      const questions = quiz.questions || [];
      let correct = 0;
      const incorrectQuestions: any[] = [];

      for (let i = 0; i < questions.length; i++) {
        if (questions[i].correctAnswer === answers[i]) {
          correct++;
        } else {
          incorrectQuestions.push(questions[i]);
        }
      }

      const score = (correct / questions.length) * 100;

      // Generate feedback using LLM
      const feedbackPrompt = `Generate personalized feedback for a quiz attempt:

Score: ${score.toFixed(1)}% (${correct}/${questions.length} correct)
Questions missed: ${incorrectQuestions.length}

Incorrect questions:
${incorrectQuestions.map((q, i) => `${i + 1}. ${q.question}`).join('\n')}

Provide:
1. Overall feedback (encouraging but constructive)
2. List of strengths (what they did well)
3. List of areas for improvement (specific topics to review)

Return JSON: {feedback: string, strengths: string[], weaknesses: string[]}`;

      const llmResult = await this.executeViaSutradhar(
        'llm-agent',
        'chat',
        {
          system: 'You are a supportive tutor. Return only valid JSON.',
          user: feedbackPrompt,
          provider: 'openai',
          model: 'gpt-4o-mini'
        },
        context
      );

      if (!llmResult.success || !llmResult.data) {
        return this.error('Failed to generate feedback');
      }

      let result: any;
      try {
        const text = llmResult.data.text?.trim() || '{}';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        result = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch (e) {
        result = {
          feedback: score >= 70 ? 'Good job!' : 'Keep practicing!',
          strengths: [],
          weaknesses: []
        };
      }

      return this.success(result);
    } catch (error: any) {
      return this.error(error.message || 'Failed to generate feedback');
    }
  }

  /**
   * Assess skill level from performance
   */
  async assessSkill(
    userId: string,
    skillName: string,
    context?: AgentContext
  ): Promise<AgentResult<{ level: number; confidence: number; improvementRate: number }>> {
    try {
      // Get all related activities
      const quizAttempts = await this.convexQuery('quizAttempts:getByUser', { userId }, context);
      const codeSubmissions = await this.convexQuery('codeSubmissions:getByUser', { userId }, context);
      const events = await this.convexQuery('events:getByUser', { userId, limit: 100 }, context);

      // Calculate metrics
      const quizScores = (quizAttempts || []).map((a: any) => a.score || 0);
      const codeScores = (codeSubmissions || []).map((s: any) => {
        const results = s.results || {};
        return results.passed && results.total ? (results.passed / results.total) * 100 : 0;
      });

      const avgQuiz = quizScores.length > 0
        ? quizScores.reduce((a: number, b: number) => a + b, 0) / quizScores.length
        : 0;
      const avgCode = codeScores.length > 0
        ? codeScores.reduce((a: number, b: number) => a + b, 0) / codeScores.length
        : 0;

      const overallLevel = Math.round((avgQuiz * 0.4 + avgCode * 0.6));

      // Calculate improvement rate (compare recent vs older)
      const recentScores = [...quizScores.slice(-10), ...codeScores.slice(-10)];
      const olderScores = [...quizScores.slice(0, -10), ...codeScores.slice(0, -10)];

      const recentAvg = recentScores.length > 0
        ? recentScores.reduce((a: number, b: number) => a + b, 0) / recentScores.length
        : 0;
      const olderAvg = olderScores.length > 0
        ? olderScores.reduce((a: number, b: number) => a + b, 0) / olderScores.length
        : 0;

      const improvementRate = recentAvg - olderAvg;

      // Confidence based on data points
      const confidence = Math.min(100, Math.max(30, (quizScores.length + codeScores.length) * 5));

      // Save assessment
      await this.convexMutation('skillAssessments:upsert', {
        userId,
        skillName,
        level: overallLevel,
        confidence,
        improvementRate,
        lastAssessedAt: Date.now()
      }, context);

      return this.success({
        level: overallLevel,
        confidence,
        improvementRate: Math.round(improvementRate * 10) / 10
      });
    } catch (error: any) {
      return this.error(error.message || 'Failed to assess skill');
    }
  }

  /**
   * Generate practice questions based on weak areas
   */
  async generatePracticeQuestions(
    userId: string,
    courseSlug: string,
    weakTopics: string[],
    numQuestions: number = 5,
    context?: AgentContext
  ): Promise<AgentResult<{ questions: any[] }>> {
    try {
      const prompt = `Generate ${numQuestions} practice questions focusing on these weak areas:
${weakTopics.join(', ')}

Create questions that:
- Target these specific topics
- Start at beginner level and gradually increase
- Include explanations
- Help reinforce understanding

Return JSON array: [{question: string, options: string[], correctAnswer: number, explanation: string, topic: string}]`;

      const llmResult = await this.executeViaSutradhar(
        'llm-agent',
        'chat',
        {
          system: 'You are an expert educator. Return only valid JSON array.',
          user: prompt,
          provider: 'openai',
          model: 'gpt-4o-mini'
        },
        context
      );

      if (!llmResult.success || !llmResult.data) {
        return this.error('Failed to generate practice questions');
      }

      let questions: any[] = [];
      try {
        const text = llmResult.data.text?.trim() || '[]';
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        questions = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch (e) {
        return this.error('Failed to parse questions');
      }

      return this.success({ questions });
    } catch (error: any) {
      return this.error(error.message || 'Failed to generate practice questions');
    }
  }
}

