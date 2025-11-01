#!/usr/bin/env bash

set -euo pipefail

KEY=${1:?Usage: ./toggle.sh <KEY> <VALUE>}
VAL=${2:?Usage: ./toggle.sh <KEY> <VALUE>}

curl -sS -X POST http://localhost:4001/admin/toggle \
  -H "Content-Type: application/json" \
  -d "{\"key\":\"$KEY\",\"value\":\"$VAL\"}" | jq .

