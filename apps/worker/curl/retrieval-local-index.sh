#!/usr/bin/env bash

set -euo pipefail

curl -sS -X POST http://localhost:4001/retrieval/indexSeed | jq .

