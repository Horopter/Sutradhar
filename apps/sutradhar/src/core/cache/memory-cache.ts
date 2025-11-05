/**
 * In-Memory Cache Implementation
 * For single-instance deployments or development
 * For production multi-instance, use RedisCache
 */

import { ICache } from './types';
export class MemoryCache implements ICache {
  private cache: Map<string, { value: any; expires?: number }> = new Map();
  private readonly defaultTTL: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(defaultTTL = 3600) {
    this.defaultTTL = defaultTTL;
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Destroy the cache and clear cleanup interval
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (entry.expires && Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const expires = ttl 
      ? Date.now() + (ttl * 1000)
      : Date.now() + (this.defaultTTL * 1000);
    
    this.cache.set(key, { value, expires });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(namespace?: string): Promise<void> {
    if (namespace) {
      const prefix = `${namespace}:`;
      for (const key of this.cache.keys()) {
        if (key.startsWith(prefix)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (entry.expires && Date.now() > entry.expires) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires && now > entry.expires) {
        this.cache.delete(key);
      }
    }
  }
}

// MemoryCache already exported above as class export

