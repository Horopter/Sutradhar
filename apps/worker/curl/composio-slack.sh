#!/usr/bin/env bash
set -euo pipefail
URL=${1:-http://localhost:4001/actions/slack}
SESSION=${SESSION_ID:-"demo-session"}
TEXT=${TEXT:-"Hello from Sutradhar via Composio"}
curl -sS -X POST "$URL" -H "Content-Type: application/json" \
  -d "{\"text\":\"$TEXT\",\"sessionId\":\"$SESSION\"}" | jq .

