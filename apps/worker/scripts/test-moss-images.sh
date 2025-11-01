#!/bin/bash
# Test Moss Image Search Integration

set -e

BASE_URL="${BASE_URL:-http://localhost:4001}"
MOSS_BRIDGE="${MOSS_BRIDGE_URL:-http://127.0.0.1:4050}"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing Moss Image Search Integration"
echo "========================================"
echo ""

# Test 1: Health check for moss-bridge
echo "1️⃣  Testing Moss Bridge Health..."
if curl -sS "${MOSS_BRIDGE}/health" | jq -e '.ok' > /dev/null 2>&1; then
    echo -e "${GREEN}   ✓ Moss Bridge is healthy${NC}"
    curl -sS "${MOSS_BRIDGE}/health" | jq .
else
    echo -e "${RED}   ✗ Moss Bridge is not responding${NC}"
    echo "   Make sure moss-bridge is running: cd apps/moss-bridge && npm start"
    exit 1
fi
echo ""

# Test 2: Ensure image index exists
echo "2️⃣  Ensuring image index exists..."
ENSURE_RESPONSE=$(curl -sS -X POST "${MOSS_BRIDGE}/images/ensure")
if echo "$ENSURE_RESPONSE" | jq -e '.ok' > /dev/null 2>&1; then
    echo -e "${GREEN}   ✓ Image index ensured${NC}"
    echo "$ENSURE_RESPONSE" | jq .
else
    echo -e "${RED}   ✗ Failed to ensure image index${NC}"
    echo "$ENSURE_RESPONSE" | jq .
    exit 1
fi
echo ""

# Test 3: Index a sample image with URL
echo "3️⃣  Indexing sample image (by URL)..."
INDEX_PAYLOAD='{
  "images": [
    {
      "id": "test-image-1",
      "imageUrl": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
      "metadata": {
        "title": "Test Mountain Image",
        "description": "A beautiful mountain landscape for testing",
        "tags": ["mountain", "landscape", "nature", "test"],
        "url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4"
      }
    },
    {
      "id": "test-image-2",
      "imageUrl": "https://images.unsplash.com/photo-1494500764479-0c8f2919a3d8",
      "metadata": {
        "title": "Test Beach Image",
        "description": "A serene beach scene",
        "tags": ["beach", "ocean", "water", "test"],
        "url": "https://images.unsplash.com/photo-1494500764479-0c8f2919a3d8"
      }
    }
  ]
}'

INDEX_RESPONSE=$(curl -sS -X POST "${MOSS_BRIDGE}/images/index" \
  -H "Content-Type: application/json" \
  -d "$INDEX_PAYLOAD")

if echo "$INDEX_RESPONSE" | jq -e '.ok' > /dev/null 2>&1; then
    echo -e "${GREEN}   ✓ Images indexed successfully${NC}"
    echo "$INDEX_RESPONSE" | jq .
else
    echo -e "${RED}   ✗ Failed to index images${NC}"
    echo "$INDEX_RESPONSE" | jq .
    exit 1
fi
echo ""

# Test 4: Search images by text query
echo "4️⃣  Searching images by text query ('mountain')..."
SEARCH_PAYLOAD='{
  "query": "mountain",
  "maxResults": 5
}'

SEARCH_RESPONSE=$(curl -sS -X POST "${MOSS_BRIDGE}/images/query" \
  -H "Content-Type: application/json" \
  -d "$SEARCH_PAYLOAD")

if echo "$SEARCH_RESPONSE" | jq -e '.ok' > /dev/null 2>&1; then
    echo -e "${GREEN}   ✓ Image search completed${NC}"
    RESULT_COUNT=$(echo "$SEARCH_RESPONSE" | jq '.count // 0')
    if [ "$RESULT_COUNT" -gt 0 ]; then
        echo -e "${GREEN}   ✓ Found $RESULT_COUNT result(s)${NC}"
        echo "$SEARCH_RESPONSE" | jq '{ok, count, query, results: .results | map({id, title, description, tags, url})}'
    else
        echo -e "${YELLOW}   ⚠ No results found${NC}"
        echo "$SEARCH_RESPONSE" | jq .
    fi
else
    echo -e "${RED}   ✗ Image search failed${NC}"
    echo "$SEARCH_RESPONSE" | jq .
    exit 1
fi
echo ""

# Test 5: Test worker API health endpoint
echo "5️⃣  Testing Worker API Image Search Health..."
if curl -sS "${BASE_URL}/api/v1/images/health" | jq -e '.available' > /dev/null 2>&1; then
    echo -e "${GREEN}   ✓ Worker API image service is available${NC}"
    curl -sS "${BASE_URL}/api/v1/images/health" | jq .
else
    echo -e "${YELLOW}   ⚠ Worker API may not be running or not configured${NC}"
    echo "   Make sure worker is running and MOSS_PROJECT_ID/MOSS_PROJECT_KEY are set"
fi
echo ""

# Test 6: Test worker API image search
echo "6️⃣  Testing Worker API Image Search..."
WORKER_SEARCH_PAYLOAD='{
  "query": "beach ocean",
  "maxResults": 3
}'

WORKER_SEARCH_RESPONSE=$(curl -sS -X POST "${BASE_URL}/api/v1/images/search" \
  -H "Content-Type: application/json" \
  -d "$WORKER_SEARCH_PAYLOAD" 2>&1)

if echo "$WORKER_SEARCH_RESPONSE" | jq -e '.ok' > /dev/null 2>&1; then
    echo -e "${GREEN}   ✓ Worker API image search completed${NC}"
    WORKER_RESULT_COUNT=$(echo "$WORKER_SEARCH_RESPONSE" | jq '.count // 0')
    if [ "$WORKER_RESULT_COUNT" -gt 0 ]; then
        echo -e "${GREEN}   ✓ Found $WORKER_RESULT_COUNT result(s)${NC}"
        echo "$WORKER_SEARCH_RESPONSE" | jq '{ok, count, query, results: .results | map({id, title, description, tags})}'
    else
        echo -e "${YELLOW}   ⚠ No results found${NC}"
    fi
else
    echo -e "${YELLOW}   ⚠ Worker API search test skipped or failed${NC}"
    echo "$WORKER_SEARCH_RESPONSE"
fi
echo ""

echo -e "${GREEN}✅ Moss Image Search Integration Tests Complete!${NC}"
echo ""
echo "📝 Summary:"
echo "   - Moss Bridge: ${MOSS_BRIDGE}"
echo "   - Worker API: ${BASE_URL}"
echo "   - Image Index: images (default)"
echo ""

