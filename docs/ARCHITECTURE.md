# Sutradhar Architecture

## High-Level Design (HLD)

### System Overview

Sutradhar is a scalable, microservices-oriented API service that provides AI-powered assistant capabilities with retrieval-augmented generation (RAG), LLM integration, and external service actions.

```
┌─────────────┐
│   Clients   │
│  (Various)  │
└──────┬──────┘
       │
       │ HTTP/REST
       │
┌──────▼─────────────────────────────────────┐
│         Sutradhar API Gateway              │
│  (Express.js with Rate Limiting & CORS)    │
└──────┬─────────────────────────────────────┘
       │
       ├──────────────┬──────────────┬─────────────┐
       │              │              │             │
┌──────▼──────┐ ┌─────▼─────┐ ┌─────▼────┐ ┌──────▼─────┐
│   Answer    │ │    LLM    │ │ Actions  │ │   Voice    │
│  Service    │ │  Service  │ │ Service  │ │  Service   │
└──────┬──────┘ └─────┬─────┘ └─────┬────┘ └──────┬─────┘
       │              │              │             │
       │              │              │             │
┌──────▼──────────────▼──────────────▼─────────────▼──────┐
│              Plugin Architecture                         │
│  (Real/Mock plugins with Circuit Breakers)              │
└──────┬───────────────────────────────────────────────────┘
       │
       ├──────────────┬──────────────┬─────────────┐
       │              │              │             │
┌──────▼──────┐ ┌─────▼─────┐ ┌─────▼────┐ ┌──────▼─────┐
│ Hyperspell  │ │  OpenAI   │ │ Composio │ │  LiveKit   │
│   Vector    │ │ Perplexity│ │  Actions │ │   Voice    │
│   Search    │ │    LLM    │ │          │ │            │
└─────────────┘ └───────────┘ └──────────┘ └────────────┘
       │
       │
┌──────▼──────────────────────────────────────────────────┐
│                  Data Layer                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Convex  │  │  Redis   │  │   Seed   │             │
│  │ (Sessions│  │  (Cache) │  │  (.md)   │             │
│  │ Messages)│  │          │  │          │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘
```

### Core Principles

1. **Service-Oriented**: Pure API service, no UI dependencies
2. **Horizontally Scalable**: Stateless design with Redis for shared cache
3. **Fault Tolerant**: Circuit breakers, graceful degradation, retry logic
4. **Observable**: Comprehensive metrics, logging, health checks
5. **Versioned APIs**: `/api/v1/*` endpoints with backward compatibility

## Low-Level Design (LLD)

### Request Flow

```
Client Request
    │
    ├─> Rate Limiter (per-endpoint limits)
    │
    ├─> Request Context Middleware (adds X-Request-ID)
    │
    ├─> Validation Middleware (Zod schemas)
    │
    ├─> Deduplication Middleware (5s window)
    │
    ├─> Guardrails Check (content filtering)
    │
    ├─> Service Layer (Answer/LLM/Actions)
    │
    ├─> Plugin Layer (Real/Mock with circuit breakers)
    │
    ├─> External APIs (Hyperspell, OpenAI, etc.)
    │
    ├─> Cache Layer (Redis/Memory)
    │
    ├─> Response Formatting
    │
    └─> Metrics Recording
```

### Scalability Patterns

#### Vertical Scaling (Upward)
- **Connection Pooling**: Reuse HTTP connections to external APIs
- **Efficient Caching**: Reduce redundant API calls
- **Streaming**: Stream large responses to reduce memory usage
- **Resource Optimization**: Proper timeout handling, memory management

#### Horizontal Scaling (Outward)
- **Stateless Services**: All state in Convex/Redis
- **Distributed Cache**: Redis for shared cache across instances
- **Load Balancing Ready**: Health checks for load balancer integration
- **Session Management**: External session store (Convex)
- **Shared Nothing**: Each instance independent

### Component Architecture

#### 1. Plugin System
- **Interface-Based**: All plugins implement common interfaces
- **Factory Pattern**: Dynamic plugin instantiation
- **Circuit Breakers**: Automatic fallback on failures
- **Mock/Real Toggle**: Easy switching for testing

#### 2. Caching Strategy
- **Multi-Level**: 
  - L1: In-memory (single instance)
  - L2: Redis (distributed)
- **TTL-Based**: Automatic expiration
- **Namespace Isolation**: Per-service cache namespaces
- **Cache-Aside Pattern**: Application manages cache

#### 3. Error Handling
- **Structured Errors**: Consistent error format
- **Graceful Degradation**: Fallback to mock/services down
- **Retry Logic**: Exponential backoff for transient failures
- **Circuit Breakers**: Prevent cascade failures

#### 4. Monitoring & Observability
- **Prometheus Metrics**: Request rates, latencies, errors
- **Structured Logging**: JSON logs with context
- **Health Checks**: Multiple levels (basic, full, heartbeat)
- **Request Tracing**: X-Request-ID for correlation

