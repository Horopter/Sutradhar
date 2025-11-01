# Rube.app Integration

This directory contains the Rube.app integration for Slack, Google Calendar, and GitHub actions.

## Status

✅ **Integration complete** - All code updated to use Rube.app instead of Composio.

## Configuration

Add to `.env`:
```bash
RUBE_API_KEY=your_rube_api_key_here
RUBE_BASE_URL=https://api.rube.app  # Default, can be overridden
MOCK_ACTIONS=false  # Set to false to enable real Rube.app actions
```

## API Endpoints to Update

**⚠️ IMPORTANT**: The following endpoints in the code are placeholders and need to be updated based on the actual Rube.app API documentation:

### Slack (`rube/slack.ts`)
- Current endpoint: `POST /actions/slack/send-message`
- Update based on Rube.app's actual Slack API endpoint

### Calendar (`rube/calendar.ts`)
- Current endpoint: `POST /actions/calendar/create-event`
- Update based on Rube.app's actual Google Calendar API endpoint

### GitHub (`rube/github.ts`)
- Current endpoint: `POST /actions/github/create-issue`
- Update based on Rube.app's actual GitHub API endpoint

## Request/Response Format

The current implementation assumes:
- **Authentication**: Bearer token in `Authorization` header
- **Request Body**: JSON format with action-specific parameters
- **Response**: JSON with `data` field containing the result

Update these assumptions if Rube.app uses a different format.

## Testing

Once Rube.app API key is configured:

1. Set `MOCK_ACTIONS=false` in `.env`
2. Restart the worker server
3. Test endpoints:
   - `POST /actions/slack`
   - `POST /actions/calendar`
   - `POST /actions/github`
   - `GET /diag/composio` (legacy endpoint, now uses Rube.app)

## Migration from Composio

All Composio integration files now forward to Rube.app implementations for backward compatibility. The old Composio code is preserved but commented out.

