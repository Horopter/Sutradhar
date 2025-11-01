/**
 * Health Tracking Middleware - Tracks request/response health for all endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { healthMonitor } from '../services/health-monitor';

/**
 * Middleware to track endpoint health
 */
export function trackHealth(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const path = req.route?.path || req.path;
  const method = req.method;

  // Track response finish
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    const success = res.statusCode >= 200 && res.statusCode < 400;
    const error = success ? undefined : `HTTP ${res.statusCode}`;

    healthMonitor.recordRequest(
      path,
      method,
      responseTime,
      success,
      res.statusCode,
      error
    );
  });

  next();
}

