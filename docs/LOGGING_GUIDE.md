# Logging Guide

Sutradhar uses a comprehensive logging system built on Winston with session-based log persistence and search capabilities.

## Log Levels

The system supports five log levels (ordered by severity):

1. **ERROR** - Critical errors that require attention
2. **WARN** - Warning conditions that may need attention
3. **INFO** - Informational messages about normal operations
4. **VERBOSE** - Detailed diagnostic information
5. **DEBUG** - Very detailed diagnostic information for debugging

## Configuration

### Environment Variables

```bash
# Log level (default: 'info' in production, 'debug' in development)
LOG_LEVEL=debug

# JSON format logging (default: false)
LOG_JSON=true

# Enable file logging in development (default: false)
LOG_FILE=true

# Persist logs to Convex (default: true)
LOG_PERSIST=true
```

### Default Behavior

- **Development**: Logs to console with colors, DEBUG level enabled
- **Production**: JSON format, INFO level, file rotation with 30-day retention

## Usage

### Basic Logging

```typescript
import { logger } from './core/logging/logger';

// Simple logging
logger.info('User logged in');
logger.error('Database connection failed');
logger.warn('Rate limit approaching');
logger.debug('Processing request data');
logger.verbose('Detailed request information');

// With context
logger.info('Request processed', {
  userId: '123',
  endpoint: '/api/answer',
  durationMs: 245,
});
```

### Session-Based Logging

Logs are automatically associated with sessions when a `sessionId` is provided in the context:

```typescript
// Set session context
logger.setContext({ sessionId: 'session-123' });

// All subsequent logs will be associated with this session
logger.info('User asked a question', { question: 'What is AI?' });

// Create child logger with additional context
const requestLogger = logger.child({
  requestId: 'req-456',
  userId: 'user-789',
});

requestLogger.info('Processing answer');
```

### Request-Level Logging

In route handlers, use the request logger which automatically includes request context:

```typescript
import { Request } from 'express';

export async function myRoute(req: Request, res: Response) {
  // Request logger is available on req.logger
  const log = (req as any).logger || logger;
  
  log.verbose('Processing request', { 
    sessionId: req.body.sessionId,
    question: req.body.question 
  });
  
  // ... your code ...
  
  log.info('Request completed successfully', { resultCount: 10 });
}
```

## Session-Based Log Search

### API Endpoints

#### Get Recent Sessions
```bash
GET /api/v1/logs/sessions/recent?limit=50
```

Returns sessions that have logs, sorted by most recent activity.

#### Get Logs for a Session
```bash
GET /api/v1/logs/sessions/{sessionId}?limit=1000&level=error
```

Optional query parameters:
- `limit` - Maximum number of logs to return (default: 1000)
- `level` - Filter by log level (error, warn, info, verbose, debug)
- `startTime` - Start timestamp (milliseconds)
- `endTime` - End timestamp (milliseconds)

#### Get Log Statistics for a Session
```bash
GET /api/v1/logs/sessions/{sessionId}/stats
```

Returns statistics including:
- Total log count
- Counts by level
- First and last log timestamps
- Average request duration

#### Search Logs
```bash
GET /api/v1/logs/search?q=error&level=error&limit=100
```

Search across all sessions. Optional parameters:
- `q` - Search query (required)
- `level` - Filter by log level
- `startTime` - Start timestamp
- `endTime` - End timestamp
- `limit` - Maximum results (default: 100)

#### Get Most Recent Session Logs
```bash
GET /api/v1/logs/most-recent?limit=100
```

Returns logs from the most recent session with activity.

### Examples

```bash
# Get recent sessions
curl http://localhost:2198/api/v1/logs/sessions/recent

# Get all error logs for a session
curl http://localhost:2198/api/v1/logs/sessions/sess-123?level=error

# Search for "database" errors in last 7 days
curl "http://localhost:2198/api/v1/logs/search?q=database&level=error&startTime=$(date -v-7d +%s000)"

# Get most recent session logs
curl http://localhost:2198/api/v1/logs/most-recent
```

## Log Storage

### File Logs

- **Location**: `logs/` directory
- **Rotation**: Daily rotation
- **Retention**: 30 days
- **Files**:
  - `sutradhar-YYYY-MM-DD.log` - All logs
  - `sutradhar-error-YYYY-MM-DD.log` - Error logs only

### Convex Database

Logs are stored in the `logs` table with the following indexes:
- `by_session` - Session ID and timestamp
- `by_timestamp` - Timestamp only
- `by_level` - Log level and timestamp

**Automatic Cleanup**: Logs older than 30 days are automatically cleaned up daily.

## Best Practices

### When to Use Each Level

- **ERROR**: System errors, exceptions, failures that need immediate attention
- **WARN**: Non-critical issues, deprecated features, rate limits
- **INFO**: Important business events, request/response logging, state changes
- **VERBOSE**: Detailed flow information, intermediate steps
- **DEBUG**: Variable values, detailed execution paths, troubleshooting

### Include Context

Always include relevant context:
```typescript
// Good
logger.error('Failed to process payment', {
  userId: user.id,
  amount: payment.amount,
  error: err.message,
  sessionId: session.id,
});

// Bad
logger.error('Payment failed');
```

### Session Association

Always include `sessionId` when available:
```typescript
logger.info('Answer generated', {
  sessionId: session.id,
  question: req.body.question,
  answerLength: answer.length,
});
```

### Performance

- Log persistence to Convex is non-blocking (fire-and-forget)
- Only INFO and above are persisted in production
- Use VERBOSE/DEBUG sparingly in production code

## Migration from Legacy Logger

The legacy `log` interface still works and delegates to the new logger:

```typescript
// Still works
import { log } from './log';
log.info('Message');

// Preferred
import { logger } from './core/logging/logger';
logger.info('Message', { context: 'value' });
```

## Monitoring

### Log Aggregation

For production, integrate with log aggregation services:
- **Datadog**: Winston → Datadog agent
- **ELK Stack**: Filebeat → Elasticsearch
- **CloudWatch**: Winston → CloudWatch Logs

### Alerts

Set up alerts based on log patterns:
- ERROR rate exceeding threshold
- WARN patterns indicating issues
- Unusual patterns in INFO logs

## Troubleshooting

### Logs Not Persisting

1. Check `LOG_PERSIST` environment variable
2. Verify Convex connection (`CONVEX_URL`)
3. Check Convex logs for errors

### Too Many Logs

1. Adjust `LOG_LEVEL` to a higher level
2. Use `LOG_PERSIST=false` for development
3. Check log file sizes in `logs/` directory

### Missing Session Context

Ensure `sessionId` is set in logger context:
```typescript
logger.setContext({ sessionId: session.id });
```

Or use request logger:
```typescript
const log = (req as any).logger || logger.child({ sessionId: session.id });
```

