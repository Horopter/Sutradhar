# Sutradhar API

A scalable, AI-powered assistant API service with retrieval-augmented generation (RAG), LLM integration, voice support, and external service actions.

## 🚀 Quick Start

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
```

### Development

```bash
# Start the API server
cd apps/worker && npm run dev

# Or use Makefile
make dev
```

The API will be available at `http://localhost:2198`

### Docker

```bash
# Build and start with Docker Compose
make docker-up

# Or manually
docker-compose up -d
```

## 📚 Documentation

- **[API Documentation](API_README.md)** - Complete API reference
- **[Architecture](ARCHITECTURE.md)** - System architecture and design
- **[API Integrations](API_INTEGRATIONS.md)** - External service integrations
- **[API Explanations](API_DETAILED_EXPLANATIONS.md)** - Detailed API explanations

## 🔧 Configuration

### Quick Setup

1. **Create environment file** (non-sensitive config):
   ```bash
   cp apps/worker/src/env.example .env
   ```

2. **Create secrets file** (API keys, IDs, secrets):
   ```bash
   cp .secrets.example .secrets.env
   # Edit .secrets.env and add your actual secrets
   ```

3. **Set file permissions** (security):
   ```bash
   chmod 600 .secrets.env
   ```

### Configuration Files

- **`.env`** - Non-sensitive configuration (can be committed)
- **`.secrets.env`** - Secrets and sensitive data (NEVER committed to git)

**Important**: API keys, account IDs, and secrets should go in `.secrets.env`, not `.env`.

See [SECRETS_MANAGEMENT.md](SECRETS_MANAGEMENT.md) for detailed secrets management guide.

### Example Configuration

**.env** (safe to commit):
```bash
PORT=2198
NODE_ENV=development
CONVEX_URL=http://localhost:3210
MOCK_LLM=true
```

**.secrets.env** (NEVER commit):
```bash
OPENAI_API_KEY=sk-...
PERPLEXITY_API_KEY=pplx-...
HYPERSPELL_API_KEY=hs_...
RUBE_API_KEY=...
RUBE_PROJECT_ID=proj_...
```

See `apps/worker/src/env.ts` for all available environment variables.

## 🏗️ Architecture

Sutradhar is built with a scalable, microservices-oriented architecture:

- **Plugin System**: Modular, interface-based plugins for all external services
- **Horizontal Scaling**: Stateless design with Redis for distributed caching
- **Fault Tolerance**: Circuit breakers, graceful degradation, retry logic
- **Observability**: Prometheus metrics, structured logging, health checks
- **API Versioning**: `/api/v1/*` endpoints with backward compatibility

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed architecture documentation.

## 📊 API Endpoints

### Core Endpoints

- `GET /` - API information
- `GET /health` - Health check
- `GET /health/full` - Full health status
- `GET /metrics` - Prometheus metrics
- `GET /api/v1/docs` - OpenAPI specification

### API v1 Endpoints

- `POST /api/v1/answer` - Retrieval-augmented generation
- `POST /api/v1/llm/*` - LLM operations (answer, summarize, escalate)
- `POST /api/v1/actions/*` - External service actions (Slack, Calendar, GitHub, Forum)
- `POST /api/v1/email/send` - Send emails
- `POST /api/v1/retrieval/index` - Index documents
- `GET /api/v1/voice/token` - LiveKit voice token

See [API_README.md](API_README.md) for complete API documentation.

## 🧪 Testing

```bash
# Run all tests
cd apps/worker && npm run test

# Run specific test suites
npm run test:all      # Full API test suite
npm run test:edge     # Edge cases and validation
```

## 🐳 Docker

### Build

```bash
make docker-build
# Or
docker build -t sutradhar-worker -f apps/worker/Dockerfile .
```

### Run

```bash
make docker-up
# Or
docker-compose up -d
```

### Health Check

```bash
curl http://localhost:2198/health
```

## 📈 Monitoring

### Metrics

Prometheus metrics available at `/metrics`:

- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request latency
- `llm_requests_total` - LLM API calls
- `action_requests_total` - Action executions

### Health Checks

- `/health/heartbeat` - Simple ping (for load balancers)
- `/health` - Basic health check
- `/health/full` - Comprehensive health status

### Logging

Structured JSON logging enabled with `LOG_JSON=true`:

```bash
LOG_JSON=true npm run dev
```

## 🚀 Deployment

### Production Checklist

1. ✅ Set all required environment variables
2. ✅ Enable Redis cache (`REDIS_URL`)
3. ✅ Configure CORS origins (`ALLOWED_ORIGINS`)
4. ✅ Set `NODE_ENV=production`
5. ✅ Configure Sentry (optional, `SENTRY_DSN`)
6. ✅ Set up health check monitoring
7. ✅ Configure load balancer with health checks
8. ✅ Set up log aggregation

### Scaling

**Horizontal Scaling:**
- Deploy multiple instances behind load balancer
- Enable Redis for shared cache
- Use external session store (Convex)

**Vertical Scaling:**
- Increase Node.js memory limit
- Tune connection pool sizes
- Optimize cache TTLs

## 🔌 Services

All services are retained and configurable:

- ✅ **Answer Service** - RAG with retrieval
- ✅ **LLM Service** - OpenAI, Perplexity
- ✅ **Retrieval Service** - Hyperspell, BM25, file-scan
- ✅ **Action Service** - Slack, Calendar, GitHub, Forum
- ✅ **Email Service** - AgentMail integration
- ✅ **Voice Service** - LiveKit integration
- ✅ **Session Service** - Convex persistence

## 📝 License

ISC

## 🤝 Contributing

See architecture documentation for code organization and patterns.

