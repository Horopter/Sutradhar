/**
 * Centralized Error Handling Middleware
 * Provides consistent error responses across all endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { log } from '../../log';
import { env } from '../../env';
import * as Sentry from '@sentry/node';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

/**
 * Create a standardized application error
 */
export function createError(
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: any
): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
}

/**
 * Error handler middleware
 */
export function errorHandler(
  err: Error | AppError | z.ZodError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Request ID for tracing
  const requestId = req.headers['x-request-id'] as string || 'unknown';

  // Handle Zod validation errors
  if (err instanceof z.ZodError) {
    log.warn('Validation error', {
      requestId,
      path: req.path,
      errors: err.errors,
    });

    res.status(400).json({
      ok: false,
      error: 'Validation failed',
      details: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })),
      requestId,
    });
    return;
  }

  // Handle application errors
  const appError = err as AppError;
  const statusCode = appError.statusCode || 500;
  const isClientError = statusCode >= 400 && statusCode < 500;

  // Send to Sentry for server errors
  if (!isClientError && env.SENTRY_DSN) {
    Sentry.captureException(err, {
      tags: {
        path: req.path,
        method: req.method,
      },
      extra: {
        requestId,
        statusCode,
        code: appError.code,
      },
    });
  }

  // Log error
  if (isClientError) {
    log.warn('Client error', {
      requestId,
      path: req.path,
      method: req.method,
      statusCode,
      message: err.message,
      code: appError.code,
    });
  } else {
    log.error('Server error', {
      requestId,
      path: req.path,
      method: req.method,
      statusCode,
      message: err.message,
      stack: env.NODE_ENV === 'development' ? err.stack : undefined,
      code: appError.code,
      details: appError.details,
    });
  }

  // Send error response
  const response: any = {
    ok: false,
    error: err.message || 'Internal server error',
    requestId,
  };

  if (appError.code) {
    response.code = appError.code;
  }

  // Include details in development or for client errors
  if (env.NODE_ENV === 'development' || isClientError) {
    if (appError.details) {
      response.details = appError.details;
    }
    if (env.NODE_ENV === 'development' && err.stack) {
      response.stack = err.stack;
    }
  }

  res.status(statusCode).json(response);
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

