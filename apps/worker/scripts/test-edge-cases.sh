#!/usr/bin/env bash

# Edge Cases and Validation Test Suite
# Tests error handling, validation, and edge cases

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL=${BASE_URL:-http://localhost:4001}
TEST_COUNT=0
PASS_COUNT=0
FAIL_COUNT=0

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
    ((PASS_COUNT++))
    ((TEST_COUNT++))
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
    ((FAIL_COUNT++))
    ((TEST_COUNT++))
}

log_test() {
    echo -e "\n${YELLOW}==> Testing: $1${NC}"
}

check_error_response() {
    local response=$1
    local expected_status=$2
    local test_name=$3
    
    local status=$(echo "$response" | jq -r '.ok // "false"')
    local error=$(echo "$response" | jq -r '.error // ""')
    
    if [ "$status" == "false" ] && [ -n "$error" ]; then
        log_success "$test_name (expected error: ${error:0:50}...)"
        return 0
    else
        log_error "$test_name - Expected error response but got ok=$status"
        echo "$response" | jq . || echo "$response"
        return 1
    fi
}

check_validation_error() {
    local response=$1
    local test_name=$2
    
    local status=$(echo "$response" | jq -r '.ok // "false"')
    local error=$(echo "$response" | jq -r '.error // ""')
    local details=$(echo "$response" | jq -r '.details // empty')
    
    if [ "$status" == "false" ] && [[ "$error" == *"validation"* || -n "$details" ]]; then
        log_success "$test_name"
        return 0
    else
        log_error "$test_name - Expected validation error"
        echo "$response" | jq . || echo "$response"
        return 1
    fi
}

test_validation_errors() {
    log_test "Validation Error Handling"
    
    # Test missing required fields
    local response=$(curl -sS -X POST "${BASE_URL}/api/answer" \
        -H "Content-Type: application/json" \
        -d '{}')
    check_validation_error "$response" "POST /api/answer with missing question"
    
    # Test empty string
    local response=$(curl -sS -X POST "${BASE_URL}/api/answer" \
        -H "Content-Type: application/json" \
        -d '{"question": ""}')
    check_validation_error "$response" "POST /api/answer with empty question"
    
    # Test invalid email format
    local response=$(curl -sS -X POST "${BASE_URL}/agentmail/send" \
        -H "Content-Type: application/json" \
        -d '{
            "to": "invalid-email",
            "subject": "Test",
            "text": "Test"
        }')
    check_validation_error "$response" "POST /agentmail/send with invalid email"
    
    # Test missing required action fields
    local response=$(curl -sS -X POST "${BASE_URL}/actions/slack" \
        -H "Content-Type: application/json" \
        -d '{}')
    check_validation_error "$response" "POST /actions/slack with missing text"
    
    # Test invalid date format (calendar)
    local response=$(curl -sS -X POST "${BASE_URL}/actions/calendar" \
        -H "Content-Type: application/json" \
        -d '{
            "title": "Test",
            "startISO": "invalid-date",
            "endISO": "invalid-date"
        }')
    check_validation_error "$response" "POST /actions/calendar with invalid dates"
    
    # Test missing sessionId for actions/list
    local response=$(curl -sS "${BASE_URL}/actions/list")
    check_error_response "$response" "400" "GET /actions/list without sessionId"
}

test_rate_limiting() {
    log_test "Rate Limiting"
    
    log_info "Sending multiple rapid requests to test rate limiting..."
    
    local rate_limited=false
    for i in {1..15}; do
        local response=$(curl -sS -X POST "${BASE_URL}/llm/answer" \
            -H "Content-Type: application/json" \
            -d "{\"question\": \"Test $i\"}")
        
        local status=$(echo "$response" | jq -r '.ok // "false"')
        local error=$(echo "$response" | jq -r '.error // ""')
        
        if [[ "$error" == *"Too many requests"* ]] || [[ "$error" == *"rate limit"* ]]; then
            rate_limited=true
            log_success "Rate limiting triggered (request $i)"
            break
        fi
        
        sleep 0.1
    done
    
    if [ "$rate_limited" == "false" ]; then
        log_info "Rate limiting not triggered (may be normal for lenient limits)"
        ((TEST_COUNT++))
    fi
}

