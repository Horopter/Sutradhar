# RESTful Actions API Documentation

The GitHub, Slack, and Google Calendar actions have been expanded into comprehensive RESTful APIs following REST principles.

## GitHub API (`/api/v1/github`)

### Repositories

**GET `/api/v1/github/repos/:repoSlug`**
Get repository information.
- `repoSlug`: Format `owner/repo` (e.g., `octocat/Hello-World`)

### Issues

**GET `/api/v1/github/repos/:repoSlug/issues`**
List issues for a repository.
- Query parameters:
  - `state`: `open`, `closed`, or `all` (default: `open`)
  - `label`: Filter by label name
  - `assignee`: Filter by assignee username
  - `limit`: Maximum number of results

**POST `/api/v1/github/repos/:repoSlug/issues`**
Create a new issue.
```json
{
  "title": "Issue title",
  "body": "Issue description",
  "labels": ["bug", "urgent"],
  "assignees": ["username"],
  "sessionId": "optional-session-id"
}
```

**GET `/api/v1/github/repos/:repoSlug/issues/:issueNumber`**
Get a specific issue.

**PATCH `/api/v1/github/repos/:repoSlug/issues/:issueNumber`**
Update an issue.
```json
{
  "title": "Updated title",
  "body": "Updated description",
  "state": "closed",
  "labels": ["fixed"],
  "assignees": ["username"]
}
```

**POST `/api/v1/github/repos/:repoSlug/issues/:issueNumber/comments`**
Add a comment to an issue.
```json
{
  "body": "Comment text",
  "sessionId": "optional-session-id"
}
```

### Pull Requests

**GET `/api/v1/github/repos/:repoSlug/pulls`**
List pull requests.
- Query parameters:
  - `state`: `open`, `closed`, or `all`
  - `limit`: Maximum number of results

**POST `/api/v1/github/repos/:repoSlug/pulls`**
Create a pull request.
```json
{
  "title": "PR title",
  "body": "PR description",
  "head": "feature-branch",
  "base": "main",
  "draft": false,
  "sessionId": "optional-session-id"
}
```

**GET `/api/v1/github/repos/:repoSlug/pulls/:prNumber`**
Get a specific pull request.

## Slack API (`/api/v1/slack`)

### Channels

**GET `/api/v1/slack/channels`**
List channels.
- Query parameters:
  - `types`: Comma-separated list (`public_channel,private_channel`)
  - `excludeArchived`: `true` or `false`

**GET `/api/v1/slack/channels/:channelId`**
Get channel information.

### Messages

**GET `/api/v1/slack/channels/:channelId/messages`**
List messages in a channel.
- Query parameters:
  - `limit`: Maximum number of messages (default: 100)
  - `cursor`: Pagination cursor
  - `oldest`: Oldest timestamp to include
  - `latest`: Latest timestamp to include

**POST `/api/v1/slack/channels/:channelId/messages`**
Send a message to a channel.
```json
{
  "text": "Message text",
  "threadTs": "optional-thread-timestamp",
  "blocks": [],
  "sessionId": "optional-session-id"
}
```

**POST `/api/v1/slack/messages`**
Alternative endpoint to send a message.
```json
{
  "text": "Message text",
  "channelId": "C1234567890",
  "sessionId": "optional-session-id"
}
```

**GET `/api/v1/slack/channels/:channelId/messages/:ts`**
Get a specific message.
- `ts`: Message timestamp

**PUT `/api/v1/slack/channels/:channelId/messages/:ts`**
Update a message.
```json
{
  "text": "Updated message text",
  "blocks": []
}
```

**DELETE `/api/v1/slack/channels/:channelId/messages/:ts`**
Delete a message.

## Google Calendar API (`/api/v1/calendar`)

### Calendars

**GET `/api/v1/calendar/calendars`**
List calendars.

**GET `/api/v1/calendar/calendars/:calendarId`**
Get calendar information.

### Events