## DevOps & MLOps

### Containerization
- **Multi-Stage Docker Build**: Minimal production image
- **Layer Caching**: Optimized Dockerfile for faster builds
- **Security**: Non-root user, minimal base image
- **Health Checks**: Built-in container health checks

### CI/CD
- **GitHub Actions**: Automated testing and building
- **Automated Testing**: API tests, type checking
- **Docker Registry**: Automated image building
- **Release Automation**: Tag-based releases

### Deployment
- **Docker Compose**: Local development
- **Kubernetes Ready**: Health checks, graceful shutdown
- **Environment-Based**: Dev/staging/production configs
- **Zero-Downtime**: Graceful shutdown with request draining

### Monitoring
- **Prometheus Metrics**: `/metrics` endpoint
- **Health Endpoints**: `/health`, `/health/full`, `/health/heartbeat`
- **Structured Logs**: JSON format for log aggregation
- **Sentry Integration**: Error tracking (optional)

## Performance Optimizations

### Caching
- **LLM Responses**: Cache system prompts (1 hour TTL)
- **Retrieval Results**: Cache search queries (10 minutes TTL)
- **Email Inbox Resolution**: Cache inbox IDs
- **Guardrail Results**: Cache spam/off-topic checks

### Database
- **Indexed Queries**: Convex indexes for fast lookups
- **Connection Pooling**: Reuse connections
- **Read Replicas**: If Convex supports it

### API Calls
- **Deduplication**: Prevent duplicate requests (5s window)
- **Request Batching**: Where possible
- **Circuit Breakers**: Prevent thundering herd
- **Timeout Management**: Per-service timeouts

### Memory Management
- **Streaming**: For large responses
- **Cleanup Intervals**: Automatic cache cleanup
- **Memory Limits**: Per-service memory constraints

## Security

### API Security
- **Rate Limiting**: Per-endpoint limits
- **CORS Configuration**: Environment-based origins
- **Input Validation**: Zod schemas for all inputs
- **Content Filtering**: Guardrails for safety

### Infrastructure Security
- **Non-Root Containers**: Run as appuser
- **Secret Management**: Environment variables
- **HTTPS Only**: In production
- **Security Headers**: CORS, CSP, etc.

## Scalability Considerations

### Current Limits
- **Single Instance**: ~1000 req/min (depending on LLM calls)
- **Memory Cache**: ~100MB (in-memory)
- **No Connection Limits**: HTTP connections

### Scaling Path
1. **Horizontal Scaling**: Add more instances behind load balancer
2. **Redis Cache**: Enable for shared cache
3. **Read Replicas**: For Convex if needed
4. **CDN**: For static assets (if any)
5. **Message Queue**: For async processing (future)

### Bottlenecks
- **LLM API Calls**: Longest latency (2-5s)
- **Retrieval Searches**: Moderate latency (500ms-2s)
- **Database Writes**: Low latency (<100ms)

## Technology Stack

### Core
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Validation**: Zod

### Services
- **Database**: Convex
- **Cache**: Redis (production) / Memory (dev)
- **LLM**: OpenAI, Perplexity
- **Vector Search**: Hyperspell
- **Voice**: LiveKit
- **Actions**: Composio/Rube.app
- **Email**: AgentMail
- **Monitoring**: Prometheus, Sentry

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose, Kubernetes-ready
- **CI/CD**: GitHub Actions
- **Logging**: Structured JSON logs

## Configuration Management

### Environment Variables
- **Validation**: Zod schema validation on startup
- **Defaults**: Sensible defaults for development
- **Required vs Optional**: Clear distinction
- **Type Safety**: TypeScript types from schema

### Feature Flags
- **Mock/Real Toggles**: Per-service
- **Admin API**: Runtime toggle changes
- **Hot Reload**: No restart required (most cases)

## Development Workflow

### Local Development
```bash
# Start all services
docker-compose up

# Or individual services
cd apps/worker && npm run dev
cd apps/convex && npm run dev
```

### Testing
```bash
# Full test suite
npm run test

# Specific tests
npm run test:all
npm run test:edge
```

### Deployment
```bash
# Build
docker build -t sutradhar-worker -f apps/worker/Dockerfile .

# Run
docker run -p 2198:2198 --env-file .env sutradhar-worker
```

## Future Enhancements

### Short-Term
- [ ] Redis cache implementation
- [ ] Connection pooling for HTTP clients
- [ ] Request queuing for high load
- [ ] Enhanced metrics dashboard

### Medium-Term
- [ ] GraphQL API option
- [ ] WebSocket support for real-time
- [ ] Message queue for async processing
- [ ] Multi-region deployment

### Long-Term
- [ ] ML model serving
- [ ] A/B testing framework
- [ ] Advanced analytics
- [ ] Auto-scaling based on metrics

