/**
 * Knowledge Service
 * Unified interface for search, retrieval, and indexing
 * Abstracts Hyperspell, Moss, and local indexing
 */

import { retrievalService } from '../core/services/retrieval-service';
import { mossImageService } from '../integrations/images/moss-image-service';
import {
  SearchQuery,
  SearchResults,
  SearchResult,
  ImageSearchQuery,
  ImageSearchResults,
  ImageResult,
  ContentToIndex,
  ImageInput,
} from '../models/knowledge';
import { log } from '../log';
import { logger } from '../core/logging/logger';

export class KnowledgeService {
  /**
   * Search documents and content
   */
  async search(query: SearchQuery): Promise<SearchResults> {
    const serviceLogger = logger.child({ service: 'knowledge', operation: 'search' });
    const t0 = Date.now();

    try {
      const maxResults = query.maxResults || 10;
      
      // Use retrieval service (abstracts Hyperspell, BM25, etc.)
      const { snippets, mocked } = await retrievalService.search(query.query, maxResults);

      // Convert to unified SearchResult model
      const results: SearchResult[] = snippets.map((snippet, idx) => ({
        id: (snippet as any).id || `result-${Date.now()}-${idx}`,
        text: snippet.text,
        source: snippet.source || 'unknown',
        score: snippet.score || 0,
        url: snippet.url,
        metadata: snippet.metadata,
      }));

      // Apply filters if provided
      let filteredResults = results;
      if (query.filters) {
        filteredResults = this._applyFilters(results, query.filters);
      }

      // Apply score threshold if provided
      if (query.options?.minScore) {
        filteredResults = filteredResults.filter(r => r.score >= query.options!.minScore!);
      }

      // Limit results
      const limitedResults = filteredResults.slice(0, maxResults);

      serviceLogger.info('Search completed', {
        query: query.query,
        resultsCount: limitedResults.length,
        mocked,
      });

      return {
        results: limitedResults,
        query: query.query,
        total: limitedResults.length,
        latencyMs: Date.now() - t0,
        metadata: {
          retrievalUsed: mocked ? [] : ['hyperspell', 'local'],
        },
      };
    } catch (error: any) {
      serviceLogger.error('Search failed', { error: error.message, query: query.query });
      return {
        results: [],
        query: query.query,
        total: 0,
        latencyMs: Date.now() - t0,
      };
    }
  }

  /**
   * Search images by text or image similarity
   */
  async searchImages(query: ImageSearchQuery): Promise<ImageSearchResults> {
    const serviceLogger = logger.child({ service: 'knowledge', operation: 'searchImages' });
    const t0 = Date.now();

    try {
      if (!mossImageService.isAvailable()) {
        serviceLogger.warn('Image search not available (Moss not configured)');
        return {
          results: [],
          query: query.query,
          total: 0,
          latencyMs: Date.now() - t0,
        };
      }

      const maxResults = query.maxResults || 10;
      let mossResults;

      if (query.image) {
        // Image-to-image similarity search
        const imageData = query.image.base64 || query.image.url || '';
        mossResults = await mossImageService.searchByImage(imageData, maxResults);
      } else if (query.query) {
        // Text-to-image search
        mossResults = await mossImageService.searchByText(query.query, maxResults);
      } else {
        return {
          results: [],
          total: 0,
          latencyMs: Date.now() - t0,
        };
      }

      // Convert to unified ImageResult model
      const results: ImageResult[] = (mossResults || []).map((img: any) => ({
        id: img.id,
        title: img.title,
        description: img.description,
        imageUrl: img.image_url || img.url,
        image: img.image,
        score: img.score || 0,
        metadata: {
          tags: img.tags,
          ...img,
        },
      }));

      serviceLogger.info('Image search completed', {
        query: query.query || 'image similarity',
        resultsCount: results.length,
      });

      return {
        results,
        query: query.query,
        total: results.length,
        latencyMs: Date.now() - t0,
      };
    } catch (error: any) {
      serviceLogger.error('Image search failed', { error: error.message });
      return {
        results: [],
        query: query.query,
        total: 0,
        latencyMs: Date.now() - t0,
      };
    }
  }

  /**
   * Index content for search
   */
  async indexContent(content: ContentToIndex | ContentToIndex[]): Promise<void> {
    const serviceLogger = logger.child({ service: 'knowledge', operation: 'indexContent' });
    
    try {
      const contents = Array.isArray(content) ? content : [content];

      // Use retrieval service to index
      await retrievalService.indexDocuments(
        contents.map(c => ({
          id: c.id,
          text: c.text,
          source: c.source,
          metadata: c.metadata,
        }))
      );

      serviceLogger.info('Content indexed', { count: contents.length });
    } catch (error: any) {
      serviceLogger.error('Index content failed', { error: error.message });
      throw new Error(`Failed to index content: ${error.message}`);
    }
  }

  /**
   * Index an image for search
   */
  async indexImage(image: ImageInput | ImageInput[]): Promise<{ ok: boolean; indexed?: number; total?: number; error?: string }> {
    const serviceLogger = logger.child({ service: 'knowledge', operation: 'indexImage' });
    
    try {
      if (!mossImageService.isAvailable()) {
        return { ok: false, error: 'Image indexing not available (Moss not configured)' };
      }

      const images = Array.isArray(image) ? image : [image];

      const result = await mossImageService.indexImages(
        images.map(img => ({
          id: img.id,
          image: img.base64,
          imageUrl: img.url,
          metadata: img.metadata,
        }))
      );

      serviceLogger.info('Images indexed', { count: images.length, result });
      return result;
    } catch (error: any) {
      serviceLogger.error('Index image failed', { error: error.message });
      return { ok: false, error: error.message, total: Array.isArray(image) ? image.length : 1 };
    }
  }

  /**
   * Apply search filters
   */
  private _applyFilters(results: SearchResult[], filters: any): SearchResult[] {
    let filtered = results;

    if (filters.sources && filters.sources.length > 0) {
      filtered = filtered.filter(r => filters.sources!.includes(r.source));
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(r => {
        const resultTags = r.metadata?.tags || [];
        return filters.tags!.some((tag: string) => resultTags.includes(tag));
      });
    }

    if (filters.dateRange) {
      filtered = filtered.filter(r => {
        const resultDate = r.metadata?.timestamp || r.metadata?.date;
        if (!resultDate) return true;
        
        const date = typeof resultDate === 'number' ? resultDate : new Date(resultDate).getTime();
        
        if (filters.dateRange!.start && date < filters.dateRange!.start) return false;
        if (filters.dateRange!.end && date > filters.dateRange!.end) return false;
        
        return true;
      });
    }

    return filtered;
  }
}

export const knowledgeService = new KnowledgeService();