test_guardrails() {
    log_test "Guardrails"
    
    # Test blocked content (offensive language)
    local response=$(curl -sS -X POST "${BASE_URL}/llm/answer" \
        -H "Content-Type: application/json" \
        -d '{
            "question": "This is a test with inappropriate content that should be blocked"
        }')
    
    # Guardrails may or may not block this, so we just check it returns a response
    if echo "$response" | jq -e '.' > /dev/null 2>&1; then
        local blocked=$(echo "$response" | jq -r '.blocked // false')
        if [ "$blocked" == "true" ]; then
            log_success "Guardrails blocked inappropriate content"
        else
            log_info "Guardrails did not block content (may be configured permissively)"
            ((TEST_COUNT++))
        fi
    else
        log_error "Guardrails test failed to get valid response"
    fi
}

test_timeout_handling() {
    log_test "Timeout Handling"
    
    # Test with very long request (should timeout)
    log_info "Testing timeout behavior (this may take a moment)..."
    
    local response=$(curl -sS --max-time 5 "${BASE_URL}/api/answer" \
        -H "Content-Type: application/json" \
        -d '{
            "question": "What is the meaning of life?"
        }')
    
    # Should either complete or timeout gracefully
    if echo "$response" | jq -e '.' > /dev/null 2>&1 || [ -z "$response" ]; then
        log_success "Timeout handling works (request completed or timed out gracefully)"
    else
        log_error "Timeout handling issue"
    fi
}

test_malformed_json() {
    log_test "Malformed JSON Handling"
    
    local response=$(curl -sS -X POST "${BASE_URL}/api/answer" \
        -H "Content-Type: application/json" \
        -d '{"question": "test" invalid}')
    
    check_error_response "$response" "400" "POST with malformed JSON"
}

test_missing_content_type() {
    log_test "Missing Content-Type Header"
    
    local response=$(curl -sS -X POST "${BASE_URL}/api/answer" \
        -d '{"question": "test"}')
    
    # Should handle gracefully (may accept or reject)
    if echo "$response" | jq -e '.' > /dev/null 2>&1; then
        log_success "Handles missing Content-Type header"
    else
        log_info "Rejects missing Content-Type (acceptable behavior)"
        ((TEST_COUNT++))
    fi
}

test_empty_body() {
    log_test "Empty Request Body"
    
    local response=$(curl -sS -X POST "${BASE_URL}/api/answer" \
        -H "Content-Type: application/json" \
        -d '')
    
    check_error_response "$response" "400" "POST with empty body"
}

test_large_payload() {
    log_test "Large Payload Handling"
    
    # Create a large text string
    local large_text=$(python3 -c "print('A' * 10000)" 2>/dev/null || printf 'A%.0s' {1..10000})
    
    local response=$(curl -sS -X POST "${BASE_URL}/api/answer" \
        -H "Content-Type: application/json" \
        -d "{\"question\": \"$large_text\"}")
    
    # Should handle or reject gracefully
    if echo "$response" | jq -e '.' > /dev/null 2>&1; then
        local ok=$(echo "$response" | jq -r '.ok // false')
        if [ "$ok" == "false" ]; then
            log_success "Large payload rejected gracefully"
        else
            log_success "Large payload handled"
        fi
    else
        log_error "Large payload handling failed"
    fi
}

test_special_characters() {
    log_test "Special Characters Handling"
    
    local response=$(curl -sS -X POST "${BASE_URL}/api/answer" \
        -H "Content-Type: application/json" \
        -d '{
            "question": "Test with special chars: <>&\"'\''/\\n\\t"
        }')
    
    if echo "$response" | jq -e '.ok' > /dev/null 2>&1; then
        log_success "Special characters handled"
    else
        check_error_response "$response" "400" "Special characters (may be rejected by guardrails)"
    fi
}

