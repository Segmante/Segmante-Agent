import { NextRequest, NextResponse } from 'next/server';
import { ShopifyClient } from '@/lib/shopify/client';

export async function POST(request: NextRequest) {
  try {
    const { domain, accessToken } = await request.json();

    if (!domain || !accessToken) {
      return NextResponse.json(
        { error: 'Domain and access token are required' },
        { status: 400 }
      );
    }

    const shopifyClient = new ShopifyClient({
      domain,
      accessToken
    });

    const connectionStatus = await shopifyClient.testConnection();

    if (connectionStatus.connected) {
      // Also get product count
      const productCount = await shopifyClient.getProductCount();
      return NextResponse.json({
        ...connectionStatus,
        productCount
      });
    }

    return NextResponse.json(connectionStatus);

  } catch (error: any) {
    console.error('Shopify connection test error:', error);

    return NextResponse.json(
      {
        connected: false,
        error: error.message || 'Connection test failed'
      },
      { status: 500 }
    );
  }
}