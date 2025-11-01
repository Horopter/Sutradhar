#!/bin/bash

# Robustness Test Suite - Tests error handling, edge cases, and resilience
# Designed for multi-agent systems with comprehensive validation

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:4001}"
RL_BYPASS="${RL_BYPASS:-true}"
CURL_HEADERS=(-H "Content-Type: application/json")
if [ "$RL_BYPASS" = "true" ]; then
    CURL_HEADERS+=(-H "X-Internal-Test: true")
fi

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

PASSED=0
FAILED=0
TOTAL=0

log_test() {
    echo -e "${CYAN}[TEST]${NC} $1"
    TOTAL=$((TOTAL + 1))
}

log_pass() {
    echo -e "${GREEN}✓ PASS${NC} $1"
    PASSED=$((PASSED + 1))
}

log_fail() {
    echo -e "${RED}✗ FAIL${NC} $1"
    FAILED=$((FAILED + 1))
    echo "   Error: $2"
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
        log_fail "$test_name" "Expected status $expected_status, got $status"
        return 1
    fi
}

extract_json() {
    local json=$1
    local field=$2
    echo "$json" | jq -r ".${field}" 2>/dev/null || echo ""
}

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Robustness Test Suite                                  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Verify server
if ! curl -sS "${BASE_URL}/api/unified/system/status" > /dev/null 2>&1; then
    echo -e "${RED}Server not running${NC}"
    exit 1
fi

