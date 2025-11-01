#!/usr/bin/env bash

set -euo pipefail

URL=${1:-http://localhost:4001/agentmail/send}

curl -sS -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d '{
    "to":"support@demo.local",
    "subject":"[Escalation][P1] Upload 500s",
    "text":"Customer ACME reports 500 on >2GB uploads. Please triage."
  }' | jq .

