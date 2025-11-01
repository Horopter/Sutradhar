#!/bin/bash

# Quick script to verify server is running before tests

BASE_URL="${BASE_URL:-http://localhost:4001}"

if curl -sS "${BASE_URL}/api/unified/system/status" > /dev/null 2>&1; then
    echo "✓ Server is running at ${BASE_URL}"
    exit 0
else
    echo "✗ Server is not running at ${BASE_URL}"
    echo "  Please start the server with: npm run dev"
    exit 1
fi

