#!/usr/bin/env bash

set -euo pipefail

curl -sS -X POST http://localhost:4001/retrieval/hyperspell/seed \
  -H "Content-Type: application/json" \
  -d '{"text":"Starter memory: SSO sometimes fails due to IdP clock skew >120s."}' | jq .

