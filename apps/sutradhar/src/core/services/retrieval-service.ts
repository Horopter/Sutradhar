/**
 * Retrieval Service - Business logic layer for search/retrieval operations
 */

import { pluginRegistry } from '../plugin-registry';
import { IRetrievalPlugin, SearchRequest, SearchSnippet, IndexRequest } from '../interfaces/retrieval-plugin.interface';
import { log } from '../../log';
import { cache } from '../cache';

export class RetrievalService {
  private async getPlugin(): Promise<IRetrievalPlugin> {
    return await pluginRegistry.get<IRetrievalPlugin>('retrieval');
  }

  async search(query: string, maxResults = 5): Promise<{ snippets: SearchSnippet[]; mocked?: boolean }> {
    try {
      const plugin = await this.getPlugin();

      // Optional caching for frequent queries
      const cacheKey = `retrieval:search:${this.hashQuery(query)}:${maxResults}`;
      const cached = await cache.get<SearchSnippet[]>(cacheKey);
      
      if (cached) {
        log.info('Retrieval cache hit', { query });
        return { snippets: cached };
      }

      const request: SearchRequest = {
        query,
        maxResults,
      };

      const result = await plugin.search(request);

      if (result.ok && result.data) {
        // Cache retrieval results for 10 minutes (longer TTL for better cost savings)
        // User queries are unique, but similar queries benefit from cache
        await cache.set(cacheKey, result.data, 600);
        
        log.info('Retrieval search completed', {
          query,
          results: result.data.length,
          mocked: result.mocked,
        });

        return {
          snippets: result.data,
          mocked: result.mocked,
        };
      }

      return { snippets: [] };
    } catch (error) {
      log.error('Retrieval service error', error);
      return { snippets: [] };
    }
  }

  async indexDocuments(documents: Array<{ id: string; text: string; source: string; metadata?: Record<string, any> }>): Promise<{ indexed: number; total: number }> {
    try {
      const plugin = await this.getPlugin();

      const request: IndexRequest = {
        documents,
        replace: false,
      };

      const result = await plugin.index(request);

      if (result.ok && result.data) {
        log.info('Documents indexed', {
          indexed: result.data.indexed,
          total: result.data.total,
        });

        // Clear search cache since index changed
        await cache.clear('retrieval');

        return result.data;
      }

      return { indexed: 0, total: 0 };
    } catch (error) {
      log.error('Index service error', error);
      return { indexed: 0, total: 0 };
    }
  }

  async getStatus(): Promise<{ indexed: boolean; docCount: number; engine: string }> {
    try {
      const plugin = await this.getPlugin();
      const result = await plugin.getStatus();

      if (result.ok && result.data) {
        return result.data;
      }

      return { indexed: false, docCount: 0, engine: 'unknown' };
    } catch (error) {
      return { indexed: false, docCount: 0, engine: 'error' };
    }
  }

  private hashQuery(query: string): string {
    // Simple hash for caching
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}

export const retrievalService = new RetrievalService();

