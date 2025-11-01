# Bidirectional Integration Guide

Sutradhar now supports bidirectional communication with Slack, GitHub, and Google Calendar. The system can receive events, consult LLMs, and automatically respond.

## Overview

### Integration Flow

```
External Service → Webhook → Analyze (LLM) → Respond (Action)
```

1. **Receive**: Webhook receives event from external service
2. **Analyze**: LLM/Answer service processes the event
3. **Respond**: Appropriate action is executed (reply, reschedule, etc.)

## Slack Integration

### Webhook Setup

**Endpoint**: `POST /api/v1/webhooks/slack`

**Slack Events API Configuration**:
1. Create Slack App
2. Enable Events API
3. Set Request URL to: `https://your-domain.com/api/v1/webhooks/slack`
4. Subscribe to `message.channels` event
5. Add bot to channels

### Features

**Receive Messages**:
- Listens to channel messages
- Filters out bot messages
- Detects questions and requests

**Automatic Replies**:
- Analyzes message using RAG + LLM
- Generates contextual response
- Posts reply (in thread if applicable)
- Maintains session context per channel

**Example Flow**:
```
User: "What's the status of project X?"
  ↓
Webhook receives message
  ↓
Answer service analyzes with RAG
  ↓
Response: "Project X is 80% complete..."
  ↓
Posted to Slack channel
```

### Thread Support
- Automatically replies in thread if message is part of a thread
- Maintains conversation context within threads

## GitHub Integration

### Webhook Setup

**Endpoint**: `POST /api/v1/webhooks/github`

**GitHub Webhook Configuration**:
1. Go to repository Settings → Webhooks
2. Add webhook URL: `https://your-domain.com/api/v1/webhooks/github`
3. Content type: `application/json`
4. Events: `Issues`, `Issue comments`

### Features

**Issue Comments**:
- Detects questions in comments
- Analyzes using LLM with issue context
- Posts helpful responses
- Maintains conversation context per issue

**New Issues**:
- Analyzes new issues
- Provides initial helpful response
- Can auto-assign labels/categorize

**Issue Reopened**:
- Acknowledges reopening
- Offers assistance

**Example Flow**:
```
User comment: "How do I fix this bug?"
  ↓
Webhook receives comment
  ↓
Gets full issue context
  ↓
LLM analyzes issue + comment
  ↓
Response: "Based on the issue, try..."
  ↓
Posted as comment on issue
```

## Google Calendar Integration

### Webhook Setup

**Endpoint**: `POST /api/v1/webhooks/calendar/:calendarId`

**Google Calendar Push Notification Setup**:
1. Create watch channel for calendar
2. Set webhook URL
3. Subscribe to events

### Features

**Reschedule Requests**:
- Detects reschedule requests in event descriptions
- Uses LLM to extract new date/time
- Updates event automatically
- Handles timezone conversions

**Cancellation Requests**:
- Detects cancellation keywords
- Deletes event automatically

**Example Flow**:
```
Event description: "Please reschedule to tomorrow at 3pm"
  ↓
Webhook receives event update
  ↓
LLM extracts: "tomorrow at 3pm" → "2024-01-16T15:00:00Z"
  ↓
Event updated with new time
```

## Configuration

### Environment Variables

```bash
# Slack
SLACK_CONNECTED_ACCOUNT_ID=ac_xxx
SLACK_CHANNEL_ID=C123456

# GitHub
GITHUB_CONNECTED_ACCOUNT_ID=ac_xxx
GITHUB_REPO_SLUG=owner/repo

# Calendar
GCAL_CONNECTED_ACCOUNT_ID=ac_xxx
GCAL_CALENDAR_ID=primary

# LLM (for responses)
OPENAI_API_KEY=sk-xxx
# or
PERPLEXITY_API_KEY=pplx-xxx

# Composio (for actions)
COMPOSIO_API_KEY=xxx
COMPOSIO_USER_ID=user_xxx
```

### Webhook Security

**Slack**:
- Verifies signature using `SLACK_SIGNING_SECRET`
- URL verification challenge support

**GitHub**:
- Verify signature using `GITHUB_WEBHOOK_SECRET`
- Validate webhook delivery

**Calendar**:
- Sync token management
- Event ID validation

## API Endpoints

### Webhook Endpoints

**POST `/api/v1/webhooks/slack`**
- Receives Slack Events API webhooks
- Handles URL verification
- Processes message events

**POST `/api/v1/webhooks/github`**
- Receives GitHub webhooks
- Processes issue and comment events

**POST `/api/v1/webhooks/calendar/:calendarId`**
- Receives Google Calendar push notifications
- Processes event changes

**GET `/api/v1/webhooks`**
- Lists available webhooks and their configurations

## Usage Examples

### Testing Slack Webhook

```bash
# Simulate Slack event
curl -X POST http://localhost:2198/api/v1/webhooks/slack \
  -H "Content-Type: application/json" \
  -d '{
    "type": "event_callback",
    "event": {
      "type": "message",
      "channel": "C123456",
      "user": "U123456",
      "text": "What is the project status?",
      "ts": "1234567890.123456"
    }
  }'
```

### Testing GitHub Webhook

```bash
# Simulate GitHub comment
curl -X POST http://localhost:2198/api/v1/webhooks/github \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: issue_comment" \
  -d '{
    "action": "created",
    "issue": {
      "number": 123,
      "title": "Bug fix needed",
      "repository": {
        "full_name": "owner/repo"
      }
    },
    "comment": {
      "body": "How do I fix this?",
      "user": {"login": "user123"}
    }
  }'
```

## Response Flow

### Slack Message Response

1. Message received in channel
2. Bot analyzes using answer service (RAG)
3. Response generated with context
4. Reply posted to channel (in thread if applicable)
5. Session tracked: `slack-{channelId}-{userId}`

### GitHub Comment Response

1. Comment posted on issue
2. Bot detects question in comment
3. Full issue context retrieved
4. LLM analyzes with context
5. Response posted as comment
6. Session tracked: `github-{repo}-{issueNumber}`

### Calendar Reschedule

1. Event description updated
2. Bot detects reschedule request
3. LLM extracts new date/time
4. Event updated automatically
5. Confirmation logged

## Best Practices

### 1. Avoid Infinite Loops
- Don't respond to bot's own messages
- Filter by user ID
- Check message source

### 2. Rate Limiting
- Respect service rate limits
- Queue webhook processing if needed
- Implement backoff for failures

### 3. Error Handling
- Log all webhook errors
- Don't expose internal errors
- Return appropriate status codes

### 4. Security
- Verify webhook signatures
- Validate event sources
- Sanitize inputs

## Monitoring

### Logs
All webhook events are logged:
- Incoming events: VERBOSE level
- Processing: INFO level
- Responses: INFO level
- Errors: ERROR level

### Sessions
Each interaction creates/updates a session:
- Slack: `slack-{channel}-{user}`
- GitHub: `github-{repo}-{issue}`
- Calendar: `calendar-{calendarId}-{eventId}`

Search logs by session:
```bash
GET /api/v1/logs/sessions/slack-C123456-U789012
```

## Troubleshooting

### Webhooks Not Receiving Events
1. Verify webhook URL is accessible
2. Check service configuration
3. Verify signatures/secrets
4. Check logs for errors

### No Responses Generated
1. Check LLM API keys
2. Verify answer service is working
3. Check guardrails aren't blocking
4. Review logs for processing errors

### Responses Not Posted
1. Verify action credentials
2. Check connection IDs
3. Verify bot permissions
4. Review action service logs

