#!/bin/bash
# Comprehensive Health Check Script
# Tests all layers: Sutradhar → Optimus → Masterbolt

set -e

SUTRADHAR_URL="${SUTRADHAR_URL:-http://localhost:5000}"
OPTIMUS_URL="${OPTIMUS_URL:-http://localhost:4001}"
MASTERBOLT_URL="${MASTERBOLT_URL:-http://localhost:3777}"

echo "🏥 Sutradhar Architecture Health Checks"
echo "========================================"
echo ""
echo "Configuration:"
echo "  Sutradhar:    $SUTRADHAR_URL"
echo "  Optimus:      $OPTIMUS_URL"
echo "  Masterbolt: $MASTERBOLT_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0

test_endpoint() {
    local url=$1
    local name=$2
    
    if curl -s -f --max-time 5 "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $name${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ $name${NC}"
        ((FAILED++))
        return 1
    fi
}

test_json_endpoint() {
    local url=$1
    local name=$2
    local expected_key=$3
    
    local response=$(curl -s --max-time 5 "$url" 2>/dev/null)
    if [ -z "$response" ]; then
        echo -e "${RED}❌ $name (no response)${NC}"
        ((FAILED++))
        return 1
    fi
    
    if echo "$response" | grep -q "$expected_key"; then
        echo -e "${GREEN}✅ $name${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${YELLOW}⚠️  $name (unexpected response)${NC}"
        echo "   Response: $(echo "$response" | head -c 100)"
        ((FAILED++))
        return 1
    fi
}

# ========== LEVEL 1: Sutradhar Server ==========
echo -e "${BLUE}📡 Level 1: Sutradhar Server Health${NC}"
echo "-----------------------------------"

test_endpoint "$SUTRADHAR_URL/health" "Sutradhar server health endpoint"

AGENTS_RESPONSE=$(curl -s --max-time 5 "$SUTRADHAR_URL/orchestrator/agents" 2>/dev/null)
if echo "$AGENTS_RESPONSE" | grep -q '"ok":true'; then
    echo -e "${GREEN}✅ Sutradhar orchestrator agents endpoint${NC}"
    AGENT_COUNT=$(echo "$AGENTS_RESPONSE" | grep -o '"id":"[^"]*"' | wc -l | tr -d ' ')
    echo "   Found $AGENT_COUNT registered agents"
    ((PASSED++))
else
    echo -e "${RED}❌ Sutradhar orchestrator agents endpoint${NC}"
    ((FAILED++))
fi

echo ""

# ========== LEVEL 2: Agent Health Checks ==========
echo -e "${BLUE}🤖 Level 2: Agent Health Checks (Sutradhar)${NC}"
echo "--------------------------------------------"

AGENTS=("email-agent" "action-agent" "llm-agent" "retrieval-agent" "data-agent")

