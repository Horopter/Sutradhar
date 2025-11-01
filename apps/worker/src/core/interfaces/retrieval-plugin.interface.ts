/**
 * Retrieval/Vector Search Plugin Interface
 */

import { IPlugin, PluginResult } from '../types';

export interface SearchSnippet {
  source: string;
  text: string;
  url?: string;
  score?: number;
  metadata?: Record<string, any>;
}

export interface SearchRequest {
  query: string;
  maxResults?: number;
  sources?: string[];
  filters?: Record<string, any>;
}

export interface IndexDocument {
  id: string;
  text: string;
  source: string;
  metadata?: Record<string, any>;
}

export interface IndexRequest {
  documents: IndexDocument[];
  collection?: string;
  replace?: boolean;
}

export interface IRetrievalPlugin extends IPlugin {
  search(request: SearchRequest): Promise<PluginResult<SearchSnippet[]>>;
  index(request: IndexRequest): Promise<PluginResult<{ indexed: number; total: number }>>;
  getStatus(): Promise<PluginResult<{ indexed: boolean; docCount: number; engine: string }>>;
}

