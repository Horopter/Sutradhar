# Sutradhar Worker

Express server for Sutradhar agent orchestration.

## Run MVP Locally

### Quickstart (Demo)

**Terminal A:**
```bash
  cd apps/convex && pnpm dev
```

**Terminal B:**
```bash
  cd apps/worker && pnpm dev
```

**Run demo:**
```bash
  pnpm demo:happy
```

## Flip to Real

Toggle from mock to real services:

```bash
# Browser (requires server restart)
pnpm admin:toggle MOCK_BROWSER false

# Actions (Slack, Calendar, GitHub)
pnpm admin:toggle MOCK_ACTIONS false

# LLM (OpenAI, Perplexity)
pnpm admin:toggle MOCK_LLM false

# Retrieval
pnpm admin:toggle MOCK_RETRIEVAL false
```

Or set environment variables before starting:

```bash
MOCK_BROWSER=false MOCK_ACTIONS=false MOCK_LLM=false npm run dev
```

## Real-vs-Mock Switches

- **AgentMail**: `AGENTMAIL_API_KEY` (unset = mock)
- **Composio**: `COMPOSIO_API_KEY` & `MOCK_ACTIONS=false` (unset/true = mock)
- **Retrieval**: `MOCK_RETRIEVAL=false` (uses Hyperspell → BM25 → file-scan)
- **Browser Use**: `MOCK_BROWSER=false` (needs server restart)
- **LiveKit**: provide `LIVEKIT_*` to use token+voice page

## Retrieval Order

1. **Hyperspell** (vault memories) - Primary vector search from memory vault
2. **BM25 local index** (seed/*.md) - In-memory BM25 ranking over seed documents
3. **File-scan fallback** - Simple keyword matching as last resort

> **Note:** Moss is temporarily disabled due to upstream ESM/CJS packaging issue. When fixed:
> - Re-enable moss-bridge in `apps/moss-bridge`
> - Restore moss query/index calls in `getContext.ts` / `indexSeed.ts`

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## Retrieval

### Build Local BM25 Index
```bash
npm run retrieval:local:index
```

### Query Retrieval
```bash
npm run retrieval:answer
# Or with custom question:
Q="Your question here" npm run retrieval:local:query
```

### Seed Hyperspell Vault
```bash
npm run retrieval:hs:seed
```

## Health Check

```bash
curl http://localhost:2198/health/full | jq .
```

Checks status of all services: Convex, AgentMail, LiveKit, Composio, Hyperspell, and BM25 local index.

The health endpoint includes:
- `demo_ready`: Boolean indicating if all required services are available
- `blockers`: Array of blocking issues if `demo_ready` is false (e.g., `["convex_down", "no_local_docs", "livekit_unset"]`)

## Production Deployment

### Docker

Build and run with Docker:

```bash
docker build -t sutradhar-worker -f apps/worker/Dockerfile .
docker run -p 4001:4001 --env-file apps/worker/.env sutradhar-worker
```

### Replit

The project includes `.replit` and `replit.nix` for deployment to Replit. Ensure environment variables are configured in Replit Secrets.

### Smoke Tests

Run production smoke tests:

```bash
npm run smoke:prod
BASE_URL=https://your-api.com npm run smoke:prod
```

## Testing

### Run All Tests

```bash
cd apps/worker
npm run test:all      # Full API test suite
npm run test:edge     # Edge cases and validation
npm run test          # Both suites
```

### CI Mode (Bypass Rate Limits)

For CI/testing environments:

```bash
RL_BYPASS=true AGENTMAIL_DRY_RUN=true npm run test:all
```

Test configuration:
- `RL_BYPASS=true`: Bypass rate limiting (for tests)
- `AGENTMAIL_DRY_RUN=true`: Use email dry-run mode (no actual sends)
- `AGENTMAIL_TEST_TO=your@email.com`: Use specific test recipient
- `RETRIEVAL_REQUIRE_HS=false`: Make Hyperspell optional (skip if unavailable)

## Observability

### Prometheus Metrics

Metrics available at `/metrics`:

- `http_requests_total`: Total HTTP requests by method, route, status
- `http_request_duration_seconds`: Request duration histogram
- `llm_requests_total`: LLM requests by provider and status
- `action_requests_total`: Action requests by type and status

### JSON Logging

Enable structured JSON logging:

```bash
LOG_JSON=true npm run dev
```

### Sentry Integration

Configure error tracking:

```bash
SENTRY_DSN=your-dsn npm run dev
```

## API Documentation

OpenAPI specification available at `apps/worker/openapi.yaml`. Key endpoints:

- `POST /api/answer` - AI answer with retrieval
- `POST /forum/post` - Post to forum
- `POST /actions/{slack|calendar|github}` - Execute actions
- `POST /llm/{answer|summarize|escalate}` - LLM operations
- `GET /health/full` - Comprehensive health check

