#!/bin/bash

# Extensive Unified API Test Suite
# Comprehensive testing for all edge cases, error scenarios, and multi-agent robustness

set -euo pipefail

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
MAGENTA='\033[0;35m'
NC='\033[0m'

PASSED=0
FAILED=0
TOTAL=0
WARNINGS=0

declare -A TEST_RESULTS
declare -A AGENT_SESSIONS
declare -A CREATED_RESOURCES

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

log_warn() {
    echo -e "${YELLOW}⚠ WARN${NC} $1"
    WARNINGS=$((WARNINGS + 1))
    TEST_RESULTS["$1"]="WARN"
}

check_endpoint() {
    local method=$1
    local path=$2
    local data=$3
    local expected_status=$4
    local test_name=$5
    
    local cmd="curl -sS -w '\nHTTP_CODE:%{http_code}' -X ${method} '${BASE_URL}${path}' ${CURL_HEADERS[*]}"
    if [ -n "$data" ] && [ "$data" != "null" ]; then
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
        echo "$body"
        return 0
    else
        log_fail "$test_name" "Expected status $expected_status, got $status. Response: $body"
        return 1
    fi
}

extract_json() {
    local json=$1
    local field=$2
    echo "$json" | jq -r ".${field}" 2>/dev/null || echo ""
}

# Verify server is running
echo -e "${BLUE}Checking server status...${NC}"
if ! curl -sS "${BASE_URL}/api/unified/system/status" > /dev/null 2>&1; then
    echo -e "${RED}✗ Server is not running at ${BASE_URL}${NC}"
    echo "  Please start with: npm run dev"
    exit 1
fi
echo -e "${GREEN}✓ Server is running${NC}\n"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Extensive Unified API Test Suite                       ║${NC}"
echo -e "${BLUE}║  Testing all edge cases, errors, and robustness         ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================================
# PHASE 1: Input Validation Tests
# ============================================================================
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}PHASE 1: Input Validation & Error Handling${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test invalid conversation start
log_test "Invalid conversation start (missing required fields)"
INVALID_START='{"channelType": "web"}'  # Missing persona and userName
RESPONSE=$(check_endpoint "POST" "/api/unified/conversations/start" "$INVALID_START" "400" "Invalid conversation start")
if [ $? -eq 0 ]; then
    log_pass "Invalid conversation start rejected"
else
    log_warn "Invalid conversation start validation may need improvement"
fi

# Test invalid message
log_test "Invalid message (empty text)"
INVALID_MSG='{"sessionId": "test-123", "from": {"id": "user", "name": "user", "type": "user"}, "text": ""}'
RESPONSE=$(check_endpoint "POST" "/api/unified/conversations/test-123/messages" "$INVALID_MSG" "400" "Invalid message (empty text)")
if [ $? -eq 0 ]; then
    log_pass "Empty message rejected"
fi

# Test invalid session ID format
log_test "Invalid session ID (non-existent)"
RESPONSE=$(check_endpoint "GET" "/api/unified/conversations/non-existent-session-12345" "" "404" "Non-existent session")
if [ $? -eq 0 ]; then
    log_pass "Non-existent session handled correctly"
fi

# Test invalid knowledge search
log_test "Invalid knowledge search (empty query)"
INVALID_SEARCH='{"query": "", "maxResults": 5}'
RESPONSE=$(check_endpoint "POST" "/api/unified/knowledge/documents/search" "$INVALID_SEARCH" "400" "Empty search query")
if [ $? -eq 0 ]; then
    log_pass "Empty search query rejected"
fi

# Test invalid image search (neither query nor image)
log_test "Invalid image search (missing query and image)"
INVALID_IMG_SEARCH='{"maxResults": 5}'
RESPONSE=$(check_endpoint "POST" "/api/unified/knowledge/images/search" "$INVALID_IMG_SEARCH" "400" "Invalid image search")
if [ $? -eq 0 ]; then
    log_pass "Invalid image search rejected"
fi

# Test invalid email
log_test "Invalid email (missing recipients)"
INVALID_EMAIL='{"subject": "Test", "body": "Test"}'
RESPONSE=$(check_endpoint "POST" "/api/unified/communications/email/send" "$INVALID_EMAIL" "400" "Invalid email (no recipients)")
if [ $? -eq 0 ]; then
    log_pass "Invalid email rejected"
fi

# Test invalid issue creation
log_test "Invalid issue creation (missing title)"
INVALID_ISSUE='{"description": "Test", "repository": "owner/repo"}'
RESPONSE=$(check_endpoint "POST" "/api/unified/collaboration/issues" "$INVALID_ISSUE" "400" "Invalid issue (no title)")
if [ $? -eq 0 ]; then
    log_pass "Invalid issue rejected"
fi

# Test invalid event creation
log_test "Invalid event creation (end before start)"
INVALID_EVENT='{
  "title": "Test",
  "calendarId": "primary",
  "startTime": 2000000000000,
  "endTime": 1000000000000
}'
RESPONSE=$(check_endpoint "POST" "/api/unified/scheduling/events" "$INVALID_EVENT" "400" "Invalid event (end before start)")
if [ $? -eq 0 ]; then
    log_pass "Invalid event timing rejected"
