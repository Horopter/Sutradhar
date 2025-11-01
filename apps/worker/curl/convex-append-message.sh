#!/usr/bin/env bash
set -euo pipefail

SID=${1:?Usage: ./convex-append-message.sh <sessionId>}

if [ -z "${CONVEX_URL:-}" ]; then
  echo "Error: CONVEX_URL environment variable is not set"
  echo "Usage: export CONVEX_URL=http://localhost:3210 && $0 <sessionId>"
  exit 1
fi

curl -sS -X POST "$CONVEX_URL/api/mutation" \
  -H "Content-Type: application/json" \
  -d "{\"path\":\"messages:append\",\"args\":{\"sessionId\":\"$SID\",\"from\":\"agent\",\"text\":\"Hello from Convex\"},\"format\":\"json\"}" | jq .
