#!/usr/bin/env bash
set -euo pipefail
URL=${1:-http://localhost:4001/actions/calendar}
SESSION=${SESSION_ID:-"demo-session"}
# macOS uses -v flag, Linux uses -d flag
if date -v+1H >/dev/null 2>&1; then
  # macOS
  START=$(date -u -v+1H +"%Y-%m-%dT%H:%M:%SZ")
  END=$(date -u -v+1H -v+45M +"%Y-%m-%dT%H:%M:%SZ")
else
  # Linux
  START=$(date -u -d "+1 hour" +"%Y-%m-%dT%H:%M:%SZ")
  END=$(date -u -d "+1 hour 45 minutes" +"%Y-%m-%dT%H:%M:%SZ")
fi
curl -sS -X POST "$URL" -H "Content-Type: application/json" \
  -d "{\"title\":\"Sutradhar AMA\",\"startISO\":\"$START\",\"endISO\":\"$END\",\"description\":\"Q&A\",\"sessionId\":\"$SESSION\"}" | jq .

