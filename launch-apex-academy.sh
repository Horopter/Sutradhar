#!/bin/bash

# Launch Apex Academy - Complete Startup Script
# Starts all required services: Sutradhar, Optimus, Convex, and Apex Academy Frontend

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Launching Apex Academy - Teacher in Your Pocket${NC}"
echo "========================================================"
echo ""

# Function to check if port is in use
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    
    echo -e "${YELLOW}   Waiting for $name...${NC}"
    for i in $(seq 1 $max_attempts); do
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}   ✓ $name ready${NC}"
            return 0
        fi
        if [ $i -eq $max_attempts ]; then
            echo -e "${YELLOW}   ⚠ $name taking longer than expected${NC}"
            return 1
        fi
        sleep 1
    done
}

# Kill existing processes on ports
echo -e "${BLUE}🧹 Cleaning up existing processes...${NC}"
for port in 3777 3888 3999 3210; do
    if check_port $port; then
        echo "   Killing process on port $port..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
    fi
done
sleep 2

# Start Sutradhar Orchestrator
echo ""
echo -e "${BLUE}1️⃣  Starting Sutradhar Orchestrator (Port 3999)...${NC}"
cd "$PROJECT_ROOT/apps/sutradhar"
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    npm install --silent
fi
npm run dev > /tmp/sutradhar.log 2>&1 &
SUTRADHAR_PID=$!
echo "   PID: $SUTRADHAR_PID"
echo "   Logs: /tmp/sutradhar.log"

# Wait for Sutradhar
wait_for_service "http://localhost:3999/health" "Sutradhar"
sleep 2

# Start Optimus Backend
echo ""
echo -e "${BLUE}2️⃣  Starting Optimus Backend (Port 3888)...${NC}"
cd "$PROJECT_ROOT/apps/optimus"
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    npm install --silent
fi
npm run dev > /tmp/optimus.log 2>&1 &
OPTIMUS_PID=$!
echo "   PID: $OPTIMUS_PID"
echo "   Logs: /tmp/optimus.log"

# Wait for Optimus (give it more time as it needs to connect to Sutradhar)
echo "   Waiting for Optimus to start and connect to Sutradhar..."
for i in {1..60}; do
    if curl -s http://localhost:3888/health > /dev/null 2>&1; then
        echo -e "${GREEN}   ✓ Optimus ready${NC}"
        break
    fi
    if [ $i -eq 60 ]; then
        echo -e "${YELLOW}   ⚠ Optimus taking longer than expected (check logs at /tmp/optimus.log)${NC}"
    fi
    sleep 1
done
sleep 2

# Start Convex
echo ""
echo -e "${BLUE}3️⃣  Starting Convex Backend...${NC}"
cd "$PROJECT_ROOT/apps/convex"
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    npm install --silent
fi

# Start Convex (runs in foreground, needs to be in separate terminal or handled differently)
# For now, start it in background - user may need to run it separately if needed
npx convex dev > /tmp/convex.log 2>&1 &
CONVEX_PID=$!
echo "   PID: $CONVEX_PID"
echo "   Logs: /tmp/convex.log"
echo "   Note: Convex dev server starting... (may require manual setup on first run)"
echo "   Tip: If Convex fails, run 'cd apps/convex && npx convex dev' separately"
sleep 5

# Start Apex Academy Frontend
echo ""
echo -e "${BLUE}4️⃣  Starting Apex Academy Frontend (Port 3777)...${NC}"
cd "$PROJECT_ROOT/apps/apex-academy"
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    pnpm install --silent || npm install --silent
fi

# Clear Nuxt cache
rm -rf .nuxt node_modules/.vite 2>/dev/null || true

pnpm dev > /tmp/apex-academy.log 2>&1 || npm run dev > /tmp/apex-academy.log 2>&1 &
APEX_PID=$!
echo "   PID: $APEX_PID"
echo "   Logs: /tmp/apex-academy.log"
echo "   Note: First build may take 60-90 seconds..."

# Wait for Apex Academy
echo "   Waiting for frontend compilation..."
for i in {1..120}; do
    if curl -s http://localhost:3777 2>&1 | grep -q "Apex Academy\|Continue as Guest" 2>/dev/null || ! curl -s http://localhost:3777 2>&1 | grep -q "Nuxt dev server is starting" 2>/dev/null; then
        echo -e "${GREEN}   ✓ Frontend ready${NC}"
        break
    fi
    if [ $i -eq 120 ]; then
        echo -e "${YELLOW}   ⚠ Frontend still compiling (normal for first build)${NC}"
    fi
    sleep 1
done

echo ""
echo "========================================================"
echo -e "${GREEN}✅ All services started!${NC}"
echo "========================================================"
echo ""
echo -e "${BLUE}📍 Access Points:${NC}"
echo -e "   Frontend:  ${GREEN}http://localhost:3777${NC}"
echo -e "   Optimus:   ${GREEN}http://localhost:3888${NC}"
echo -e "   Sutradhar: ${GREEN}http://localhost:3999${NC}"
echo -e "   Convex:    ${GREEN}http://localhost:3210${NC} (if configured)"
echo ""
echo -e "${BLUE}📋 Process IDs:${NC}"
echo "   Sutradhar: $SUTRADHAR_PID"
echo "   Optimus:   $OPTIMUS_PID"
echo "   Convex:    $CONVEX_PID"
echo "   Apex:      $APEX_PID"
echo ""
echo -e "${BLUE}📝 Log Files:${NC}"
echo "   Sutradhar: /tmp/sutradhar.log"
echo "   Optimus:   /tmp/optimus.log"
echo "   Convex:    /tmp/convex.log"
echo "   Apex:      /tmp/apex-academy.log"
echo ""
echo -e "${YELLOW}💡 To stop all services:${NC}"
echo "   kill $SUTRADHAR_PID $OPTIMUS_PID $CONVEX_PID $APEX_PID"
echo ""
echo -e "${YELLOW}💡 Or use:${NC}"
echo "   pkill -f 'sutradhar|optimus|convex|apex-academy'"
echo ""

# Save PIDs
echo "$SUTRADHAR_PID $OPTIMUS_PID $CONVEX_PID $APEX_PID" > /tmp/apex-academy-pids.txt

# Try to open browser
sleep 3
if command -v open &> /dev/null; then
    open http://localhost:3777 2>/dev/null || true
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3777 2>/dev/null || true
fi

echo -e "${GREEN}🎉 Apex Academy is launching!${NC}"
echo -e "${YELLOW}⏱️  Note: Frontend may take 60-90 seconds to fully compile on first build${NC}"
echo ""
echo -e "${BLUE}📚 Features Available:${NC}"
echo "   • Adaptive Learning & Personalization"
echo "   • AI Tutoring with Socratic Method"
echo "   • Learning Analytics & Insights"
echo "   • Gamification (Badges, Points, Leaderboards)"
echo "   • Social Learning (Forums, Study Groups)"
echo "   • Content Generation (Summaries, Quizzes, Flashcards)"
echo "   • Advanced Assessment & Code Review"
echo ""
