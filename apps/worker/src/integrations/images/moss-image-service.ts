/**
 * Moss Image Search Service
 * Provides image indexing and semantic search capabilities using Moss
 */

import { 
  mossBridgeEnsureImageIndex, 
  mossBridgeIndexImages, 
  mossBridgeSearchImages,
  mossBridgeGetImage,
  ImageIndexRequest,
  ImageSearchResult
} from '../../retrieval/clients';
import { log } from '../../log';
import { env } from '../../env';

export class MossImageService {
  /**
   * Ensure image index is initialized
   */
  async ensureIndex(): Promise<{ ok: boolean; index?: string; error?: string }> {
    try {
      const result: any = await mossBridgeEnsureImageIndex();
      log.info('Moss image index ensured', { result });
      return { ok: true, index: result.index || 'images' };
    } catch (error: any) {
      log.error('Failed to ensure Moss image index', { error: error.message });
      return { ok: false, error: error.message };
    }
  }

  /**
   * Index one or more images
   */
  async indexImages(images: ImageIndexRequest[]): Promise<{ ok: boolean; indexed?: number; total?: number; error?: string }> {
    try {
      if (images.length === 0) {
        return { ok: true, indexed: 0, total: 0 };
      }

      const result: any = await mossBridgeIndexImages(images);
      
      log.info('Images indexed in Moss', {
        count: result.count || images.length,
        indexed: result.indexed?.length || images.length
      });

      return {
        ok: true,
        indexed: result.count || images.length,
        total: images.length
      };
    } catch (error: any) {
      log.error('Failed to index images in Moss', { 
        error: error.message,
        count: images.length
      });
      return { ok: false, error: error.message, total: images.length };
    }
  }

  /**
   * Search images by text query
   */
  async searchByText(query: string, maxResults: number = 10): Promise<ImageSearchResult[]> {
    try {
      if (!query || query.trim().length === 0) {
        return [];
      }

      const results = await mossBridgeSearchImages(query, undefined, maxResults);
      
      log.info('Image search completed', {
        query,
        resultsCount: results.length
      });

      return results;
    } catch (error: any) {
      log.error('Failed to search images in Moss', { 
        error: error.message,
        query
      });
      return [];
    }
  }

  /**
   * Search images by image similarity (image-to-image search)
   */
  async searchByImage(imageData: string, maxResults: number = 10): Promise<ImageSearchResult[]> {
    try {
      if (!imageData) {
        return [];
      }

      const results = await mossBridgeSearchImages(undefined, imageData, maxResults);
      
      log.info('Image similarity search completed', {
        resultsCount: results.length
      });

      return results;
    } catch (error: any) {
      log.error('Failed to search images by similarity in Moss', { 
        error: error.message
      });
      return [];
    }
  }

  /**
   * Get a specific image by ID
   */
  async getImage(imageId: string): Promise<ImageSearchResult | null> {
    try {
      return await mossBridgeGetImage(imageId);
    } catch (error: any) {
      log.error('Failed to get image from Moss', { 
        error: error.message,
        imageId
      });
      return null;
    }
  }

  /**
   * Check if image search is available
   */
  isAvailable(): boolean {
    return !!(env.MOSS_PROJECT_ID && env.MOSS_PROJECT_KEY);
  }
}

export const mossImageService = new MossImageService();

