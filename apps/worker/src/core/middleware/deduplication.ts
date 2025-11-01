/**
 * Request Deduplication Middleware
 * Prevents duplicate expensive operations (like LLM calls) from running concurrently
 */

import { Request, Response, NextFunction } from 'express';
import { log } from '../../log';
import crypto from 'crypto';

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

class RequestDeduplicator {
  private pending: Map<string, PendingRequest> = new Map();
  private readonly maxAge = 60000; // 1 minute max age for pending requests

  /**
   * Execute a request, deduplicating if the same request is already in flight
   */
  async execute<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = 5000 // Default 5 second deduplication window
  ): Promise<T> {
    // Cleanup old entries
    this.cleanup();

    const existing = this.pending.get(key);
    if (existing) {
      const age = Date.now() - existing.timestamp;
      if (age < ttl) {
        log.info('Request deduplicated', { key, age });
        return existing.promise as Promise<T>;
      }
    }

    // Create new request
    const promise = fn().finally(() => {
      // Remove after completion
      setTimeout(() => {
        this.pending.delete(key);
      }, 100);
    });

    this.pending.set(key, {
      promise,
      timestamp: Date.now(),
    });

    return promise;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.pending.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        this.pending.delete(key);
      }
    }
  }

  clear(): void {
    this.pending.clear();
  }
}

const deduplicator = new RequestDeduplicator();

/**
 * Generate a deduplication key from request
 */
export function generateDedupeKey(req: Request, includeBody: boolean = true): string {
  const parts = [
    req.method,
    req.path,
    req.query ? JSON.stringify(req.query) : '',
  ];

  if (includeBody && req.body) {
    // Hash body to avoid storing large payloads
    const bodyStr = JSON.stringify(req.body);
    const hash = crypto.createHash('sha256').update(bodyStr).digest('hex').substring(0, 16);
    parts.push(hash);
  }

  return parts.join(':');
}

/**
 * Request deduplication middleware
 * Only deduplicates POST/PUT requests with bodies
 */
export function deduplicate(ttl: number = 5000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Only deduplicate POST/PUT/PATCH with body
    if (!['POST', 'PUT', 'PATCH'].includes(req.method) || !req.body) {
      return next();
    }

    const key = generateDedupeKey(req, true);
    
    // Wrap the original handler
    const originalSend = res.send;
    let responseData: any;

    res.send = function (body: any) {
      responseData = body;
      return originalSend.call(this, body);
    };

    // Store original next
    const originalNext = next;
    let handlerExecuted = false;
    let handlerPromise: Promise<any> | null = null;

    // Override next to capture handler
    const wrappedNext = function (this: any) {
      handlerExecuted = true;
      return originalNext.apply(this, arguments as any);
    };
    next = wrappedNext as NextFunction;

    // Execute with deduplication
    deduplicator
      .execute(
        key,
        async () => {
          return new Promise<void>((resolve, reject) => {
            // Wait for response to be sent
            const checkInterval = setInterval(() => {
              if (res.headersSent || responseData !== undefined) {
                clearInterval(checkInterval);
                resolve();
              }
            }, 10);

            // Timeout after 60 seconds
            setTimeout(() => {
              clearInterval(checkInterval);
              reject(new Error('Deduplication timeout'));
            }, 60000);
          });
        },
        ttl
      )
      .catch((err) => {
        if (!res.headersSent) {
          log.error('Deduplication error', err);
          res.status(500).json({
            ok: false,
            error: 'Request processing error',
          });
        }
      });

    // Call next normally
    originalNext();
  };
}

/**
 * Deduplicate expensive operations manually (for use in services)
 */
export async function deduplicateOperation<T>(
  key: string,
  operation: () => Promise<T>,
  ttl: number = 5000
): Promise<T> {
  return deduplicator.execute(key, operation, ttl);
}

