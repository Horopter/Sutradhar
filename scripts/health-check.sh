#!/bin/bash
# Health Check Script - Tests all layers of the architecture

set -e

SUTRADHAR_URL="${SUTRADHAR_URL:-http://localhost:5000}"
OPTIMUS_URL="${OPTIMUS_URL:-http://localhost:4001}"
MASTERBOLT_URL="${MASTERBOLT_URL:-http://localhost:3777}"

echo "🏥 Sutradhar Health Check & Integration Tests"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
        return 0
    else
        echo -e "${RED}❌ $1${NC}"
        return 1
    fi
}

# ========== Level 1: Sutradhar Server Health ==========
echo "📡 Level 1: Sutradhar Server Health"
echo "-----------------------------------"

echo "Checking Sutradhar server..."
if curl -s -f "${SUTRADHAR_URL}/health" > /dev/null; then
    check_status "Sutradhar server is running"
    SUTRADHAR_HEALTH=$(curl -s "${SUTRADHAR_URL}/health")
    echo "  Response: $SUTRADHAR_HEALTH"
else
    echo -e "${RED}❌ Sutradhar server is not responding at ${SUTRADHAR_URL}${NC}"
    echo "  Make sure Sutradhar is running: cd apps/sutradhar && npm run dev"
    exit 1
fi

echo ""

# ========== Level 2: Agent Health Checks ==========
echo "🤖 Level 2: Agent Health Checks (Sutradhar)"
echo "--------------------------------------------"

AGENTS=("email-agent" "action-agent" "llm-agent" "retrieval-agent" "data-agent")

