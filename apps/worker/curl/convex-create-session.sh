#!/usr/bin/env bash
set -euo pipefail

if [ -z "${CONVEX_URL:-}" ]; then
  echo "Error: CONVEX_URL environment variable is not set"
  echo "Usage: export CONVEX_URL=http://localhost:3210 && $0"
  exit 1
fi

curl -sS -X POST "$CONVEX_URL/api/mutation" \
  -H "Content-Type: application/json" \
  -d '{"path":"sessions:start","args":{"channel":"email","persona":"Escalator","userName":"Demo"},"format":"json"}' | jq .
