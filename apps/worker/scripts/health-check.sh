#!/usr/bin/env bash

# Comprehensive Health Check Script
# Tests all endpoints and demo happy paths

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BASE_URL=${BASE_URL:-http://localhost:2198}
MAX_WAIT=30
CHECK_INTERVAL=1

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
    ((PASSED_CHECKS++))
    ((TOTAL_CHECKS++))
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
    ((FAILED_CHECKS++))
    ((TOTAL_CHECKS++))
}

log_test() {
    echo -e "\n${YELLOW}==> $1${NC}"
}

# Wait for server to be ready
wait_for_server() {
    log_info "Waiting for server at ${BASE_URL}..."
    local elapsed=0
    
    while [ $elapsed -lt $MAX_WAIT ]; do
        if curl -sfS "${BASE_URL}/health" > /dev/null 2>&1; then
            log_success "Server is ready"
            return 0
        fi
        sleep $CHECK_INTERVAL
        ((elapsed += CHECK_INTERVAL))
    done
    
    log_error "Server did not become ready within ${MAX_WAIT}s"
    return 1
}

# Check endpoint health
check_endpoint() {
    local method=$1
    local path=$2
    local expected_status=${3:-200}
    local data=${4:-}
    
    local cmd="curl -sS -w '\\nHTTP_CODE:%{http_code}' -X ${method} '${BASE_URL}${path}'"
    if [ -n "$data" ]; then
        cmd="${cmd} -H 'Content-Type: application/json' -d '${data}'"
    fi
    
    local response=$(eval $cmd)
    local body=$(echo "$response" | sed '$d' | sed '/^HTTP_CODE:/d')
    local status=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    
    if [ "$status" = "$expected_status" ]; then
        log_success "${method} ${path} (${status})"
        return 0
    else
        log_error "${method} ${path} (expected ${expected_status}, got ${status})"
        echo "$body" | jq . 2>/dev/null || echo "$body" | head -3
        return 1
    fi
}

# Test basic health
test_health() {
    log_test "Health Checks"
    
    check_endpoint "GET" "/health"
    check_endpoint "GET" "/health/full"
    check_endpoint "GET" "/api/v1/"
}

# Test API v1 endpoints
test_api_v1() {
    log_test "API v1 Endpoints"
    
    # Answer endpoint
    check_endpoint "POST" "/api/v1/answer" 200 '{"question":"What is Sutradhar?","sessionId":"health-check"}'
    
    # LLM endpoints
    check_endpoint "POST" "/api/v1/llm/answer" 200 '{"prompt":"Hello","model":"gpt-4o-mini"}'
    check_endpoint "POST" "/api/v1/llm/summarize" 200 '{"text":"This is a test summary."}'
    check_endpoint "POST" "/api/v1/llm/escalate" 200 '{"query":"Help me","context":"test"}'
    
    # Actions
    check_endpoint "GET" "/api/v1/actions/list"
    
    # Sessions
    check_endpoint "POST" "/api/v1/sessions/start" 200 '{"channel":"test","persona":"Greeter","userName":"TestUser"}'
    
    # Retrieval
    check_endpoint "POST" "/api/v1/retrieval/indexSeed" 200 '{"text":"Test content","docId":"test123"}'
}

# Test RESTful endpoints
test_restful_endpoints() {
    log_test "RESTful Service Endpoints"
    
    # GitHub
    check_endpoint "POST" "/api/v1/github/issues" 200 '{"title":"Test Issue","body":"Test body"}' || log_info "GitHub endpoint may require valid credentials"
    
    # Slack
    check_endpoint "POST" "/api/v1/slack/messages" 200 '{"text":"Test message"}' || log_info "Slack endpoint may require valid credentials"
    
    # Calendar
    check_endpoint "POST" "/api/v1/calendar/events" 200 '{"title":"Test Event","start":"2024-12-31T10:00:00Z","end":"2024-12-31T11:00:00Z"}' || log_info "Calendar endpoint may require valid credentials"
    
    # Webhooks
    check_endpoint "GET" "/api/v1/webhooks"
    check_endpoint "POST" "/api/v1/webhooks/slack" 200 '{"type":"url_verification","challenge":"test123"}'
}

