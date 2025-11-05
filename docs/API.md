# API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Authentication](#authentication)
4. [Rate Limiting](#rate-limiting)
5. [API Endpoints](#api-endpoints)
6. [External Integrations](#external-integrations)
7. [Bidirectional Integrations](#bidirectional-integrations)
8. [Unified API](#unified-api)

## Overview

Sutradhar provides a scalable REST API for building AI-powered applications. It offers:

- **Retrieval-Augmented Generation (RAG)**: Search and answer questions using indexed documents
- **LLM Integration**: Direct access to OpenAI and Perplexity models
- **Action Execution**: Integrate with Slack, Google Calendar, GitHub, and forums
- **Voice Support**: LiveKit integration for voice interactions
- **Session Management**: Track conversations and actions across sessions

### Base URL

```
Development: http://localhost:2198
Production: https://api.sutradhar.example.com
```

### API Versioning

All endpoints are versioned under `/api/v1/`. Legacy endpoints (without version prefix) are maintained for backward compatibility but new integrations should use v1 endpoints.

## Quick Start

### Health Check

```bash
curl http://localhost:2198/health
```

### Answer a Question (RAG)

```bash
curl -X POST http://localhost:2198/api/v1/answer \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is machine learning?",
    "sessionId": "my-session"
  }'
```

### Get LLM Response

```bash
curl -X POST http://localhost:2198/api/v1/llm/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user": "Explain quantum computing",
    "system": "You are a helpful assistant",
    "provider": "openai"
  }'
```

## Authentication

Currently, OAuth endpoints return dummy tokens. Implement proper authentication for production use.

For Apex Academy (EdTech), guest mode is available:

```bash
curl -X POST http://localhost:2198/auth/guest
```

## Rate Limiting

Different endpoints have different rate limits:
- **Strict**: 10 requests/minute (expensive operations like LLM, actions)
- **Standard**: 60 requests/minute (most endpoints)
- **Lenient**: 100 requests/minute (health checks)
- **Per Session**: 20 requests/minute per session ID

Rate limit information is provided in response headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (ISO 8601)

## API Endpoints

### Health & Status

- `GET /` - API information
- `GET /health` - Basic health check
- `GET /health/full` - Full health check with dependencies
- `GET /metrics` - Prometheus metrics

### RAG (Retrieval-Augmented Generation)

**POST `/api/v1/answer`**
Get AI answer with retrieval-augmented generation.

```json
{
  "question": "What is machine learning?",
  "sessionId": "optional-session-id",
  "persona": "optional-persona"
}
```

**Response:**
```json
{
  "ok": true,
  "finalText": "Machine learning is...",
  "citations": [...],
  "latencyMs": 1234,
  "blocked": false
}
```

### LLM (Large Language Models)

**POST `/api/v1/llm/chat`**
Direct LLM chat endpoint.

```json
{
  "user": "Explain quantum computing",
  "system": "You are a helpful assistant",
  "provider": "openai",
  "model": "gpt-4o-mini"
}
```

**POST `/api/v1/llm/summarize`**
Summarize text.

**POST `/api/v1/llm/escalate`**
Analyze escalation requests.

### Actions (GitHub, Slack, Calendar)

#### GitHub API (`/api/v1/github`)

**GET `/api/v1/github/repos/:repoSlug`**
Get repository information.

**GET `/api/v1/github/repos/:repoSlug/issues`**
List issues (query params: `state`, `label`, `assignee`, `limit`).

**POST `/api/v1/github/repos/:repoSlug/issues`**
Create a new issue.

```json
{
  "title": "Issue title",
  "body": "Issue description",
  "labels": ["bug", "urgent"],
  "assignees": ["username"]
}
```

**GET `/api/v1/github/repos/:repoSlug/issues/:issueNumber`**
Get a specific issue.

**PATCH `/api/v1/github/repos/:repoSlug/issues/:issueNumber`**
Update an issue.

**POST `/api/v1/github/repos/:repoSlug/issues/:issueNumber/comments`**
Add a comment to an issue.

#### Slack API (`/api/v1/slack`)

**POST `/api/v1/slack/messages`**
Send a message to Slack.

```json
{
  "channel": "general",
  "text": "Hello from Sutradhar!"
}
```

**GET `/api/v1/slack/channels`**
List channels.

**GET `/api/v1/slack/channels/:id`**
Get channel information.

#### Calendar API (`/api/v1/calendar`)

**POST `/api/v1/calendar/events`**
Create a calendar event.

```json
{
  "summary": "Meeting",
  "start": "2024-01-01T10:00:00Z",
  "end": "2024-01-01T11:00:00Z",
  "description": "Meeting description"
}
```

**GET `/api/v1/calendar/events`**
List events.

**GET `/api/v1/calendar/events/:id`**
Get a specific event.

**PUT `/api/v1/calendar/events/:id`**
Update an event.

**DELETE `/api/v1/calendar/events/:id`**
Delete an event.

### Webhooks

**POST `/api/v1/webhooks/slack`**
Receive Slack events.

**POST `/api/v1/webhooks/github`**
Receive GitHub events.

**POST `/api/v1/webhooks/calendar`**
Receive Calendar events.

### Voice (LiveKit)

**GET `/api/v1/voice/token`**
Generate LiveKit access token.

Query parameters:
- `room` (optional): Room name (default: auto-generated)

**Response:**
```json
{
  "token": "eyJhbGc...",
  "url": "wss://your-livekit-url",
  "room": "room-name"
}
```

**Configuration:**
Required environment variables:
- `LIVEKIT_URL` - WebSocket URL (e.g., `wss://your-livekit-url.livekit.cloud`)
- `LIVEKIT_API_KEY` - API key for token generation
- `LIVEKIT_API_SECRET` - Secret for signing tokens

**Webhook Setup:**
For transcription events, configure webhook in LiveKit dashboard:
- Endpoint: `POST /webhooks/livekit/transcription`
- Events: `transcription_finished`

**Client Integration:**
```typescript
// Get token
const tokenResponse = await api.getVoiceToken()

// Connect to room
const room = new Room()
await room.connect(tokenResponse.url, tokenResponse.token)

// Publish audio
const audioTrack = await createLocalAudioTrack()
await room.localParticipant.publishTrack(audioTrack)
```

### EdTech (Apex Academy)

**POST `/auth/guest`**
Create guest session.

**GET `/catalog`**
List courses (cached for 1 hour).

**GET `/course/:slug/lessons`**
List lessons for a course.

**GET `/lesson/:id`**
Get lesson content.

**POST `/lesson/:id/query`**
Ask a question about a lesson (with intent detection and actions).

**POST `/lesson/:id/summarize`**
Summarize a lesson.

**GET `/quiz/:id`**
Get quiz.

**POST `/quiz/:id/attempt`**
Submit quiz attempt.

**GET `/code`**
List code assignments.

**GET `/code/:assignmentId`**
Get coding assignment.

**POST `/code/:assignmentId/hint`**
Get hint (hint-only tutor).

**POST `/code/:assignmentId/run`**
Run code with sandboxing.

## External Integrations

### Hyperspell
- **Purpose**: Vector search and memory vault retrieval
- **Status**: ✅ Configured
- **Usage**: Primary retrieval source (vault memories)
- **Endpoints**: 
  - `POST /retrieval/hyperspell/seed` - Seed text to Hyperspell
  - `GET /diag/hyperspell` - Hyperspell diagnostics

### OpenAI
- **Purpose**: LLM responses via OpenAI API
- **Status**: ✅ Configured
- **Endpoints**: 
  - `POST /llm/answer` - Generate LLM answers
  - `POST /llm/summarize` - Summarize text
  - `POST /llm/escalate` - Escalation analysis

### LiveKit
- **Purpose**: Real-time voice communication
- **Status**: ✅ Fully Configured
- **Usage**: 
  - Voice token generation (`/voice/token`)
  - Voice UI at `/voice`

### AgentMail
- **Purpose**: Email sending via AgentMail API
- **Status**: ✅ API Key Configured
- **Endpoints**: 
  - `POST /agentmail/send`
  - `POST /agentmail/webhook`

### Composio
- **Purpose**: Action integrations (GitHub, Slack, Calendar)
- **Status**: ✅ Configured
- **Usage**: All action endpoints use Composio SDK

**Configuration:**
```bash
COMPOSIO_API_KEY=your-key
COMPOSIO_USER_ID=your-user-id
GITHUB_CONNECTED_ACCOUNT_ID=account-id
SLACK_CONNECTED_ACCOUNT_ID=account-id
GCAL_CONNECTED_ACCOUNT_ID=account-id
```

**Supported Actions:**
- GitHub: Create issues, pull requests, comments
- Slack: Send messages, list channels
- Calendar: Create, update, delete events

## Bidirectional Integrations

Sutradhar supports bidirectional communication with Slack, GitHub, and Google Calendar. The system can receive events, consult LLMs, and automatically respond.

### Integration Flow

```
External Service → Webhook → Analyze (LLM) → Respond (Action)
```

1. **Receive**: Webhook receives event from external service
2. **Analyze**: LLM/Answer service processes the event
3. **Respond**: Appropriate action is executed (reply, reschedule, etc.)

### Slack Integration

**Webhook Setup**:
- Endpoint: `POST /api/v1/webhooks/slack`
- Subscribe to `message.channels` event
- Add bot to channels

**Features**:
- Receives channel messages
- Analyzes using RAG + LLM
- Generates contextual response
- Posts reply (in thread if applicable)
- Maintains session context per channel

### GitHub Integration

**Webhook Setup**:
- Endpoint: `POST /api/v1/webhooks/github`
- Events: `Issues`, `Issue comments`

**Features**:
- Detects questions in comments
- Analyzes using LLM with issue context
- Posts helpful responses
- Maintains conversation context per issue

### Calendar Integration

**Webhook Setup**:
- Endpoint: `POST /api/v1/webhooks/calendar`
- Events: `events.updated`, `events.cancelled`

**Features**:
- Receives event updates
- Analyzes reschedule requests
- Automatically updates events
- Maintains user preferences

## Unified API

The unified API (`/api/unified/*`) provides a clean, UI-focused interface that abstracts all external API complexity.

### Endpoint Categories

#### 1. Conversations (`/api/unified/conversations`)
- `POST /ask` - Ask a question
- `POST /chat` - Send chat message
- `POST /start` - Start new session
- `POST /:sessionId/end` - End session
- `GET /:sessionId` - Get conversation
- `GET /:sessionId/history` - Get message history

#### 2. Knowledge (`/api/unified/knowledge`)
- `POST /search` - Search documents
- `POST /search/images` - Search images
- `POST /index` - Index content
- `POST /index/images` - Index images

#### 3. Communications (`/api/unified/communications`)
- `POST /messages` - Send message (Slack, GitHub, Email)
- `GET /messages` - Get messages
- `GET /channels` - List channels
- `GET /channels/:id` - Get channel

#### 4. Collaboration (`/api/unified/collaboration`)
- `POST /issues` - Create GitHub issue
- `GET /issues` - List issues
- `GET /issues/:id` - Get issue
- `PUT /issues/:id` - Update issue
- `POST /tasks` - Create task (issue or event)

#### 5. Scheduling (`/api/unified/scheduling`)
- `POST /events` - Create calendar event
- `GET /events` - List events
- `GET /events/:id` - Get event
- `PUT /events/:id` - Update event
- `DELETE /events/:id` - Delete event

#### 6. Media (`/api/unified/media`)
- `POST /images/search` - Search images
- `POST /images/index` - Index images
- `POST /voice/session` - Start voice session
- `GET /voice/token` - Get voice token

#### 7. System (`/api/unified/system`)
- `GET /health` - System health
- `GET /capabilities` - Available capabilities

### Key Benefits

1. **No External API Exposure**: All external APIs are hidden
2. **Consistent Interface**: Same patterns across all features
3. **Easy Testing**: Mock adapters for all services
4. **API Agnostic**: Swap external providers without UI changes
5. **Type Safety**: Strong TypeScript types throughout

