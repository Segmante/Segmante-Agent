import { NextRequest, NextResponse } from 'next/server';
import { ShopifyClient } from '@/lib/shopify/client';
import { EnhancedProductSyncService } from '@/lib/sensay/enhanced-product-sync';

export async function POST(request: NextRequest) {
  try {
    const { domain, accessToken } = await request.json();

    if (!domain || !accessToken) {
      return NextResponse.json(
        { error: 'Domain and access token are required' },
        { status: 400 }
      );
    }

    // Initialize Shopify client
    const shopifyClient = new ShopifyClient({
      domain,
      accessToken
    });

    // Test connection first
    const connectionStatus = await shopifyClient.testConnection();
    if (!connectionStatus.connected) {
      return NextResponse.json({
        success: false,
        error: connectionStatus.error || 'Failed to connect to Shopify'
      });
    }

    // Fetch products
    const products = await shopifyClient.getAllProducts();
    const processedProducts = shopifyClient.processProductData(products);

    if (processedProducts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No products found to sync',
        productCount: 0
      });
    }

    // Get Sensay API key
    const sensayApiKey = process.env.NEXT_PUBLIC_SENSAY_API_KEY_SECRET;
    if (!sensayApiKey) {
      return NextResponse.json(
        { error: 'Sensay API key not configured' },
        { status: 500 }
      );
    }

    // Get store name from connection status
    const storeName = connectionStatus.shopName;

    // Use enhanced sync service with per-user isolation
    const syncService = new EnhancedProductSyncService(sensayApiKey);

    const syncResult = await syncService.syncProductsToKnowledgeBase(
      processedProducts,
      domain,
      accessToken,
      storeName
    );

    return NextResponse.json({
      success: syncResult.success,
      productCount: processedProducts.length,
      knowledgeBaseId: syncResult.knowledgeBaseId,
      replicaUuid: syncResult.replicaUuid,
      userId: syncResult.userId,
      status: syncResult.status,
      error: syncResult.error
    });

  } catch (error: any) {
    console.error('Product sync error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Product sync failed'
      },
      { status: 500 }
    );
  }
}