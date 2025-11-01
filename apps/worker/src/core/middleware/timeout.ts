/**
 * Request Timeout Middleware
 * Prevents long-running requests from consuming resources
 */

import { Request, Response, NextFunction } from 'express';
import { log } from '../../log';

/**
 * Create timeout middleware
 */
export function timeout(ms: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        log.warn('Request timeout', {
          requestId: req.requestId,
          path: req.path,
          method: req.method,
          timeoutMs: ms,
        });

        res.status(504).json({
          ok: false,
          error: 'Request timeout',
          message: `Request exceeded ${ms}ms timeout`,
          requestId: req.requestId,
        });
      }
    }, ms);

    // Clear timeout when response is sent
    const originalEnd = res.end.bind(res);
    res.end = function (chunk?: any, encoding?: any): Response {
      clearTimeout(timer);
      return originalEnd(chunk, encoding);
    };

    next();
  };
}

/**
 * Predefined timeout middleware for different operation types
 */
export const timeouts = {
  // Very short timeout for health checks
  health: timeout(5000),

  // Standard timeout for most endpoints
  standard: timeout(30000), // 30 seconds

  // Longer timeout for expensive operations (LLM, retrieval)
  expensive: timeout(60000), // 60 seconds

  // Very long timeout for indexing operations
  indexing: timeout(120000), // 2 minutes
};

