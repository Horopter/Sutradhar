/**
 * Request Context Middleware
 * Adds request ID, timing, and logging context to all requests
 */

import { Request, Response, NextFunction } from 'express';
import { nanoid } from 'nanoid';
import { logger } from '../../core/logging/logger';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}

/**
 * Request context middleware
 * - Adds unique request ID
 * - Tracks request timing
 * - Adds structured logging context
 */
export function requestContext(req: Request, res: Response, next: NextFunction): void {
  // Generate or use existing request ID
  req.requestId = (req.headers['x-request-id'] as string) || nanoid(10);
  req.startTime = Date.now();

  // Set response header
  res.setHeader('X-Request-ID', req.requestId);

  // Set logger context for this request
  const requestLogger = logger.child({
    requestId: req.requestId,
    path: req.path,
    method: req.method,
  });
  
  // Store logger on request for use in route handlers
  (req as any).logger = requestLogger;

  // Log request start
  requestLogger.verbose('Request started', {
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
  });

  // Log response completion
  const originalEnd = res.end.bind(res);
  res.end = function (chunk?: any, encoding?: any): Response {
    const duration = Date.now() - req.startTime;
    
    requestLogger.info('Request completed', {
      statusCode: res.statusCode,
      durationMs: duration,
    });

    return originalEnd(chunk, encoding);
  };

  next();
}