# Test demo happy paths
test_demo_happy_paths() {
    log_test "Demo Happy Paths"
    
    # 1. Start a session
    log_info "Happy Path 1: Start session and ask question"
    local session_response=$(curl -sS -X POST "${BASE_URL}/api/v1/sessions/start" \
        -H "Content-Type: application/json" \
        -d '{"channel":"voice","persona":"Greeter","userName":"DemoUser"}')
    
    local session_id=$(echo "$session_response" | jq -r '.sessionId // "demo-session"')
    log_info "Session ID: ${session_id}"
    
    # 2. Ask a question
    log_info "Happy Path 2: Ask question with retrieval"
    local answer_response=$(curl -sS -X POST "${BASE_URL}/api/v1/answer" \
        -H "Content-Type: application/json" \
        -d "{\"sessionId\":\"${session_id}\",\"question\":\"What is Sutradhar?\"}")
    
    if echo "$answer_response" | jq -e '.ok == true' > /dev/null 2>&1; then
        log_success "Answer endpoint working"
        echo "$answer_response" | jq -r '.text // .finalText // "Answer received"' | head -1
    else
        log_error "Answer endpoint failed"
        echo "$answer_response" | jq . 2>/dev/null || echo "$answer_response"
    fi
    
    # 3. Use LLM directly
    log_info "Happy Path 3: Direct LLM call"
    local llm_response=$(curl -sS -X POST "${BASE_URL}/api/v1/llm/answer" \
        -H "Content-Type: application/json" \
        -d '{"prompt":"Explain AI assistants in one sentence","model":"gpt-4o-mini"}')
    
    if echo "$llm_response" | jq -e '.ok == true' > /dev/null 2>&1; then
        log_success "LLM endpoint working"
    else
        log_error "LLM endpoint failed"
    fi
    
    # 4. List sessions
    log_info "Happy Path 4: List sessions"
    check_endpoint "GET" "/api/v1/sessions/list"
    
    # 5. End session
    log_info "Happy Path 5: End session"
    check_endpoint "POST" "/api/v1/sessions/end" 200 "{\"sessionId\":\"${session_id}\"}"
}

# Test error handling
test_error_handling() {
    log_test "Error Handling"
    
    # Invalid JSON
    local response=$(curl -sS -w '\n%{http_code}' -X POST "${BASE_URL}/api/v1/answer" \
        -H "Content-Type: application/json" \
        -d 'invalid json')
    local status=$(echo "$response" | tail -n 1)
    if [ "$status" = "400" ] || [ "$status" = "422" ]; then
        log_success "Invalid JSON properly rejected (${status})"
    else
        log_error "Invalid JSON not properly rejected (${status})"
    fi
    
    # Missing required fields
    local response=$(curl -sS -w '\n%{http_code}' -X POST "${BASE_URL}/api/v1/answer" \
        -H "Content-Type: application/json" \
        -d '{}')
    local status=$(echo "$response" | tail -n 1)
    if [ "$status" = "400" ] || [ "$status" = "422" ]; then
        log_success "Missing fields properly rejected (${status})"
    else
        log_error "Missing fields not properly rejected (${status})"
    fi
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "=========================================="
    echo "  Sutradhar Health Check"
    echo "=========================================="
    echo -e "${NC}"
    echo "Base URL: ${BASE_URL}"
    echo ""
    
    # Wait for server
    if ! wait_for_server; then
        echo -e "\n${RED}Server not available. Start the server with: npm run dev${NC}"
        exit 1
    fi
    
    # Run all checks
    test_health
    test_api_v1
    test_restful_endpoints
    test_demo_happy_paths
    test_error_handling
    
    # Summary
    echo -e "\n${BLUE}=========================================="
    echo "  Health Check Summary"
    echo "==========================================${NC}"
    echo "Total Checks: ${TOTAL_CHECKS}"
    echo -e "${GREEN}Passed: ${PASSED_CHECKS}${NC}"
    echo -e "${RED}Failed: ${FAILED_CHECKS}${NC}"
    
    if [ ${FAILED_CHECKS} -eq 0 ]; then
        echo -e "\n${GREEN}✓ All health checks passed!${NC}"
        exit 0
    else
        echo -e "\n${RED}✗ Some health checks failed${NC}"
        exit 1
    fi
}

main "$@"

