import { NextRequest, NextResponse } from 'next/server';
import { ShopifyClient } from '@/lib/shopify/client';
import { ProductSyncService } from '@/lib/sensay/product-sync';
import { ReplicaManager } from '@/lib/sensay/replica-manager';

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

    // Initialize proper replica session
    const replicaManager = new ReplicaManager(sensayApiKey);
    const session = await replicaManager.initializeSession();

    console.log('Initialized replica session:', session);

    // Sync to Sensay knowledge base
    const syncService = new ProductSyncService(
      sensayApiKey,
      session.replicaUuid,
      session.userId
    );

    const syncResult = await syncService.syncProductsToKnowledgeBase(processedProducts);

    return NextResponse.json({
      success: syncResult.success,
      productCount: processedProducts.length,
      knowledgeBaseId: syncResult.knowledgeBaseId,
      replicaUuid: session.replicaUuid,
      userId: session.userId,
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