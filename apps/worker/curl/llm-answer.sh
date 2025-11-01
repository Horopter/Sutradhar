#!/usr/bin/env bash

set -euo pipefail

Q=${Q:-"Draft a reply explaining Business plan and upload limits."}

curl -sS -X POST http://localhost:4001/llm/answer \
  -H "Content-Type: application/json" \
  -d "{\"question\":\"$Q\",\"sessionId\":\"diag\"}" | jq .

