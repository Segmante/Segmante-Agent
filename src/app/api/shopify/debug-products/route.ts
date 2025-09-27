import { NextRequest } from 'next/server';
import { ShopifyClient } from '@/lib/shopify/client';

export async function POST(request: NextRequest) {
  try {
    const { domain, accessToken } = await request.json();

    if (!domain || !accessToken) {
      return Response.json(
        { error: 'Domain and access token are required' },
        { status: 400 }
      );
    }

    console.log('🔍 DEBUG: Starting product fetch debug...');
    console.log('🏪 Domain:', domain);

    // Initialize Shopify client
    const shopifyClient = new ShopifyClient({
      domain,
      accessToken
    });

    // Step 1: Test connection
    console.log('🔗 Testing Shopify connection...');
    const connectionStatus = await shopifyClient.testConnection();
    console.log('✅ Connection result:', connectionStatus);

    if (!connectionStatus.connected) {
      return Response.json({
        success: false,
        error: 'Connection failed',
        connectionStatus
      });
    }

    // Step 2: Get product count first
    console.log('📊 Getting product count...');
    const productCount = await shopifyClient.getProductCount();
    console.log(`📦 Product count from API: ${productCount}`);

    // Step 3: Fetch products
    console.log('📦 Fetching products...');
    const rawProducts = await shopifyClient.getAllProducts();
    console.log(`📦 Raw products fetched: ${rawProducts.length}`);

    // Log first product details if available
    if (rawProducts.length > 0) {
      console.log('🔍 First product sample:', {
        id: rawProducts[0].id,
        title: rawProducts[0].title,
        vendor: rawProducts[0].vendor,
        productType: rawProducts[0].product_type,
        variants: rawProducts[0].variants?.length || 0,
        hasDescription: !!rawProducts[0].body_html,
        tags: rawProducts[0].tags
      });
    }

    // Step 4: Process products
    console.log('⚙️ Processing products...');
    const processedProducts = shopifyClient.processProductData(rawProducts);
    console.log(`⚙️ Processed products: ${processedProducts.length}`);

    // Log processed product sample
    if (processedProducts.length > 0) {
      console.log('🔍 First processed product sample:', {
        id: processedProducts[0].id,
        title: processedProducts[0].title,
        description: processedProducts[0].description?.substring(0, 100) + '...',
        price: processedProducts[0].price,
        variants: processedProducts[0].variants.length,
        inventory: processedProducts[0].inventory
      });
    }

    // Step 5: Format for knowledge base
    console.log('📝 Formatting for knowledge base...');
    const formattedData = shopifyClient.formatForKnowledgeBase(processedProducts.slice(0, 2)); // Just first 2 for debugging
    console.log('📝 Knowledge base format sample length:', formattedData.length);
    console.log('📝 Knowledge base content preview:', formattedData.substring(0, 500) + '...');

    return Response.json({
      success: true,
      debug: {
        connectionStatus,
        productCountFromAPI: productCount,
        rawProductsFetched: rawProducts.length,
        processedProducts: processedProducts.length,
        firstRawProduct: rawProducts[0] || null,
        firstProcessedProduct: processedProducts[0] || null,
        knowledgeBaseSample: formattedData.substring(0, 1000),
        sampleProductTitles: processedProducts.slice(0, 5).map(p => p.title)
      }
    });

  } catch (error: any) {
    console.error('🚨 DEBUG ERROR:', error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}