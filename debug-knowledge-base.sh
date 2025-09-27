#!/bin/bash

# Debug Knowledge Base Content Generation
# Usage: ./debug-knowledge-base.sh

echo "🔍 Debugging Knowledge Base Content Generation"
echo "============================================="

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
    echo "  ./debug-knowledge-base.sh"
    exit 1
fi

# Debug Knowledge Base Content
log_debug "Testing Knowledge Base Content Generation"
echo "  Store: $DOMAIN"

DEBUG_RESPONSE=$(curl -s -X POST "$BASE_URL/api/shopify/debug-knowledge-base" \
    -H "Content-Type: application/json" \
    -d "{\"domain\": \"$DOMAIN\", \"accessToken\": \"$ACCESS_TOKEN\"}")

# Check if response is valid JSON
if ! echo "$DEBUG_RESPONSE" | jq . >/dev/null 2>&1; then
    log_error "Invalid JSON response from API"
    echo "Raw response: $DEBUG_RESPONSE"
    exit 1
fi

# Extract key metrics
SUCCESS=$(echo "$DEBUG_RESPONSE" | jq -r '.success // false')
RAW_COUNT=$(echo "$DEBUG_RESPONSE" | jq -r '.debug.productCounts.raw // 0')
PROCESSED_COUNT=$(echo "$DEBUG_RESPONSE" | jq -r '.debug.productCounts.processed // 0')
ENHANCED_LENGTH=$(echo "$DEBUG_RESPONSE" | jq -r '.debug.knowledgeBase.enhanced.contentLength // 0')
ORIGINAL_LENGTH=$(echo "$DEBUG_RESPONSE" | jq -r '.debug.knowledgeBase.original.contentLength // 0')
FACTS_COUNT=$(echo "$DEBUG_RESPONSE" | jq -r '.debug.knowledgeBase.enhanced.factsCount // 0')

echo ""
echo "📊 Knowledge Base Debug Results:"
echo "==============================="
echo "✅ Success: $SUCCESS"
echo "📦 Raw Products: $RAW_COUNT"
echo "⚙️ Processed Products: $PROCESSED_COUNT"
echo "📝 Enhanced KB Length: $ENHANCED_LENGTH characters"
echo "📝 Original KB Length: $ORIGINAL_LENGTH characters"
echo "🎯 Generated Facts: $FACTS_COUNT"

if [ "$SUCCESS" = "true" ]; then
    if [ "$RAW_COUNT" -eq 0 ]; then
        log_error "No products found in store!"
        echo "  ➡️ Check if store has products and API permissions"
    elif [ "$PROCESSED_COUNT" -eq 0 ]; then
        log_error "Product processing failed!"
        echo "  ➡️ Check product data processing logic"
    elif [ "$ENHANCED_LENGTH" -lt 500 ]; then
        log_error "Enhanced knowledge base content is too short!"
        echo "  ➡️ Content length: $ENHANCED_LENGTH characters"
        echo "  ➡️ Check enhanced formatting logic"
    elif [ "$ORIGINAL_LENGTH" -lt 200 ]; then
        log_error "Original knowledge base content is too short!"
        echo "  ➡️ Content length: $ORIGINAL_LENGTH characters"
        echo "  ➡️ Check original formatting logic"
    else
        log_success "Knowledge base content generation working correctly!"
        echo "  ➡️ Enhanced format: $ENHANCED_LENGTH characters"
        echo "  ➡️ Original format: $ORIGINAL_LENGTH characters"
        echo "  ➡️ Generated facts: $FACTS_COUNT"
    fi
else
    ERROR_MSG=$(echo "$DEBUG_RESPONSE" | jq -r '.error // "Unknown error"')
    log_error "Debug failed: $ERROR_MSG"
fi

echo ""
echo "🎯 Generated Facts:"
echo "=================="
echo "$DEBUG_RESPONSE" | jq -r '.debug.knowledgeBase.enhanced.facts[]? // empty' | while read fact; do
    echo "  📊 $fact"
done

echo ""
echo "📦 Sample Products:"
echo "=================="
echo "$DEBUG_RESPONSE" | jq -r '.debug.sampleProducts[]? | "  🛍️ " + .title + " (" + .price + ") - " + (.variants|tostring) + " variants"' 2>/dev/null

echo ""
echo "📝 Enhanced Knowledge Base Sample:"
echo "================================="
echo "$DEBUG_RESPONSE" | jq -r '.debug.knowledgeBase.enhanced.content // "No content available"' | head -30

echo ""
echo "📝 Original Knowledge Base Sample:"
echo "================================="
echo "$DEBUG_RESPONSE" | jq -r '.debug.knowledgeBase.original.content // "No content available"' | head -20

echo ""
echo "🏁 Knowledge Base debug completed!"

# Save full response for detailed analysis
echo "$DEBUG_RESPONSE" > debug-kb-response.json
log_debug "Full response saved to debug-kb-response.json"