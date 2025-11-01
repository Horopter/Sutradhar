# Unified API Migration Guide

## Overview

Sutradhar has been redesigned with a unified API layer that abstracts all external API complexity. All external services (AgentMail, Convex, Composio, Moss, Hyperspell, LiveKit, etc.) are now internal to Sutradhar and hidden behind clean, UI-focused endpoints.

## New API Structure

### Base URL
- **Unified API**: `/api/unified/*`
- **Legacy API**: `/api/v1/*` (maintained for backward compatibility)

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

## Architecture Layers

```
UI Request
    ↓
Unified API Endpoints (/api/unified/*)
    ↓
Unified Services (conversation, knowledge, communication, etc.)
    ↓
Adapters (abstract external APIs)
    ↓
External API Clients (private)
```

## Key Benefits

1. **No External API Exposure**: All external APIs are hidden
2. **Consistent Interface**: Same patterns across all features
3. **Easy Testing**: Mock adapters for all services
4. **API Agnostic**: Swap external providers without UI changes
5. **Type Safety**: Strong TypeScript types throughout

## Example Usage

### Ask a Question
```bash
POST /api/unified/conversations/ask
{
  "question": "What is AI?",
  "sessionId": "optional-session-id",
  "persona": "default"
}
```

### Search Documents
```bash
POST /api/unified/knowledge/search
{
  "query": "machine learning",
  "maxResults": 10
}
```

### Send Message (Platform Agnostic)
```bash
POST /api/unified/communications/messages
{
  "channel": {
    "id": "C123456",
    "platform": "slack"
  },
  "text": "Hello from Sutradhar!"
}
```

### Create Issue
```bash
POST /api/unified/collaboration/issues
{
  "repository": "owner/repo",
  "title": "Bug fix needed",
  "description": "Details..."
}
```

## Migration from Legacy API

Legacy endpoints at `/api/v1/*` continue to work but are deprecated. New integrations should use `/api/unified/*`.

### Legacy → Unified Mapping

| Legacy | Unified |
|--------|---------|
| `/api/v1/answer` | `/api/unified/conversations/ask` |
| `/api/v1/retrieval/search` | `/api/unified/knowledge/search` |
| `/api/v1/github/issues` | `/api/unified/collaboration/issues` |
| `/api/v1/slack/messages` | `/api/unified/communications/messages` |
| `/api/v1/calendar/events` | `/api/unified/scheduling/events` |
| `/api/v1/images/search` | `/api/unified/media/images/search` |

## Internal Architecture

All external API clients are now in `src/external/` (private):
- `external/agentmail/` - AgentMail client
- `external/convex/` - Convex client
- `external/composio/` - Composio client
- `external/hyperspell/` - Hyperspell client
- `external/moss/` - Moss client
- `external/openai/` - OpenAI client
- `external/livekit/` - LiveKit client

Adapters in `src/adapters/` convert between external API formats and internal models.

Unified services in `src/services/` provide the business logic layer.

API routes in `src/api/v1/` expose clean, UI-focused endpoints.

## Next Steps

1. Migrate existing frontend to use `/api/unified/*` endpoints
2. Test all unified endpoints
3. Deprecate legacy `/api/v1/*` endpoints (with long sunset period)
4. Document all unified endpoints in OpenAPI spec