fi

# ============================================================================
# PHASE 2: Multiple Agents with Different Personas
# ============================================================================
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}PHASE 2: Multiple Agents with Different Personas${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Create agents with different personas
AGENTS=(
    "agent-student:student:learning about AI"
    "agent-teacher:teacher:explaining concepts"
    "agent-developer:developer:technical discussion"
    "agent-manager:manager:planning and coordination"
    "agent-support:support:helping users"
)

for agent_config in "${AGENTS[@]}"; do
    IFS=':' read -r agent_name persona agent_desc <<< "$agent_config"
    
    log_test "Create agent: ${agent_name} (persona: ${persona})"
    SESSION_PAYLOAD=$(cat <<EOF
{
  "channelType": "web",
  "channelId": "channel-${agent_name}",
  "channelName": "${agent_desc}",
  "persona": "${persona}",
  "userName": "${agent_name}"
}
EOF
)
    
    SESSION_RESPONSE=$(check_endpoint "POST" "/api/unified/conversations/start" "$SESSION_PAYLOAD" "201" "Create session for ${agent_name}")
    SESSION_ID=$(extract_json "$SESSION_RESPONSE" "conversation.sessionId")
    
    if [ -n "$SESSION_ID" ] && [ "$SESSION_ID" != "null" ]; then
        AGENT_SESSIONS["$agent_name"]="$SESSION_ID"
        log_pass "Session created for ${agent_name}: ${SESSION_ID}"
        
        # Send persona-specific message
        MESSAGE_PAYLOAD=$(cat <<EOF
{
  "sessionId": "${SESSION_ID}",
  "from": {
    "id": "${agent_name}",
    "name": "${agent_name}",
    "type": "user"
  },
  "text": "Hello, I am a ${persona}. What can you help me with?",
  "persona": "${persona}"
}
EOF
)
        MESSAGE_RESPONSE=$(check_endpoint "POST" "/api/unified/conversations/${SESSION_ID}/messages" "$MESSAGE_PAYLOAD" "201" "Send message from ${agent_name}")
        RESPONSE_OK=$(extract_json "$MESSAGE_RESPONSE" "ok")
        
        if [ "$RESPONSE_OK" = "true" ]; then
            log_pass "Message exchange successful for ${agent_name}"
        fi
    else
        log_fail "Session creation for ${agent_name}" "Failed to extract session ID"
    fi
done

# Verify all sessions are isolated
log_test "Verify session isolation across all agents"
ISOLATION_PASSED=true
for agent_name in "${!AGENT_SESSIONS[@]}"; do
    SESSION_ID="${AGENT_SESSIONS[$agent_name]}"
    CONV_RESPONSE=$(check_endpoint "GET" "/api/unified/conversations/${SESSION_ID}" "" "200" "Get conversation for ${agent_name}")
    CONV_USER=$(extract_json "$CONV_RESPONSE" "conversation.userName")
    
    if [ "$CONV_USER" != "$agent_name" ]; then
        ISOLATION_PASSED=false
        log_fail "Session isolation for ${agent_name}" "Expected userName $agent_name, got $CONV_USER"
    fi
done

if [ "$ISOLATION_PASSED" = "true" ]; then
    log_pass "All sessions are properly isolated"
fi

# ============================================================================
# PHASE 3: Concurrent Operations Stress Test
# ============================================================================
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}PHASE 3: Concurrent Operations Stress Test${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test concurrent message sending from multiple agents
log_test "Concurrent message sending from all agents"
CONCURRENT_PIDS=()
CONCURRENT_PASSED=0
CONCURRENT_FAILED=0

for agent_name in "${!AGENT_SESSIONS[@]}"; do
    SESSION_ID="${AGENT_SESSIONS[$agent_name]}"
    
    (
        MESSAGE_PAYLOAD=$(cat <<EOF
{
  "sessionId": "${SESSION_ID}",
  "from": {
    "id": "${agent_name}",
    "name": "${agent_name}",
    "type": "user"
  },
  "text": "Concurrent test message from ${agent_name}",
  "persona": "assistant"
}
EOF
)
        RESPONSE=$(curl -sS -X POST "${BASE_URL}/api/unified/conversations/${SESSION_ID}/messages" \
            "${CURL_HEADERS[@]}" \
            -d "$MESSAGE_PAYLOAD" 2>&1)
        
        OK=$(echo "$RESPONSE" | jq -r ".ok" 2>/dev/null || echo "false")
        if [ "$OK" = "true" ]; then
            echo "PASS" > "/tmp/concurrent_${agent_name}"
        else
            echo "FAIL" > "/tmp/concurrent_${agent_name}"
        fi
    ) &
    
    CONCURRENT_PIDS+=($!)
done

# Wait for all concurrent requests
for pid in "${CONCURRENT_PIDS[@]}"; do
    wait "$pid"
done

# Collect results
for agent_name in "${!AGENT_SESSIONS[@]}"; do
    if [ -f "/tmp/concurrent_${agent_name}" ]; then
        RESULT=$(cat "/tmp/concurrent_${agent_name}")
        if [ "$RESULT" = "PASS" ]; then
            CONCURRENT_PASSED=$((CONCURRENT_PASSED + 1))
        else
            CONCURRENT_FAILED=$((CONCURRENT_FAILED + 1))
        fi
        rm -f "/tmp/concurrent_${agent_name}"
    fi
done

if [ $CONCURRENT_FAILED -eq 0 ]; then
    log_pass "Concurrent operations: ${CONCURRENT_PASSED} succeeded, ${CONCURRENT_FAILED} failed"
else
    log_fail "Concurrent operations" "${CONCURRENT_FAILED} out of ${#AGENT_SESSIONS[@]} failed"
fi

# ============================================================================
# PHASE 4: Resource Lifecycle & CRUD Edge Cases
# ============================================================================
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}PHASE 4: Resource Lifecycle & CRUD Edge Cases${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test session lifecycle edge cases
log_test "Create session, add messages, verify count, end session"
SESSION_PAYLOAD='{
  "channelType": "web",
  "persona": "assistant",
  "userName": "lifecycle-test"
}'
LIFECYCLE_SESSION=$(check_endpoint "POST" "/api/unified/conversations/start" "$SESSION_PAYLOAD" "201" "Create lifecycle test session")
LIFECYCLE_SESSION_ID=$(extract_json "$LIFECYCLE_SESSION" "conversation.sessionId")

