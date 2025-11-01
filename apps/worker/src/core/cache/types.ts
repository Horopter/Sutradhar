/**
 * Cache Interface Types
 */

export interface CacheConfig {
  ttl?: number;  // Time to live in seconds
  namespace?: string;
}

export interface ICache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(namespace?: string): Promise<void>;
  has(key: string): Promise<boolean>;
}

