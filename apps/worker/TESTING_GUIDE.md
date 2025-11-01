# API Testing Guide

This guide explains how to run comprehensive tests for all APIs in the Sutradhar application.

## Quick Start

```bash
# Test all APIs (happy path)
npm run test:all

# Test edge cases and validation
npm run test:edge

# Run both test suites
npm run test
```

## Test Suites

### 1. Full API Test Suite (`test-all-apis.sh`)

Tests all endpoints with valid inputs to ensure happy path functionality.

**Tests:**
- Health checks (`/health`, `/health/full`, `/convex/diag`)
- OAuth endpoints (`/auth/*/login`, `/auth/*/callback`)
- Email (`/agentmail/send`)
- Retrieval (`/retrieval/indexSeed`)
- Answer (`/api/answer`)
- LLM (`/llm/answer`, `/llm/summarize`, `/llm/escalate`)
- Actions (`/actions/slack`, `/actions/calendar`, `/actions/github`, `/forum/post`, `/actions/list`)
- Diagnostics (`/diag/composio`, `/diag/agentmail`, `/diag/hyperspell`)
- Admin (`/admin/guardrails`, `/admin/guardrails/metrics`, `/admin/guardrails/persona`, `/admin/toggle`)
- Voice (`/voice/token`, `/voice`)
- Webhooks (`/dev/replay-webhook`)
- Convex operations (if CONVEX_URL is set)
- Rate limiting headers
- Request ID tracking

**Expected Output:**
- Test results with pass/fail indicators
- Summary with total tests, passed, and failed counts
- Exit code 0 if all tests pass, 1 if any fail

### 2. Edge Cases & Validation Test Suite (`test-edge-cases.sh`)

Tests error handling, validation, and edge cases.

**Tests:**
- Validation errors (missing fields, empty strings, invalid formats)
- Rate limiting behavior
- Guardrails (content filtering)
- Timeout handling
- Malformed JSON
- Missing Content-Type headers
- Empty request bodies
- Large payloads
- Special characters
- Unicode handling
- Concurrent requests
- Request deduplication

**Expected Output:**
- Test results showing how edge cases are handled
- Validation error detection
- Summary with pass/fail counts

## Configuration

Both test suites support environment variables:

```bash
# Set base URL (default: http://localhost:4001)
export BASE_URL=http://localhost:4001

# Set Convex URL (optional, for Convex integration tests)
export CONVEX_URL=http://localhost:3210

# Run tests
npm run test:all
```

## Prerequisites

1. **Server Running**: The worker server must be running
   ```bash
   npm run dev
   # or
   npm start
   ```

2. **Dependencies**: `curl` and `jq` must be installed
   ```bash
   # macOS
   brew install curl jq
   
   # Ubuntu/Debian
   sudo apt-get install curl jq
   ```

3. **Optional**: Convex dev server (for Convex integration tests)
   ```bash
   cd apps/convex
   npm run dev
   ```

## Test Coverage

### Endpoints Tested

#### Health & Diagnostics
- ✅ `GET /health`
- ✅ `GET /health/full`
- ✅ `GET /convex/diag`
- ✅ `GET /diag/composio`
- ✅ `GET /diag/agentmail`
- ✅ `GET /diag/hyperspell`

#### Authentication
- ✅ `POST /auth/github/login`
- ✅ `POST /auth/slack/login`
- ✅ `POST /auth/google/login`
- ✅ `GET /auth/github/callback`
- ✅ `GET /auth/slack/callback`
- ✅ `GET /auth/google/callback`

#### Email
- ✅ `POST /agentmail/send`

#### Retrieval
- ✅ `POST /retrieval/indexSeed`

#### Answer
- ✅ `POST /api/answer`

#### LLM
- ✅ `POST /llm/answer`
- ✅ `POST /llm/summarize`
- ✅ `POST /llm/escalate`

#### Actions
- ✅ `POST /actions/slack`
- ✅ `POST /actions/calendar`
- ✅ `POST /actions/github`
- ✅ `POST /forum/post`
- ✅ `GET /actions/list`

#### Admin
- ✅ `GET /admin/guardrails`
- ✅ `GET /admin/guardrails/metrics`
- ✅ `POST /admin/guardrails/persona`
- ✅ `POST /admin/toggle`

#### Voice
- ✅ `GET /voice/token`
- ✅ `GET /voice`

#### Webhooks
- ✅ `POST /dev/replay-webhook`

#### Convex (if configured)
- ✅ `POST /api/mutation` (sessions:start)
- ✅ `POST /api/mutation` (messages:append)
- ✅ `POST /api/query` (messages:list)

## Running Individual Tests

You can also run individual curl scripts for specific endpoints:

```bash
# Health check
npm run health

# Send email
npm run send:test

# LLM answer
npm run llm:answer

# Actions
npm run act:slack
npm run act:cal
npm run act:gh

# See all scripts in package.json
```

## Understanding Test Results

### Success Indicators
- ✅ Green checkmark: Test passed
- Blue [INFO]: Informational message
- Test summary showing passed/failed counts

### Common Issues

#### Tests Fail with Connection Errors
- **Issue**: Cannot connect to server
- **Solution**: Ensure server is running on the correct port (default: 4001)

#### Convex Tests Skipped
- **Issue**: `CONVEX_URL` not set
- **Solution**: Set `CONVEX_URL` environment variable if you want to test Convex integration

#### Validation Tests Fail
- **Issue**: Server accepts invalid input
- **Solution**: This may indicate a bug - check server validation logic

#### Rate Limiting Tests Don't Trigger
- **Issue**: Rate limits not hit
- **Solution**: This is normal - rate limits may be lenient or not configured strictly

## Continuous Integration

These test scripts can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run API Tests
  run: |
    npm run dev &
    sleep 5
    npm run test
```

## Advanced Testing

### Custom Test Scenarios

You can modify the test scripts to add custom scenarios:

1. Edit `scripts/test-all-apis.sh` for additional happy path tests
2. Edit `scripts/test-edge-cases.sh` for additional edge cases

### Load Testing

For load testing, consider using tools like:
- `ab` (Apache Bench)
- `wrk`
- `k6`
- `artillery`

### Integration with Test Frameworks

While these are bash scripts for quick validation, for more comprehensive testing, consider:
- **Jest** + **Supertest** for Node.js integration tests
- **Postman** for API testing with collections
- **Newman** for running Postman collections in CI

## Troubleshooting

### Permission Denied
```bash
chmod +x scripts/test-all-apis.sh
chmod +x scripts/test-edge-cases.sh
```

### jq Not Found
```bash
# Install jq
brew install jq  # macOS
apt-get install jq  # Ubuntu
```

### curl Errors
- Check if server is running: `curl http://localhost:4001/health`
- Check firewall settings
- Verify BASE_URL is correct

## Next Steps

1. **Add More Tests**: Extend test scripts with domain-specific scenarios
2. **Performance Tests**: Add load testing for production readiness
3. **Security Tests**: Add tests for authentication, authorization, and security headers
4. **Integration Tests**: Create tests that verify end-to-end workflows

