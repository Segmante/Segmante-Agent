import { NextRequest } from 'next/server';
import { ShopifyClient } from '@/lib/shopify/client';
import { EnhancedProductSyncService } from '@/lib/sensay/enhanced-product-sync';

export async function POST(request: NextRequest) {
  try {
    const { domain, accessToken } = await request.json();

    if (!domain || !accessToken) {
      return Response.json(
        { error: 'Domain and access token are required' },
        { status: 400 }
      );
    }

    // Create streaming response using Server-Sent Events
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {

        const sendMessage = (data: any) => {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        try {
          // Initialize Shopify client
          sendMessage({
            type: 'progress',
            stage: 'connecting',
            message: 'Connecting to Shopify store...',
            progress: 5
          });

          const shopifyClient = new ShopifyClient({
            domain,
            accessToken
          });

          // Test connection
          sendMessage({
            type: 'progress',
            stage: 'connecting',
            message: 'Verifying store connection...',
            progress: 15
          });

          const connectionStatus = await shopifyClient.testConnection();
          if (!connectionStatus.connected) {
            sendMessage({
              type: 'error',
              message: connectionStatus.error || 'Failed to connect to Shopify'
            });
            controller.close();
            return;
          }

          // Fetch products
          sendMessage({
            type: 'progress',
            stage: 'fetching',
            message: 'Fetching product catalog...',
            progress: 25
          });

          const products = await shopifyClient.getAllProducts();
          const processedProducts = shopifyClient.processProductData(products);

          if (processedProducts.length === 0) {
            sendMessage({
              type: 'success',
              message: 'Store connected successfully! No products found to sync.',
              progress: 100,
              productCount: 0
            });
            controller.close();
            return;
          }

          sendMessage({
            type: 'progress',
            stage: 'preparing',
            message: `Found ${processedProducts.length} products, preparing sync...`,
            progress: 35,
            productCount: processedProducts.length
          });

          // Get Sensay API key
          const sensayApiKey = process.env.NEXT_PUBLIC_SENSAY_API_KEY_SECRET;
          if (!sensayApiKey) {
            sendMessage({
              type: 'error',
              message: 'AI service configuration error'
            });
            controller.close();
            return;
          }

          // Start sync with progress callbacks
          const syncService = new EnhancedProductSyncService(sensayApiKey);
          const storeName = connectionStatus.shopName;

          const syncResult = await syncService.syncProductsToKnowledgeBase(
            processedProducts,
            domain,
            accessToken,
            storeName,
            // Real-time progress callback - this is the key fix!
            (progressUpdate) => {
              sendMessage({
                type: 'progress',
                stage: progressUpdate.stage,
                message: progressUpdate.message,
                progress: progressUpdate.progress
              });
            }
          );

          // Send final result
          if (syncResult.success) {
            sendMessage({
              type: 'success',
              message: `🎉 Successfully synced ${processedProducts.length} products to AI knowledge base!`,
              progress: 100,
              productCount: processedProducts.length,
              knowledgeBaseId: syncResult.knowledgeBaseId,
              replicaUuid: syncResult.replicaUuid,
              userId: syncResult.userId
            });
          } else {
            sendMessage({
              type: 'error',
              message: syncResult.error || 'Sync failed'
            });
          }

        } catch (error: any) {
          console.error('Sync error:', error);
          sendMessage({
            type: 'error',
            message: error.message || 'Unexpected error during sync'
          });
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
      }
    });

  } catch (error: any) {
    console.error('API error:', error);
    return Response.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}