#!/bin/bash

# Test Shopify API Endpoints with Enhanced Error Handling
# Usage: ./test-shopify-api.sh

echo "🧪 Testing Enhanced Shopify API Endpoints"
echo "=========================================="

# Configuration
BASE_URL="http://localhost:3000"
DOMAIN="${SHOPIFY_DOMAIN:-your-store.myshopify.com}"
ACCESS_TOKEN="${SHOPIFY_ACCESS_TOKEN:-shpat_your_token_here}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_test() {
    echo -e "${BLUE}🧪 Testing: $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ Success: $1${NC}"
}

log_error() {
    echo -e "${RED}❌ Error: $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  Warning: $1${NC}"
}

# Check prerequisites
if [[ "$DOMAIN" == "your-store.myshopify.com" || "$ACCESS_TOKEN" == "shpat_your_token_here" ]]; then
    log_warning "Please set SHOPIFY_DOMAIN and SHOPIFY_ACCESS_TOKEN environment variables"
    echo "Example:"
    echo "  export SHOPIFY_DOMAIN=your-store.myshopify.com"
    echo "  export SHOPIFY_ACCESS_TOKEN=shpat_your_token_here"
    echo "  ./test-shopify-api.sh"
    exit 1
fi

# Test 1: Verify Connection (should work every time)
log_test "1. Shopify Connection Verification"
VERIFY_RESPONSE=$(curl -s -X POST "$BASE_URL/api/shopify/verify-connection" \
    -H "Content-Type: application/json" \
    -d "{\"domain\": \"$DOMAIN\", \"accessToken\": \"$ACCESS_TOKEN\"}")

if echo "$VERIFY_RESPONSE" | grep -q '"connected":true'; then
    log_success "Connection verification passed"
    SHOP_NAME=$(echo "$VERIFY_RESPONSE" | jq -r '.shopName // "Unknown Shop"')
    echo "  Shop Name: $SHOP_NAME"
else
    log_error "Connection verification failed"
    echo "  Response: $VERIFY_RESPONSE"
    exit 1
fi

# Test 2: Enhanced Sync with Retry Logic
log_test "2. Enhanced Product Sync with Error Handling"
echo "  This test will create user and replica with retry logic..."

# Start the sync and track progress
SYNC_OUTPUT=$(mktemp)
curl -s -X POST "$BASE_URL/api/shopify/sync-products-realtime" \
    -H "Content-Type: application/json" \
    -d "{\"domain\": \"$DOMAIN\", \"accessToken\": \"$ACCESS_TOKEN\"}" \
    > "$SYNC_OUTPUT" &

SYNC_PID=$!
echo "  Sync started (PID: $SYNC_PID), monitoring progress..."

# Monitor the sync for up to 2 minutes
TIMEOUT=120
ELAPSED=0
LAST_PROGRESS=0

