#!/bin/bash

# Launch script for Masterbolt
# Starts all required services in separate terminal windows

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🚀 Launching Masterbolt"
echo "========================"
echo ""

# Get the project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Project root: $PROJECT_ROOT"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "🔍 Checking prerequisites..."
if ! command_exists node; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

if ! command_exists pnpm && ! command_exists npm; then
    echo "❌ Neither pnpm nor npm found. Please install one of them"
    exit 1
fi

PACKAGE_MANAGER="pnpm"
if ! command_exists pnpm; then
    PACKAGE_MANAGER="npm"
    echo -e "${YELLOW}⚠️  pnpm not found, using npm${NC}"
fi

echo -e "${GREEN}✓ Prerequisites OK${NC}"
echo ""

# Determine OS and set terminal command
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    TERMINAL_CMD="osascript -e 'tell application \"Terminal\" to do script \"cd $PROJECT_ROOT && $1\"'"
    OPEN_CMD="open"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command_exists gnome-terminal; then
        TERMINAL_CMD="gnome-terminal -- bash -c \"cd $PROJECT_ROOT && $1; exec bash\""
    elif command_exists xterm; then
        TERMINAL_CMD="xterm -e \"cd $PROJECT_ROOT && $1; exec bash\""
    else
        TERMINAL_CMD="echo 'Please open terminals manually and run the commands'"
    fi
    OPEN_CMD="xdg-open"
else
    TERMINAL_CMD="echo 'Please open terminals manually and run the commands'"
    OPEN_CMD="echo"
fi

# Start Convex
echo "1️⃣  Starting Convex (Terminal 1)..."
cd "$PROJECT_ROOT/apps/convex"
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    npm install
fi
eval "$TERMINAL_CMD 'cd $PROJECT_ROOT/apps/convex && echo \"📦 Convex Backend\" && npx convex dev'"
echo -e "${GREEN}✓ Convex starting in new terminal${NC}"
sleep 2

# Start Worker
echo ""
echo "2️⃣  Starting Worker/Sutradhar API (Terminal 2)..."
cd "$PROJECT_ROOT/apps/worker"
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    npm install
fi
eval "$TERMINAL_CMD 'cd $PROJECT_ROOT/apps/worker && echo \"⚙️  Sutradhar Worker API\" && npm run dev'"
echo -e "${GREEN}✓ Worker starting in new terminal${NC}"
sleep 2

# Start Nuxt
echo ""
echo "3️⃣  Starting Nuxt Frontend (Terminal 3)..."
cd "$PROJECT_ROOT/apps/nuxt"
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    $PACKAGE_MANAGER install
fi
eval "$TERMINAL_CMD 'cd $PROJECT_ROOT/apps/masterbolt && echo \"🎨 Masterbolt Frontend\" && $PACKAGE_MANAGER dev'"
echo -e "${GREEN}✓ Nuxt starting in new terminal${NC}"

echo ""
echo "=========================================="
echo -e "${GREEN}✅ All services starting!${NC}"
echo "=========================================="
echo ""
echo "Wait for all services to start, then:"
echo ""
echo "  🌐 Frontend:  ${BLUE}http://localhost:3777${NC}"
echo "  ⚙️  API:       ${BLUE}http://localhost:3888${NC}"
echo "  📦 Convex:    ${BLUE}http://localhost:3210${NC}"
echo ""
echo "Press Enter to open the frontend in your browser..."
read -r
$OPEN_CMD http://localhost:3777 2>/dev/null || echo "Please open http://localhost:3777 manually"

