import { NextRequest } from 'next/server';
import { ShopifyClient } from '@/lib/shopify/client';
import { EnhancedProductSyncService } from '@/lib/sensay/enhanced-product-sync';

export async function POST(request: NextRequest) {
  try {
    const { domain, accessToken } = await request.json();

    if (!domain || !accessToken) {
      return new Response(JSON.stringify({ error: 'Domain and access token are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create streaming response
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendProgress = (type: string, message: string, progress: number, data?: any) => {
          const progressData = JSON.stringify({
            type,
            message,
            progress,
            timestamp: new Date().toISOString(),
            ...data
          });
          controller.enqueue(encoder.encode(`data: ${progressData}\n\n`));
        };

        try {

        // Initialize Shopify client
        sendProgress('progress', 'Connecting to Shopify store...', 5);

        const shopifyClient = new ShopifyClient({
          domain,
          accessToken
        });

        // Test connection
        sendProgress('progress', 'Verifying store connection...', 10);
        const connectionStatus = await shopifyClient.testConnection();
        if (!connectionStatus.connected) {
          sendProgress('error', connectionStatus.error || 'Failed to connect to Shopify', 0);
          controller.close();
          return;
        }

        // Fetch products with progress
        sendProgress('progress', 'Fetching product catalog...', 20);
        const products = await shopifyClient.getAllProducts();
        const processedProducts = shopifyClient.processProductData(products);

        if (processedProducts.length === 0) {
          sendProgress('success', 'Store connected successfully! No products found to sync.', 100, {
            productCount: 0
          });
          controller.close();
          return;
        }

        sendProgress('progress', `Found ${processedProducts.length} products`, 25, {
          productCount: processedProducts.length
        });

        // Get Sensay API key
        const sensayApiKey = process.env.NEXT_PUBLIC_SENSAY_API_KEY_SECRET;
        if (!sensayApiKey) {
          sendProgress('error', 'Sensay AI service configuration error', 0);
          controller.close();
          return;
        }

        // Initialize sync service with progress callbacks
        const syncService = new EnhancedProductSyncService(sensayApiKey);
        const storeName = connectionStatus.shopName;

        // Start sync with real-time progress
        const syncResult = await syncService.syncProductsToKnowledgeBase(
          processedProducts,
          domain,
          accessToken,
          storeName,
          // Real-time progress callback
          (progressUpdate) => {
            sendProgress('progress', progressUpdate.message, progressUpdate.progress);
          }
        );

        if (syncResult.success) {
          sendProgress('success',
            `Successfully synced ${processedProducts.length} products to AI knowledge base`,
            100,
            {
              productCount: processedProducts.length,
              knowledgeBaseId: syncResult.knowledgeBaseId,
              replicaUuid: syncResult.replicaUuid,
              userId: syncResult.userId
            }
          );
        } else {
          sendProgress('error', syncResult.error || 'Sync failed', 0);
        }

        } catch (error: any) {
          console.error('Sync stream error:', error);
          const errorData = JSON.stringify({
            type: 'error',
            message: error.message || 'Unexpected error during sync',
            timestamp: new Date().toISOString()
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error: any) {
    console.error('POST function error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}