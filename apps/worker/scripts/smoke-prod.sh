#!/usr/bin/env bash

set -euo pipefail

BASE=${BASE_URL:-http://localhost:4001}

echo "=== Production Smoke Tests ==="
echo "Base URL: $BASE"
echo ""

echo "== Health =="
curl -sS "$BASE/health/full" | jq '.ok, .demo_ready, .blockers' || echo "Health check failed"
echo ""

echo "== Answer =="
curl -sS -X POST "$BASE/api/answer" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"smoke-test","question":"Business plan upload limits?"}' | \
  jq '.ok, .finalText[0:100]' || echo "Answer endpoint failed"
echo ""

echo "== Forum (mock) =="
curl -sS -X POST "$BASE/forum/post" \
  -H "Content-Type: application/json" \
  -d '{"text":"Workaround posted","sessionId":"smoke-test"}' | \
  jq '.ok, .mocked' || echo "Forum endpoint failed"
echo ""

echo "=== Smoke tests complete ==="

