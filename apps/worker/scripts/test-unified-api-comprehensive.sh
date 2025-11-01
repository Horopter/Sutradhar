#!/bin/bash

# Comprehensive Multi-Agent Unified API Test Suite
# Tests all endpoints with proper session isolation and concurrent operations

set -euo pipefail

# Verify server is running
if ! curl -sS "${BASE_URL:-http://localhost:4001}/api/unified/system/status" > /dev/null 2>&1; then
    echo "✗ Server is not running. Please start with: npm run dev"
    exit 1
fi

BASE_URL="${BASE_URL:-http://localhost:4001}"
RL_BYPASS="${RL_BYPASS:-true}"
CURL_HEADERS=(-H "Content-Type: application/json")
if [ "$RL_BYPASS" = "true" ]; then
    CURL_HEADERS+=(-H "X-Internal-Test: true")
fi

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

PASSED=0
FAILED=0
TOTAL=0

# Test results tracking
declare -A TEST_RESULTS
declare -A AGENT_SESSIONS

# Helper functions
log_test() {
    echo -e "${CYAN}[TEST]${NC} $1"
    TOTAL=$((TOTAL + 1))
}

log_pass() {
    echo -e "${GREEN}✓ PASS${NC} $1"
    PASSED=$((PASSED + 1))
    TEST_RESULTS["$1"]="PASS"
}

log_fail() {
    echo -e "${RED}✗ FAIL${NC} $1"
    FAILED=$((FAILED + 1))
    TEST_RESULTS["$1"]="FAIL"
    echo "   Error: $2"
}

check_endpoint() {
    local method=$1
    local path=$2
    local data=$3
    local expected_status=$4
    local test_name=$5
    
    log_test "$test_name"
    
    local cmd="curl -sS -w '\nHTTP_CODE:%{http_code}' -X ${method} '${BASE_URL}${path}' ${CURL_HEADERS[*]}"
    if [ -n "$data" ]; then
        cmd="${cmd} -d '${data}'"
    fi
    
    local response=$(eval $cmd 2>&1 || echo "CURL_ERROR")
    if [ "$response" = "CURL_ERROR" ]; then
        log_fail "$test_name" "curl command failed"
        return 1
    fi
    
    local body=$(echo "$response" | sed '$d' | sed '/^HTTP_CODE:/d')
    local status=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    
    if [ "$status" = "$expected_status" ]; then
        log_pass "$test_name"
        echo "$body"
        return 0
    else
        log_fail "$test_name" "Expected status $expected_status, got $status. Response: $body"
        return 1
    fi
}

