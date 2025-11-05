/**
 * Course Agent - Optimus Layer
 * Uses Sutradhar orchestrator via SutradharClient
 */

import { BaseAgent, AgentResult, AgentContext } from './base-agent';
import { SutradharClient } from '../client/sutradhar-client';
import path from 'path';
import fs from 'fs';
import { marked } from 'marked';

export interface Course {
  slug: string;
  title: string;
  description?: string;
  coverImg?: string;
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  content?: string;
  body?: string;
  courseSlug: string;
  difficulty: string;
}

export class CourseAgent extends BaseAgent {
  private dataRepoPath: string;

  constructor(sutradharClient: SutradharClient) {
    super('CourseAgent', 'Manages courses and lessons from data_repository', sutradharClient);
    this.dataRepoPath = this._findDataRepository();
  }

  /**
   * Find data_repository directory
   */
  private _findDataRepository(): string {
    const possiblePaths = [
      path.join(process.cwd(), '..', 'data_repository'),
      path.join(process.cwd(), '..', '..', 'data_repository'),
      path.join(__dirname, '..', '..', '..', '..', 'data_repository'),
    ];

    for (const repoPath of possiblePaths) {
      if (fs.existsSync(repoPath)) {
        return repoPath;
      }
    }

    throw new Error('data_repository directory not found');
  }

  /**
   * Map course slug to directory name
   */
  private _findCourseDirectory(courseSlug: string): string | null {
    const dirMap: Record<string, string> = {
      'cplusplus': 'CPlusPlus',
      'java': 'Java',
      'web-development': 'Web development',
      'android': 'Android app development',
      'android-app-development': 'Android app development', // Alternative slug format
      'machine-learning': 'Machine Learning',
    };

    // Try direct mapping first
    let dirName: string | null = dirMap[courseSlug] || null;
    
    // If not found, try to find matching directory by slug normalization
    if (!dirName) {
      // Try to find directory that matches the slug when normalized
      const courseDirs = fs.readdirSync(this.dataRepoPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .filter(name => !name.startsWith('.') && name !== 'node_modules');
      
      // Normalize slug and try to match
      const normalizedSlug = courseSlug.toLowerCase().replace(/-/g, ' ').replace(/\s+/g, ' ');
      const foundDir = courseDirs.find(dir => {
        const normalizedDir = dir.toLowerCase();
        return normalizedDir.includes(normalizedSlug) || normalizedSlug.includes(normalizedDir);
      });
      dirName = foundDir || null;
    }

    // Fallback: capitalize first letter
    if (!dirName) {
      dirName = courseSlug.charAt(0).toUpperCase() + courseSlug.slice(1);
    }

    const fullPath = path.join(this.dataRepoPath, dirName);

    if (fs.existsSync(fullPath)) {
      return dirName;
    }

    return null;
  }

  /**
   * List all courses
   */
  async listCourses(context?: AgentContext): Promise<AgentResult<Course[]>> {
    try {
      const courseDirs = fs.readdirSync(this.dataRepoPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .filter(name => !name.startsWith('.') && name !== 'node_modules');

      const courses: Course[] = courseDirs.map(dir => ({
        slug: dir.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        title: dir,
        description: `Learn ${dir}`,
      }));

      return this.success(courses);
    } catch (error: any) {
      return this.error(error.message || 'Failed to list courses');
    }
  }

  /**
   * List lessons for a course
   */
  async listLessons(courseSlug: string, context?: AgentContext): Promise<AgentResult<Lesson[]>> {
    try {
      const courseDir = this._findCourseDirectory(courseSlug);
      if (!courseDir) {
        return this.error(`Course not found: ${courseSlug}`);
      }

      const coursePath = path.join(this.dataRepoPath, courseDir);
      const files = fs.readdirSync(coursePath)
        .filter(file => file.endsWith('.md'))
        .sort();

      const lessons: Lesson[] = files.map(file => {
        const id = file.replace('.md', '');
        const title = id.replace(/_/g, ' ').replace(/Lesson\s+\d+\s+/, '');
        
        return {
          id,
          title,
          courseSlug,
          difficulty: 'beginner',
        };
      });

      // Sync lessons list to Convex for other agents
      try {
        for (const lesson of lessons) {
          await this.convexMutation('lessons:upsert', {
            courseSlug,
            lessonId: lesson.id,
            title: lesson.title,
            body: '', // Will be populated when lesson is accessed
            assets: [],
            difficulty: lesson.difficulty
          }, context);
        }
      } catch (syncError: any) {
        // Log but don't fail - Convex sync is optional
        console.warn(`Failed to sync lessons list to Convex: ${syncError.message}`);
      }

      return this.success(lessons);
    } catch (error: any) {
      return this.error(error.message || 'Failed to list lessons');
    }
  }

  /**
   * Get a specific lesson
   */
  async getLesson(courseSlug: string, lessonId: string, context?: AgentContext): Promise<AgentResult<Lesson>> {
    try {
      const courseDir = this._findCourseDirectory(courseSlug);
      if (!courseDir) {
        return this.error(`Course not found: ${courseSlug}`);
      }

      const lessonPath = path.join(this.dataRepoPath, courseDir, `${lessonId}.md`);
      
      if (!fs.existsSync(lessonPath)) {
        return this.error(`Lesson not found: ${lessonId}`);
      }

      const markdownContent = fs.readFileSync(lessonPath, 'utf-8');
      const htmlContent = await marked(markdownContent);

      // Extract title from first line or filename
      const title = lessonId.replace(/_/g, ' ').replace(/Lesson\s+\d+\s+/, '');
      
      const lesson: Lesson = {
        id: lessonId,
        title,
        body: markdownContent,
        content: htmlContent,
        courseSlug,
        difficulty: 'beginner',
      };

      // Sync lesson to Convex so other agents can access it
      try {
        await this.convexMutation('lessons:upsert', {
          courseSlug,
          lessonId,
          title,
          body: markdownContent,
          assets: [],
          difficulty: 'beginner'
        }, context);
      } catch (syncError: any) {
        // Log but don't fail - Convex sync is optional
        console.warn(`Failed to sync lesson to Convex: ${syncError.message}`);
      }

      // TODO: Use Sutradhar to index content via retrieval agent
      // await this.executeViaSutradhar('retrieval-agent', 'index', { documents: [...] });

      return this.success(lesson);
    } catch (error: any) {
      return this.error(error.message || 'Failed to get lesson');
    }
  }
}