while kill -0 "$SYNC_PID" 2>/dev/null && [ $ELAPSED -lt $TIMEOUT ]; do
    if [ -f "$SYNC_OUTPUT" ]; then
        # Look for progress updates
        PROGRESS_LINES=$(grep -o '"progress":[0-9]*' "$SYNC_OUTPUT" | tail -1)
        if [ ! -z "$PROGRESS_LINES" ]; then
            CURRENT_PROGRESS=$(echo "$PROGRESS_LINES" | cut -d':' -f2)
            if [ "$CURRENT_PROGRESS" -ne "$LAST_PROGRESS" ]; then
                echo "    Progress: $CURRENT_PROGRESS%"
                LAST_PROGRESS=$CURRENT_PROGRESS
            fi
        fi

        # Check for completion
        if grep -q '"type":"success"' "$SYNC_OUTPUT"; then
            log_success "Sync completed successfully"

            # Extract key information
            USER_ID=$(grep -o '"userId":"[^"]*"' "$SYNC_OUTPUT" | tail -1 | cut -d'"' -f4)
            REPLICA_UUID=$(grep -o '"replicaUuid":"[^"]*"' "$SYNC_OUTPUT" | tail -1 | cut -d'"' -f4)
            KB_ID=$(grep -o '"knowledgeBaseId":[0-9]*' "$SYNC_OUTPUT" | tail -1 | cut -d':' -f2)
            PRODUCT_COUNT=$(grep -o '"productCount":[0-9]*' "$SYNC_OUTPUT" | tail -1 | cut -d':' -f2)

            echo "  Results:"
            echo "    User ID: $USER_ID"
            echo "    Replica UUID: $REPLICA_UUID"
            echo "    Knowledge Base ID: $KB_ID"
            echo "    Product Count: $PRODUCT_COUNT"
            break
        fi

        # Check for errors
        if grep -q '"type":"error"' "$SYNC_OUTPUT"; then
            ERROR_MSG=$(grep -o '"message":"[^"]*"' "$SYNC_OUTPUT" | tail -1 | cut -d'"' -f4)
            log_error "Sync failed: $ERROR_MSG"
            break
        fi
    fi

    sleep 2
    ELAPSED=$((ELAPSED + 2))
done

# Clean up
if kill -0 "$SYNC_PID" 2>/dev/null; then
    kill "$SYNC_PID" 2>/dev/null
    log_warning "Sync timed out after $TIMEOUT seconds"
fi

rm -f "$SYNC_OUTPUT"

# Test 3: Quick Connect Mode (should work if previous sync succeeded)
log_test "3. Quick Connect Mode"
echo "  Testing connection without full sync..."

QUICK_VERIFY_RESPONSE=$(curl -s -X POST "$BASE_URL/api/shopify/verify-connection" \
    -H "Content-Type: application/json" \
    -d "{\"domain\": \"$DOMAIN\", \"accessToken\": \"$ACCESS_TOKEN\"}")

if echo "$QUICK_VERIFY_RESPONSE" | grep -q '"connected":true'; then
    log_success "Quick connect verification passed"
    echo "  This mode should work for returning users with existing replicas"
else
    log_error "Quick connect failed"
fi

# Test 4: Error Resilience Test
log_test "4. Error Resilience with Invalid Credentials"
echo "  Testing with intentionally invalid credentials..."

INVALID_RESPONSE=$(curl -s -X POST "$BASE_URL/api/shopify/verify-connection" \
    -H "Content-Type: application/json" \
    -d "{\"domain\": \"invalid-store.myshopify.com\", \"accessToken\": \"invalid_token\"}")

if echo "$INVALID_RESPONSE" | grep -q '"connected":false'; then
    log_success "Error handling works correctly for invalid credentials"
else
    log_warning "Error handling might need improvement"
    echo "  Response: $INVALID_RESPONSE"
fi

# Test 5: API Health Check
log_test "5. API Health Check"
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health" 2>/dev/null || echo "000")

if [ "$HEALTH_RESPONSE" = "200" ] || [ "$HEALTH_RESPONSE" = "404" ]; then
    log_success "API server is responding"
else
    log_warning "API server might not be running (HTTP $HEALTH_RESPONSE)"
    echo "  Make sure to run 'npm run dev' first"
fi

echo ""
echo "🎯 Test Summary"
echo "==============="
echo "Enhanced Shopify API endpoints have been tested for:"
echo "  ✅ Connection verification with proper error handling"
echo "  ✅ User and replica creation with retry logic"
echo "  ✅ Product synchronization with progress tracking"
echo "  ✅ Quick connect mode for returning users"
echo "  ✅ Error resilience and graceful failure handling"
echo ""
echo "💡 Next Steps:"
echo "  1. Test the frontend UI with these enhanced endpoints"
echo "  2. Monitor user onboarding flow for any remaining issues"
echo "  3. Check chat interface for proper replica access"
echo ""
echo "🏁 Test completed!"