#!/usr/bin/env bash

set -euo pipefail

URL=${1:-http://localhost:4001/api/answer}

SID=${SID:-demo-session}

Q=${Q:-"What's in the Business plan and any known upload issues?"}

curl -sS -X POST "$URL" -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SID\",\"question\":\"$Q\"}" | jq .

