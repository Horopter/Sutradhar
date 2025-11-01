/**
 * Log Cleanup Service
 * Automatically removes logs older than 30 days
 */

import { logger } from './logger';
import { Convex } from '../../convexClient';
import { env } from '../../env';

const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Run log cleanup (removes logs older than 30 days)
 */
export async function runLogCleanup(): Promise<void> {
  try {
    logger.info('Starting log cleanup', {
      service: 'log-cleanup',
      timestamp: Date.now(),
    });

    const result = await Convex.logs.cleanup({});

    logger.info('Log cleanup completed', {
      service: 'log-cleanup',
      deleted: result.deleted || 0,
      timestamp: result.timestamp || Date.now(),
    });
  } catch (error: any) {
    logger.error('Log cleanup failed', {
      service: 'log-cleanup',
      error: error.message,
      stack: error.stack,
    });
  }
}

/**
 * Start automatic log cleanup
 */
export function startLogCleanup(): void {
  if (cleanupInterval) {
    logger.warn('Log cleanup already running');
    return;
  }

  // Run immediately on start (with delay to let server initialize)
  setTimeout(() => {
    runLogCleanup();
  }, 5 * 60 * 1000); // 5 minutes

  // Then run daily
  cleanupInterval = setInterval(() => {
    runLogCleanup();
  }, CLEANUP_INTERVAL);

  logger.info('Log cleanup scheduled', {
    service: 'log-cleanup',
    interval: '24 hours',
    retention: '30 days',
  });
}

/**
 * Stop automatic log cleanup
 */
export function stopLogCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    logger.info('Log cleanup stopped');
  }
}