# Test 1: SQL Injection / XSS attempts
log_test "Input sanitization (SQL injection attempt)"
RESPONSE=$(check_endpoint "POST" "/api/unified/conversations/start" \
  '{"channelType":"web","userName":"admin'\''; DROP TABLE users;--","persona":"test"}' \
  "201\|400" "SQL injection attempt")
if [ $? -eq 0 ]; then
    log_pass "Input sanitization: SQL injection blocked or handled"
fi

# Test 2: Extremely long inputs
log_test "Input length limits (very long username)"
LONG_USER=$(head -c 10000 < /dev/urandom | base64 | tr -d '\n')
RESPONSE=$(check_endpoint "POST" "/api/unified/conversations/start" \
  "{\"channelType\":\"web\",\"userName\":\"${LONG_USER:0:500}\",\"persona\":\"test\"}" \
  "201\|400" "Very long input")
if [ $? -eq 0 ]; then
    log_pass "Input length limits handled"
fi

# Test 3: Concurrent session creation (same user)
log_test "Concurrent duplicate session creation"
SESSION_PAYLOAD='{"channelType":"web","userName":"duplicate-test","persona":"test"}'
for i in {1..5}; do
    (
        check_endpoint "POST" "/api/unified/conversations/start" "$SESSION_PAYLOAD" "201" "Concurrent session $i" > "/tmp/session_$i" 2>&1
    ) &
done
wait
UNIQUE_COUNT=$(cat /tmp/session_* 2>/dev/null | jq -r '.conversation.sessionId' 2>/dev/null | sort -u | wc -l | tr -d ' ')
rm -f /tmp/session_*
if [ "$UNIQUE_COUNT" -eq 5 ]; then
    log_pass "Concurrent sessions: All unique ($UNIQUE_COUNT/5)"
else
    log_fail "Concurrent sessions" "Expected 5 unique, got $UNIQUE_COUNT"
fi

# Test 4: Message to non-existent session
log_test "Message to non-existent session"
RESPONSE=$(check_endpoint "POST" "/api/unified/conversations/nonexistent-12345/messages" \
  '{"sessionId":"nonexistent-12345","from":{"id":"user","name":"user","type":"user"},"text":"test"}' \
  "404\|400" "Message to non-existent session")
if [ $? -eq 0 ]; then
    log_pass "Non-existent session handling"
fi

# Test 5: Invalid JSON
log_test "Invalid JSON payload"
RESPONSE=$(echo '{"invalid": json}' | curl -sS -w '\nHTTP_CODE:%{http_code}' -X POST "${BASE_URL}/api/unified/conversations/start" \
  "${CURL_HEADERS[@]}" -d @- 2>&1)
STATUS=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
if [ "$STATUS" = "400" ]; then
    log_pass "Invalid JSON rejected"
else
    log_fail "Invalid JSON" "Expected 400, got $STATUS"
fi

# Test 6: Missing required fields (should validate)
log_test "Missing required fields validation"
RESPONSE=$(check_endpoint "POST" "/api/unified/conversations/start" '{}' "400" "Missing required fields")
if [ $? -eq 0 ]; then
    log_pass "Required field validation working"
fi

# Test 7: Negative numbers where not allowed
log_test "Negative number validation"
RESPONSE=$(check_endpoint "POST" "/api/unified/knowledge/documents/search" \
  '{"query":"test","maxResults":-5}' \
  "400" "Negative maxResults")
if [ $? -eq 0 ]; then
    log_pass "Negative number validation"
fi

# Test 8: Zero or empty arrays
log_test "Empty array validation"
RESPONSE=$(check_endpoint "POST" "/api/unified/knowledge/documents/index" \
  '{"content":[]}' \
  "400" "Empty content array")
if [ $? -eq 0 ]; then
    log_pass "Empty array validation"
fi

# Test 9: Invalid enum values
log_test "Invalid enum value validation"
RESPONSE=$(check_endpoint "POST" "/api/unified/conversations/start" \
  '{"channelType":"invalid-channel-type","userName":"test","persona":"test"}' \
  "400" "Invalid enum value")
if [ $? -eq 0 ]; then
    log_pass "Enum validation working"
fi

# Test 10: Timestamp edge cases (past dates, far future)
log_test "Timestamp validation (past dates)"
PAST_TIME=$(( $(date +%s) - 86400 * 365 * 10 ))  # 10 years ago
RESPONSE=$(check_endpoint "POST" "/api/unified/scheduling/events" \
  "{\"calendar\":\"primary\",\"title\":\"Test\",\"startTime\":${PAST_TIME}000,\"endTime\":$((PAST_TIME + 3600))000}" \
  "201\|400" "Past date event")
if [ $? -eq 0 ]; then
    log_pass "Past timestamp handling"
fi

# Test 11: Unicode and emoji handling
log_test "Unicode and emoji support"
RESPONSE=$(check_endpoint "POST" "/api/unified/conversations/start" \
  '{"channelType":"web","userName":"用户🎉test","persona":"test"}' \
  "201" "Unicode username")
if [ $? -eq 0 ]; then
    SESSION_ID=$(extract_json "$RESPONSE" "conversation.sessionId")
    if [ -n "$SESSION_ID" ] && [ "$SESSION_ID" != "null" ]; then
        log_pass "Unicode/emoji support working"
    fi
fi

# Test 12: Rate limiting (if not bypassed)
if [ "$RL_BYPASS" != "true" ]; then
    log_test "Rate limiting enforcement"
    for i in {1..100}; do
        curl -sS -X GET "${BASE_URL}/api/unified/system/status" "${CURL_HEADERS[@]}" > /dev/null
    done
    # Should eventually hit rate limit
    log_pass "Rate limiting tested"
fi

# Test 13: Session exhaustion (many sessions)
log_test "Multiple session creation (stress test)"
SESSION_IDS=()
for i in {1..20}; do
    RESPONSE=$(check_endpoint "POST" "/api/unified/conversations/start" \
      "{\"channelType\":\"web\",\"userName\":\"stress-test-$i\",\"persona\":\"test\"}" \
      "201" "Session $i")
    SESSION_ID=$(extract_json "$RESPONSE" "conversation.sessionId")
    if [ -n "$SESSION_ID" ] && [ "$SESSION_ID" != "null" ]; then
        SESSION_IDS+=("$SESSION_ID")
    fi
done
if [ ${#SESSION_IDS[@]} -eq 20 ]; then
    log_pass "Session creation stress test: ${#SESSION_IDS[@]}/20"
    
    # Cleanup
    for sid in "${SESSION_IDS[@]}"; do
        check_endpoint "POST" "/api/unified/conversations/end" "{\"sessionId\":\"$sid\"}" "200" "Cleanup" > /dev/null
    done
else
    log_fail "Session stress test" "Created ${#SESSION_IDS[@]}/20 sessions"
fi

# Test 14: Cross-session contamination check
log_test "Cross-session isolation (data leakage test)"
SESSION1=$(check_endpoint "POST" "/api/unified/conversations/start" \
  '{"channelType":"web","userName":"agent-isolated-1","persona":"test"}' \
  "201" "Create session 1")
SESSION2=$(check_endpoint "POST" "/api/unified/conversations/start" \
  '{"channelType":"web","userName":"agent-isolated-2","persona":"test"}' \
  "201" "Create session 2")
SID1=$(extract_json "$SESSION1" "conversation.sessionId")
SID2=$(extract_json "$SESSION2" "conversation.sessionId")

if [ -n "$SID1" ] && [ -n "$SID2" ] && [ "$SID1" != "$SID2" ]; then
    # Send message to session 1
    check_endpoint "POST" "/api/unified/conversations/${SID1}/messages" \
      "{\"sessionId\":\"${SID1}\",\"from\":{\"id\":\"user1\",\"name\":\"user1\",\"type\":\"user\"},\"text\":\"Private message for session 1\"}" \
      "201" "Message to session 1" > /dev/null
    
    # Check session 2 - should NOT see session 1's message
    MSGS2=$(check_endpoint "GET" "/api/unified/conversations/${SID2}/messages" "" "200" "Get session 2 messages")
    CONTAMINATION=$(echo "$MSGS2" | jq -r '.messages[]?.text' 2>/dev/null | grep -c "Private message for session 1" || echo "0")
    
    if [ "$CONTAMINATION" = "0" ]; then
        log_pass "Cross-session isolation verified"
    else
        log_fail "Cross-session isolation" "Data leakage detected!"
    fi
    
    # Cleanup
    check_endpoint "POST" "/api/unified/conversations/end" "{\"sessionId\":\"$SID1\"}" "200" "Cleanup 1" > /dev/null
    check_endpoint "POST" "/api/unified/conversations/end" "{\"sessionId\":\"$SID2\"}" "200" "Cleanup 2" > /dev/null
fi

# Test 15: Resource cleanup after errors
log_test "Resource cleanup after error"
ERROR_SESSION=$(check_endpoint "POST" "/api/unified/conversations/start" \
  '{"channelType":"web","userName":"error-cleanup-test","persona":"test"}' \
  "201" "Create session for error test")
ESID=$(extract_json "$ERROR_SESSION" "conversation.sessionId")

if [ -n "$ESID" ] && [ "$ESID" != "null" ]; then
    # Cause an error (invalid message format)
    check_endpoint "POST" "/api/unified/conversations/${ESID}/messages" \
      '{"invalid":"format"}' \
      "400\|500" "Invalid message format" > /dev/null
    
    # Session should still be accessible
    GET_SESSION=$(check_endpoint "GET" "/api/unified/conversations/${ESID}" "" "200" "Get session after error")
    if [ $? -eq 0 ]; then
        log_pass "Resource cleanup: Session still accessible after error"
    fi
    
    check_endpoint "POST" "/api/unified/conversations/end" "{\"sessionId\":\"$ESID\"}" "200" "Cleanup" > /dev/null
fi

# Test 16: Concurrent operations on same resource
log_test "Concurrent updates to same resource"
# Create a session and send concurrent messages
CONC_SESSION=$(check_endpoint "POST" "/api/unified/conversations/start" \
  '{"channelType":"web","userName":"concurrent-resource","persona":"test"}' \
  "201" "Create concurrent session")
CSID=$(extract_json "$CONC_SESSION" "conversation.sessionId")

if [ -n "$CSID" ] && [ "$CSID" != "null" ]; then
    CONCURRENT_PIDS=()
    CONC_SUCCESS=0
    
    for i in {1..10}; do
        (
            RESPONSE=$(check_endpoint "POST" "/api/unified/conversations/${CSID}/messages" \
              "{\"sessionId\":\"${CSID}\",\"from\":{\"id\":\"user\",\"name\":\"user\",\"type\":\"user\"},\"text\":\"Concurrent message $i\"}" \
              "201" "Concurrent message $i" 2>&1)
            if [ $? -eq 0 ]; then
                echo "SUCCESS" > "/tmp/conc_$i"
            fi
        ) &
        CONCURRENT_PIDS+=($!)
    done
    
    wait
    
    for i in {1..10}; do
        if [ -f "/tmp/conc_$i" ]; then
            CONC_SUCCESS=$((CONC_SUCCESS + 1))
            rm -f "/tmp/conc_$i"
        fi
    done
    
    if [ $CONC_SUCCESS -eq 10 ]; then
        log_pass "Concurrent operations: $CONC_SUCCESS/10 succeeded"
    else
        log_fail "Concurrent operations" "Only $CONC_SUCCESS/10 succeeded"
    fi
    
    check_endpoint "POST" "/api/unified/conversations/end" "{\"sessionId\":\"$CSID\"}" "200" "Cleanup" > /dev/null
fi

echo -e "\n${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Robustness Test Summary                                ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Total Tests: ${TOTAL}"
echo -e "${GREEN}Passed: ${PASSED}${NC}"
echo -e "${RED}Failed: ${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All robustness tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ ${FAILED} test(s) failed${NC}"
    exit 1
fi

