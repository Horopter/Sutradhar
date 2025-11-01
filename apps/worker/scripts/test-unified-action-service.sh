#!/bin/bash

# Comprehensive test runner for UnifiedActionService
# Tests the entire system design and abstraction layer

set -e

echo "🧪 Testing UnifiedActionService and Agent Abstraction"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0

# Function to run tests
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "${BLUE}▶ Running: ${test_name}${NC}"
    if eval "$test_command"; then
        echo -e "${GREEN}✓ ${test_name} passed${NC}\n"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ ${test_name} failed${NC}\n"
        ((FAILED++))
        return 1
    fi
}

# Navigate to worker directory
cd "$(dirname "$0")/.." || exit 1

echo "1️⃣  Unit Tests: UnifiedActionService"
echo "-----------------------------------"
run_test "UnifiedActionService Unit Tests" \
    "npm run test:unit -- __tests__/unit/services/action-service.test.ts"

echo "2️⃣  Unit Tests: StudyPlanAgent"
echo "-----------------------------------"
run_test "StudyPlanAgent Unit Tests" \
    "npm run test:unit -- __tests__/unit/agents/study-plan-agent.test.ts"

echo "3️⃣  Integration Tests: API Routes"
echo "-----------------------------------"
run_test "UnifiedActionService API Integration Tests" \
    "npm run test:integration -- __tests__/integration/api/v1/unified-action-service.test.ts"

echo "4️⃣  End-to-End Tests: Apex Academy Workflows"
echo "-----------------------------------"
run_test "Study Plan Workflow E2E Tests" \
    "npm run test:integration -- __tests__/integration/apex-academy/study-plan-workflow.test.ts"

echo ""
echo "=================================================="
echo "📊 Test Summary"
echo "=================================================="
echo -e "${GREEN}Passed: ${PASSED}${NC}"
echo -e "${RED}Failed: ${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "🎉 UnifiedActionService is fully tested and functional!"
    echo ""
    echo "Key achievements:"
    echo "  ✓ UnifiedActionService CRUD operations tested"
    echo "  ✓ Agent abstraction layer validated"
    echo "  ✓ API route integration verified"
    echo "  ✓ Apex Academy workflows validated"
    echo "  ✓ System design integrity confirmed"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review the output above.${NC}"
    exit 1
fi

