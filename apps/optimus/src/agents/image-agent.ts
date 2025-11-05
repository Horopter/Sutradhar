/**
 * Image Agent - Optimus Layer
 * Uses Sutradhar orchestrator for image operations
 */

import { BaseAgent, AgentResult, AgentContext } from './base-agent';
import { SutradharClient } from '../client/sutradhar-client';

export interface Image {
  id: string;
  url: string;
  caption: string;
}

export class ImageAgent extends BaseAgent {
  constructor(sutradharClient: SutradharClient) {
    super('ImageAgent', 'Fetches images for courses', sutradharClient);
  }

  async getCourseImages(courseSlug: string, keywords?: string[], context?: AgentContext): Promise<AgentResult<Image[]>> {
    try {
      // Use Sutradhar data-agent for image retrieval
      const images = await this.convexQuery('images:getByCourse', { 
        courseSlug: courseSlug,
        keywords: keywords || []
      });
      
      return this.success((images || []).map((img: any) => ({
        id: img.id,
        url: img.url,
        caption: img.caption || ''
      })));
    } catch (error: any) {
      return this.error(error.message || 'Failed to get course images');
    }
  }

  async cacheAllImages(context?: AgentContext): Promise<AgentResult<{ cached: number }>> {
    try {
      // TODO: Implement image caching via Sutradhar
      // For now, return success with 0 cached
      return this.success({ cached: 0 });
    } catch (error: any) {
      return this.error(error.message || 'Failed to cache images');
    }
  }
}
