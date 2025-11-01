/**
 * Image Agent
 * Single responsibility: Fetch images for courses (Moss bridge + local fallback)
 */

import { BaseAgent, AgentResult, AgentContext } from './base-agent';
import { Convex } from '../convexClient';
import { promises as fs } from 'fs';
import path from 'path';
import { log } from '../log';
import { env } from '../env';

export interface Image {
  url: string;
  source: 'moss' | 'local';
  caption: string;
}

// Import knowledge service instance
let knowledgeServiceInstance: any = null;

async function getKnowledgeService() {
  if (!knowledgeServiceInstance) {
    const { knowledgeService } = await import('../services/knowledge-service');
    knowledgeServiceInstance = knowledgeService;
  }
  return knowledgeServiceInstance;
}

export class ImageAgent extends BaseAgent {
  constructor() {
    super('ImageAgent', 'Fetches images for courses (Moss bridge + local fallback)');
  }

  /**
   * Get images for a course
   */
  async getCourseImages(courseSlug: string, keywords?: string, context?: AgentContext): Promise<AgentResult<Image[]>> {
    try {
      const images: Image[] = [];
      const searchQuery = keywords || courseSlug;
      
      // Try Moss bridge if configured
      if (env.MOSS_BRIDGE_URL) {
        try {
          const knowledgeService = await getKnowledgeService();
          const mossResult = await knowledgeService.searchImages({
            query: searchQuery,
            maxResults: 10
          });
          
          if (mossResult.results && mossResult.results.length > 0) {
            for (const img of mossResult.results) {
              await Convex.mutations('images:upsert', {
                courseSlug,
                url: img.url,
                source: 'moss',
                caption: img.caption || searchQuery
              });
              
              images.push({
                url: img.url,
                source: 'moss',
                caption: img.caption || searchQuery
              });
            }
          }
        } catch (error: any) {
          log.warn('Moss bridge failed, falling back to local', error);
        }
      }
      
      // Fallback to local images
      if (images.length === 0) {
        const localImgPath = path.join(process.cwd(), '..', '..', 'apps', 'nuxt', 'public', 'img', courseSlug);
        try {
          const files = await fs.readdir(localImgPath);
          for (const file of files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))) {
            images.push({
              url: `/img/${courseSlug}/${file}`,
              source: 'local',
              caption: file.replace(/\.[^.]+$/, '')
            });
          }
        } catch {
          // No local images directory
        }
      }
      
      return this.success(images);
    } catch (error: any) {
      log.error('ImageAgent.getCourseImages failed', error);
      return this.error(error.message || 'Failed to get images');
    }
  }

  /**
   * Cache images for all courses
   */
  async cacheAllImages(context?: AgentContext): Promise<AgentResult<{ cached: string[] }>> {
    try {
      const courses: any = await Convex.queries('courses:list', {});
      const cached: string[] = [];
      const coursesArray = Array.isArray(courses) ? courses : [];
      
      for (const course of coursesArray) {
        const result = await this.getCourseImages(course.slug, course.title);
        if (result.success && result.data && result.data.length > 0) {
          cached.push(course.slug);
        }
      }
      
      return this.success({ cached });
    } catch (error: any) {
      log.error('ImageAgent.cacheAllImages failed', error);
      return this.error(error.message || 'Failed to cache images');
    }
  }
}