# Extract JSON field
extract_json() {
    local json=$1
    local field=$2
    echo "$json" | jq -r ".${field}" 2>/dev/null || echo ""
}

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Comprehensive Multi-Agent Unified API Test Suite       ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================================
# PHASE 1: System Health & Capabilities
# ============================================================================
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}PHASE 1: System Health & Capabilities${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

HEALTH_RESPONSE=$(check_endpoint "GET" "/api/unified/system/health" "" "200" "System Health Check")
SYSTEM_STATUS=$(check_endpoint "GET" "/api/unified/system/status" "" "200" "System Status")

CAPABILITIES_RESPONSE=$(check_endpoint "GET" "/api/v1/system/capabilities" "" "200" "System Capabilities Check")
echo "$CAPABILITIES_RESPONSE" | jq .

# ============================================================================
# PHASE 2: Multi-Agent Session Management
# ============================================================================
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}PHASE 2: Multi-Agent Session Management${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Create sessions for 3 different agents
AGENTS=("agent-alpha" "agent-beta" "agent-gamma")
for agent in "${AGENTS[@]}"; do
    SESSION_PAYLOAD=$(cat <<EOF
{
  "channelType": "web",
  "channelId": "channel-${agent}",
  "channelName": "Channel for ${agent}",
  "persona": "assistant",
  "userName": "${agent}"
}
EOF
)
    
    SESSION_RESPONSE=$(check_endpoint "POST" "/api/unified/conversations/start" "$SESSION_PAYLOAD" "201" "Create session for ${agent}")
    SESSION_ID=$(extract_json "$SESSION_RESPONSE" "conversation.sessionId")
    
    if [ -n "$SESSION_ID" ] && [ "$SESSION_ID" != "null" ]; then
        AGENT_SESSIONS["$agent"]="$SESSION_ID"
        log_pass "Session created for ${agent}: ${SESSION_ID}"
    else
        log_fail "Session creation for ${agent}" "Failed to extract session ID"
    fi
done

# Verify session isolation - get each agent's conversation
for agent in "${AGENTS[@]}"; do
    SESSION_ID="${AGENT_SESSIONS[$agent]}"
    if [ -n "$SESSION_ID" ] && [ "$SESSION_ID" != "null" ]; then
        CONV_RESPONSE=$(check_endpoint "GET" "/api/unified/conversations/${SESSION_ID}" "" "200" "Get conversation for ${agent}")
        CONV_USER=$(extract_json "$CONV_RESPONSE" "conversation.userName")
        
        if [ "$CONV_USER" = "$agent" ]; then
            log_pass "Session isolation verified for ${agent}"
        else
            log_fail "Session isolation for ${agent}" "Expected userName $agent, got $CONV_USER"
        fi
    fi
done

# ============================================================================
# PHASE 3: Concurrent Conversations & Messages
# ============================================================================
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}PHASE 3: Concurrent Conversations & Messages${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Each agent sends a message concurrently (simulated sequentially for now)
for agent in "${AGENTS[@]}"; do
    SESSION_ID="${AGENT_SESSIONS[$agent]}"
    if [ -n "$SESSION_ID" ] && [ "$SESSION_ID" != "null" ]; then
        MESSAGE_PAYLOAD=$(cat <<EOF
{
  "sessionId": "${SESSION_ID}",
  "from": {
    "id": "${agent}",
    "name": "${agent}",
    "type": "user"
  },
  "text": "Hello from ${agent}! What is artificial intelligence?",
  "persona": "assistant"
}
EOF
)
        
        MESSAGE_RESPONSE=$(check_endpoint "POST" "/api/unified/conversations/${SESSION_ID}/messages" "$MESSAGE_PAYLOAD" "201" "Send message from ${agent}")
        MESSAGE_TEXT=$(extract_json "$MESSAGE_RESPONSE" "message.text")
        
        if [ -n "$MESSAGE_TEXT" ] && [ "$MESSAGE_TEXT" != "null" ]; then
            log_pass "Message sent and response received for ${agent}"
        else
            log_fail "Message exchange for ${agent}" "No response text received"
        fi
        
        # Verify message history for this session
        sleep 1
        MESSAGES_RESPONSE=$(check_endpoint "GET" "/api/unified/conversations/${SESSION_ID}/messages" "" "200" "Get message history for ${agent}")
        MESSAGE_COUNT=$(extract_json "$MESSAGES_RESPONSE" "count")
        
        if [ -n "$MESSAGE_COUNT" ] && [ "$MESSAGE_COUNT" -gt 0 ]; then
            log_pass "Message history retrieved for ${agent} (${MESSAGE_COUNT} messages)"
        else
            log_fail "Message history for ${agent}" "Expected messages, got count: $MESSAGE_COUNT"
        fi
    fi
done

# ============================================================================
# PHASE 4: Knowledge Management (Document & Image Search)
# ============================================================================
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}PHASE 4: Knowledge Management${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test document search
DOC_SEARCH_PAYLOAD='{
  "query": "artificial intelligence",
  "maxResults": 5,
  "sessionId": "test-session"
}'
DOC_SEARCH_RESPONSE=$(check_endpoint "POST" "/api/unified/knowledge/documents/search" "$DOC_SEARCH_PAYLOAD" "200" "Document Search")

# Test document indexing
DOC_INDEX_PAYLOAD='{
  "content": [
    {
      "id": "doc-1",
      "text": "This is a test document about machine learning and neural networks.",
      "source": "test",
      "url": "https://example.com/doc1",
      "metadata": {
        "topic": "ML",
        "author": "Test Agent"
      }
    },
    {
      "id": "doc-2",
      "text": "Another document discussing deep learning architectures and transformers.",
      "source": "test",
      "url": "https://example.com/doc2",
      "metadata": {
        "topic": "DL",
        "author": "Test Agent"
      }
    }
  ]
}'
DOC_INDEX_RESPONSE=$(check_endpoint "POST" "/api/unified/knowledge/documents/index" "$DOC_INDEX_PAYLOAD" "200" "Document Indexing")

# Test image search availability
IMAGE_AVAIL_RESPONSE=$(check_endpoint "GET" "/api/unified/media/images/available" "" "200" "Image Search Availability")
IMAGE_AVAIL=$(extract_json "$IMAGE_AVAIL_RESPONSE" "available")

