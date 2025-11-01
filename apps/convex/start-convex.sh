#!/usr/bin/env bash
# Helper script to start Convex dev server
# Run this in an interactive terminal: ./start-convex.sh

set -e

echo "Starting Convex dev server..."
echo "When prompted, choose 'develop locally without an account'"
echo ""

cd "$(dirname "$0")"
npx convex dev

