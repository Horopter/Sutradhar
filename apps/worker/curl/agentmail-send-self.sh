#!/usr/bin/env bash

set -euo pipefail

URL=${1:-http://localhost:4001/agentmail/send}

# Load .env if it exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

TO=${TO:-${AGENTMAIL_FROM_ADDRESS:-support@demo.local}}

curl -sS -X POST "$URL" -H "Content-Type: application/json" -d "{
  \"to\":\"$TO\",
  \"subject\":\"[POC] Sutradhar send test\",
  \"text\":\"Hello from the Draft→Send flow.\"
}" | jq .

