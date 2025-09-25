import { NextRequest } from 'next/server';
import { ShopifyClient } from '@/lib/shopify/client';

export async function POST(request: NextRequest) {
  try {
    const { domain, accessToken } = await request.json();

    if (!domain || !accessToken) {
      return Response.json(
        { connected: false, error: 'Domain and access token are required' },
        { status: 400 }
      );
    }

    // Initialize Shopify client
    const shopifyClient = new ShopifyClient({
      domain,
      accessToken
    });

    // Test connection only - no product fetching
    const connectionStatus = await shopifyClient.testConnection();

    return Response.json({
      connected: connectionStatus.connected,
      shopName: connectionStatus.shopName,
      error: connectionStatus.error,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Connection verification error:', error);
    return Response.json(
      {
        connected: false,
        error: error.message || 'Connection verification failed'
      },
      { status: 500 }
    );
  }
}