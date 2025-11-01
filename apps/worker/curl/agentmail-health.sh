#!/usr/bin/env bash

curl -sS http://localhost:4001/health | jq .

