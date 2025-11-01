/**
 * Mock Retrieval Plugin - Sophisticated mock for vector/search operations
 */

import { BaseMockPlugin } from './base-mock-plugin';
import {
  IRetrievalPlugin,
  SearchRequest,
  SearchSnippet,
  IndexRequest,
  IndexDocument,
} from '../interfaces/retrieval-plugin.interface';
import { PluginConfig, PluginMetadata, PluginResult } from '../types';
import { log } from '../../log';
import fs from 'fs';
import path from 'path';

export class RetrievalMockPlugin extends BaseMockPlugin implements IRetrievalPlugin {
  readonly metadata: PluginMetadata = {
    name: 'retrieval-mock',
    version: '1.0.0',
    description: 'Mock retrieval provider with local file search',
    capabilities: ['search', 'index', 'local-files'],
  };

  readonly config: PluginConfig;
  private indexedDocuments: IndexDocument[] = [];
  private searchHistory: Array<{ query: string; results: number; timestamp: number }> = [];

  constructor(config: PluginConfig) {
    super();
    this.config = config;
  }

  async initialize(config: PluginConfig): Promise<void> {
    await super.initialize(config);
    
    // Auto-index data repository files if available
    try {
      const dataRepoDir = this.getDataRepositoryDir();
      if (fs.existsSync(dataRepoDir)) {
        await this.indexLocalFiles(dataRepoDir);
        log.info(`Mock retrieval initialized with ${this.indexedDocuments.length} documents from ${dataRepoDir}`);
      }
    } catch (error) {
      log.warn('Could not auto-index data repository files', error);
    }
  }

  async search(request: SearchRequest): Promise<PluginResult<SearchSnippet[]>> {
    await this.simulateLatency(50, 250);

    const query = request.query.toLowerCase();
    const maxResults = request.maxResults || 5;
    
    // Search through indexed documents
    const results: SearchSnippet[] = [];
    
    for (const doc of this.indexedDocuments) {
      const docText = doc.text.toLowerCase();
      
      // Simple keyword matching (can be enhanced with BM25-like scoring)
      const queryTerms = query.split(/\s+/).filter(t => t.length > 2);
      const matches = queryTerms.filter(term => docText.includes(term));
      
      if (matches.length > 0) {
        // Calculate relevance score (simple)
        const score = matches.length / queryTerms.length;
        
        // Extract relevant snippet
        const snippet = this.extractSnippet(doc.text, query);
        
        results.push({
          source: doc.source,
          text: snippet,
          score,
          metadata: doc.metadata,
        });

        if (results.length >= maxResults) break;
      }
    }

    // Fallback to default snippets if no matches
    if (results.length === 0) {
      results.push(
        {
          source: 'FAQ.md',
          text: 'Business plan includes unlimited videos with 1080p exports and SSO.',
          score: 0.5,
        },
        {
          source: 'Runbooks.md',
          text: 'Upload 500 on >2GB via web: suggest Desktop app or split file; escalate if Business.',
          score: 0.5,
        }
      );
    }

    // Sort by score
    results.sort((a, b) => (b.score || 0) - (a.score || 0));

    // Track search
    this.searchHistory.push({
      query: request.query,
      results: results.length,
      timestamp: Date.now(),
    });

    // Keep last 1000 searches
    if (this.searchHistory.length > 1000) {
      this.searchHistory.shift();
    }

    log.info(`MOCK RETRIEVAL: "${query}"`, {
      results: results.length,
      indexedDocs: this.indexedDocuments.length,
    });

    return this.mockSuccess(results.slice(0, maxResults), {
      totalIndexed: this.indexedDocuments.length,
      searchCount: this.searchHistory.length,
    });
  }

  async index(request: IndexRequest): Promise<PluginResult<{ indexed: number; total: number }>> {
    await this.simulateLatency(100, 500);

    if (request.replace) {
      this.indexedDocuments = [];
    }

    const beforeCount = this.indexedDocuments.length;
    this.indexedDocuments.push(...request.documents);
    
    log.info(`MOCK INDEX: Indexed ${request.documents.length} documents`, {
      before: beforeCount,
      after: this.indexedDocuments.length,
    });

    return this.mockSuccess({
      indexed: request.documents.length,
      total: this.indexedDocuments.length,
    });
  }

  async getStatus(): Promise<PluginResult<{ indexed: boolean; docCount: number; engine: string }>> {
    return this.mockSuccess({
      indexed: this.indexedDocuments.length > 0,
      docCount: this.indexedDocuments.length,
      engine: 'mock-local-search',
    });
  }

  private extractSnippet(text: string, query: string, maxLength = 200): string {
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    
    // Find first occurrence
    const index = textLower.indexOf(queryLower);
    
    if (index === -1) {
      // No match, return beginning
      return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
    }

    // Extract context around match
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + query.length + 150);
    
    let snippet = text.substring(start, end);
    
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';
    
    return snippet;
  }

  private getDataRepositoryDir(): string {
    const options = [
      path.join(process.cwd(), '../data_repository'),
      path.join(process.cwd(), '../../data_repository'),
      path.join(process.cwd(), 'data_repository'),
      path.join(__dirname, '../../../../data_repository'),
    ];

    for (const dataRepoDir of options) {
      if (fs.existsSync(dataRepoDir)) {
        return dataRepoDir;
      }
    }

    return path.join(process.cwd(), '../data_repository');
  }

  private getAllMarkdownFiles(dir: string, fileList: string[] = []): string[] {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        this.getAllMarkdownFiles(filePath, fileList);
      } else if (file.endsWith('.md')) {
        fileList.push(filePath);
      }
    });
    
    return fileList;
  }

  private async indexLocalFiles(dataRepoDir: string): Promise<void> {
    if (!fs.existsSync(dataRepoDir)) return;

    const filePaths = this.getAllMarkdownFiles(dataRepoDir);
    const documents: IndexDocument[] = [];

    for (const filePath of filePaths) {
      const relativePath = path.relative(dataRepoDir, filePath);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        // Split into chunks
        const chunks = content.split(/\n(?=##? )/g).filter(Boolean);
        
        chunks.forEach((chunk, i) => {
          documents.push({
            id: `${relativePath}-${i}`,
            text: chunk.trim(),
            source: relativePath,
            metadata: { file: relativePath, chunkIndex: i },
          });
        });
      } catch (error) {
        log.warn(`Failed to index ${relativePath}`, error);
      }
    }

    if (documents.length > 0) {
      this.indexedDocuments.push(...documents);
    }
  }

  /**
   * Get search history (for analytics)
   */
  getSearchHistory(): Array<{ query: string; results: number; timestamp: number }> {
    return [...this.searchHistory];
  }
}


