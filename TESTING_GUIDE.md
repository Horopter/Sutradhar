# Comprehensive Testing Guide for Unified API

This guide covers testing the unified API system designed for multi-agent communication and CRUD operations.

## Test Suites

### 1. Comprehensive Unified API Test (`test:unified`)

Tests all unified API endpoints with proper session isolation:

```bash
npm run test:unified
```

**What it tests:**
- System health and capabilities
- Multi-agent session management (3 agents: alpha, beta, gamma)
- Session isolation verification
- Concurrent conversations and messages
- Knowledge management (document/image search and indexing)
- Communication services (email, Slack)
- Collaboration (GitHub issues CRUD)
- Scheduling (Calendar events CRUD)
- Media services (voice tokens)
- Session cleanup

**Key Features:**
- Creates separate sessions for each agent
- Verifies sessions are isolated (no cross-contamination)
- Tests full CRUD operations for all resource types
- Handles missing configurations gracefully

### 2. Concurrent Multi-Agent Stress Test (`test:concurrent`)

Tests system under concurrent load from multiple agents:

```bash
npm run test:concurrent
```

**Environment Variables:**
- `NUM_AGENTS` - Number of concurrent agents (default: 5)
- `REQUESTS_PER_AGENT` - Messages per agent (default: 3)

**What it tests:**
- Concurrent session creation
- Concurrent message sending
- Session isolation under load
- System performance and stability

**Example:**
```bash
NUM_AGENTS=10 REQUESTS_PER_AGENT=5 npm run test:concurrent
```

### 3. Run All Tests (`test:all`)

Runs both comprehensive and concurrent tests:

```bash
npm run test:all
```

## Test Architecture for Multi-Agent Systems

### Session Isolation

Each agent receives its own session ID, ensuring:
- No message leakage between agents
- Independent conversation histories
- Proper resource ownership

### CRUD Operations Testing

All CRUD operations are tested:
- **Create**: Sessions, messages, issues, events
- **Read**: Conversations, messages, issues, events
- **Update**: Issues, events
- **Delete**: Events (issues are closed, not deleted)

### Scalability Considerations

The system is designed to handle:
- Multiple concurrent agents
- Independent session management
- Resource isolation
- Proper error handling and recovery

## Environment Variables

Some tests require configuration:

- `GITHUB_REPO_SLUG` - For GitHub issue tests (format: `owner/repo`)
- `GOOGLE_CALENDAR_ID` - For calendar event tests (default: `primary`)
- `MOSS_PROJECT_ID` / `MOSS_PROJECT_KEY` - For image search tests
- `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` - For voice token tests

## Expected Behavior

### Success Criteria

1. **Session Management**
   - Each agent can create/end its own session
   - Sessions are isolated (agent A cannot access agent B's messages)
   - Sessions can be retrieved by session ID

2. **Message Exchange**
   - Each agent can send messages in its session
   - Messages are recorded in the correct session
   - AI responses are generated and stored

3. **CRUD Operations**
   - Create operations return resource IDs
   - Read operations return correct data
   - Update operations modify resources correctly
   - Delete operations remove resources

4. **Concurrent Operations**
   - Multiple agents can operate simultaneously
   - No race conditions or data corruption
   - Proper error handling under load

## Troubleshooting

### Server Not Running
```bash
# Start the server first
npm run dev

# In another terminal, run tests
npm run test:unified
```

### Rate Limiting Issues
Tests include `X-Internal-Test: true` header to bypass rate limits during testing.

### Missing Configuration
If external services (GitHub, Calendar, etc.) are not configured, those specific tests will be skipped gracefully.

## Manual Testing

### Test a Single Agent

```bash
# Create session
curl -X POST http://localhost:4001/api/unified/conversations/start \
  -H "Content-Type: application/json" \
  -H "X-Internal-Test: true" \
  -d '{
    "channelType": "web",
    "persona": "assistant",
    "userName": "test-agent"
  }'

# Send message (use sessionId from above)
curl -X POST http://localhost:4001/api/unified/conversations/{sessionId}/messages \
  -H "Content-Type: application/json" \
  -H "X-Internal-Test: true" \
  -d '{
    "sessionId": "{sessionId}",
    "from": {"id": "test-agent", "name": "test-agent", "type": "user"},
    "text": "Hello, what is AI?",
    "persona": "assistant"
  }'
```

## Test Results Interpretation

- **✓ PASS**: Test passed successfully
- **✗ FAIL**: Test failed - check error message
- **Skipped**: Test skipped due to missing configuration (expected behavior)

## Best Practices for Agent Communication

1. **Always create a session first** before sending messages
2. **Use unique session IDs** for each agent/conversation
3. **End sessions** when conversation is complete
4. **Handle errors gracefully** - retry logic recommended
5. **Respect rate limits** in production (use appropriate headers in test)

## Next Steps

After running tests:
1. Review any failed tests
2. Check server logs for errors
3. Verify external service configurations if needed
4. Run concurrent tests to verify scalability
5. Monitor resource usage during concurrent operations

