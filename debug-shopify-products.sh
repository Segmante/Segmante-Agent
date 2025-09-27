#!/bin/bash

# Debug Shopify Products API
# Usage: ./debug-shopify-products.sh

echo "🔍 Debugging Shopify Products Pipeline"
echo "======================================"

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
log_debug() {
    echo -e "${BLUE}🔍 Debug: $1${NC}"
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
    echo "  ./debug-shopify-products.sh"
    exit 1
fi

# Debug Products Pipeline
log_debug "Testing Shopify Products Pipeline"
echo "  Store: $DOMAIN"

DEBUG_RESPONSE=$(curl -s -X POST "$BASE_URL/api/shopify/debug-products" \
    -H "Content-Type: application/json" \
    -d "{\"domain\": \"$DOMAIN\", \"accessToken\": \"$ACCESS_TOKEN\"}")

echo "📊 Debug Response:"
echo "$DEBUG_RESPONSE" | jq '.' 2>/dev/null || echo "$DEBUG_RESPONSE"

# Extract key metrics
SUCCESS=$(echo "$DEBUG_RESPONSE" | jq -r '.success // false')
PRODUCT_COUNT=$(echo "$DEBUG_RESPONSE" | jq -r '.debug.productCountFromAPI // 0')
FETCHED_COUNT=$(echo "$DEBUG_RESPONSE" | jq -r '.debug.rawProductsFetched // 0')
PROCESSED_COUNT=$(echo "$DEBUG_RESPONSE" | jq -r '.debug.processedProducts // 0')
KB_SAMPLE_LENGTH=$(echo "$DEBUG_RESPONSE" | jq -r '.debug.knowledgeBaseSample | length // 0')

echo ""
echo "📈 Pipeline Summary:"
echo "==================="
echo "✅ Success: $SUCCESS"
echo "📊 Product Count from API: $PRODUCT_COUNT"
echo "📦 Raw Products Fetched: $FETCHED_COUNT"
echo "⚙️ Processed Products: $PROCESSED_COUNT"
echo "📝 Knowledge Base Sample Length: $KB_SAMPLE_LENGTH characters"

if [ "$SUCCESS" = "true" ]; then
    if [ "$PRODUCT_COUNT" -gt 0 ] && [ "$FETCHED_COUNT" -eq 0 ]; then
        log_error "Store has $PRODUCT_COUNT products but none were fetched!"
        echo "  ➡️ Check Shopify API permissions and product visibility"
    elif [ "$FETCHED_COUNT" -gt 0 ] && [ "$PROCESSED_COUNT" -eq 0 ]; then
        log_error "Products were fetched but processing failed!"
        echo "  ➡️ Check product data processing logic"
    elif [ "$PROCESSED_COUNT" -gt 0 ] && [ "$KB_SAMPLE_LENGTH" -lt 100 ]; then
        log_error "Products were processed but knowledge base content is too short!"
        echo "  ➡️ Check knowledge base formatting logic"
    elif [ "$PROCESSED_COUNT" -gt 0 ] && [ "$KB_SAMPLE_LENGTH" -gt 100 ]; then
        log_success "Pipeline working correctly!"
        echo "  ➡️ Products are being fetched, processed, and formatted properly"
    else
        log_warning "Unusual metrics detected - review debug output above"
    fi
else
    ERROR_MSG=$(echo "$DEBUG_RESPONSE" | jq -r '.error // "Unknown error"')
    log_error "Debug failed: $ERROR_MSG"
fi

echo ""
echo "🔍 Sample Products:"
echo "=================="
echo "$DEBUG_RESPONSE" | jq -r '.debug.sampleProductTitles[]? // empty' | head -5 | while read title; do
    echo "  📦 $title"
done

echo ""
echo "📝 Knowledge Base Sample:"
echo "========================="
echo "$DEBUG_RESPONSE" | jq -r '.debug.knowledgeBaseSample // "No sample available"' | head -20

echo ""
echo "🏁 Debug completed!"