for agent in "${AGENTS[@]}"; do
    echo -n "Checking $agent... "
    HEALTH=$(curl -s "${SUTRADHAR_URL}/orchestrator/agents/${agent}/health" 2>/dev/null || echo '{"ok":false}')
    
    if echo "$HEALTH" | grep -q '"ok":true'; then
        STATUS=$(echo "$HEALTH" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
        echo -e "${GREEN}✅ $agent is ${STATUS}${NC}"
    else
        echo -e "${RED}❌ $agent health check failed${NC}"
        echo "  Response: $HEALTH"
    fi
done

echo ""

# ========== Level 3: Agent Registration & Listing ==========
echo "📋 Level 3: Agent Registration & Listing"
echo "-----------------------------------------"

echo "Listing registered agents..."
AGENTS_LIST=$(curl -s "${SUTRADHAR_URL}/orchestrator/agents")
if echo "$AGENTS_LIST" | grep -q '"ok":true'; then
    check_status "Agents list retrieved"
    AGENT_COUNT=$(echo "$AGENTS_LIST" | grep -o '"id":"[^"]*"' | wc -l | tr -d ' ')
    echo "  Found $AGENT_COUNT registered agents"
    echo "$AGENTS_LIST" | grep -o '"id":"[^"]*"' | sed 's/"id":"\(.*\)"/    - \1/'
else
    echo -e "${RED}❌ Failed to list agents${NC}"
    echo "  Response: $AGENTS_LIST"
fi

echo ""

# ========== Level 4: Agent Task Execution ==========
echo "⚙️  Level 4: Agent Task Execution Tests"
echo "---------------------------------------"

echo "Testing LLM agent..."
LLM_RESULT=$(curl -s -X POST "${SUTRADHAR_URL}/orchestrator/tasks/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "llm-agent",
    "task": {
      "type": "chat",
      "payload": {
        "system": "You are a test assistant.",
        "user": "Say hello",
        "provider": "openai",
        "model": "gpt-4o-mini"
      }
    }
  }' 2>/dev/null || echo '{"ok":false}')

if echo "$LLM_RESULT" | grep -q '"success":true'; then
    check_status "LLM agent task execution"
else
    echo -e "${YELLOW}⚠️  LLM agent may be in mock mode (expected in dev)${NC}"
    echo "  Response: $(echo "$LLM_RESULT" | head -c 200)"
fi

echo ""

echo "Testing Data agent (query)..."
DATA_RESULT=$(curl -s -X POST "${SUTRADHAR_URL}/orchestrator/tasks/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "data-agent",
    "task": {
      "type": "query",
      "payload": {
        "path": "sessions:list",
        "args": {}
      }
    }
  }' 2>/dev/null || echo '{"ok":false}')

if echo "$DATA_RESULT" | grep -q '"success":true'; then
    check_status "Data agent query execution"
else
    echo -e "${YELLOW}⚠️  Data agent query failed (Convex may not be running)${NC}"
    echo "  Response: $(echo "$DATA_RESULT" | head -c 200)"
fi

echo ""

# ========== Level 5: Optimus Integration ==========
echo "🔗 Level 5: Optimus → Sutradhar Integration"
echo "-------------------------------------------"

echo "Checking Optimus server..."
if curl -s -f "${OPTIMUS_URL}/health" > /dev/null; then
    check_status "Optimus server is running"
    OPTIMUS_HEALTH=$(curl -s "${OPTIMUS_URL}/health")
    echo "  Response: $OPTIMUS_HEALTH"
    
    # Check if Optimus can connect to Sutradhar
    if echo "$OPTIMUS_HEALTH" | grep -q '"sutradharConnected":true'; then
        check_status "Optimus connected to Sutradhar"
    else
        echo -e "${RED}❌ Optimus cannot connect to Sutradhar${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Optimus server is not running at ${OPTIMUS_URL}${NC}"
    echo "  Run: cd apps/optimus && npm run dev"
fi

echo ""

# ========== Level 6: Optimus Agent Endpoints ==========
echo "🎯 Level 6: Optimus Agent Endpoints"
echo "----------------------------------"

if curl -s -f "${OPTIMUS_URL}/health" > /dev/null; then
    echo "Testing Optimus agents list..."
    OPTIMUS_AGENTS=$(curl -s "${OPTIMUS_URL}/agents" 2>/dev/null || echo '{"ok":false}')
    if echo "$OPTIMUS_AGENTS" | grep -q '"ok":true'; then
        check_status "Optimus agents list retrieved"
        AGENT_COUNT=$(echo "$OPTIMUS_AGENTS" | grep -o '"name":"[^"]*"' | wc -l | tr -d ' ')
        echo "  Found $AGENT_COUNT Optimus agents"
    else
        echo -e "${YELLOW}⚠️  Could not retrieve Optimus agents${NC}"
    fi
    
    echo ""
    
    echo "Testing Optimus catalog endpoint..."
    CATALOG_RESULT=$(curl -s "${OPTIMUS_URL}/catalog" 2>/dev/null || echo '{"ok":false}')
    if echo "$CATALOG_RESULT" | grep -q '"ok":true'; then
        check_status "Optimus catalog endpoint"
    else
        echo -e "${YELLOW}⚠️  Catalog endpoint test failed${NC}"
    fi
fi

echo ""

# ========== Level 7: Masterbolt Integration ==========
echo "🌐 Level 7: Masterbolt → Optimus Integration"
echo "---------------------------------------------"

echo "Checking Masterbolt server..."
if curl -s -f "${MASTERBOLT_URL}" > /dev/null; then
    check_status "Masterbolt server is running"
else
    echo -e "${YELLOW}⚠️  Masterbolt server is not running at ${MASTERBOLT_URL}${NC}"
    echo "  Run: cd apps/masterbolt && pnpm dev"
fi

echo ""

# ========== Summary ==========
echo "📊 Summary"
echo "----------"
echo "All health checks completed!"
echo ""
echo "To start all services:"
echo "  1. Sutradhar: cd apps/sutradhar && npm run dev"
echo "  2. Optimus:   cd apps/optimus && npm run dev"
echo "  3. Masterbolt: cd apps/masterbolt && pnpm dev"
echo ""

