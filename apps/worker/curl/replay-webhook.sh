#!/usr/bin/env bash

set -euo pipefail

URL=${1:-http://localhost:4001/dev/replay-webhook}

curl -sS -X POST "$URL" -H "Content-Type: application/json" -d '{}' | jq .

