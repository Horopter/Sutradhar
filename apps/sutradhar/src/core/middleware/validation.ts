/**
 * Request Validation Middleware
 * Validates request bodies and query parameters using Zod schemas
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { createError } from './error-handler';

export interface ValidationOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
  stripUnknown?: boolean;
}

/**
 * Validate request using Zod schemas
 */
export function validate(options: ValidationOptions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (options.body) {
        const result = options.body.safeParse(req.body);
        if (!result.success) {
          throw result.error;
        }
        req.body = options.stripUnknown !== false ? result.data : req.body;
      }

      if (options.query) {
        const result = options.query.safeParse(req.query);
        if (!result.success) {
          throw result.error;
        }
        req.query = options.stripUnknown !== false ? result.data : req.query;
      }

      if (options.params) {
        const result = options.params.safeParse(req.params);
        if (!result.success) {
          throw result.error;
        }
        req.params = options.stripUnknown !== false ? result.data : req.params;
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(error);
      } else {
        next(createError('Validation failed', 400, 'VALIDATION_ERROR', error));
      }
    }
  };
}