if [ "$IMAGE_AVAIL" = "true" ]; then
    # Test image indexing
    IMAGE_INDEX_PAYLOAD='{
      "images": [
        {
          "id": "img-1",
          "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Mount_Hood_from_Mirror_Lake.jpg/1280px-Mount_Hood_from_Mirror_Lake.jpg",
          "metadata": {
            "title": "Mountain Landscape",
            "description": "Beautiful mountain with lake",
            "tags": ["mountain", "lake", "nature"]
          }
        }
      ]
    }'
    IMAGE_INDEX_RESPONSE=$(check_endpoint "POST" "/api/unified/knowledge/images/index" "$IMAGE_INDEX_PAYLOAD" "200" "Image Indexing")
    
    # Test image search
    IMAGE_SEARCH_PAYLOAD='{
      "query": "mountain landscape",
      "maxResults": 5
    }'
    IMAGE_SEARCH_RESPONSE=$(check_endpoint "POST" "/api/unified/knowledge/images/search" "$IMAGE_SEARCH_PAYLOAD" "200" "Image Search")
else
    log_pass "Image search not available (skipping image tests)"
fi

# ============================================================================
# PHASE 5: Communication (Email, Slack)
# ============================================================================
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}PHASE 5: Communication Services${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test email sending (will likely be mocked)
EMAIL_PAYLOAD='{
  "to": ["test@example.com"],
  "subject": "Test Email from Unified API",
  "body": "This is a test email sent via the unified communication service.",
  "fromAddress": "noreply@sutradhar.ai",
  "fromName": "Sutradhar Test Agent"
}'
EMAIL_RESPONSE=$(check_endpoint "POST" "/api/unified/communications/email/send" "$EMAIL_PAYLOAD" "200" "Send Email")

# Test Slack message (will likely be mocked)
SLACK_PAYLOAD='{
  "channelId": "C1234567890",
  "text": "Test message from Unified API agent"
}'
SLACK_RESPONSE=$(check_endpoint "POST" "/api/unified/communications/slack/post" "$SLACK_PAYLOAD" "200" "Post Slack Message")

# ============================================================================
# PHASE 6: Collaboration (GitHub Issues)
# ============================================================================
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}PHASE 6: Collaboration (GitHub Issues)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Create issue from agent-alpha
REPO="${GITHUB_REPO_SLUG:-owner/repo}"
if [ "$REPO" != "owner/repo" ]; then
    CREATE_ISSUE_PAYLOAD=$(cat <<EOF
{
  "title": "Test Issue from Agent Alpha",
  "description": "This issue was created by agent-alpha via the unified API",
  "repository": "${REPO}",
  "labels": []
}
EOF
)
    
    CREATE_ISSUE_RESPONSE=$(check_endpoint "POST" "/api/unified/collaboration/issues" "$CREATE_ISSUE_PAYLOAD" "201" "Create GitHub Issue from agent-alpha")
    ISSUE_ID=$(extract_json "$CREATE_ISSUE_RESPONSE" "result.taskId")
    
    if [ -n "$ISSUE_ID" ] && [ "$ISSUE_ID" != "null" ]; then
        log_pass "Issue created with ID: ${ISSUE_ID}"
        
        # Get issue
        GET_ISSUE_RESPONSE=$(check_endpoint "GET" "/api/unified/collaboration/issues/${ISSUE_ID}?repository=${REPO}" "" "200" "Get GitHub Issue")
        ISSUE_TITLE=$(extract_json "$GET_ISSUE_RESPONSE" "issue.title")
        
        if [ "$ISSUE_TITLE" = "Test Issue from Agent Alpha" ]; then
            log_pass "Issue retrieval verified"
        fi
        
        # Update issue from agent-beta
        UPDATE_ISSUE_PAYLOAD='{
          "title": "Updated Issue from Agent Beta",
          "status": "open"
        }'
        UPDATE_ISSUE_RESPONSE=$(check_endpoint "PUT" "/api/unified/collaboration/issues/${ISSUE_ID}?repository=${REPO}" "$UPDATE_ISSUE_PAYLOAD" "200" "Update GitHub Issue from agent-beta")
    else
        log_fail "GitHub Issue Creation" "Failed to create issue (may need GITHUB_REPO_SLUG env var)"
    fi
else
    log_pass "GitHub repo not configured (skipping GitHub tests)"
fi

# ============================================================================
# PHASE 7: Scheduling (Calendar Events)
# ============================================================================
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}PHASE 7: Scheduling (Calendar Events)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

