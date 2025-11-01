# Endpoint Testing Guide

## Quick Reference

### Start Server
```bash
cd apps/worker
npm run dev
```

### Run Tests
```bash
# Health check (requires server running)
npm run health

# Demo happy paths
npm run demo

# All API tests
npm run test:all

# Jest unit/integration tests
npm run test:jest
```

## Health Check Script

The health check script (`scripts/health-check.sh`) is the primary tool for verifying all endpoints are working correctly.

### Features
- ✅ Waits for server to be ready
- ✅ Tests all core endpoints
- ✅ Tests RESTful service endpoints
- ✅ Tests demo happy paths
- ✅ Validates error handling
- ✅ Provides detailed pass/fail reporting

### Usage
```bash
# Basic usage
npm run health

# Custom base URL
BASE_URL=http://localhost:3000 npm run health
```

### What It Tests
1. **Health Endpoints**: `/health`, `/health/full`
2. **API v1 Core**: Answer, LLM, Actions, Sessions, Retrieval
3. **RESTful Services**: GitHub, Slack, Calendar endpoints
4. **Webhooks**: All webhook endpoints
5. **Error Handling**: Invalid requests, missing fields

## Demo Happy Paths

The demo script (`scripts/demo-happy-paths.sh`) tests complete user flows:

### Demo 1: Q&A Flow
1. Start a session
2. Ask a question with retrieval
3. Get answer
4. End session

### Demo 2: Direct LLM
- Direct LLM API calls
- Summarization
- Escalation analysis

### Demo 3: Action Integration
- List available actions
- Execute actions (Slack, GitHub, Calendar)

### Demo 4: Webhook Verification
- Slack URL verification
- GitHub webhook handling
- Calendar webhook handling

### Demo 5: API Documentation
- Verify docs are accessible
- Check OpenAPI spec

## Manual Endpoint Testing

### Health Check
```bash
curl http://localhost:2198/health
curl http://localhost:2198/health/full
```

### Answer Endpoint
```bash
curl -X POST http://localhost:2198/api/v1/answer \
  -H "Content-Type: application/json" \
  -d '{"question":"What is Sutradhar?","sessionId":"test-session"}'
```

### LLM Endpoint
```bash
curl -X POST http://localhost:2198/api/v1/llm/answer \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Explain AI assistants","model":"gpt-4o-mini"}'
```

### GitHub Actions
```bash
# Create issue
curl -X POST http://localhost:2198/api/v1/github/issues \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Issue","body":"Test body"}'

# List issues
curl http://localhost:2198/api/v1/github/repos/owner/repo/issues
```

### Slack Actions
```bash
# Post message
curl -X POST http://localhost:2198/api/v1/slack/messages \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello from API"}'

# List channels
curl http://localhost:2198/api/v1/slack/channels
```

### Calendar Actions
```bash
# Create event
curl -X POST http://localhost:2198/api/v1/calendar/events \
  -H "Content-Type: application/json" \
  -d '{"title":"Meeting","start":"2024-12-31T10:00:00Z","end":"2024-12-31T11:00:00Z"}'

# List calendars
curl http://localhost:2198/api/v1/calendar/calendars
```

### Webhooks
```bash
# Slack webhook verification
curl -X POST http://localhost:2198/api/v1/webhooks/slack \
  -H "Content-Type: application/json" \
  -d '{"type":"url_verification","challenge":"test123"}'

# GitHub webhook
curl -X POST http://localhost:2198/api/v1/webhooks/github \
  -H "X-GitHub-Event: issue_comment" \
  -H "Content-Type: application/json" \
  -d '{"action":"created","issue":{"number":123}}'
```

## Troubleshooting

### Server Not Starting
1. Check port availability: `lsof -i:2198`
2. Check environment variables: `cat .env`
3. Check for errors: Look at console output

### Endpoints Returning Errors
1. Check server logs for detailed errors
2. Verify environment variables are set
3. Check if services are configured (API keys, etc.)
4. Use `/health/full` for detailed status

### Health Check Failing
1. Ensure server is running: `curl http://localhost:2198/health`
2. Check BASE_URL matches server port
3. Review error messages in health check output
4. Verify all required services are configured

## Test Results Interpretation

### Health Check Results
- ✅ **Green checkmarks**: Endpoint working correctly
- ✗ **Red X marks**: Endpoint failed or returned unexpected response
- [INFO]: Informational messages about skipped tests

### Demo Path Results
- Each demo path should complete without errors
- Check individual step outputs for issues
- Review session IDs and response data

### API Test Results
- Tests show pass/fail for each endpoint
- Summary shows total tests and pass/fail counts
- Review individual test outputs for detailed errors

## Integration with CI/CD

### GitHub Actions Example
```yaml
- name: Start server
  run: |
    cd apps/worker
    npm run dev &
    sleep 10
    
- name: Run health checks
  run: |
    cd apps/worker
    npm run health
    
- name: Run demo paths
  run: |
    cd apps/worker
    npm run demo
```

## Next Steps

1. **Set up monitoring**: Add health checks to monitoring system
2. **Create alerts**: Alert on health check failures
3. **Automate testing**: Include in deployment pipeline
4. **Add metrics**: Track endpoint health over time

