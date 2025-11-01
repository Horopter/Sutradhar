#!/usr/bin/env bash

set -euo pipefail

Q=${Q:-"What's in the Business plan?"}

curl -sS -X POST http://localhost:4001/api/answer \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"test\",\"question\":\"$Q\"}" | jq .