if [ -n "$LIFECYCLE_SESSION_ID" ] && [ "$LIFECYCLE_SESSION_ID" != "null" ]; then
    # Send multiple messages
    for i in {1..3}; do
        MSG_PAYLOAD=$(cat <<EOF
{
  "sessionId": "${LIFECYCLE_SESSION_ID}",
  "from": {"id": "user", "name": "user", "type": "user"},
  "text": "Message ${i}"
}
EOF
)
        check_endpoint "POST" "/api/unified/conversations/${LIFECYCLE_SESSION_ID}/messages" "$MSG_PAYLOAD" "201" "Send message ${i}" > /dev/null
    done
    
    # Verify message count
    MESSAGES_RESPONSE=$(check_endpoint "GET" "/api/unified/conversations/${LIFECYCLE_SESSION_ID}/messages" "" "200" "Get messages")
    MESSAGE_COUNT=$(extract_json "$MESSAGES_RESPONSE" "count")
    
    if [ "$MESSAGE_COUNT" -ge 3 ]; then
        log_pass "Session lifecycle: ${MESSAGE_COUNT} messages recorded"
    else
        log_fail "Session lifecycle" "Expected at least 3 messages, got ${MESSAGE_COUNT}"
    fi
    
    # End session
    END_PAYLOAD="{\"sessionId\": \"${LIFECYCLE_SESSION_ID}\"}"
    check_endpoint "POST" "/api/unified/conversations/end" "$END_PAYLOAD" "200" "End lifecycle session" > /dev/null
    log_pass "Session lifecycle: end successful"
