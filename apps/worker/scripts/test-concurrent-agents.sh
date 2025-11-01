#!/bin/bash

# Concurrent Multi-Agent Stress Test
# Tests system under concurrent load from multiple agents

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:4001}"
NUM_AGENTS="${NUM_AGENTS:-5}"
REQUESTS_PER_AGENT="${REQUESTS_PER_AGENT:-3}"

CURL_HEADERS=(-H "Content-Type: application/json" -H "X-Internal-Test: true")

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

declare -A AGENT_SESSIONS
declare -A AGENT_PIDS

# Function to simulate an agent
simulate_agent() {
    local agent_id=$1
    local agent_name="agent-${agent_id}"
    local passed=0
    local failed=0
    
    echo "[${agent_name}] Starting..."
    
    # 1. Create session
    SESSION_PAYLOAD=$(cat <<EOF
{
  "channelType": "web",
  "channelId": "channel-${agent_name}",
  "channelName": "Channel for ${agent_name}",
  "persona": "assistant",
  "userName": "${agent_name}"
}
EOF
)
    
    SESSION_RESPONSE=$(curl -sS -X POST "${BASE_URL}/api/unified/conversations/start" \
        "${CURL_HEADERS[@]}" \
        -d "$SESSION_PAYLOAD" 2>&1)
    
    SESSION_ID=$(echo "$SESSION_RESPONSE" | jq -r ".conversation.sessionId" 2>/dev/null || echo "")
    
    if [ -z "$SESSION_ID" ] || [ "$SESSION_ID" = "null" ]; then
        echo "[${agent_name}] ✗ Failed to create session"
        failed=$((failed + 1))
        return 1
    fi
    
    AGENT_SESSIONS["${agent_name}"]="$SESSION_ID"
    echo "[${agent_name}] ✓ Session created: ${SESSION_ID}"
    passed=$((passed + 1))
    
    # 2. Send multiple messages
    for i in $(seq 1 $REQUESTS_PER_AGENT); do
        MESSAGE_PAYLOAD=$(cat <<EOF
{
  "sessionId": "${SESSION_ID}",
  "from": {
    "id": "${agent_name}",
    "name": "${agent_name}",
    "type": "user"
  },
  "text": "Message ${i} from ${agent_name}: What is AI?",
  "persona": "assistant"
}
EOF
)
        
        MESSAGE_RESPONSE=$(curl -sS -X POST "${BASE_URL}/api/unified/conversations/${SESSION_ID}/messages" \
            "${CURL_HEADERS[@]}" \
            -d "$MESSAGE_PAYLOAD" 2>&1)
        
        STATUS=$(echo "$MESSAGE_RESPONSE" | jq -r ".ok" 2>/dev/null || echo "false")
        
        if [ "$STATUS" = "true" ]; then
            echo "[${agent_name}] ✓ Message ${i} sent and responded"
            passed=$((passed + 1))
        else
            echo "[${agent_name}] ✗ Message ${i} failed"
            failed=$((failed + 1))
        fi
        
        # Small delay between messages
        sleep 0.2
    done
    
    # 3. Get conversation history
    MESSAGES_RESPONSE=$(curl -sS -X GET "${BASE_URL}/api/unified/conversations/${SESSION_ID}/messages" \
        "${CURL_HEADERS[@]}" 2>&1)
    
    COUNT=$(echo "$MESSAGES_RESPONSE" | jq -r ".count" 2>/dev/null || echo "0")
    
    if [ "$COUNT" -gt 0 ]; then
        echo "[${agent_name}] ✓ Retrieved ${COUNT} messages"
        passed=$((passed + 1))
    else
        echo "[${agent_name}] ✗ Failed to retrieve messages"
        failed=$((failed + 1))
    fi
    
    # 4. End session
    END_PAYLOAD="{\"sessionId\": \"${SESSION_ID}\"}"
    END_RESPONSE=$(curl -sS -X POST "${BASE_URL}/api/unified/conversations/end" \
        "${CURL_HEADERS[@]}" \
        -d "$END_PAYLOAD" 2>&1)
    
    STATUS=$(echo "$END_RESPONSE" | jq -r ".ok" 2>/dev/null || echo "false")
    
    if [ "$STATUS" = "true" ]; then
        echo "[${agent_name}] ✓ Session ended"
        passed=$((passed + 1))
    else
        echo "[${agent_name}] ✗ Failed to end session"
        failed=$((failed + 1))
    fi
    
    echo "[${agent_name}] Completed: ${passed} passed, ${failed} failed"
    echo "${passed}:${failed}" > "/tmp/agent_${agent_id}_result"
}

# Run concurrent agents
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Concurrent Multi-Agent Stress Test                     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Starting ${NUM_AGENTS} agents concurrently..."
echo "Each agent will make ${REQUESTS_PER_AGENT} message requests"
echo ""

START_TIME=$(date +%s)

# Start all agents in background
for i in $(seq 1 $NUM_AGENTS); do
    simulate_agent "$i" &
    AGENT_PIDS["$i"]=$!
done

# Wait for all agents to complete
TOTAL_PASSED=0
TOTAL_FAILED=0

for pid in "${AGENT_PIDS[@]}"; do
    wait "$pid"
done

# Collect results
for i in $(seq 1 $NUM_AGENTS); do
    if [ -f "/tmp/agent_${i}_result" ]; then
        RESULT=$(cat "/tmp/agent_${i}_result")
        PASSED=$(echo "$RESULT" | cut -d: -f1)
        FAILED=$(echo "$RESULT" | cut -d: -f2)
        TOTAL_PASSED=$((TOTAL_PASSED + PASSED))
        TOTAL_FAILED=$((TOTAL_FAILED + FAILED))
        rm -f "/tmp/agent_${i}_result"
    fi
done

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Concurrent Test Summary                                ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Agents: ${NUM_AGENTS}"
echo "Requests per agent: ${REQUESTS_PER_AGENT}"
echo "Duration: ${DURATION} seconds"
echo -e "${GREEN}Total Passed: ${TOTAL_PASSED}${NC}"
echo -e "${RED}Total Failed: ${TOTAL_FAILED}${NC}"
echo ""

if [ $TOTAL_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All concurrent tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some concurrent tests failed.${NC}"
    exit 1
fi

