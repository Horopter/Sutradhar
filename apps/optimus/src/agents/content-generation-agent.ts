/**
 * Content Generation Agent - Optimus Layer
 * Generates lessons, quizzes, examples, and summaries using AI
 */

import { BaseAgent, AgentResult, AgentContext } from './base-agent';
import { SutradharClient } from '../client/sutradhar-client';

export interface GeneratedContent {
  contentType: 'lesson' | 'quiz' | 'example' | 'summary' | 'flashcard';
  courseSlug: string;
  lessonId?: string;
  content: any;
  version: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export class ContentGenerationAgent extends BaseAgent {
  private courseAgentCache: any = null;

  constructor(sutradharClient: SutradharClient) {
    super('ContentGenerationAgent', 'Generates educational content using AI', sutradharClient);
  }

  /**
   * Get lesson with fallback - tries Convex first, then CourseAgent (file system)
   */
  private async getLessonWithFallback(
    courseSlug: string,
    lessonId: string,
    context?: AgentContext
  ): Promise<any> {
    // Try Convex first
    let lesson: any = await this.convexQuery('lessons:get', { courseSlug, lessonId }, context);
    
    // If not in Convex or missing body, get from CourseAgent (file system)
    if (!lesson || !lesson.body) {
      if (!this.courseAgentCache) {
        const { CourseAgent } = await import('./course-agent');
        this.courseAgentCache = new CourseAgent(this.sutradharClient);
      }
      const lessonResult = await this.courseAgentCache.getLesson(courseSlug, lessonId, context);
      if (lessonResult.success && lessonResult.data) {
        lesson = lessonResult.data;
      }
    }
    
    return lesson;
  }

  /**
   * Generate a lesson summary
   */
  async generateSummary(
    courseSlug: string,
    lessonId: string,
    context?: AgentContext
  ): Promise<AgentResult<{ summary: string }>> {
    try {
      // Get lesson content with fallback
      const lesson = await this.getLessonWithFallback(courseSlug, lessonId, context);
      
      if (!lesson || !lesson.body) {
        return this.error('Lesson not found');
      }

      const excerpt = (lesson.body || '').substring(0, 3000);

      const summaryResult = await this.executeViaSutradhar(
        'llm-agent',
        'chat',
        {
          system: 'You are an expert educational assistant. Create concise, engaging summaries (2-3 sentences, under 100 words) that capture key concepts and main takeaways.',
          user: `Lesson Title: ${lesson.title}\n\nContent:\n${excerpt}\n\nGenerate a summary.`,
          provider: 'openai',
          model: 'gpt-4o-mini'
        },
        context
      );

      if (!summaryResult.success || !summaryResult.data) {
        return this.error('Failed to generate summary');
      }

      const summary = summaryResult.data.text || '';

      // Save generated content
      await this.convexMutation('generatedContent:create', {
        contentType: 'summary',
        courseSlug,
        lessonId,
        content: { summary },
        generatedBy: 'system',
        createdAt: Date.now(),
        version: 1
      }, context);

      return this.success({ summary });
    } catch (error: any) {
      return this.error(error.message || 'Failed to generate summary');
    }
  }

  /**
   * Generate quiz questions from lesson content
   */
  async generateQuiz(
    courseSlug: string,
    lessonId: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate',
    numQuestions: number = 5,
    context?: AgentContext
  ): Promise<AgentResult<{ questions: QuizQuestion[] }>> {
    try {
      const lesson = await this.getLessonWithFallback(courseSlug, lessonId, context);
      
      if (!lesson || !lesson.body) {
        return this.error('Lesson not found');
      }

      const excerpt = (lesson.body || '').substring(0, 4000);

      const prompt = `Generate ${numQuestions} ${difficulty}-level quiz questions based on this lesson:

Title: ${lesson.title}
Content: ${excerpt}

For each question, provide:
- A clear question
- 4 multiple choice options
- The correct answer (0-3 index)
- A brief explanation

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

      let questions: QuizQuestion[] = [];
      try {
        const text = llmResult.data.text?.trim() || '[]';
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        questions = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch (e) {
        return this.error('Failed to parse quiz questions');
      }

      // Save generated quiz
      await this.convexMutation('dynamicQuizzes:create', {
        quizId: `dynamic-${lessonId}-${Date.now()}`,
        courseSlug,
        lessonId,
        questions,
        difficulty,
        generatedAt: Date.now(),
        generatedBy: 'ai'
      }, context);

      return this.success({ questions });
    } catch (error: any) {
      return this.error(error.message || 'Failed to generate quiz');
    }
  }

  /**
   * Generate practice examples
   */
  async generateExamples(
    courseSlug: string,
    lessonId: string,
    topic: string,
    numExamples: number = 3,
    context?: AgentContext
  ): Promise<AgentResult<{ examples: string[] }>> {
    try {
      const lesson = await this.getLessonWithFallback(courseSlug, lessonId, context);
      
      if (!lesson || !lesson.body) {
        return this.error('Lesson not found');
      }

      const prompt = `Generate ${numExamples} practical examples related to "${topic}" from this lesson:

Title: ${lesson.title}
Content: ${(lesson.body || '').substring(0, 2000)}

Each example should be:
- Clear and concise
- Relevant to the topic
- Practical and applicable

Return JSON array: ["example1", "example2", ...]`;

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
        return this.error('Failed to generate examples');
      }

      let examples: string[] = [];
      try {
        const text = llmResult.data.text?.trim() || '[]';
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        examples = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch (e) {
        return this.error('Failed to parse examples');
      }

      return this.success({ examples });
    } catch (error: any) {
      return this.error(error.message || 'Failed to generate examples');
    }
  }

  /**
   * Generate flashcards from lesson
   */
  async generateFlashcards(
    courseSlug: string,
    lessonId: string,
    numCards: number = 10,
    context?: AgentContext
  ): Promise<AgentResult<{ flashcards: Array<{ front: string; back: string }> }>> {
    try {
      const lesson = await this.getLessonWithFallback(courseSlug, lessonId, context);
      
      if (!lesson || !lesson.body) {
        return this.error('Lesson not found');
      }

      const excerpt = (lesson.body || '').substring(0, 3000);

      const prompt = `Generate ${numCards} flashcards from this lesson:

Title: ${lesson.title}
Content: ${excerpt}

Each flashcard should have:
- Front: A question or term
- Back: A concise answer or definition

Return JSON array: [{front: string, back: string}]`;

      const llmResult = await this.executeViaSutradhar(
        'llm-agent',
        'chat',
        {
          system: 'You are an expert in creating study materials. Return only valid JSON array.',
          user: prompt,
          provider: 'openai',
          model: 'gpt-4o-mini'
        },
        context
      );

      if (!llmResult.success || !llmResult.data) {
        return this.error('Failed to generate flashcards');
      }

      let flashcards: Array<{ front: string; back: string }> = [];
      try {
        const text = llmResult.data.text?.trim() || '[]';
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        flashcards = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch (e) {
        return this.error('Failed to parse flashcards');
      }

      // Save generated content
      await this.convexMutation('generatedContent:create', {
        contentType: 'flashcard',
        courseSlug,
        lessonId,
        content: { flashcards },
        generatedBy: 'system',
        createdAt: Date.now(),
        version: 1
      }, context);

      return this.success({ flashcards });
    } catch (error: any) {
      return this.error(error.message || 'Failed to generate flashcards');
    }
  }

  /**
   * Generate study notes
   */
  async generateNotes(
    courseSlug: string,
    lessonId: string,
    context?: AgentContext
  ): Promise<AgentResult<{ notes: string }>> {
    try {
      const lesson = await this.getLessonWithFallback(courseSlug, lessonId, context);
      
      if (!lesson || !lesson.body) {
        return this.error('Lesson not found');
      }

      const excerpt = (lesson.body || '').substring(0, 4000);

      const prompt = `Create comprehensive study notes from this lesson in markdown format:

Title: ${lesson.title}
Content: ${excerpt}

Include:
- Key concepts
- Important definitions
- Examples
- Takeaways

Format as markdown with headings, bullet points, and code blocks where appropriate.`;

      const llmResult = await this.executeViaSutradhar(
        'llm-agent',
        'chat',
        {
          system: 'You are an expert note-taker. Create well-structured markdown notes.',
          user: prompt,
          provider: 'openai',
          model: 'gpt-4o-mini'
        },
        context
      );

      if (!llmResult.success || !llmResult.data) {
        return this.error('Failed to generate notes');
      }

      const notes = llmResult.data.text || '';

      return this.success({ notes });
    } catch (error: any) {
      return this.error(error.message || 'Failed to generate notes');
    }
  }

  /**
   * Generate practice problems
   */
  async generatePracticeProblems(
    courseSlug: string,
    lessonId: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate',
    numProblems: number = 5,
    context?: AgentContext
  ): Promise<AgentResult<{ problems: Array<{ problem: string; solution: string; hints: string[] }> }>> {
    try {
      const lesson = await this.getLessonWithFallback(courseSlug, lessonId, context);
      
      if (!lesson || !lesson.body) {
        return this.error('Lesson not found');
      }

      const excerpt = (lesson.body || '').substring(0, 3000);

      const prompt = `Generate ${numProblems} ${difficulty}-level practice problems based on this lesson:

Title: ${lesson.title}
Content: ${excerpt}

For each problem, provide:
- A clear problem statement
- A detailed solution
- 2-3 progressive hints (from light to detailed)

Return JSON array: [{problem: string, solution: string, hints: string[]}]`;

      const llmResult = await this.executeViaSutradhar(
        'llm-agent',
        'chat',
        {
          system: 'You are an expert problem creator. Return only valid JSON array.',
          user: prompt,
          provider: 'openai',
          model: 'gpt-4o-mini'
        },
        context
      );

      if (!llmResult.success || !llmResult.data) {
        return this.error('Failed to generate practice problems');
      }

      let problems: Array<{ problem: string; solution: string; hints: string[] }> = [];
      try {
        const text = llmResult.data.text?.trim() || '[]';
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        problems = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch (e) {
        return this.error('Failed to parse practice problems');
      }

      return this.success({ problems });
    } catch (error: any) {
      return this.error(error.message || 'Failed to generate practice problems');
    }
  }
}

