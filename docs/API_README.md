# Sutradhar API

Sutradhar is an AI-powered assistant API service with retrieval-augmented generation, actions, and LLM capabilities.

## Overview

Sutradhar provides a scalable REST API for building AI-powered applications. It offers:

- **Retrieval-Augmented Generation (RAG)**: Search and answer questions using indexed documents
- **LLM Integration**: Direct access to OpenAI and Perplexity models
- **Action Execution**: Integrate with Slack, Google Calendar, GitHub, and forums
- **Voice Support**: LiveKit integration for voice interactions
- **Session Management**: Track conversations and actions across sessions

## Quick Start

### Base URL

```
Development: http://localhost:2198
Production: https://api.sutradhar.example.com
```

### API Versioning

All endpoints are versioned under `/api/v1/`. Legacy endpoints (without version prefix) are maintained for backward compatibility but new integrations should use v1 endpoints.

### Authentication

Currently, OAuth endpoints return dummy tokens. Implement proper authentication for production use.

### Rate Limiting

Different endpoints have different rate limits:
- **Strict**: 10 requests/minute
- **Standard**: 100 requests/minute  
- **Lenient**: 1000 requests/minute
- **Per Session**: 30 requests/minute per session ID

Rate limit information is provided in response headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (Unix timestamp)

## API Endpoints

### Health & Status

- `GET /` - API information
- `GET /health` - Basic health check
- `GET /health/full` - Comprehensive health status
- `GET /health/heartbeat` - Simple ping endpoint
- `GET /metrics` - Prometheus metrics
- `GET /api/v1` - v1 API information
- `GET /api/v1/docs` - OpenAPI specification

### Answer (RAG)

**POST `/api/v1/answer`**
Get AI answer using retrieval-augmented generation.

**Request:**
```json
{
  "sessionId": "optional-session-id",
  "question": "What is photosynthesis?",
  "persona": "optional-persona"
}
```

**Response:**
```json
{
  "ok": true,
  "finalText": "Photosynthesis is...",
  "citations": [
    {
      "source": "biology-ch5.md",
      "text": "relevant excerpt...",
      "url": null
    }
  ],
  "latencyMs": 1250,
  "blocked": false
}
```

### LLM

**POST `/api/v1/llm/answer`**
Get direct LLM response (with guardrails).

**POST `/api/v1/llm/summarize`**
Summarize text using LLM.

**POST `/api/v1/llm/escalate`**
Analyze query for escalation needs.

### Actions

**POST `/api/v1/actions/slack`**
Send message to Slack channel.

**POST `/api/v1/actions/calendar`**
Create Google Calendar event.

**POST `/api/v1/actions/github`**
Create GitHub issue.

**POST `/api/v1/actions/forum`**
Post to forum (browser automation).

**GET `/api/v1/actions?sessionId=<id>`**
List actions by session.

### Email

**POST `/api/v1/email/send`**
Send email via AgentMail.

### Retrieval

**POST `/api/v1/retrieval/index`**
Index documents from seed directory.

### Voice

**GET `/api/v1/voice/token`**
Generate LiveKit access token.

### Authentication

**POST `/api/v1/auth/{provider}/login`**
Initiate OAuth flow (github, slack, google).

**GET `/api/v1/auth/{provider}/callback`**
OAuth callback endpoint.

## Response Format

All endpoints return JSON with a consistent structure:

```json
{
  "ok": true,
  "data": {},
  "message": "Success message",
  "error": null
}
```

**Error Response:**
```json
{
  "ok": false,
  "error": "Error description",
  "message": "Detailed error message"
}
```

## Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `428` - Precondition Required (e.g., inbox not found)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
- `503` - Service Unavailable (circuit breaker open)

## Request Headers

- `Content-Type: application/json` - Required for POST requests
- `Authorization: Bearer <token>` - Optional, for authenticated requests
- `X-Session-ID: <session-id>` - Optional, for session tracking
- `X-Request-ID: <request-id>` - Optional, for request tracking

## Examples

### Ask a Question

```bash
curl -X POST http://localhost:2198/api/v1/answer \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is photosynthesis?",
    "sessionId": "session-123"
  }'
```

### Send Slack Message

```bash
curl -X POST http://localhost:2198/api/v1/actions/slack \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello from Sutradhar API!",
    "channelId": "C09Q8AD2KHS",
    "sessionId": "session-123"
  }'
```

### Create Calendar Event

```bash
curl -X POST http://localhost:2198/api/v1/actions/calendar \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Study Session",
    "startISO": "2024-01-15T10:00:00Z",
    "endISO": "2024-01-15T11:00:00Z",
    "description": "Biology review",
    "sessionId": "session-123"
  }'
```

## Documentation

Full OpenAPI specification available at:
- `/api/v1/docs` - YAML format
- Or view in Swagger UI if configured

## Legacy Endpoints

The following legacy endpoints are maintained for backward compatibility but new code should use v1 endpoints:

- `/api/answer` → `/api/v1/answer`
- `/llm/*` → `/api/v1/llm/*`
- `/actions/*` → `/api/v1/actions/*`
- `/agentmail/send` → `/api/v1/email/send`
- `/retrieval/indexSeed` → `/api/v1/retrieval/index`
- `/voice/token` → `/api/v1/voice/token`

## Support

For API support and documentation, see:
- API Documentation: `/api/v1/docs`
- Health Status: `/health/full`

