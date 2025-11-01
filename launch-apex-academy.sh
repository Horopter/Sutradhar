#!/bin/bash

# Launch Apex Academy - Complete Startup Script
# Starts all required services: Convex, Worker API, and Nuxt Frontend

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Launching Apex Academy${NC}"
echo "================================"
echo ""

# Kill existing processes on ports
echo "🧹 Cleaning up existing processes..."
lsof -ti:3000,2198,3210 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 2

# Start Convex
echo -e "${BLUE}1️⃣  Starting Convex...${NC}"
cd "$PROJECT_ROOT/apps/convex"
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    npm install --silent
fi
npx convex dev > /tmp/convex.log 2>&1 &
CONVEX_PID=$!
echo "   PID: $CONVEX_PID"
sleep 5

# Start Worker
echo -e "${BLUE}2️⃣  Starting Worker API...${NC}"
cd "$PROJECT_ROOT/apps/worker"
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    npm install --silent
fi
PORT=2198 npm run dev > /tmp/worker.log 2>&1 &
WORKER_PID=$!
echo "   PID: $WORKER_PID"

# Wait for worker to be ready
echo "   Waiting for worker..."
for i in {1..30}; do
    if curl -s http://localhost:2198/health > /dev/null 2>&1; then
        echo -e "   ${GREEN}✓ Worker ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "   ${YELLOW}⚠ Worker taking longer than expected${NC}"
    fi
    sleep 1
done

# Start Nuxt
echo -e "${BLUE}3️⃣  Starting Nuxt Frontend...${NC}"
cd "$PROJECT_ROOT/apps/nuxt"
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    npm install --silent
fi

# Clear cache
rm -rf .nuxt node_modules/.vite 2>/dev/null || true

npm run dev > /tmp/nuxt.log 2>&1 &
NUXT_PID=$!
echo "   PID: $NUXT_PID"
echo "   First build may take 60-90 seconds..."

# Wait for Nuxt to compile
echo "   Waiting for Nuxt compilation..."
for i in {1..120}; do
    if curl -s http://localhost:3000 2>&1 | grep -q "Apex Academy\|Continue as Guest" 2>/dev/null || ! curl -s http://localhost:3000 2>&1 | grep -q "Nuxt dev server is starting" 2>/dev/null; then
        echo -e "   ${GREEN}✓ Nuxt ready${NC}"
        break
    fi
    if [ $i -eq 120 ]; then
        echo -e "   ${YELLOW}⚠ Nuxt still compiling (this is normal for first build)${NC}"
    fi
    sleep 1
done

echo ""
echo "=========================================="
echo -e "${GREEN}✅ All services started!${NC}"
echo "=========================================="
echo ""
echo -e "📍 Access Points:"
echo -e "   Frontend:  ${BLUE}http://localhost:3000${NC}"
echo -e "   Worker:    ${BLUE}http://localhost:2198${NC}"
echo -e "   Convex:    ${BLUE}http://localhost:3210${NC}"
echo ""
echo -e "📋 Process IDs:"
echo "   Convex: $CONVEX_PID"
echo "   Worker: $WORKER_PID"
echo "   Nuxt:   $NUXT_PID"
echo ""
echo -e "${YELLOW}💡 To stop all services:${NC}"
echo "   kill $CONVEX_PID $WORKER_PID $NUXT_PID"
echo ""

# Save PIDs
echo "$CONVEX_PID $WORKER_PID $NUXT_PID" > /tmp/apex-academy-pids.txt

# Try to open browser
sleep 3
if command -v open &> /dev/null; then
    open http://localhost:3000 2>/dev/null || true
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000 2>/dev/null || true
fi

echo -e "${GREEN}🎉 Apex Academy is launching!${NC}"
echo -e "${YELLOW}⏱️  Note: Nuxt may take 60-90 seconds to fully compile on first build${NC}"
echo ""