for agent in "${AGENTS[@]}"; do
    HEALTH_RESPONSE=$(curl -s --max-time 5 "$SUTRADHAR_URL/orchestrator/agents/$agent/health" 2>/dev/null)
    if echo "$HEALTH_RESPONSE" | grep -q '"ok":true'; then
        STATUS=$(echo "$HEALTH_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
        echo -e "${GREEN}✅ $agent is ${STATUS}${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ $agent health check failed${NC}"
        ((FAILED++))
    fi
done

echo ""

# ========== LEVEL 3: Agent Task Execution ==========
echo -e "${BLUE}⚙️  Level 3: Agent Task Execution (Sutradhar)${NC}"
echo "---------------------------------------"

# Test LLM Agent
LLM_TASK=$(curl -s --max-time 10 -X POST "$SUTRADHAR_URL/orchestrator/tasks/execute" \
  -H "Content-Type: application/json" \
  -d '{"agentId":"llm-agent","task":{"type":"chat","payload":{"system":"Test","user":"Hello","provider":"openai","model":"gpt-4o-mini"}}}' 2>/dev/null)

if echo "$LLM_TASK" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ LLM agent task execution${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  LLM agent task (may be in mock mode)${NC}"
    ((FAILED++))
fi

# Test Data Agent
DATA_TASK=$(curl -s --max-time 10 -X POST "$SUTRADHAR_URL/orchestrator/tasks/execute" \
  -H "Content-Type: application/json" \
  -d '{"agentId":"data-agent","task":{"type":"query","payload":{"path":"sessions:list","args":{}}}}' 2>/dev/null)

if echo "$DATA_TASK" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Data agent task execution${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  Data agent task (Convex may not be running)${NC}"
    ((FAILED++))
fi

echo ""

# ========== LEVEL 4: Optimus Integration ==========
echo -e "${BLUE}🔗 Level 4: Optimus → Sutradhar Integration${NC}"
echo "-------------------------------------------"

OPTIMUS_HEALTH=$(curl -s --max-time 5 "$OPTIMUS_URL/health" 2>/dev/null)
if echo "$OPTIMUS_HEALTH" | grep -q '"ok":true'; then
    echo -e "${GREEN}✅ Optimus server is running${NC}"
    ((PASSED++))
    
    if echo "$OPTIMUS_HEALTH" | grep -q '"sutradharConnected":true'; then
        echo -e "${GREEN}✅ Optimus connected to Sutradhar${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ Optimus cannot connect to Sutradhar${NC}"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠️  Optimus server is not running${NC}"
    echo "   Run: cd apps/optimus && npm run dev"
    ((FAILED++))
fi

echo ""

# ========== LEVEL 5: Optimus Agent Endpoints ==========
if echo "$OPTIMUS_HEALTH" | grep -q '"ok":true'; then
    echo -e "${BLUE}🎯 Level 5: Optimus Agent Endpoints${NC}"
    echo "----------------------------------"
    
    OPTIMUS_AGENTS=$(curl -s --max-time 5 "$OPTIMUS_URL/agents" 2>/dev/null)
    if echo "$OPTIMUS_AGENTS" | grep -q '"ok":true'; then
        echo -e "${GREEN}✅ Optimus agents list endpoint${NC}"
        AGENT_COUNT=$(echo "$OPTIMUS_AGENTS" | grep -o '"name":"[^"]*"' | wc -l | tr -d ' ')
        echo "   Found $AGENT_COUNT Optimus agents"
        ((PASSED++))
    else
        echo -e "${RED}❌ Optimus agents list endpoint${NC}"
        ((FAILED++))
    fi
    
    CATALOG=$(curl -s --max-time 5 "$OPTIMUS_URL/catalog" 2>/dev/null)
    if echo "$CATALOG" | grep -q '"ok":true'; then
        echo -e "${GREEN}✅ Optimus catalog endpoint${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️  Optimus catalog endpoint (may require Convex)${NC}"
        ((FAILED++))
    fi
    
    echo ""
fi

# ========== LEVEL 6: Masterbolt Integration ==========
echo -e "${BLUE}🌐 Level 6: Masterbolt → Optimus Integration${NC}"
echo "---------------------------------------------"

MASTERBOLT_RESPONSE=$(curl -s --max-time 5 "$MASTERBOLT_URL" 2>/dev/null)
if [ ! -z "$MASTERBOLT_RESPONSE" ]; then
    echo -e "${GREEN}✅ Masterbolt server is running${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  Masterbolt server is not running${NC}"
    echo "   Run: cd apps/masterbolt && pnpm dev"
    ((FAILED++))
fi

echo ""

# ========== Summary ==========
echo -e "${BLUE}📊 Summary${NC}"
echo "========================================"
echo -e "Tests passed: ${GREEN}$PASSED${NC}"
echo -e "Tests failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All health checks passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some health checks failed.${NC}"
    echo ""
    echo "To start services:"
    echo "  1. Sutradhar:    cd apps/sutradhar && npm run dev"
    echo "  2. Optimus:      cd apps/optimus && npm run dev"
    echo "  3. Masterbolt: cd apps/masterbolt && pnpm dev"
    exit 1
fi

