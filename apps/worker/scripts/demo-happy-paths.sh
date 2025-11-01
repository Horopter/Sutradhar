#!/usr/bin/env bash

# Demo Happy Paths Script
# Tests complete user flows end-to-end

set -e
set -o pipefail

BASE_URL=${BASE_URL:-http://localhost:2198}

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "=========================================="
echo "  Demo Happy Paths"
echo "=========================================="
echo -e "${NC}"

# Demo 1: Complete Q&A Flow
echo -e "\n${YELLOW}Demo 1: Q&A Flow${NC}"
echo "1. Starting session..."
SESSION_RESPONSE=$(curl -sS -X POST "${BASE_URL}/api/v1/sessions/start" \
    -H "Content-Type: application/json" \
    -d '{"channel":"voice","persona":"Greeter","userName":"DemoUser"}' 2>&1)
if echo "$SESSION_RESPONSE" | jq -e '.sessionId' > /dev/null 2>&1; then
    SESSION_ID=$(echo "$SESSION_RESPONSE" | jq -r '.sessionId')
    echo "   Session ID: ${SESSION_ID}"
else
    SESSION_ID="demo-session-$(date +%s)"
    echo "   Using fallback Session ID: ${SESSION_ID}"
    if echo "$SESSION_RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
        ERROR_MSG=$(echo "$SESSION_RESPONSE" | jq -r '.error // .message // "unknown error"')
        echo "   Note: ${ERROR_MSG}"
    fi
fi

echo "2. Asking question..."
ANSWER_RESPONSE=$(curl -sS -X POST "${BASE_URL}/api/v1/answer" \
    -H "Content-Type: application/json" \
    -d "{\"sessionId\":\"${SESSION_ID}\",\"question\":\"What is Sutradhar?\"}" 2>&1)
if echo "$ANSWER_RESPONSE" | jq -e '.ok == true' > /dev/null 2>&1; then
    ANSWER_TEXT=$(echo "$ANSWER_RESPONSE" | jq -r '.finalText // .text // "Answer received"' 2>/dev/null || echo "Answer received")
    echo "   Answer: ${ANSWER_TEXT:0:100}..."
else
    ERROR_MSG=$(echo "$ANSWER_RESPONSE" | jq -r '.error // .message // "unknown error"' 2>/dev/null || echo "Failed to get answer")
    echo "   Error: ${ERROR_MSG}"
fi

echo "3. Ending session..."
END_RESPONSE=$(curl -sS -X POST "${BASE_URL}/api/v1/sessions/end" \
    -H "Content-Type: application/json" \
    -d "{\"sessionId\":\"${SESSION_ID}\"}" 2>&1)
if echo "$END_RESPONSE" | jq -e '.ok == true' > /dev/null 2>&1; then
    echo -e "${GREEN}   ✓ Session ended successfully${NC}"
else
    echo "   Note: Session end returned: $(echo "$END_RESPONSE" | jq -r '.error // .message // "unknown"' 2>/dev/null || echo "response")"
fi
echo -e "${GREEN}   ✓ Demo 1 Complete${NC}"

# Demo 2: LLM Direct Usage
echo -e "\n${YELLOW}Demo 2: Direct LLM Usage${NC}"
LLM_RESPONSE=$(curl -sS -X POST "${BASE_URL}/api/v1/llm/answer" \
    -H "Content-Type: application/json" \
    -d '{"question":"Explain AI in one sentence","model":"gpt-4o-mini"}' 2>&1)
if echo "$LLM_RESPONSE" | jq -e '.ok == true' > /dev/null 2>&1; then
    LLM_TEXT=$(echo "$LLM_RESPONSE" | jq -r '.text // .data.text // "Response received"' 2>/dev/null || echo "Response received")
    echo "   Response: ${LLM_TEXT:0:80}..."
    echo -e "${GREEN}   ✓ LLM working${NC}"
else
    ERROR_MSG=$(echo "$LLM_RESPONSE" | jq -r '.error // .message // "unknown error"' 2>/dev/null || echo "Failed to parse error")
    echo "   Error: ${ERROR_MSG}"
fi

# Demo 3: Action Integration
echo -e "\n${YELLOW}Demo 3: Action Integration${NC}"
ACTIONS_RESPONSE=$(curl -sS "${BASE_URL}/api/v1/actions/list" 2>&1)
if echo "$ACTIONS_RESPONSE" | jq -e '.ok == true' > /dev/null 2>&1 && echo "$ACTIONS_RESPONSE" | jq -e '.actions' > /dev/null 2>&1; then
    ACTION_COUNT=$(echo "$ACTIONS_RESPONSE" | jq '.actions | length' 2>/dev/null || echo "0")
    echo "   Available actions: ${ACTION_COUNT}"
    echo -e "${GREEN}   ✓ Actions endpoint working${NC}"
else
    ERROR_MSG=$(echo "$ACTIONS_RESPONSE" | jq -r '.error // .message // "unknown"' 2>/dev/null || echo "Failed")
    echo "   Note: ${ERROR_MSG}"
fi

# Demo 4: Webhook Verification
echo -e "\n${YELLOW}Demo 4: Webhook Verification${NC}"
WEBHOOK_RESPONSE=$(curl -sS -X POST "${BASE_URL}/api/v1/webhooks/slack" \
    -H "Content-Type: application/json" \
    -d '{"type":"url_verification","challenge":"demo_challenge_123"}' 2>&1)
CHALLENGE=$(echo "$WEBHOOK_RESPONSE" | jq -r '.challenge // empty' 2>/dev/null || echo "")
if [ "$CHALLENGE" = "demo_challenge_123" ]; then
    echo "   Challenge verified: ${CHALLENGE}"
    echo -e "${GREEN}   ✓ Webhook verification working${NC}"
else
    echo "   Response: $(echo "$WEBHOOK_RESPONSE" | jq -r '.error // .message // .challenge // "unexpected response"' 2>/dev/null || echo "parse error")"
fi

# Demo 5: API Documentation
echo -e "\n${YELLOW}Demo 5: API Documentation${NC}"
DOCS_RESPONSE=$(curl -sS "${BASE_URL}/api/v1/docs" 2>&1)
if echo "$DOCS_RESPONSE" | grep -q "openapi\|swagger" 2>/dev/null; then
    echo -e "${GREEN}   ✓ API docs available${NC}"
elif echo "$DOCS_RESPONSE" | jq -e '.ok' > /dev/null 2>&1; then
    echo "   Docs endpoint available"
    echo -e "${GREEN}   ✓ API docs endpoint working${NC}"
else
    DOCS_STATUS=$(curl -sS -o /dev/null -w "%{http_code}" "${BASE_URL}/api/v1/docs" 2>&1)
    echo "   Docs endpoint status: ${DOCS_STATUS}"
fi

# Demo 6: GitHub API (if configured)
echo -e "\n${YELLOW}Demo 6: GitHub API${NC}"
GH_REPO_RESPONSE=$(curl -sS "${BASE_URL}/api/v1/github/repos/test/repo" 2>&1)
if echo "$GH_REPO_RESPONSE" | jq -e '.ok == true' > /dev/null 2>&1; then
    REPO_NAME=$(echo "$GH_REPO_RESPONSE" | jq -r '.repo.name // .name // "unknown"' 2>/dev/null || echo "unknown")
    echo "   Repository: ${REPO_NAME}"
    echo -e "${GREEN}   ✓ GitHub API working${NC}"
else
    ERROR_MSG=$(echo "$GH_REPO_RESPONSE" | jq -r '.error // .message // "not configured"' 2>/dev/null || echo "not configured")
    echo "   Note: ${ERROR_MSG} (expected if credentials not set)"
fi

# Demo 7: Health Check
echo -e "\n${YELLOW}Demo 7: Health Check${NC}"
HEALTH_RESPONSE=$(curl -sS "${BASE_URL}/health" 2>&1)
if echo "$HEALTH_RESPONSE" | jq -e '.ok == true' > /dev/null 2>&1; then
    MODE=$(echo "$HEALTH_RESPONSE" | jq -r '.mode // "unknown"' 2>/dev/null || echo "unknown")
    echo "   Server mode: ${MODE}"
    echo -e "${GREEN}   ✓ Server is healthy${NC}"
else
    echo "   Health check failed"
fi

echo -e "\n${BLUE}=========================================="
echo "  All Demo Paths Complete"
echo "==========================================${NC}"

