# Architecture & Folder Structure

## Overview

Sutradhar follows a clean, scalable architecture with clear separation of concerns and intuitive organization.

## Folder Structure

```
apps/worker/src/
├── core/                      # Core architecture & infrastructure
│   ├── cache/                 # Caching layer (Memory/Redis)
│   ├── guardrails/            # Content guardrails & safety
│   ├── http/                  # HTTP client pooling
│   ├── interfaces/            # Plugin interfaces
│   ├── logging/               # Logging system
│   ├── middleware/            # Express middleware
│   ├── mocks/                 # Mock plugin implementations
│   ├── plugins/               # Real plugin implementations
│   └── services/              # Business logic services
│
├── integrations/              # External service integrations
│   ├── actions/               # Action integrations (GitHub, Slack, Calendar)
│   │   ├── client.ts          # Safe action wrapper
│   │   ├── github.ts          # GitHub operations
│   │   ├── slack.ts           # Slack operations
│   │   └── calendar.ts        # Calendar operations
│   └── webhooks/              # Webhook handlers (bidirectional)
│       ├── slack.ts           # Slack event handler
│       ├── github.ts          # GitHub webhook handler
│       └── calendar.ts        # Calendar webhook handler
│
├── routes/                    # API routes
│   └── v1/                    # Version 1 API endpoints
│       ├── answer.ts          # RAG endpoints
│       ├── llm.ts             # LLM endpoints
│       ├── actions.ts         # Action endpoints (legacy)
│       ├── github.ts          # GitHub REST API
│       ├── slack.ts           # Slack REST API
│       ├── calendar.ts        # Calendar REST API
│       ├── webhooks.ts        # Webhook endpoints
│       ├── logs.ts            # Log search API
│       └── index.ts           # Route aggregator
│
├── agentmail/                 # Email service integration
├── browser/                   # Browser automation
├── llm/                       # LLM providers & prompts
├── retrieval/                 # Retrieval services
├── voice/                     # Voice/LiveKit integration
├── util/                      # Utilities
└── server.ts                  # Main server file
```

## Key Design Principles

### 1. **Separation of Concerns**
- **Core**: Infrastructure, plugins, services
- **Integrations**: External service clients and webhooks
- **Routes**: API endpoint definitions
- **Services**: Business logic layer

### 2. **Plugin Architecture**
- Interfaces in `core/interfaces/`
- Mock implementations in `core/mocks/`
- Real implementations in `core/plugins/`
- Enables easy swapping and testing

### 3. **Integration Pattern**
- Actions: Outbound operations (send, create, update)
- Webhooks: Inbound event handlers (receive, respond)
- All integrations under `integrations/`

### 4. **RESTful Design**
- Resource-based URLs
- Standard HTTP methods
- Consistent response formats
- Versioned endpoints (`/api/v1/`)

## Integration Architecture

### Actions (`integrations/actions/`)
**Purpose**: Outbound operations to external services

```
integrations/actions/
├── client.ts          # Safe action wrapper with mocking
├── github.ts          # GitHub: issues, PRs, repos
├── slack.ts           # Slack: messages, channels
└── calendar.ts        # Calendar: events, calendars
```

**Features**:
- No hardcoded IDs/secrets (throws errors if missing)
- Type-safe interfaces for mocking
- Safe action wrapper with error handling
- Composio SDK integration

### Webhooks (`integrations/webhooks/`)
**Purpose**: Inbound event processing and responses

```
integrations/webhooks/
├── slack.ts           # Receives messages → LLM → Replies
├── github.ts          # Receives comments → LLM → Responds
└── calendar.ts        # Receives events → Processes reschedule requests
```

**Flow**:
1. Receive webhook event
2. Analyze using LLM/answer service
3. Generate appropriate response
4. Execute action (reply, reschedule, etc.)

## Core Services

### Services (`core/services/`)
- `answer-service.ts` - RAG orchestration
- `llm-service.ts` - LLM provider abstraction
- `retrieval-service.ts` - Document search
- `action-service.ts` - Action execution
- `email-service.ts` - Email operations
- `session-service.ts` - Session management
- `health-monitor.ts` - Health tracking
- `shutdown.ts` - Graceful shutdown

### Middleware (`core/middleware/`)
- `request-context.ts` - Request ID & timing
- `error-handler.ts` - Error handling
- `rate-limiter.ts` - Rate limiting
- `timeout.ts` - Request timeouts
- `validation.ts` - Request validation
- `deduplication.ts` - Request deduplication
- `health-tracker.ts` - Health monitoring

## API Organization

### Version 1 Routes (`routes/v1/`)
- **Answer**: `/api/v1/answer` - RAG endpoints
- **LLM**: `/api/v1/llm/*` - Direct LLM access
- **GitHub**: `/api/v1/github/*` - RESTful GitHub API
- **Slack**: `/api/v1/slack/*` - RESTful Slack API
- **Calendar**: `/api/v1/calendar/*` - RESTful Calendar API
- **Webhooks**: `/api/v1/webhooks/*` - Incoming events
- **Logs**: `/api/v1/logs/*` - Log search
- **Actions**: `/api/v1/actions/*` - Legacy action endpoints

## Security & Secrets

### Secrets Management
- All secrets in `.secrets.env` (never committed)
- No hardcoded IDs or keys in code
- Errors thrown if secrets missing
- `.secrets.example` as template

### Required Secrets
```
GITHUB_CONNECTED_ACCOUNT_ID
SLACK_CONNECTED_ACCOUNT_ID
GCAL_CONNECTED_ACCOUNT_ID
COMPOSIO_USER_ID
COMPOSIO_API_KEY
```

## Logging

### Structure
- Winston-based logging
- Levels: DEBUG, INFO, VERBOSE, WARN, ERROR
- Session-based log storage
- 30-day retention
- File rotation

### Log Storage
- Console output (development)
- File logs (production)
- Convex database (session-based)

## Mocking & Testing

### Mock Support
- All integrations have mock modes
- `MOCK_ACTIONS=true` enables mocking
- Interfaces enable easy mock creation
- Safe action wrapper handles mocking

### Testing
- Mock plugins in `core/mocks/`
- Interface-based design
- Easy to swap implementations

## Scalability Features

### Horizontal Scaling
- Stateless API design
- Redis for distributed caching
- Session-based state in Convex
- Load balancer ready

### Vertical Scaling
- Connection pooling
- Caching strategies
- Request deduplication
- Graceful degradation

## Next Steps for Folder Organization

### Potential Improvements
1. Move `agentmail/` to `integrations/email/`
2. Move `browser/` to `integrations/browser/`
3. Move `voice/` to `integrations/voice/`
4. Move `retrieval/` to `integrations/retrieval/`
5. Move `llm/` to `core/llm/` or `integrations/llm/`

This would create a unified `integrations/` folder structure:
```
integrations/
├── actions/       # GitHub, Slack, Calendar actions
├── webhooks/      # Event handlers
├── email/         # AgentMail
├── browser/       # Browser automation
├── voice/         # LiveKit
└── retrieval/     # Hyperspell, BM25
```

## Benefits of Current Structure

1. **Clear Boundaries**: Core vs Integrations vs Routes
2. **Easy Testing**: Interfaces enable mocking
3. **Scalable**: Plugin architecture supports growth
4. **Maintainable**: Logical grouping
5. **Type Safe**: Interfaces throughout
6. **Secure**: No secrets in code