CALENDAR_ID="${GOOGLE_CALENDAR_ID:-primary}"
START_TIME=$(( $(date +%s) + 3600 ))  # 1 hour from now
END_TIME=$(( START_TIME + 3600 ))      # 2 hours from now

CREATE_EVENT_PAYLOAD=$(cat <<EOF
{
  "title": "Meeting: Agent Coordination",
  "description": "Multi-agent coordination meeting",
  "calendarId": "${CALENDAR_ID}",
  "startTime": ${START_TIME}000,
  "endTime": ${END_TIME}000,
  "location": "Virtual",
  "attendees": ["agent-alpha@example.com", "agent-beta@example.com"]
}
EOF
)

CREATE_EVENT_RESPONSE=$(check_endpoint "POST" "/api/unified/scheduling/events" "$CREATE_EVENT_PAYLOAD" "201" "Create Calendar Event")
EVENT_ID=$(extract_json "$CREATE_EVENT_RESPONSE" "result.taskId")

if [ -n "$EVENT_ID" ] && [ "$EVENT_ID" != "null" ]; then
    log_pass "Calendar event created with ID: ${EVENT_ID}"
    
    # Get event
    GET_EVENT_RESPONSE=$(check_endpoint "GET" "/api/unified/scheduling/events/${EVENT_ID}?calendarId=${CALENDAR_ID}" "" "200" "Get Calendar Event")
    EVENT_TITLE=$(extract_json "$GET_EVENT_RESPONSE" "event.title")
    
    if [ "$EVENT_TITLE" = "Meeting: Agent Coordination" ]; then
        log_pass "Calendar event retrieval verified"
    fi
    
    # Update event
    UPDATE_EVENT_PAYLOAD=$(cat <<EOF
{
  "title": "Updated: Agent Coordination Meeting",
  "location": "Virtual Room 2"
}
EOF
)
    UPDATE_EVENT_RESPONSE=$(check_endpoint "PUT" "/api/unified/scheduling/events/${EVENT_ID}?calendarId=${CALENDAR_ID}" "$UPDATE_EVENT_PAYLOAD" "200" "Update Calendar Event")
    
    # Delete event
    DELETE_EVENT_RESPONSE=$(check_endpoint "DELETE" "/api/unified/scheduling/events/${EVENT_ID}?calendarId=${CALENDAR_ID}" "" "200" "Delete Calendar Event")
else
    log_fail "Calendar Event Creation" "Failed to create event (may need GOOGLE_CALENDAR_ID env var)"
fi

# ============================================================================
# PHASE 8: Media (Voice Tokens)
# ============================================================================
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}PHASE 8: Media Services${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

VOICE_AVAIL_RESPONSE=$(check_endpoint "GET" "/api/unified/media/voice/available" "" "200" "Voice Availability Check")
VOICE_AVAIL=$(extract_json "$VOICE_AVAIL_RESPONSE" "available")

if [ "$VOICE_AVAIL" = "true" ]; then
    VOICE_TOKEN_PAYLOAD='{
      "roomName": "test-room-123",
      "participantName": "agent-alpha"
    }'
    VOICE_TOKEN_RESPONSE=$(check_endpoint "POST" "/api/unified/media/voice/token" "$VOICE_TOKEN_PAYLOAD" "200" "Generate Voice Token")
    TOKEN=$(extract_json "$VOICE_TOKEN_RESPONSE" "token.token")
    
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        log_pass "Voice token generated successfully"
    else
        log_fail "Voice Token Generation" "Failed to extract token"
    fi
else
    log_pass "Voice not available (skipping voice tests)"
fi

# ============================================================================
# PHASE 9: Session Cleanup
# ============================================================================
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}PHASE 9: Session Cleanup${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

for agent in "${AGENTS[@]}"; do
    SESSION_ID="${AGENT_SESSIONS[$agent]}"
    if [ -n "$SESSION_ID" ] && [ "$SESSION_ID" != "null" ]; then
        END_SESSION_PAYLOAD="{\"sessionId\": \"${SESSION_ID}\"}"
        END_RESPONSE=$(check_endpoint "POST" "/api/unified/conversations/end" "$END_SESSION_PAYLOAD" "200" "End session for ${agent}")
    fi
done

# ============================================================================
# FINAL SUMMARY
# ============================================================================
echo -e "\n${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Test Summary                                            ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Total Tests: ${TOTAL}"
echo -e "${GREEN}Passed: ${PASSED}${NC}"
echo -e "${RED}Failed: ${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Review output above.${NC}"
    exit 1
fi