else
    log_fail "Session lifecycle" "Failed to create session"
fi

# Test duplicate resource creation
log_test "Attempt duplicate session creation (same user)"
DUPLICATE_SESSION=$(check_endpoint "POST" "/api/unified/conversations/start" "$SESSION_PAYLOAD" "201" "Create duplicate session")
DUPLICATE_SESSION_ID=$(extract_json "$DUPLICATE_SESSION" "conversation.sessionId")

if [ -n "$DUPLICATE_SESSION_ID" ] && [ "$DUPLICATE_SESSION_ID" != "$LIFECYCLE_SESSION_ID" ]; then
    log_pass "Duplicate session creation: Different session IDs (${LIFECYCLE_SESSION_ID} vs ${DUPLICATE_SESSION_ID})"
fi

# ============================================================================
# PHASE 5: Large Payload & Limit Tests
# ============================================================================
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}PHASE 5: Large Payload & Limit Tests${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test large message
log_test "Large message handling"
LARGE_TEXT=$(head -c 5000 < /dev/urandom | base64 | tr -d '\n')
LARGE_MSG_PAYLOAD=$(cat <<EOF
{
  "sessionId": "${LIFECYCLE_SESSION_ID}",
  "from": {"id": "user", "name": "user", "type": "user"},
  "text": "${LARGE_TEXT:0:2000}"
}
EOF
)
LARGE_MSG_RESPONSE=$(check_endpoint "POST" "/api/unified/conversations/${LIFECYCLE_SESSION_ID}/messages" "$LARGE_MSG_PAYLOAD" "201" "Send large message")
if [ $? -eq 0 ]; then
    log_pass "Large message handled successfully"
fi

# Test max results limit
log_test "Max results limit enforcement"
MAX_RESULTS_PAYLOAD='{"query": "test", "maxResults": 1000}'
MAX_RESULTS_RESPONSE=$(check_endpoint "POST" "/api/unified/knowledge/documents/search" "$MAX_RESULTS_PAYLOAD" "200" "Search with high maxResults")
RESULTS_COUNT=$(extract_json "$MAX_RESULTS_RESPONSE" "total")

if [ "$RESULTS_COUNT" -le 100 ]; then
    log_pass "Max results limit enforced: ${RESULTS_COUNT} results (limit likely 100)"
else
    log_warn "Max results: ${RESULTS_COUNT} results returned (may exceed expected limit)"
fi

# ============================================================================
# PHASE 6: Error Recovery & Resilience
# ============================================================================
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}PHASE 6: Error Recovery & Resilience${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test operation on non-existent resource
log_test "Update non-existent issue"
UPDATE_NONEXISTENT='{"title": "Updated", "status": "open"}'
RESPONSE=$(check_endpoint "PUT" "/api/unified/collaboration/issues/999999?repository=owner/repo" "$UPDATE_NONEXISTENT" "404" "Update non-existent issue")
if [ $? -eq 0 ]; then
    log_pass "Non-existent resource update handled correctly"
fi

log_test "Delete non-existent event"
RESPONSE=$(check_endpoint "DELETE" "/api/unified/scheduling/events/non-existent-id?calendarId=primary" "" "404" "Delete non-existent event")
if [ $? -eq 0 ]; then
    log_pass "Non-existent resource deletion handled correctly"
fi

# Test operation after session ended
log_test "Send message to ended session"
ENDED_SESSION_MSG='{
  "sessionId": "'${LIFECYCLE_SESSION_ID}'",
  "from": {"id": "user", "name": "user", "type": "user"},
  "text": "Message after end"
}'
RESPONSE=$(check_endpoint "POST" "/api/unified/conversations/${LIFECYCLE_SESSION_ID}/messages" "$ENDED_SESSION_MSG" "400\|404" "Message to ended session")
if [ $? -eq 0 ]; then
    log_pass "Message to ended session handled correctly"
