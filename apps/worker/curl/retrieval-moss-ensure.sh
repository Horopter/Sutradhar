#!/usr/bin/env bash

set -euo pipefail

curl -sS -X POST ${MOSS_BRIDGE_URL:-http://127.0.0.1:4050}/ensure | jq .

