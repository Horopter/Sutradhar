#!/usr/bin/env bash
SID=${1:?Usage: ./actions-list.sh <sessionId>}
curl -sS "http://localhost:4001/actions/list?sessionId=$SID" | jq .

