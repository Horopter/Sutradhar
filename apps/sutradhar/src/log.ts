/**
 * Log interface - delegates to Winston-based logger
 */

import { logger } from './core/logging/logger';

export const log = {
  info: (message: string, context?: any) => {
    logger.info(message, context);
  },
  warn: (message: string, context?: any) => {
    logger.warn(message, context);
  },
  error: (message: string, context?: any) => {
    logger.error(message, context);
  },
  debug: (message: string, context?: any) => {
    logger.debug(message, context);
  },
};

export { logger } from './core/logging/logger';
