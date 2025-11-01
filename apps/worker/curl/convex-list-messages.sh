#!/usr/bin/env bash
set -euo pipefail

SID=${1:?Usage: ./convex-list-messages.sh <sessionId>}

if [ -z "${CONVEX_URL:-}" ]; then
  echo "Error: CONVEX_URL environment variable is not set"
  echo "Usage: export CONVEX_URL=http://localhost:3210 && $0 <sessionId>"
  exit 1
fi

curl -sS -X POST "$CONVEX_URL/api/query" \
  -H "Content-Type: application/json" \
  -d "{\"path\":\"messages:bySession\",\"args\":{\"sessionId\":\"$SID\"},\"format\":\"json\"}" | jq .
