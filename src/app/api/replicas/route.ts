import { NextRequest, NextResponse } from 'next/server';
import { ReplicaService } from '@/lib/services/replica-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'all', 'shopify', or 'knowledge'

    const sensayApiKey = process.env.NEXT_PUBLIC_SENSAY_API_KEY_SECRET;
    if (!sensayApiKey) {
      return NextResponse.json(
        { error: 'Sensay API key not configured' },
        { status: 500 }
      );
    }

    const replicaService = new ReplicaService(sensayApiKey);

    if (type === 'knowledge') {
      const knowledgeBases = await replicaService.getAllKnowledgeBases();
      return NextResponse.json({
        success: true,
        knowledgeBases
      });
    }

    let replicas;
    if (type === 'shopify') {
      replicas = await replicaService.getShopifyReplicas();
    } else {
      replicas = await replicaService.getAllReplicas();
    }

    return NextResponse.json({
      success: true,
      replicas
    });

  } catch (error: any) {
    console.error('Replicas API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch replicas'
      },
      { status: 500 }
    );
  }
}