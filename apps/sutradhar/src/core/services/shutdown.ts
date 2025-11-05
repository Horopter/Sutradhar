/**
 * Graceful Shutdown Service
 * Handles clean shutdown of all services and connections
 */

import { log } from '../../log';
import { shutdownPlugins } from '../plugin-factory';
import { healthMonitor } from './health-monitor';
import { disconnectCache } from '../cache';
import { destroyAgents } from '../http/client-pool';
import { env } from '../../env';

export interface ShutdownOptions {
  timeout?: number;
  force?: boolean;
}

export class ShutdownService {
  private shuttingDown: boolean = false;
  private readonly shutdownTimeout: number;
  private shutdownTimer: NodeJS.Timeout | null = null;

  constructor(timeout: number = env.GRACEFUL_SHUTDOWN_TIMEOUT || 30000) {
    this.shutdownTimeout = timeout;
  }

  /**
   * Register shutdown handlers
   */
  register(): void {
    // Handle SIGTERM (Docker, Kubernetes, etc.)
    process.on('SIGTERM', () => {
      log.info('SIGTERM received, initiating graceful shutdown...');
      this.shutdown();
    });

    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      log.info('SIGINT received, initiating graceful shutdown...');
      this.shutdown();
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      log.error('Uncaught exception, shutting down', error);
      this.shutdown({ force: true });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      log.error('Unhandled promise rejection', { reason, promise });
      // Don't force shutdown for unhandled rejections in production
      // Log and continue
    });
  }

  /**
   * Perform graceful shutdown
   */
  async shutdown(options: ShutdownOptions = {}): Promise<void> {
    if (this.shuttingDown) {
      log.warn('Shutdown already in progress');
      return;
    }

    this.shuttingDown = true;
    const { timeout = this.shutdownTimeout, force = false } = options;

    log.info('Starting graceful shutdown', { timeout, force });

    // Set timeout for forced shutdown
    if (!force) {
      this.shutdownTimer = setTimeout(() => {
        log.error('Shutdown timeout exceeded, forcing exit');
        process.exit(1);
      }, timeout);
    }

    try {
      // Step 1: Stop accepting new requests (health monitor will report unhealthy)
      log.info('Stopping health monitor...');
      healthMonitor.stopHeartbeat();

      // Step 2: Disconnect cache
      log.info('Disconnecting cache...');
      await disconnectCache().catch((err) => {
        log.warn('Cache disconnect error', err);
      });

      // Step 2.5: Destroy HTTP agents
      log.info('Destroying HTTP connection pools...');
      destroyAgents();

      // Step 3: Shutdown plugins
      log.info('Shutting down plugins...');
      await shutdownPlugins().catch((err) => {
        log.warn('Plugin shutdown error', err);
      });

      // Step 4: Close server connections (if any)
      log.info('Graceful shutdown complete');

      // Clear timeout
      if (this.shutdownTimer) {
        clearTimeout(this.shutdownTimer);
      }

      // Exit with success
      process.exit(0);
    } catch (error) {
      log.error('Error during shutdown', error);
      process.exit(1);
    }
  }

  /**
   * Check if shutdown is in progress
   */
  isShuttingDown(): boolean {
    return this.shuttingDown;
  }
}

export const shutdownService = new ShutdownService();

