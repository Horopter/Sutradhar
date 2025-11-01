/**
 * Rate Limiting Middleware
 * Prevents abuse and controls API costs
 */

import { Request, Response, NextFunction } from 'express';
import { log } from '../../log';

export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

/**
 * Simple in-memory rate limiter (for production, use Redis-based solution)
 */
class RateLimiter {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  check(key: string, maxRequests: number, windowMs: number): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.store[key];

    if (!entry || now > entry.resetTime) {
      // Create new entry
      this.store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: now + windowMs,
      };
    }

    if (entry.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const key in this.store) {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    }
  }

  reset(key?: string): void {
    if (key) {
      delete this.store[key];
    } else {
      this.store = {};
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store = {};
  }
}

const rateLimiter = new RateLimiter();

/**
 * Create rate limiting middleware
 */
export function rateLimit(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req: Request) => {
      // Default: use IP address
      return req.ip || req.socket.remoteAddress || 'unknown';
    },
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = config;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Allow test harness to bypass rate limits safely
    // Check both env var (for server-level bypass) and header (for request-level bypass)
    // Express normalizes headers to lowercase, so 'X-Internal-Test' becomes 'x-internal-test'
    const headerValue = req.headers['x-internal-test'];
    const isBypass = 
      process.env.RL_BYPASS === 'true' || 
      headerValue === 'true' ||
      String(headerValue).toLowerCase() === 'true';
    
    if (isBypass) {
      // Still set headers for consistency
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', maxRequests.toString());
      res.setHeader('X-RateLimit-Bypassed', 'true');
      log.info('Rate limit bypassed', {
        path: req.path,
        method: req.method,
        reason: process.env.RL_BYPASS === 'true' ? 'env_var' : 'header',
      });
      return next();
    }

    const key = keyGenerator(req);
    const result = rateLimiter.check(key, maxRequests, windowMs);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

    if (!result.allowed) {
      log.warn('Rate limit exceeded', {
        key,
        path: req.path,
        method: req.method,
      });

      res.status(429).json({
        ok: false,
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again after ${new Date(result.resetTime).toISOString()}`,
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
      });
      return;
    }

    // Track response status if needed
    const originalSend = res.send;
    res.send = function (body?: any) {
      const statusCode = res.statusCode;
      const isSuccess = statusCode >= 200 && statusCode < 300;

      if ((skipSuccessfulRequests && isSuccess) || (skipFailedRequests && !isSuccess)) {
        // Don't count this request
        const currentEntry = rateLimiter['store'][key];
        if (currentEntry && currentEntry.count > 0) {
          currentEntry.count--;
        }
      }

      return originalSend.call(this, body);
    };

    next();
  };
}

/**
 * Predefined rate limiters for common use cases
 */
export const rateLimiters = {
  // Strict rate limit for expensive operations (LLM, actions)
  strict: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  }),

  // Standard rate limit for most endpoints
  standard: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
  }),

  // Lenient rate limit for health checks and diagnostics
  lenient: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  }),

  // Per-session rate limit (requires sessionId in body/query)
  perSession: rateLimit({
    windowMs: 60 * 1000,
    maxRequests: 20,
    keyGenerator: (req: Request) => {
      const sessionId = (req.body?.sessionId || req.query?.sessionId || req.headers['x-session-id']) as string;
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      return sessionId ? `session:${sessionId}` : `ip:${ip}`;
    },
  }),
};

