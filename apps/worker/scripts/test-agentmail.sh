#!/usr/bin/env bash

# Test AgentMail Integration - Starting from Scratch
# Tests the demo happy path for AgentMail

set -e
set -o pipefail

BASE_URL=${BASE_URL:-http://localhost:2198}

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "=========================================="
echo "  AgentMail Integration Test"
echo "=========================================="
echo -e "${NC}"

# Step 1: Health Check
echo -e "\n${YELLOW}Step 1: Health Check${NC}"
HEALTH_RESPONSE=$(curl -sS "${BASE_URL}/health" 2>&1)
if echo "$HEALTH_RESPONSE" | jq -e '.ok == true' > /dev/null 2>&1; then
    MODE=$(echo "$HEALTH_RESPONSE" | jq -r '.mode // "unknown"' 2>/dev/null || echo "unknown")
    echo -e "${GREEN}   ✓ Server is healthy (mode: ${MODE})${NC}"
else
    echo -e "${RED}   ✗ Server health check failed${NC}"
    echo "   Response: $HEALTH_RESPONSE"
    exit 1
fi

# Step 2: AgentMail Self-Check (if endpoint exists)
echo -e "\n${YELLOW}Step 2: AgentMail Self-Check${NC}"
SELF_CHECK_RESPONSE=$(curl -sS "${BASE_URL}/diag/agentmail" 2>&1)
if echo "$SELF_CHECK_RESPONSE" | jq -e '.real' > /dev/null 2>&1; then
    REAL=$(echo "$SELF_CHECK_RESPONSE" | jq -r '.real // false' 2>/dev/null || echo "false")
    INBOX_ID=$(echo "$SELF_CHECK_RESPONSE" | jq -r '.inboxId // "none"' 2>/dev/null || echo "none")
    REASON=$(echo "$SELF_CHECK_RESPONSE" | jq -r '.reason // "ok"' 2>/dev/null || echo "ok")
    if [ "$REAL" = "true" ]; then
        echo -e "${GREEN}   ✓ AgentMail is configured (Real mode)${NC}"
        echo "   Inbox ID: ${INBOX_ID}"
    else
        echo -e "${YELLOW}   ⚠ AgentMail in mock mode${NC}"
        echo "   Reason: ${REASON}"
    fi
else
    echo -e "${YELLOW}   ⚠ Self-check endpoint not available${NC}"
    echo "   Response: $(echo "$SELF_CHECK_RESPONSE" | jq -r '.error // .message // "endpoint not found"' 2>/dev/null || echo "unknown")"
fi

# Step 3: Send Test Email (Mock/Dry-Run)
echo -e "\n${YELLOW}Step 3: Send Test Email${NC}"
SEND_RESPONSE=$(curl -sS -X POST "${BASE_URL}/agentmail/send" \
    -H "Content-Type: application/json" \
    -d '{
        "to":"test@demo.local",
        "subject":"[Test] AgentMail Integration Check",
        "text":"This is a test email from the Sutradhar integration test suite."
    }' 2>&1)

if echo "$SEND_RESPONSE" | jq -e '.ok == true' > /dev/null 2>&1; then
    MOCKED=$(echo "$SEND_RESPONSE" | jq -r '.mocked // false' 2>/dev/null || echo "false")
    DRY_RUN=$(echo "$SEND_RESPONSE" | jq -r '.dryRun // false' 2>/dev/null || echo "false")
    THREAD_ID=$(echo "$SEND_RESPONSE" | jq -r '.threadId // "none"' 2>/dev/null || echo "none")
    MESSAGE_ID=$(echo "$SEND_RESPONSE" | jq -r '.messageId // "none"' 2>/dev/null || echo "none")
    
    if [ "$MOCKED" = "true" ]; then
        echo -e "${YELLOW}   ⚠ Email sent in MOCK mode${NC}"
    elif [ "$DRY_RUN" = "true" ]; then
        echo -e "${YELLOW}   ⚠ Email sent in DRY-RUN mode${NC}"
    else
        echo -e "${GREEN}   ✓ Email sent successfully${NC}"
    fi
    echo "   Thread ID: ${THREAD_ID}"
    echo "   Message ID: ${MESSAGE_ID}"
    echo "$SEND_RESPONSE" | jq .
else
    ERROR_MSG=$(echo "$SEND_RESPONSE" | jq -r '.error // .message // "unknown error"' 2>/dev/null || echo "Failed to parse error")
    echo -e "${RED}   ✗ Failed to send email${NC}"
    echo "   Error: ${ERROR_MSG}"
    echo "$SEND_RESPONSE" | jq . 2>/dev/null || echo "$SEND_RESPONSE"
    exit 1
fi

# Step 4: Test via Unified API (if available)
echo -e "\n${YELLOW}Step 4: Test via Unified Communication API${NC}"
UNIFIED_RESPONSE=$(curl -sS -X POST "${BASE_URL}/api/unified/communications/send" \
    -H "Content-Type: application/json" \
    -d '{
        "platform": "email",
        "to": {"id": "test@demo.local", "name": "Test User"},
        "message": {
            "subject": "[Unified API] Test Email",
            "text": "This email was sent via the unified communication API."
        }
    }' 2>&1)

if echo "$UNIFIED_RESPONSE" | jq -e '.ok == true' > /dev/null 2>&1; then
    echo -e "${GREEN}   ✓ Unified API email sent successfully${NC}"
    echo "$UNIFIED_RESPONSE" | jq .
else
    ERROR_MSG=$(echo "$UNIFIED_RESPONSE" | jq -r '.error // .message // "endpoint not available"' 2>/dev/null || echo "unknown")
    echo -e "${YELLOW}   ⚠ Unified API test: ${ERROR_MSG}${NC}"
fi

echo -e "\n${BLUE}=========================================="
echo "  AgentMail Test Complete"
echo "==========================================${NC}"