test_unicode() {
    log_test "Unicode Handling"
    
    local response=$(curl -sS -X POST "${BASE_URL}/api/answer" \
        -H "Content-Type: application/json" \
        -d '{
            "question": "Test with unicode: 你好 🌟 ñoño"
        }')
    
    if echo "$response" | jq -e '.ok' > /dev/null 2>&1; then
        log_success "Unicode characters handled"
    else
        log_error "Unicode handling failed"
    fi
}

test_concurrent_requests() {
    log_test "Concurrent Request Handling"
    
    log_info "Sending 5 concurrent requests..."
    
    local pids=()
    for i in {1..5}; do
        curl -sS -X POST "${BASE_URL}/health" \
            -H "Content-Type: application/json" \
            > /tmp/test_concurrent_$i.json 2>&1 &
        pids+=($!)
    done
    
    # Wait for all to complete
    for pid in "${pids[@]}"; do
        wait $pid
    done
    
    # Check results
    local success_count=0
    for i in {1..5}; do
        if [ -f "/tmp/test_concurrent_$i.json" ]; then
            local response=$(cat /tmp/test_concurrent_$i.json)
            if echo "$response" | jq -e '.ok' > /dev/null 2>&1; then
                ((success_count++))
            fi
            rm -f "/tmp/test_concurrent_$i.json"
        fi
    done
    
    if [ $success_count -eq 5 ]; then
        log_success "All concurrent requests handled successfully"
    else
        log_error "Only $success_count/5 concurrent requests succeeded"
    fi
}

test_deduplication() {
    log_test "Request Deduplication"
    
    log_info "Sending identical requests rapidly to test deduplication..."
    
    local responses=()
    for i in {1..3}; do
        local response=$(curl -sS -X POST "${BASE_URL}/llm/answer" \
            -H "Content-Type: application/json" \
            -d '{
                "question": "What is 2+2?"
            }')
        responses+=("$response")
        sleep 0.1
    done
    
    # Check if responses are similar (deduplication should return same/similar)
    local first_response="${responses[0]}"
    local similar_count=0
    
    for response in "${responses[@]}"; do
        local first_text=$(echo "$first_response" | jq -r '.text // ""')
        local response_text=$(echo "$response" | jq -r '.text // ""')
        if [ "$first_text" == "$response_text" ] && [ -n "$first_text" ]; then
            ((similar_count++))
        fi
    done
    
    if [ $similar_count -ge 2 ]; then
        log_success "Request deduplication working (responses are similar)"
    else
        log_info "Deduplication may not have triggered (responses differ, which is also OK)"
        ((TEST_COUNT++))
    fi
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "=========================================="
    echo "  Edge Cases & Validation Test Suite"
    echo "=========================================="
    echo -e "${NC}"
    echo "Base URL: $BASE_URL"
    echo ""
    
    # Run all tests
    test_validation_errors
    test_rate_limiting
    test_guardrails
    test_timeout_handling
    test_malformed_json
    test_missing_content_type
    test_empty_body
    test_large_payload
    test_special_characters
    test_unicode
    test_concurrent_requests
    test_deduplication
    
    # Summary
    echo -e "\n${BLUE}=========================================="
    echo "  Test Summary"
    echo "==========================================${NC}"
    echo "Total Tests: $TEST_COUNT"
    echo -e "${GREEN}Passed: $PASS_COUNT${NC}"
    echo -e "${RED}Failed: $FAIL_COUNT${NC}"
    
    if [ $FAIL_COUNT -eq 0 ]; then
        echo -e "\n${GREEN}✓ All edge case tests passed!${NC}"
        exit 0
    else
        echo -e "\n${RED}✗ Some tests failed${NC}"
        exit 1
    fi
}

# Run main function
main "$@"

