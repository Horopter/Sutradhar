/**
 * Cache Factory
 * Automatically selects Redis or Memory cache based on configuration
 */

import { env } from '../../env';
import { MemoryCache } from './memory-cache';
import { RedisCache } from './redis-cache';
import { ICache } from './types';
import { log } from '../../log';

// Re-export types and classes
export { MemoryCache } from './memory-cache';
export { RedisCache } from './redis-cache';
export { ICache } from './types';

let cacheInstance: ICache | null = null;

export function getCache(): ICache {
  if (cacheInstance) {
    return cacheInstance;
  }

  // Use Redis if REDIS_URL is configured (production) or explicitly enabled
  // In development, use Redis if REDIS_URL is set (for testing), otherwise memory
  const defaultTTL = typeof env.CACHE_DEFAULT_TTL === 'number' ? env.CACHE_DEFAULT_TTL : 3600;
  
  const useRedis = env.REDIS_URL && (env.NODE_ENV === 'production' || env.USE_REDIS === 'true');
  
  if (useRedis) {
    log.info('Initializing Redis cache', { redisUrl: env.REDIS_URL?.replace(/:[^:@]+@/, ':****@') });
    cacheInstance = new RedisCache(env.REDIS_URL!, defaultTTL);
  } else {
    log.info('Initializing in-memory cache');
    cacheInstance = new MemoryCache(defaultTTL);
  }

  return cacheInstance;
}

export async function disconnectCache(): Promise<void> {
  if (cacheInstance && 'disconnect' in cacheInstance) {
    await (cacheInstance as RedisCache).disconnect();
  }
  cacheInstance = null;
}

// Export singleton
export const cache = getCache();