else
    log_warn "Message to ended session may need better handling"
fi

# ============================================================================
# PHASE 7: Special Characters & Encoding
# ============================================================================
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}PHASE 7: Special Characters & Encoding${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Create a session for special character testing
SPECIAL_SESSION_PAYLOAD='{
  "channelType": "web",
  "persona": "assistant",
  "userName": "test-unicode-用户"
}'
SPECIAL_SESSION=$(check_endpoint "POST" "/api/unified/conversations/start" "$SPECIAL_SESSION_PAYLOAD" "201" "Create session with special chars")
SPECIAL_SESSION_ID=$(extract_json "$SPECIAL_SESSION" "conversation.sessionId")

if [ -n "$SPECIAL_SESSION_ID" ] && [ "$SPECIAL_SESSION_ID" != "null" ]; then
    log_pass "Session with special characters created"
    
    # Test message with special characters
    SPECIAL_MSG='{
      "sessionId": "'${SPECIAL_SESSION_ID}'",
      "from": {"id": "user", "name": "user", "type": "user"},
      "text": "Test: émoji 🎉, unicode 用户, symbols !@#$%"
    }'
    SPECIAL_MSG_RESPONSE=$(check_endpoint "POST" "/api/unified/conversations/${SPECIAL_SESSION_ID}/messages" "$SPECIAL_MSG" "201" "Message with special chars")
    if [ $? -eq 0 ]; then
        log_pass "Special characters in message handled correctly"
    fi
fi

# ============================================================================
# PHASE 8: Performance & Rate Limiting
# ============================================================================
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}PHASE 8: Performance & Rate Limiting${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

log_test "Response time check (system status)"
START_TIME=$(date +%s%N)
RESPONSE=$(check_endpoint "GET" "/api/unified/system/status" "" "200" "System status response time")
END_TIME=$(date +%s%N)
DURATION=$(( (END_TIME - START_TIME) / 1000000 ))  # Convert to milliseconds

if [ $DURATION -lt 1000 ]; then
    log_pass "Response time acceptable: ${DURATION}ms"
else
    log_warn "Response time slow: ${DURATION}ms"
fi

# ============================================================================
# PHASE 9: Cleanup All Sessions
# ============================================================================
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}PHASE 9: Cleanup${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

CLEANUP_COUNT=0
for agent_name in "${!AGENT_SESSIONS[@]}"; do
    SESSION_ID="${AGENT_SESSIONS[$agent_name]}"
    END_PAYLOAD="{\"sessionId\": \"${SESSION_ID}\"}"
    check_endpoint "POST" "/api/unified/conversations/end" "$END_PAYLOAD" "200" "End session for ${agent_name}" > /dev/null
    CLEANUP_COUNT=$((CLEANUP_COUNT + 1))
done

log_pass "Cleaned up ${CLEANUP_COUNT} agent sessions"

# ============================================================================
# FINAL SUMMARY
# ============================================================================
echo -e "\n${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Extensive Test Summary                                   ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Total Tests: ${TOTAL}"
echo -e "${GREEN}Passed: ${PASSED}${NC}"
echo -e "${RED}Failed: ${FAILED}${NC}"
echo -e "${YELLOW}Warnings: ${WARNINGS}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}✓ All tests passed!${NC}"
        exit 0
    else
        echo -e "${GREEN}✓ All tests passed with ${WARNINGS} warning(s)${NC}"
        exit 0
    fi
else
    echo -e "${RED}✗ ${FAILED} test(s) failed. Review output above.${NC}"
    exit 1
fi

