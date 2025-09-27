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

    console.log('🔍 DEBUG: Knowledge Base Content Generation...');
    console.log('🏪 Domain:', domain);

    // Step 1: Fetch and process products
    const shopifyClient = new ShopifyClient({ domain, accessToken });

    const connectionStatus = await shopifyClient.testConnection();
    if (!connectionStatus.connected) {
      return Response.json({
        success: false,
        error: 'Shopify connection failed',
        connectionStatus
      });
    }

    const rawProducts = await shopifyClient.getAllProducts();
    const processedProducts = shopifyClient.processProductData(rawProducts);

    console.log(`📦 Products: ${rawProducts.length} raw → ${processedProducts.length} processed`);

    // Step 2: Test Enhanced Product Sync formatting
    const sensayApiKey = process.env.NEXT_PUBLIC_SENSAY_API_KEY_SECRET;
    if (!sensayApiKey) {
      return Response.json({
        success: false,
        error: 'Sensay API key not configured'
      });
    }

    const syncService = new EnhancedProductSyncService(sensayApiKey);

    // Access the private method via reflection for debugging
    const formatMethod = (syncService as any).formatEnhancedProductData.bind(syncService);
    const { rawText, generatedFacts } = formatMethod(processedProducts, connectionStatus.shopName);

    console.log(`📝 Knowledge Base:`)
    console.log(`   - Content length: ${rawText.length}`)
    console.log(`   - Facts count: ${generatedFacts.length}`)

    // Step 3: Test original Shopify client formatting (for comparison)
    const originalFormatted = shopifyClient.formatForKnowledgeBase(processedProducts);

    console.log(`📝 Original formatting: ${originalFormatted.length} characters`);

    return Response.json({
      success: true,
      debug: {
        shopifyConnection: connectionStatus,
        productCounts: {
          raw: rawProducts.length,
          processed: processedProducts.length
        },
        knowledgeBase: {
          enhanced: {
            contentLength: rawText.length,
            factsCount: generatedFacts.length,
            content: rawText.substring(0, 2000) + (rawText.length > 2000 ? '...' : ''),
            facts: generatedFacts
          },
          original: {
            contentLength: originalFormatted.length,
            content: originalFormatted.substring(0, 1000) + (originalFormatted.length > 1000 ? '...' : '')
          }
        },
        sampleProducts: processedProducts.slice(0, 3).map(p => ({
          id: p.id,
          title: p.title,
          description: p.description?.substring(0, 100) + '...',
          price: p.price,
          variants: p.variants.length,
          inventory: p.inventory
        }))
      }
    });

  } catch (error: any) {
    console.error('🚨 DEBUG KB ERROR:', error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}