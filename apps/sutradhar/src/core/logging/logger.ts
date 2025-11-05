/**
 * Winston-based Logger with Session Support
 * Provides DEBUG, INFO, VERBOSE, ERROR levels with session-based persistence
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { env } from '../../env';
import { Convex } from '../../convexClient';

// Custom log levels with VERBOSE
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  verbose: 3,
  debug: 4,
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'cyan',
  verbose: 'magenta',
  debug: 'blue',
};

winston.addColors(logColors);

// Log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format (pretty for development)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ colors: logColors }),
  winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} ${level}: ${message} ${metaStr}`;
  })
);

// File transport with daily rotation (30 days retention)
const fileTransport = new DailyRotateFile({
  filename: 'logs/sutradhar-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d', // Keep 30 days of logs
  format: logFormat,
  level: env.LOG_LEVEL || 'debug',
});

// Error file transport
const errorFileTransport = new DailyRotateFile({
  filename: 'logs/sutradhar-error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  format: logFormat,
  level: 'error',
});

// Create Winston logger
const winstonLogger = winston.createLogger({
  levels: logLevels,
  level: env.LOG_LEVEL || (env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: logFormat,
  defaultMeta: {
    service: 'sutradhar-api',
    environment: env.NODE_ENV,
  },
  transports: [
    // Console output
    new winston.transports.Console({
      format: env.LOG_JSON === 'true' ? logFormat : consoleFormat,
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    }),
    // File output (only in production or if LOG_FILE=true)
    ...(env.NODE_ENV === 'production' || env.LOG_FILE === 'true' 
      ? [fileTransport, errorFileTransport] 
      : []),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

// Session log storage interface
interface LogEntry {
  sessionId?: string;
  requestId?: string;
  level: string;
  message: string;
  timestamp: number;
  metadata?: Record<string, any>;
  service?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  durationMs?: number;
  error?: {
    message: string;
    stack?: string;
  };
}

// Store logs in Convex (non-blocking, fire and forget)
async function persistLog(logEntry: LogEntry): Promise<void> {
  // Only persist INFO and above in production to reduce load
  const shouldPersist = 
    env.LOG_PERSIST !== 'false' && 
    (env.NODE_ENV === 'development' || ['info', 'warn', 'error'].includes(logEntry.level));

  if (!shouldPersist || !logEntry.sessionId) {
    return;
  }

  // Fire and forget - don't block logging
  Convex.logs.append({
    sessionId: logEntry.sessionId,
    level: logEntry.level,
    message: logEntry.message,
    timestamp: logEntry.timestamp,
    metadata: logEntry.metadata || {},
    requestId: logEntry.requestId,
    service: logEntry.service,
    path: logEntry.path,
    method: logEntry.method,
    statusCode: logEntry.statusCode,
    durationMs: logEntry.durationMs,
    error: logEntry.error,
  }).catch((err) => {
    // Only log if it's not a log persistence error (avoid recursion)
    console.error('Failed to persist log to Convex', err.message);
  });
}

// Enhanced logger with session support
class Logger {
  private context: {
    sessionId?: string;
    requestId?: string;
    userId?: string;
    [key: string]: any;
  } = {};

  /**
   * Set context that will be included in all subsequent logs
   */
  setContext(context: Partial<Logger['context']>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear context
   */
  clearContext(): void {
    this.context = {};
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: Partial<Logger['context']>): Logger {
    const child = new Logger();
    child.context = { ...this.context, ...additionalContext };
    return child;
  }

  private log(
    level: 'error' | 'warn' | 'info' | 'verbose' | 'debug',
    message: string,
    metadata?: Record<string, any>
  ): void {
    const logMetadata = {
      ...this.context,
      ...metadata,
    };

    // Log to Winston
    winstonLogger[level](message, logMetadata);

    // Persist to Convex if session ID is present
    const sessionId = logMetadata.sessionId || this.context.sessionId;
    if (sessionId) {
      persistLog({
        sessionId,
        requestId: logMetadata.requestId || this.context.requestId,
        level,
        message,
        timestamp: Date.now(),
        metadata: logMetadata,
        service: logMetadata.service,
        path: logMetadata.path,
        method: logMetadata.method,
        statusCode: logMetadata.statusCode,
        durationMs: logMetadata.durationMs,
        error: logMetadata.error ? {
          message: logMetadata.error.message || String(logMetadata.error),
          stack: logMetadata.error.stack,
        } : undefined,
      });
    }
  }

  error(message: string, metadata?: Record<string, any>): void {
    this.log('error', message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log('warn', message, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log('info', message, metadata);
  }

  verbose(message: string, metadata?: Record<string, any>): void {
    this.log('verbose', message, metadata);
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.log('debug', message, metadata);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export Winston logger for advanced usage
export { winstonLogger };

// Export types
export type { LogEntry };

