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
import { marked } from 'marked';
import { knowledgeService } from '../services/knowledge-service';

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
  content?: string; // HTML rendered content
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
      // Find the actual course directory (handles slug mapping)
      const courseDirName = this._findCourseDirectory(courseSlug);
      if (!courseDirName) {
        return this.error(`Course not found: ${courseSlug}`);
      }
      
      const courseDir = path.join(this.dataRepoPath, courseDirName);
      const lessons: Lesson[] = [];
      
      const files = await fs.readdir(courseDir);
      const lessonFiles = files.filter(f => f.endsWith('.md') && f.startsWith('Lesson_'));
      
      for (const file of lessonFiles) {
        const lessonId = file.replace('.md', '');
        const content = await fs.readFile(path.join(courseDir, file), 'utf-8');
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : lessonId;
        
        // Upsert lesson in Convex (async, don't block)
        Convex.mutations('lessons:upsert', {
          courseSlug,
          lessonId,
          title,
          body: content,
          assets: [],
          difficulty: 'beginner'
        }).catch(error => {
          log.warn('Failed to upsert lesson in Convex', { courseSlug, lessonId, error });
        });
        
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
   * Map course slug to directory name (handles cases like cplusplus -> CPlusPlus)
   */
  private _findCourseDirectory(courseSlug: string): string | null {
    try {
      const dirs = fsSync.readdirSync(this.dataRepoPath, { withFileTypes: true });
      
      // Try exact match first (with space replacement)
      const normalizedSlug = courseSlug.replace(/-/g, ' ');
      for (const dir of dirs) {
        if (dir.isDirectory() && dir.name === normalizedSlug) {
          return dir.name;
        }
      }
      
      // Try case-insensitive match
      for (const dir of dirs) {
        if (dir.isDirectory() && dir.name.toLowerCase().replace(/\s+/g, '-') === courseSlug.toLowerCase()) {
          return dir.name;
        }
      }
      
      return null;
    } catch (error) {
      log.error('Failed to find course directory', { courseSlug, error });
      return null;
    }
  }

  /**
   * Get a specific lesson
   */
  async getLesson(courseSlug: string, lessonId: string, context?: AgentContext): Promise<AgentResult<Lesson>> {
    try {
      // Find the actual course directory (handles slug mapping)
      const courseDirName = this._findCourseDirectory(courseSlug);
      if (!courseDirName) {
        return this.error(`Course not found: ${courseSlug}`);
      }
      
      const courseDir = path.join(this.dataRepoPath, courseDirName);
      
      // Try to find the lesson file (handle both Lesson_ prefix and without)
      let filePath: string | null = null;
      const possibleFiles = [
        path.join(courseDir, `${lessonId}.md`),
        path.join(courseDir, `Lesson_${lessonId.replace(/^Lesson_/, '')}.md`)
      ];
      
      for (const fp of possibleFiles) {
        try {
          fsSync.accessSync(fp);
          filePath = fp;
          break;
        } catch {
          continue;
        }
      }
      
      if (!filePath) {
        return this.error(`Lesson file not found: ${lessonId}`);
      }
      
      // Read markdown content
      const markdownContent = await fs.readFile(filePath, 'utf-8');
      const titleMatch = markdownContent.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : lessonId;
      
      // Convert markdown to HTML
      const htmlContent = await marked(markdownContent);
      
      const lessonData: Lesson = {
        id: lessonId,
        courseSlug,
        title,
        body: markdownContent, // Keep original markdown
        content: htmlContent,   // HTML rendered version
        assets: [],
        difficulty: 'beginner'
      };
      
      // Try to upsert in Convex (async, don't block)
      Convex.mutations('lessons:upsert', {
        courseSlug,
        lessonId,
        title,
        body: markdownContent,
        assets: [],
        difficulty: 'beginner'
      }).catch(error => {
        log.warn('Failed to upsert lesson in Convex', { courseSlug, lessonId, error });
      });
      
      // Index in knowledge service (Moss/Hyperspell/Convex) - async, don't block
      knowledgeService.indexContent([{
        id: `${courseSlug}-${lessonId}`,
        text: markdownContent,
        source: `lesson:${courseSlug}/${lessonId}`,
        metadata: {
          courseSlug,
          lessonId,
          title,
          type: 'lesson'
        }
      }]).catch(error => {
        log.warn('Failed to index lesson content', { courseSlug, lessonId, error });
      });
      
      return this.success(lessonData);
    } catch (error: any) {
      log.error('CourseAgent.getLesson failed', error);
      return this.error(error.message || 'Lesson not found');
    }
  }
}

