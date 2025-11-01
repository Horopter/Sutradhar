#!/usr/bin/env bash

set -euo pipefail

URL=${1:-http://localhost:4001/forum/post}

TEXT=${TEXT:-"Temporary workaround: use Desktop app or split files >2GB."}

SESSION_ID=${SESSION_ID:-"demo-session"}

curl -sS -X POST "$URL" -H "Content-Type: application/json" \
  -d "{\"text\":\"$TEXT\",\"sessionId\":\"$SESSION_ID\"}" | jq .

