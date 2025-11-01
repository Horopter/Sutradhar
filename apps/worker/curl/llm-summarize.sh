#!/usr/bin/env bash

set -euo pipefail

TEXT=${TEXT:-"Uploads >2GB fail on web. Desktop app works. Fix rolling out."}

curl -sS -X POST http://localhost:4001/llm/summarize \
  -H "Content-Type: application/json" \
  -d "{\"body\":\"$TEXT\"}" | jq .