**GET `/api/v1/calendar/calendars/:calendarId/events`**
List events in a calendar.
- Query parameters:
  - `timeMin`: Start time (ISO 8601)
  - `timeMax`: End time (ISO 8601)
  - `maxResults`: Maximum number of results (default: 2500)
  - `singleEvents`: `true` or `false` (default: `true`)
  - `orderBy`: `startTime` or `updated` (default: `startTime`)

**POST `/api/v1/calendar/calendars/:calendarId/events`**
Create an event.
```json
{
  "title": "Event title",
  "startISO": "2024-01-15T10:00:00Z",
  "endISO": "2024-01-15T11:00:00Z",
  "description": "Event description",
  "location": "Conference Room A",
  "attendees": ["user@example.com"],
  "timezone": "UTC",
  "sessionId": "optional-session-id"
}
```

**POST `/api/v1/calendar/events`**
Alternative endpoint to create an event.
```json
{
  "title": "Event title",
  "startISO": "2024-01-15T10:00:00Z",
  "endISO": "2024-01-15T11:00:00Z",
  "calendarId": "primary",
  "sessionId": "optional-session-id"
}
```

**GET `/api/v1/calendar/calendars/:calendarId/events/:eventId`**
Get a specific event.

**PATCH `/api/v1/calendar/calendars/:calendarId/events/:eventId`**
Update an event.
```json
{
  "title": "Updated title",
  "startISO": "2024-01-15T11:00:00Z",
  "endISO": "2024-01-15T12:00:00Z",
  "description": "Updated description",
  "location": "New location"
}
```

**DELETE `/api/v1/calendar/calendars/:calendarId/events/:eventId`**
Delete an event.

## RESTful Principles

### Resource-Based URLs
- `/api/v1/github/repos/{owner}/{repo}/issues/{number}`
- `/api/v1/slack/channels/{channelId}/messages/{ts}`
- `/api/v1/calendar/calendars/{calendarId}/events/{eventId}`

### HTTP Methods
- **GET**: Retrieve resources
- **POST**: Create resources
- **PUT/PATCH**: Update resources
- **DELETE**: Delete resources

### Status Codes
- **200**: Success (GET, PUT, PATCH, DELETE)
- **201**: Created (POST)
- **400**: Bad Request (validation errors)
- **404**: Not Found
- **500**: Internal Server Error
- **501**: Not Implemented (for TODO endpoints)

### Response Format
All endpoints return consistent JSON:
```json
{
  "ok": true,
  "data": {},
  "message": "Success message"
}
```

Error responses:
```json
{
  "ok": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

## Examples

### Create GitHub Issue
```bash
curl -X POST http://localhost:2198/api/v1/github/repos/owner/repo/issues \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Bug: Application crashes",
    "body": "The app crashes when clicking the button",
    "labels": ["bug", "urgent"]
  }'
```

### List Slack Messages
```bash
curl "http://localhost:2198/api/v1/slack/channels/C1234567890/messages?limit=50"
```

### Create Calendar Event
```bash
curl -X POST http://localhost:2198/api/v1/calendar/events \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Team Meeting",
    "startISO": "2024-01-15T10:00:00Z",
    "endISO": "2024-01-15T11:00:00Z",
    "calendarId": "primary"
  }'
```

### Update Event
```bash
curl -X PATCH http://localhost:2198/api/v1/calendar/calendars/primary/events/event123 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Meeting Title"
  }'
```

### Delete Slack Message
```bash
curl -X DELETE http://localhost:2198/api/v1/slack/channels/C1234567890/messages/1234567890.123456
```

## Implementation Status

### ✅ Fully Implemented
- GitHub: Create issue
- Slack: Send message, list messages, delete message
- Calendar: Create event, list calendars, get calendar, list events, get event, update event, delete event

### 🚧 TODO (Returns 501)
- GitHub: List pulls, create PR, get PR, get repo
- Slack: List channels, get channel, update message, get message (partially working)
- Calendar: All operations work via Composio SDK

## Backward Compatibility

The original action endpoints are still available:
- `POST /api/v1/actions/github`
- `POST /api/v1/actions/slack`
- `POST /api/v1/actions/calendar`

These delegate to the RESTful endpoints for backward compatibility.

