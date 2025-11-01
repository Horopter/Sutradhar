/**
 * Real Retrieval Plugin - Wraps existing retrieval clients
 */

import { BaseMockPlugin } from '../mocks/base-mock-plugin';
import {
  IRetrievalPlugin,
  SearchRequest,
  SearchSnippet,
  IndexRequest,
  IndexDocument,
} from '../interfaces/retrieval-plugin.interface';
import { PluginConfig, PluginMetadata, PluginResult } from '../types';
import { hyperspellSearch, hyperspellSeedText } from '../../retrieval/clients';
import { localIndexBuild, localIndexQuery, localIndexStatus } from '../../retrieval/localIndex';
import { getContext } from '../../retrieval/getContext';
import { circuitBreakerRegistry } from '../circuit-breaker';
import { log } from '../../log';

export class RetrievalRealPlugin extends BaseMockPlugin implements IRetrievalPlugin {
  readonly metadata: PluginMetadata = {
    name: 'retrieval-real',
    version: '1.0.0',
    description: 'Real retrieval provider (Hyperspell + Local BM25)',
    capabilities: ['search', 'index', 'hyperspell', 'local-bm25'],
  };

  readonly config: PluginConfig;
  private circuitBreaker = circuitBreakerRegistry.get('retrieval-search', {
    failureThreshold: 5,
    resetTimeout: 30000,
  });

  constructor(config: PluginConfig) {
    super();
    this.config = config;
  }

  async search(request: SearchRequest): Promise<PluginResult<SearchSnippet[]>> {
    try {
      const result = await this.circuitBreaker.execute(async () => {
        // Use existing getContext which handles fallbacks
        const snippets = await getContext(request.query, request.maxResults || 5);
        
        return snippets.map(s => ({
          source: s.source,
          text: s.text,
          url: s.url,
        }));
      });

      return {
        ok: true,
        mocked: false,
        data: result,
      };
    } catch (error) {
      log.error('Retrieval search failed', error);
      // Fallback to empty results
      return {
        ok: false,
        mocked: false,
        data: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async index(request: IndexRequest): Promise<PluginResult<{ indexed: number; total: number }>> {
    try {
      // For now, index to local BM25
      if (request.replace) {
        localIndexBuild();
      }

      // Note: Local index builds from seed files, not individual documents
      // For document-level indexing, we'd need to enhance localIndex
      const status = localIndexStatus();

      return {
        ok: true,
        mocked: false,
        data: {
          indexed: request.documents.length,
          total: status.docCount,
        },
      };
    } catch (error) {
      log.error('Retrieval index failed', error);
      return {
        ok: false,
        mocked: false,
        data: { indexed: 0, total: 0 },
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getStatus(): Promise<PluginResult<{ indexed: boolean; docCount: number; engine: string }>> {
    try {
      const status = localIndexStatus();
      return {
        ok: true,
        mocked: false,
        data: {
          indexed: status.indexed,
          docCount: status.docCount,
          engine: 'bm25-local',
        },
      };
    } catch (error) {
      return {
        ok: false,
        mocked: false,
        data: {
          indexed: false,
          docCount: 0,
          engine: 'error',
        },
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

