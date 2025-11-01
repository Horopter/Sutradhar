#!/usr/bin/env bash
set -euo pipefail
URL=${1:-http://localhost:4001/actions/github}
SESSION=${SESSION_ID:-"demo-session"}
curl -sS -X POST "$URL" -H "Content-Type: application/json" \
  -d "{\"title\":\"[P1] Upload 500 on >2GB\",\"body\":\"Synthetic repro steps...\",\"sessionId\":\"$SESSION\"}" | jq .

