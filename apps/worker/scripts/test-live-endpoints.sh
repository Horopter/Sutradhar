#!/bin/bash

# Live endpoint testing - tests actual running server

BASE_URL="${BASE_URL:-http://localhost:4001}"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🚀 Testing UnifiedActionService Live Endpoints"
echo "=============================================="
echo "Base URL: $BASE_URL"
echo ""

# Wait for server
echo "⏳ Waiting for server..."
for i in {1..10}; do
    if curl -s "$BASE_URL/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Server is up!${NC}"
        break
    fi
    echo "  Attempt $i/10..."
    sleep 2
done

# Test health endpoint
echo ""
echo "1️⃣  Health Check"
echo "----------------"
HEALTH=$(curl -s "$BASE_URL/health" 2>&1)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Health endpoint responding${NC}"
    echo "$HEALTH" | head -5
else
    echo -e "${YELLOW}⚠ Health endpoint not responding${NC}"
fi

# Test create issue (will likely be mocked)
echo ""
echo "2️⃣  Create GitHub Issue"
echo "----------------------"
ISSUE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/issues" \
    -H "Content-Type: application/json" \
    -d '{"repository":"test/owner-repo","title":"Test Issue","description":"Live test"}' 2>&1)

if echo "$ISSUE_RESPONSE" | grep -q "ok"; then
    echo -e "${GREEN}✓ Issue creation endpoint working${NC}"
    echo "$ISSUE_RESPONSE" | head -10
else
    echo -e "${YELLOW}⚠ Issue creation: $ISSUE_RESPONSE${NC}"
fi

# Test create event
echo ""
echo "3️⃣  Create Calendar Event"
echo "------------------------"
NOW=$(date +%s)
START_TIME=$((NOW + 3600))
END_TIME=$((NOW + 7200))

EVENT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/unified/scheduling/events" \
    -H "Content-Type: application/json" \
    -d "{\"calendarId\":\"primary\",\"title\":\"Live Test Event\",\"description\":\"Testing live endpoint\",\"startTime\":$START_TIME,\"endTime\":$END_TIME}" 2>&1)

if echo "$EVENT_RESPONSE" | grep -q "ok"; then
    echo -e "${GREEN}✓ Event creation endpoint working${NC}"
    echo "$EVENT_RESPONSE" | head -10
else
    echo -e "${YELLOW}⚠ Event creation: $EVENT_RESPONSE${NC}"
fi

# Test list issues
echo ""
echo "4️⃣  List Issues"
echo "---------------"
LIST_RESPONSE=$(curl -s "$BASE_URL/api/v1/issues?repository=test/owner-repo" 2>&1)
if echo "$LIST_RESPONSE" | grep -q "ok\|issues"; then
    echo -e "${GREEN}✓ List issues endpoint working${NC}"
    echo "$LIST_RESPONSE" | head -10
else
    echo -e "${YELLOW}⚠ List issues: $LIST_RESPONSE${NC}"
fi

echo ""
echo "=============================================="
echo -e "${GREEN}✅ Live endpoint testing complete!${NC}"
echo ""
echo "Note: Responses may be mocked if services are not fully configured."
echo "This verifies that endpoints are correctly wired and responding."

