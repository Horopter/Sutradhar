/**
 * Cache Warming Service
 * Pre-warms frequently accessed data to improve response times
 */

import { cache } from './index';
import { log } from '../../log';
import { Convex } from '../../convexClient';

export interface CacheWarmerConfig {
  enabled: boolean;
  warmupInterval: number; // milliseconds
}

class CacheWarmer {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start cache warming
   */
  start(config: CacheWarmerConfig = { enabled: true, warmupInterval: 300000 }): void {
    if (!config.enabled || this.isRunning) {
      return;
    }

    this.isRunning = true;
    
    // Initial warmup
    this.warmup().catch(err => {
      log.warn('Initial cache warmup failed', err);
    });

    // Periodic warmup
    this.intervalId = setInterval(() => {
      this.warmup().catch(err => {
        log.warn('Periodic cache warmup failed', err);
      });
    }, config.warmupInterval);

    log.info('Cache warmer started', { interval: config.warmupInterval });
  }

  /**
   * Stop cache warming
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    log.info('Cache warmer stopped');
  }

  /**
   * Warm up frequently accessed data
   */
  private async warmup(): Promise<void> {
    try {
      // Warm up course catalog
      await this.warmupCourseCatalog();
      
      // Warm up common queries
      await this.warmupCommonQueries();
      
      log.debug('Cache warmup completed');
    } catch (error) {
      log.error('Cache warmup error', error);
    }
  }

  /**
   * Warm up course catalog
   */
  private async warmupCourseCatalog(): Promise<void> {
    try {
      const courses = await Convex.queries('courses:list', {});
      if (courses && Array.isArray(courses)) {
        await cache.set('catalog:list', courses, 3600); // Cache for 1 hour
        log.debug('Course catalog warmed up', { count: courses.length });
      }
    } catch (error) {
      // Non-fatal - catalog will be loaded on demand
      log.debug('Course catalog warmup skipped', error);
    }
  }

  /**
   * Warm up common queries
   */
  private async warmupCommonQueries(): Promise<void> {
    // Add common queries here as needed
    // Example: Popular lessons, frequently accessed assignments, etc.
  }
}

export const cacheWarmer = new CacheWarmer();

