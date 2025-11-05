# Development Guide

## Table of Contents
1. [Quick Start](#quick-start)
2. [Setup](#setup)
3. [Testing](#testing)
4. [Logging](#logging)
5. [Secrets Management](#secrets-management)
6. [LiveKit Setup](#livekit-setup)

## Quick Start

### Option 1: Automated Script (Recommended)

```bash
./apps/launch-apex-academy.sh
```

This opens 3 terminal windows and starts all services automatically.

### Option 2: Manual (3 Terminal Windows)

**Terminal 1: Convex**
```bash
cd apps/convex
npx convex dev
```

**Terminal 2: Worker (API)**
```bash
cd apps/worker
npm run dev
```

**Terminal 3: Nuxt (Frontend)**
```bash
cd apps/nuxt
pnpm install  # First time only
pnpm dev
```

### Then Visit

**http://localhost:3000**

Click "Continue as Guest" and start learning!

## Setup

### Prerequisites

- Node.js 20+
- npm or pnpm
- Docker (optional, for containerized deployment)

### Installation

```bash
# Install dependencies
make install

# Or manually
cd apps/worker && npm install
cd apps/nuxt && pnpm install
cd apps/convex && npm install
```

### Environment Configuration

1. **Copy environment files:**
```bash
cp apps/worker/src/env.example .env
cp .secrets.example .secrets.env
```

2. **Configure secrets** (see [Secrets Management](#secrets-management))

3. **Start services:**
```bash
# Development
make dev

# Or manually
cd apps/worker && npm run dev
```

## Testing

### Running Tests

```bash
cd apps/worker

# Run all tests
npm test

# Run specific test suite
npm run test:unified
npm run test:concurrent

# Run with coverage
npm run test:coverage
```

### Test Suites

#### 1. Comprehensive Unified API Test (`test:unified`)
Tests all unified API endpoints with proper session isolation:

```bash
npm run test:unified
```

**What it tests:**
- System health and capabilities
- Multi-agent session management
- Session isolation verification
- Concurrent conversations and messages
- Knowledge management (document/image search and indexing)
- Communication services (email, Slack)
- Collaboration (GitHub issues CRUD)
- Scheduling (Calendar events CRUD)
- Media services (voice tokens)
- Session cleanup

#### 2. Concurrent Multi-Agent Stress Test (`test:concurrent`)
Tests system under concurrent load from multiple agents:

```bash
npm run test:concurrent
```

**Environment Variables:**
- `NUM_AGENTS` - Number of concurrent agents (default: 5)
- `REQUESTS_PER_AGENT` - Messages per agent (default: 3)

**What it tests:**
- Concurrent session creation
- Concurrent message sending
- Session isolation under load
- System performance and stability

#### 3. API Endpoint Testing

Comprehensive endpoint testing using bash scripts:

**Test Suites:**

1. **Full API Test Suite** (`npm run test:all`)
   - Tests all endpoints with valid inputs
   - Health checks, OAuth, Email, Retrieval, Answer, LLM, Actions
   - Diagnostics, Admin, Voice, Webhooks
   - Convex operations (if configured)
   - Rate limiting headers and request ID tracking

2. **Edge Cases & Validation Test Suite** (`npm run test:edge`)
   - Validation errors (missing fields, empty strings, invalid formats)
   - Rate limiting behavior
   - Guardrails (content filtering)
   - Timeout handling
   - Malformed JSON, missing headers, large payloads
   - Special characters, Unicode handling
   - Concurrent requests and request deduplication

**Configuration:**
```bash
# Set base URL (default: http://localhost:4001)
export BASE_URL=http://localhost:4001

# Set Convex URL (optional)
export CONVEX_URL=http://localhost:3210

# Run tests
npm run test:all
npm run test:edge
```

**Prerequisites:**
- Server must be running
- `curl` and `jq` must be installed
- Optional: Convex dev server for integration tests

**Individual Test Scripts:**
```bash
npm run health      # Health check
npm run send:test   # Send email
npm run llm:answer  # LLM answer
npm run act:slack   # Slack action
npm run act:cal     # Calendar action
npm run act:gh      # GitHub action
```

**CI Mode:**
```bash
# Bypass rate limits for testing
RL_BYPASS=true AGENTMAIL_DRY_RUN=true npm run test:all
```

### Mock Mode

Enable mock mode for testing without external APIs:

```bash
# In .env
MOCK_LLM=true
MOCK_RETRIEVAL=true
MOCK_ACTIONS=true
```

## Logging

### Log Levels

The system supports five log levels (ordered by severity):

1. **ERROR** - Critical errors that require attention
2. **WARN** - Warning conditions that may need attention
3. **INFO** - Informational messages about normal operations
4. **VERBOSE** - Detailed diagnostic information
5. **DEBUG** - Very detailed diagnostic information for debugging

### Configuration

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

### Usage

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

// Session-based logging
logger.setContext({ sessionId: 'session-123' });
logger.info('User asked a question', { question: 'What is AI?' });

// Create child logger with additional context
const requestLogger = logger.child({
  requestId: 'req-456',
  userId: 'user-789',
});
requestLogger.info('Processing answer');
```

### Log Storage

- **Console output** (development)
- **File logs** (production) - `logs/sutradhar-YYYY-MM-DD.log`
- **Convex database** (session-based) - Query via `/api/v1/logs/*`

### Log Search

**GET `/api/v1/logs/search`**
Search logs by query, level, time range.

**GET `/api/v1/logs/bySession`**
Get logs for a specific session.

**GET `/api/v1/logs/recentSessions`**
List recent sessions.

## Secrets Management

Sutradhar uses a two-file approach for configuration:

1. **`.env`** - Non-sensitive configuration (can be committed to git with defaults)
2. **`.secrets.env`** - Secrets and sensitive data (NEVER committed to git)

### Setup

```bash
# Copy the example file
cp apps/worker/src/env.example .env

# Copy the secrets example
cp .secrets.example .secrets.env

# Edit and add your actual secrets
nano .secrets.env
```

### What Goes Where?

#### `.env` (Safe to Commit)
- Port numbers
- Feature flags (MOCK_*)
- Default URLs (without credentials)
- Non-sensitive defaults
- Configuration flags

#### `.secrets.env` (NEVER Commit)
- **API Keys**: All external service API keys
- **Account IDs**: Project IDs, Org IDs, User IDs
- **Secrets**: Webhook secrets, passwords
- **Credentials**: Usernames, passwords
- **URLs with Auth**: URLs containing tokens or passwords
- **Sensitive IDs**: Channel IDs, Calendar IDs, Repository slugs

### Required Secrets

```bash
# API Keys
OPENAI_API_KEY=sk-...
PERPLEXITY_API_KEY=pplx-...
HYPERSPELL_API_KEY=hs_...
AGENTMAIL_API_KEY=am_...
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...

# Account IDs
COMPOSIO_USER_ID=user_...
COMPOSIO_API_KEY=...

# Service IDs
SLACK_CHANNEL_ID=C123456
GCAL_CALENDAR_ID=calendar@example.com
GITHUB_REPO_SLUG=org/repo

# Secrets
AGENTMAIL_WEBHOOK_SECRET=secret_...
SENTRY_DSN=https://...
```

### Security Best Practices

#### ✅ DO
- ✅ Keep `.secrets.env` in `.gitignore` (already configured)
- ✅ Use `.secrets.example` as a template (this IS committed)
- ✅ Rotate secrets regularly
- ✅ Use different secrets for dev/staging/prod
- ✅ Store production secrets in secure vaults (AWS Secrets Manager, etc.)
- ✅ Set proper file permissions: `chmod 600 .secrets.env`

#### ❌ DON'T
- ❌ Commit `.secrets.env` to git
- ❌ Hardcode secrets in code
- ❌ Share secrets in plain text
- ❌ Use production secrets in development
- ❌ Store secrets in environment variables that might be logged

## LiveKit Setup

### Step 1: Configure Environment

Set LiveKit credentials in `.secrets.env`:

```bash
LIVEKIT_URL=wss://your-livekit-url.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
```

### Step 2: Start the API Server

```bash
cd apps/worker
npm run dev
```

Server should start on `http://localhost:2198`

### Step 3: Test the API

**Get a Voice Token:**
```bash
curl "http://localhost:2198/api/v1/voice/token?room=test-room"
```

**Expected Response:**
```json
{
  "token": "eyJhbGc...",
  "url": "wss://your-livekit-url",
  "room": "test-room"
}
```

Use this token in your client application to connect to LiveKit rooms.

### Webhook Setup

For transcription events, configure webhook in LiveKit dashboard:

- **Endpoint**: `POST /webhooks/livekit/transcription`
- **Events**: `transcription_finished`

Note: Webhook requires public URL. Use ngrok or similar for local development.

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill existing processes
lsof -ti:3000,4001,3210 | xargs kill -9
```

#### Dependencies Not Installed
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

#### Convex Not Running
```bash
cd apps/convex
npx convex dev
```
Check that `CONVEX_URL` is set in `.env` or `.secrets.env`.

#### Redis Connection Issues
If using Redis for caching:
```bash
# Check Redis is running
redis-cli ping
# Should return: PONG
```
If Redis is unavailable, the system falls back to in-memory caching automatically.

#### Test Failures

**Connection Errors:**
- Ensure server is running on correct port (default: 4001)
- Check firewall settings
- Verify BASE_URL is correct

**Convex Tests Skipped:**
- Set `CONVEX_URL` environment variable if you want to test Convex integration

**Validation Tests Fail:**
- May indicate a bug - check server validation logic

**Rate Limiting Tests Don't Trigger:**
- This is normal - rate limits may be lenient or not configured strictly

#### TypeScript Compilation Errors

**Common Type Errors:**
- Agent type errors: Add explicit type casting for Convex query results
- Service interface errors: Verify interface definitions match implementations
- Missing module errors: Check import paths and file locations

**Backend Compilation:**
- Check `apps/worker/src` for TypeScript errors
- Run `npm run build` to see all compilation issues

**Frontend Compilation:**
- Vue SFC compiler issues: Use regular function declarations instead of arrow functions with optional parameters
- Check `apps/nuxt` for Vue/TypeScript errors

#### Permission Denied
```bash
chmod +x scripts/test-all-apis.sh
chmod +x scripts/test-edge-cases.sh
```

#### Missing Dependencies
```bash
# Install jq (required for test scripts)
brew install jq  # macOS
apt-get install jq  # Ubuntu
```

## Apex Academy Setup

Apex Academy is a complete Nuxt 3 EdTech platform built on top of Sutradhar.

### Quick Start

**Option 1: Automated Script (Recommended)**
```bash
./apps/launch-apex-academy.sh
```

**Option 2: Manual (3 Terminal Windows)**

Terminal 1: Convex
```bash
cd apps/convex
npx convex dev
```

Terminal 2: Worker (API)
```bash
cd apps/worker
npm run dev
```

Terminal 3: Nuxt (Frontend)
```bash
cd apps/nuxt
pnpm install  # First time only
pnpm dev
```

Then visit **http://localhost:3000** and click "Continue as Guest"

### Features

**Frontend (Nuxt 3):**
- Landing page with Halloween theme
- Login (Guest mode + Magic link)
- Subjects catalog page
- Subject hub (Lessons, Quizzes, Images tabs)
- Lesson viewer with markdown rendering
- Quiz player with timer
- Coding assignment page (hint + run)
- Dashboard (progress, streaks, badges)
- Live study room page
- Voice assistant floating button

**Backend (Worker Routes):**
- `/auth/guest` - Create guest session
- `/auth/magic` - Send magic link email
- `/auth/verify` - Verify magic link token
- `/catalog` - List courses
- `/course/:slug/lessons` - List lessons
- `/lesson/:id` - Get lesson content
- `/lesson/:id/query` - Ask question with intent detection
- `/lesson/:id/summarize` - Summarize lesson
- `/quiz/:id` - Get quiz
- `/quiz/:id/attempt` - Submit quiz attempt
- `/code` - List code assignments
- `/code/:assignmentId` - Get coding assignment
- `/code/:assignmentId/hint` - Get hint
- `/code/:assignmentId/run` - Run code with sandboxing

**Convex Schema:**
- Extended schema with EdTech tables (users, courses, lessons, quizzes, quizAttempts, codeAssignments, codeSubmissions, images, events, schedules)
- Convex functions for all operations

### Worker Module Details

**Run MVP Locally:**
```bash
# Terminal A: Convex
cd apps/convex && pnpm dev

# Terminal B: Worker
cd apps/worker && pnpm dev

# Run demo
pnpm demo:happy
```

**Flip to Real Services:**
```bash
# Toggle from mock to real
pnpm admin:toggle MOCK_BROWSER false
pnpm admin:toggle MOCK_ACTIONS false
pnpm admin:toggle MOCK_LLM false
pnpm admin:toggle MOCK_RETRIEVAL false
```

**Real-vs-Mock Switches:**
- **AgentMail**: `AGENTMAIL_API_KEY` (unset = mock)
- **Composio**: `COMPOSIO_API_KEY` & `MOCK_ACTIONS=false`
- **Retrieval**: `MOCK_RETRIEVAL=false` (uses Hyperspell → BM25 → file-scan)
- **Browser Use**: `MOCK_BROWSER=false` (needs server restart)
- **LiveKit**: provide `LIVEKIT_*` to use token+voice page

**Retrieval Order:**
1. Hyperspell (vault memories) - Primary vector search
2. BM25 local index (seed/*.md) - In-memory BM25 ranking
3. File-scan fallback - Simple keyword matching

**Health Check:**
```bash
curl http://localhost:2198/health/full | jq .
```

### Nuxt Module Details

**Features:**
- Halloween-themed dark UI with neon accents
- 5 CS Subjects (C++, Java, Web Dev, Android, ML)
- AI-powered tutoring via Sutradhar
- Interactive lessons and quizzes
- Coding assignments with hints
- Progress tracking, streaks, and badges
- Calendar integration for study plans
- Live study rooms (LiveKit)

**Configuration:**
```bash
# .env
SUTRADHAR_BASE_URL=http://localhost:4001
```

**Development:**
```bash
cd apps/nuxt
pnpm dev
```

Visit `http://localhost:3000`

### Convex Module Details

**Setup:**
```bash
cd apps/convex
pnpm install
pnpm dev
```

The dev server runs on `http://127.0.0.1:3210` by default.

Set `CONVEX_URL=http://127.0.0.1:3210` in `apps/worker/.env` to connect the worker.

## Development Workflow

1. **Start services** (Convex, Worker, Nuxt)
2. **Make changes** to code
3. **Test locally** using curl or frontend
4. **Check logs** in console or `logs/` directory
5. **Run tests** before committing
6. **Commit changes** (never commit `.secrets.env`)

## Code Style

- Use TypeScript for type safety
- Follow existing code patterns
- Write tests for new features
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Keep functions small and focused

