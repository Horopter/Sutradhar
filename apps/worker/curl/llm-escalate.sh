#!/usr/bin/env bash

set -euo pipefail

BODY=${BODY:-"Customer ACME (Business, 42 seats) affected by upload failures >2GB. Need ETA + workaround."}

curl -sS -X POST http://localhost:4001/llm/escalate \
  -H "Content-Type: application/json" \
  -d "{\"body\":\"$BODY\"}" | jq .

