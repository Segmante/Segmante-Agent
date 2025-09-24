# Shopify CORS Issue Resolution

## Problem Analysis

The CORS (Cross-Origin Resource Sharing) error occurred when trying to call Shopify Admin API directly from the browser:

```
Access to XMLHttpRequest at 'https://store.myshopify.com/admin/api/2023-10/shop.json'
from origin 'http://localhost:3000' has been blocked by CORS policy:
Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Root Causes

1. **Security Policy**: Shopify Admin API does not allow direct browser requests for security reasons
2. **CORS Headers**: Shopify servers don't include `Access-Control-Allow-Origin` headers for browser requests
3. **API Design**: Shopify Admin API is designed for server-to-server communication only
4. **Token Security**: Admin API tokens are too sensitive to be exposed in client-side code

## Solution Implemented

### Server-Side API Routes

We implemented Next.js API routes to handle Shopify API calls server-side:

#### 1. Connection Test Route
**File**: `/src/app/api/shopify/test-connection/route.ts`
- Tests Shopify connection from server-side
- Validates credentials safely
- Returns connection status and product count

#### 2. Product Sync Route
**File**: `/src/app/api/shopify/sync-products/route.ts`
- Fetches all products from Shopify store
- Processes product data for knowledge base
- Syncs data to Sensay knowledge base
- Returns sync status

### Client-Side Updates

Updated the connection form to use API routes instead of direct Shopify calls:

#### Before (Direct Call - CORS Error):
```typescript
const shopifyClient = new ShopifyClient({ domain, accessToken });
const status = await shopifyClient.testConnection(); // ❌ CORS Error
```

#### After (API Route - Works):
```typescript
const response = await fetch('/api/shopify/test-connection', {
  method: 'POST',
  body: JSON.stringify({ domain, accessToken })
});
const status = await response.json(); // ✅ Works
```

## Security Benefits

1. **Token Protection**: API tokens never leave the server
2. **Request Validation**: Server-side validation of all requests
3. **Error Handling**: Proper error handling and logging
4. **Rate Limiting**: Can implement rate limiting on server routes

## Architecture Flow

```
Browser (localhost:3000)
    ↓ POST /api/shopify/test-connection
Next.js API Route (Server-side)
    ↓ HTTPS Request
Shopify Admin API
    ↓ Response
Next.js API Route
    ↓ JSON Response
Browser (Success!)
```

## Testing

The solution resolves the CORS issue and allows:
1. ✅ Shopify store connection testing
2. ✅ Product data fetching
3. ✅ Sensay knowledge base synchronization
4. ✅ Proper error handling and user feedback

## Alternative Solutions (Not Recommended)

1. **CORS Proxy**: Using a third-party CORS proxy (security risk)
2. **Browser Extensions**: Disabling CORS in browser (development only)
3. **Server Proxy**: Setting up separate proxy server (unnecessary complexity)

Our implemented solution is the **recommended and secure approach** for production applications.