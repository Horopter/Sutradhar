# Architecture Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Layers](#architecture-layers)
3. [Agent-Based Architecture](#agent-based-architecture)
4. [Folder Structure](#folder-structure)
5. [Performance Optimizations](#performance-optimizations)
6. [Design Principles](#design-principles)

## System Overview

Sutradhar is a scalable, microservices-oriented API service that provides AI-powered assistant capabilities with retrieval-augmented generation (RAG), LLM integration, and external service actions.

### High-Level Architecture

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
└──────────────────────────────────────────────────────────┘
```

## Architecture Layers

### 1. API Layer
- **Express.js** with middleware stack
- Rate limiting, timeouts, validation
- Request context and error handling
- Metrics and monitoring

### 2. Service Layer
- **AnswerService**: RAG orchestration
- **LLMService**: LLM provider abstraction
- **RetrievalService**: Document search
- **ActionService**: Action execution
- **EmailService**: Email operations
- **SessionService**: Session management

### 3. Plugin Layer
- **Interface-based design**: Easy to swap implementations
- **Mock/Real plugins**: Testing and development
- **Circuit breakers**: Fault tolerance
- **Retry logic**: Resilience

### 4. Integration Layer
- **Actions**: Outbound operations (GitHub, Slack, Calendar)
- **Webhooks**: Inbound event processing
- **Adapters**: External API abstraction

### 5. Data Layer
- **Convex**: Session and message persistence
- **Redis**: Distributed caching
- **File System**: Markdown content repository

## Agent-Based Architecture

### Three-Layer Architecture

Sutradhar uses a **three-layer architecture** that separates concerns:

1. **Sutradhar** (`apps/sutradhar/`) - Pure orchestrator (agent-agnostic)
2. **Optimus** (`apps/optimus/`) - Backend agents layer (uses Sutradhar)
3. **Masterbolt** (`apps/masterbolt/`) - Frontend application (uses Optimus)

See [ARCHITECTURE_REFACTOR.md](ARCHITECTURE_REFACTOR.md) for complete details.

### Current Agent Implementation (Optimus Layer)

EdTech-specific agents are implemented in the Optimus layer (`apps/optimus/src/agents/`). Each agent uses `SutradharClient` to communicate with the Sutradhar orchestrator for executing tasks.

**Current Architecture:**
- Agents are in the Optimus layer (use case-specific)
- Agents communicate with Sutradhar orchestrator via HTTP
- Sutradhar orchestrator manages generic agents (LLM, retrieval, actions, email)
- Clear separation: Orchestration (Sutradhar) vs. Use Cases (Optimus)

### Future Vision: Agent Orchestrator

Sutradhar is evolving into a full **agent orchestrator platform** - similar to how Kubernetes orchestrates containers. Agents will become first-class, independently deployable units that Sutradhar manages, routes to, and monitors.

**Key Benefits:**
- **Decoupling**: Agents independent of Sutradhar core
- **Scalability**: Scale agents independently
- **Flexibility**: Mix in-process, HTTP, container agents
- **Versioning**: Run multiple agent versions simultaneously
- **Reliability**: Circuit breakers, health checks, auto-recovery
- **Observability**: Per-agent metrics and monitoring

See [AGENT_ORCHESTRATION.md](AGENT_ORCHESTRATION.md) for the complete orchestration architecture design.

---

### Agent Registry (Optimus Layer)

EdTech agents are instantiated in `apps/optimus/src/routes/edtech.ts`:

```typescript
import { SutradharClient } from '../client/sutradhar-client';
import { AuthAgent } from '../agents/auth-agent';

const sutradharClient = new SutradharClient('http://localhost:5000');
const authAgent = new AuthAgent(sutradharClient);

// Use the agent
const result = await authAgent.createGuest();
```

Agents use `SutradharClient` to execute tasks via the orchestrator.

### Agents & Responsibilities

1. **AuthAgent** - Authentication
   - Creates guest sessions (`createGuest()`)
   - Sends magic link emails (`sendMagicLink(email)`)
   - Verifies magic link tokens (`verifyToken(token)`)

2. **CourseAgent** - Course Management
   - Lists courses from `data_repository/` (`listCourses()`)
   - Lists lessons for a course (`listLessons(courseSlug)`)
   - Retrieves individual lessons (`getLesson(courseSlug, lessonId)`)

3. **TutoringAgent** - AI Tutoring
   - Answers questions (delegates to ConversationService) (`answer(question)`)
   - Provides hints (never full solutions) (`getHint(assignmentPrompt, currentCode)`)
   - Escalates to human support (`escalate(reason, email?)`)

4. **QuizAgent** - Quiz Management
   - Retrieves quizzes (`getQuiz(quizId)`)
   - Submits quiz attempts (`submitAttempt(attempt)`)
   - Calculates scores and passes/fails
   - Gets user attempts (`getUserAttempts(userId)`)

5. **CodeAgent** - Coding Assignments
   - Retrieves coding assignments (`getAssignment(assignmentId)`)
   - Runs code with sandboxing (`runCode(request)`)
   - Saves code submissions (`saveSubmission(userId, assignmentId, code, results)`)

6. **ProgressAgent** - Progress Tracking
   - Gets user progress summaries (`getProgress(userId)`)
   - Updates streaks (`updateStreak(userId, increment)`)
   - Awards badges (`awardBadge(userId, badge)`)
   - Logs events (`logEvent(userId, type, payload)`)

7. **ImageAgent** - Image Management
   - Fetches course images (Moss bridge + local fallback) (`getCourseImages(courseSlug, keywords?)`)
   - Caches images for all courses (`cacheAllImages()`)

8. **StudyPlanAgent** - Study Planning
   - Creates spaced repetition plans (`createPlan(userId, courseSlug?)`)
   - Generates calendar events via Composio
   - Retrieves user schedules (`getUserSchedules(userId)`)

9. **NotificationAgent** - Notifications
   - Posts to forums (BrowserUse) (`postToForum(text, url?)`)
   - Sends Slack messages (`sendSlackMessage(text, channelId?)`)

### Agent Result Pattern

All agents return a consistent result type:

```typescript
interface AgentResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}
```

### Usage in Routes (Optimus Layer)

Routes in Optimus delegate to agents, which use Sutradhar orchestrator:

```typescript
// In apps/optimus/src/routes/edtech.ts
router.post('/auth/guest', asyncHandler(async (req, res) => {
  const result = await authAgent.createGuest(req.body);
  
  res.json({
    ok: result.success,
    ...(result.success ? result.data : { error: result.error })
  });
}));
```

Agents internally use `SutradharClient` to execute tasks via the orchestrator.

### Benefits

1. **Single Responsibility** - Each agent does one thing well
2. **Testability** - Easy to unit test individual agents
3. **Maintainability** - Changes to unified services don't break agents
4. **Composability** - Agents can be composed for complex workflows
5. **Consistency** - Uniform error handling and result patterns
6. **Abstraction Layer** - Routes don't need to know about Convex, services, etc.
7. **Future-Proof** - Can swap implementations without changing routes
8. **Orchestration Ready** - Architecture designed to evolve into agent orchestrator (see [AGENT_ORCHESTRATION.md](AGENT_ORCHESTRATION.md))

## Folder Structure

### Three-Layer Architecture

```
apps/
├── sutradhar/                  # Layer 1: Pure Orchestrator
│   ├── src/
│   │   ├── orchestrator/      # Core orchestration engine
│   │   │   ├── registry.ts    # Agent registry
│   │   │   ├── runtime/       # Runtime implementations
│   │   │   └── ...
│   │   ├── agents/            # Generic agents (LLM, retrieval, actions, email)
│   │   ├── core/              # Core services & middleware
│   │   ├── routes/            # Orchestration API routes
│   │   └── server.ts          # Orchestrator server
│   └── package.json
│
├── optimus/                    # Layer 2: Backend Agents (EdTech)
│   ├── src/
│   │   ├── agents/            # Use case-specific agents
│   │   │   ├── auth-agent.ts
│   │   │   ├── course-agent.ts
│   │   │   ├── tutoring-agent.ts
│   │   │   └── ...
│   │   ├── client/            # SutradharClient for orchestrator communication
│   │   ├── routes/            # EdTech API routes
│   │   │   └── edtech.ts
│   │   └── server.ts         # Optimus API server
│   └── package.json
│
├── masterbolt/                 # Layer 3: Frontend
│   ├── components/
│   ├── pages/
│   ├── composables/
│   │   └── useApi.ts          # Calls Optimus API
│   └── package.json
│
└── worker/                     # Legacy (being migrated)
    └── src/
        ├── core/              # Core architecture & infrastructure
        │   ├── cache/         # Caching layer (Memory/Redis)
        │   ├── guardrails/    # Content guardrails & safety
        │   ├── http/          # HTTP client pooling
        │   ├── interfaces/    # Plugin interfaces
        │   ├── logging/       # Logging system
        │   ├── middleware/    # Express middleware
        │   ├── mocks/         # Mock plugin implementations
        │   ├── plugins/       # Real plugin implementations
        │   └── services/      # Business logic services
        │
        └── agents/            # Legacy agents (being migrated to Optimus)
            ├── auth-agent.ts
            ├── course-agent.ts
            └── ...
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
│   ├── v1/                    # Version 1 API endpoints
│   │   ├── answer.ts          # RAG endpoints
│   │   ├── llm.ts             # LLM endpoints
│   │   ├── actions.ts         # Action endpoints (legacy)
│   │   ├── github.ts          # GitHub REST API
│   │   ├── slack.ts           # Slack REST API
│   │   ├── calendar.ts        # Calendar REST API
│   │   ├── webhooks.ts        # Webhook endpoints
│   │   ├── logs.ts            # Log search API
│   │   └── index.ts           # Route aggregator
│   └── edtech-v2.ts           # EdTech routes (agent-based)
│
├── api/                       # Unified API layer
│   └── v1/                    # Unified API endpoints
│       ├── conversations.ts   # Chat, Q&A endpoints
│       ├── knowledge.ts       # Search, indexing
│       ├── communications.ts  # Messages, channels
│       ├── scheduling.ts      # Calendar, events
│       ├── collaboration.ts   # Issues, tasks
│       ├── media.ts           # Images, voice
│       └── system.ts          # Health, auth, config
│
├── services/                  # Unified service layer
│   ├── conversation-service.ts   # Orchestrates chat/Q&A
│   ├── knowledge-service.ts      # Search & retrieval
│   ├── communication-service.ts # Messages, notifications
│   ├── action-service.ts         # Actions & integrations
│   ├── media-service.ts         # Images, voice, files
│   └── session-service.ts        # Sessions & context
│
├── agentmail/                 # Email service integration
├── browser/                   # Browser automation
├── llm/                       # LLM providers & prompts
├── retrieval/                 # Retrieval services
├── voice/                     # Voice/LiveKit integration
├── util/                      # Utilities
└── server.ts                  # Main server file
```

## Performance Optimizations

### Implemented Optimizations

1. **HTTP Connection Pooling**
   - Reuses HTTP connections with keep-alive
   - Reduces connection overhead by ~70%
   - Applied to Convex client and external APIs

2. **Redis-based Distributed Rate Limiting**
   - Sliding window algorithm
   - Auto-detects Redis and falls back to in-memory
   - Enables horizontal scaling

3. **Query Batching**
   - `convexBatchQueries()` for parallel queries
   - Reduces latency for multiple queries

4. **Cache Warming**
   - Pre-warms frequently accessed data
   - Runs every 5 minutes in production
   - Reduces database load

5. **Route-level Caching**
   - Catalog endpoint cached for 1 hour
   - Reduces database queries significantly

### Expected Improvements

- **Latency**: 30-50% reduction in average request time
- **Throughput**: 2-3x increase in requests per second
- **Scalability**: Support for horizontal scaling
- **Cost**: Reduced API calls through better caching

### Bottlenecks Identified & Mitigated

1. ✅ **Database Query Layer** - Connection pooling implemented
2. ✅ **Rate Limiting** - Redis-based distributed rate limiting
3. ✅ **Sequential API Calls** - Parallelization where possible
4. ✅ **Caching Strategy** - Cache warming and route-level caching
5. ✅ **HTTP Client** - Connection pooling with keep-alive

## Design Principles

### 1. Separation of Concerns
- **Core**: Infrastructure, plugins, services
- **Integrations**: External service clients and webhooks
- **Routes**: API endpoint definitions
- **Services**: Business logic layer

### 2. Plugin Architecture
- Interfaces in `core/interfaces/`
- Mock implementations in `core/mocks/`
- Real implementations in `core/plugins/`
- Enables easy swapping and testing

### 3. Integration Pattern
- **Actions**: Outbound operations (send, create, update)
- **Webhooks**: Inbound event handlers (receive, respond)
- All integrations under `integrations/`

### 4. RESTful Design
- Resource-based URLs
- Standard HTTP methods
- Consistent response formats
- Versioned endpoints (`/api/v1/`)

### 5. Abstraction & Encapsulation
- All external APIs hidden behind unified services
- External API details never leak to routes or UI layer
- Single, consistent API for all operations
- UI-First: Endpoints designed for common UI/UX patterns

## Guardrails System

A pluggable, persona-aware guardrail system for validating and filtering user queries.

### Guardrail Types

- **Safety**: Detects threats, self-harm, and harmful content
- **Relevance**: Validates that retrieved snippets match queries
- **Off-topic**: Blocks queries unrelated to the knowledge base
- **PII**: Detects personally identifiable information
- **Profanity**: Filters inappropriate language
- **Spam**: Detects repetitive or spam-like queries
- **Length**: Validates query length limits

### Personas

**Default**: Standard community manager/support persona with all guardrails enabled.

**Greeter**: Friendly, welcoming persona - more permissive:
- Allows short greetings
- No spam checks
- Lower relevance thresholds

**Moderator**: Strict content moderation:
- All guardrails enabled
- Higher relevance thresholds
- Strict spam detection
- PII checking including IPs

**Escalator**: Handles escalations - permissive for user expression:
- Off-topic disabled (allows broader questions)
- Profanity disabled (allows frustration)
- Higher spam tolerance
- Longer length limits for detailed context

**Strict**: Maximum security:
- All guardrails at highest settings
- Very high relevance thresholds
- Strict spam and length limits

**Technical**: For technical support:
- Off-topic disabled (allows technical questions)
- Standard safety and relevance checks

### Usage

```typescript
import { guardrailRegistry } from './core/guardrails';

const context = {
  query: userQuery,
  snippets: retrievedSnippets,
  sessionId: session.id,
  persona: 'moderator',
};

const result = await guardrailRegistry.check(context, 'moderator');
```

### Creating Custom Guardrails

```typescript
export class CustomGuardrail implements IGuardrail {
  name = 'custom';
  category = 'custom' as const;
  
  async check(context: GuardrailContext, config?: GuardrailConfig): Promise<GuardrailResult> {
    // Your validation logic
    if (/* condition */) {
      return {
        allowed: false,
        reason: 'Custom rejection message',
        category: 'custom',
        severity: 'medium',
      };
    }
    return { allowed: true, category: 'custom' };
  }
}

// Register it
guardrailRegistry.register(new CustomGuardrail());
```

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
OPENAI_API_KEY
HYPERSPELL_API_KEY
LIVEKIT_API_KEY
LIVEKIT_API_SECRET
```

## Scalability Features

### Horizontal Scaling
- Stateless API design
- Redis for distributed caching
- Session-based state in Convex
- Load balancer ready
- Distributed rate limiting

### Vertical Scaling
- Connection pooling
- Caching strategies
- Request deduplication
- Graceful degradation
- Circuit breakers

## Benefits

1. **Clear Boundaries**: Core vs Integrations vs Routes
2. **Easy Testing**: Interfaces enable mocking
3. **Scalable**: Plugin architecture supports growth
4. **Maintainable**: Logical grouping
5. **Type Safe**: Interfaces throughout
6. **Secure**: No secrets in code
7. **Performant**: Optimized for production workloads
