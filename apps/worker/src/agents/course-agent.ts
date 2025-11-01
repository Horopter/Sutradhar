/**
 * Course Agent
 * Single responsibility: Manage courses and lessons from data_repository
 */

import { BaseAgent, AgentResult, AgentContext } from './base-agent';
import { promises as fs } from 'fs';
import fsSync from 'fs';
import path from 'path';
import { Convex } from '../convexClient';
import { log } from '../log';

export interface Course {
  slug: string;
  title: string;
  description: string;
  lessonCount: number;
  coverImg?: string;
}

export interface Lesson {
  id: string;
  courseSlug: string;
  title: string;
  body: string;
  assets: string[];
  difficulty: string;
}

export class CourseAgent extends BaseAgent {
  private dataRepoPath: string;

  constructor() {
    super('CourseAgent', 'Manages courses and lessons from data_repository');
    this.dataRepoPath = this._findDataRepository();
  }

  /**
   * Find data_repository directory
   */
  private _findDataRepository(): string {
    const possiblePaths = [
      path.join(process.cwd(), '..', 'data_repository'),
      path.join(process.cwd(), '..', '..', 'data_repository'),
      path.join(__dirname, '..', '..', '..', '..', 'data_repository')
    ];
    
    for (const p of possiblePaths) {
      try {
        fsSync.accessSync(p);
        return p;
      } catch {
        continue;
      }
    }
    
    return possiblePaths[0]; // Fallback
  }

  /**
   * List all courses (subjects)
   */
  async listCourses(context?: AgentContext): Promise<AgentResult<Course[]>> {
    try {
      const courses: Course[] = [];
      const dirs = await fs.readdir(this.dataRepoPath, { withFileTypes: true });
      
      for (const dir of dirs) {
        if (dir.isDirectory() && !dir.name.startsWith('.')) {
          const courseSlug = dir.name.toLowerCase().replace(/\s+/g, '-');
          const files = await fs.readdir(path.join(this.dataRepoPath, dir.name));
          const lessonFiles = files.filter(f => f.endsWith('.md') && f.startsWith('Lesson_'));
          
          // Upsert course in Convex
          try {
            await Convex.mutations('courses:upsert', {
              slug: courseSlug,
              title: dir.name,
              description: `Learn ${dir.name} with interactive lessons and quizzes`,
              coverImg: ''
            });
          } catch (error) {
            log.warn('Failed to upsert course in Convex', { courseSlug, error });
          }
          
          courses.push({
            slug: courseSlug,
            title: dir.name,
            description: `Learn ${dir.name} with interactive lessons and quizzes`,
            lessonCount: lessonFiles.length
          });
        }
      }
      
      return this.success(courses);
    } catch (error: any) {
      log.error('CourseAgent.listCourses failed', error);
      return this.error(error.message || 'Failed to list courses');
    }
  }

  /**
   * List lessons for a course
   */
  async listLessons(courseSlug: string, context?: AgentContext): Promise<AgentResult<Lesson[]>> {
    try {
      const courseDir = path.join(this.dataRepoPath, courseSlug.replace(/-/g, ' '));
      const lessons: Lesson[] = [];
      
      const files = await fs.readdir(courseDir);
      const lessonFiles = files.filter(f => f.endsWith('.md') && f.startsWith('Lesson_'));
      
      for (const file of lessonFiles) {
        const lessonId = file.replace('.md', '');
        const content = await fs.readFile(path.join(courseDir, file), 'utf-8');
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : lessonId;
        
        // Upsert lesson in Convex
        try {
          await Convex.mutations('lessons:upsert', {
            courseSlug,
            lessonId,
            title,
            body: content,
            assets: [],
            difficulty: 'beginner'
          });
        } catch (error) {
          log.warn('Failed to upsert lesson in Convex', { courseSlug, lessonId, error });
        }
        
        lessons.push({
          id: lessonId,
          courseSlug,
          title,
          body: content,
          assets: [],
          difficulty: 'beginner'
        });
      }
      
      return this.success(lessons);
    } catch (error: any) {
      log.error('CourseAgent.listLessons failed', error);
      return this.error(error.message || 'Failed to list lessons');
    }
  }

  /**
   * Get a specific lesson
   */
  async getLesson(courseSlug: string, lessonId: string, context?: AgentContext): Promise<AgentResult<Lesson>> {
    try {
      // Try Convex first
      const lesson = await Convex.queries('lessons:get', { courseSlug, lessonId }) as Lesson | null;
      
      if (lesson) {
        return this.success(lesson as Lesson);
      }
      
      // Fallback: read from file
      const courseDir = path.join(this.dataRepoPath, courseSlug.replace(/-/g, ' '));
      const filePath = path.join(courseDir, `${lessonId}.md`);
      const content = await fs.readFile(filePath, 'utf-8');
      const titleMatch = content.match(/^#\s+(.+)$/m);
      
      const lessonData: Lesson = {
        id: lessonId,
        courseSlug,
        title: titleMatch ? titleMatch[1] : lessonId,
        body: content,
        assets: [],
        difficulty: 'beginner'
      };
      
      return this.success(lessonData);
    } catch (error: any) {
      log.error('CourseAgent.getLesson failed', error);
      return this.error(error.message || 'Lesson not found');
    }
  }
}

