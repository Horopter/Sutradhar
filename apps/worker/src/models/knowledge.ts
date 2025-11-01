/**
 * Knowledge Domain Models
 * Unified models for search, retrieval, and indexing
 */

export interface SearchQuery {
  query: string;
  maxResults?: number;
  filters?: SearchFilters;
  options?: SearchOptions;
}

export interface SearchFilters {
  sources?: string[];
  dateRange?: {
    start?: number;
    end?: number;
  };
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface SearchOptions {
  includeMetadata?: boolean;
  minScore?: number;
  deduplicate?: boolean;
}

export interface SearchResult {
  id: string;
  text: string;
  source: string;
  score: number;
  url?: string;
  metadata?: Record<string, any>;
}

export interface SearchResults {
  results: SearchResult[];
  query: string;
  total: number;
  latencyMs: number;
  metadata?: {
    retrievalUsed?: string[];
    [key: string]: any;
  };
}

export interface ImageSearchQuery {
  query?: string;
  image?: ImageInput;
  maxResults?: number;
  filters?: SearchFilters;
}

export interface ImageInput {
  id?: string;
  url?: string;
  base64?: string;
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
    [key: string]: any;
  };
}

export interface ImageResult {
  id: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  image?: string; // base64
  score?: number;
  metadata?: Record<string, any>;
}

export interface ImageSearchResults {
  results: ImageResult[];
  query?: string;
  total: number;
  latencyMs: number;
}

export interface ContentToIndex {
  id: string;
  text: string;
  source: string;
  metadata?: {
    title?: string;
    tags?: string[];
    url?: string;
    [key: string]: any;
  };
}

