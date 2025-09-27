import { ShopifyConnectionPersistence } from './connection-persistence';
import { UserSessionManager } from '@/lib/user-session';
import { SensayUserManager } from '@/lib/sensay/user-manager';
import { EnhancedProductSyncService } from '@/lib/sensay/enhanced-product-sync';

export interface ConnectionState {
  connected: boolean;
  isConnected: boolean;
  domain: string;
  shopName: string;
  lastSync?: string;
  productCount?: number;
  knowledgeBaseId?: number;
  replicaUuid?: string;
  userId?: string;
  wasSkipped?: boolean;
  hasReplica?: boolean;
}

export interface ConnectionProgress {
  message: string;
  percentage: number;
  stage?: 'verifying' | 'creating-replica' | 'syncing' | 'completed';
}

export class EnhancedConnectionManager {
  private userManager: SensayUserManager;
  private syncService: EnhancedProductSyncService;

  constructor(apiKey: string) {
    this.userManager = new SensayUserManager(apiKey);
    this.syncService = new EnhancedProductSyncService(apiKey);
  }

  /**
   * Smart connection flow that handles both new users and returning users
   */
  async smartConnect(
    domain: string,
    accessToken: string,
    mode: 'verify' | 'sync' | 'force-sync',
    onProgress?: (progress: ConnectionProgress) => void
  ): Promise<ConnectionState> {
    const formattedDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

    try {
      // Step 1: Always verify Shopify connection first
      onProgress?.({ message: 'Verifying Shopify connection...', percentage: 10 });

      const verificationResult = await this.verifyShopifyConnection(formattedDomain, accessToken);
      if (!verificationResult.connected) {
        throw new Error(verificationResult.error || 'Connection verification failed');
      }

      // Step 2: Get or create user and replica
      onProgress?.({ message: 'Setting up AI assistant...', percentage: 25, stage: 'creating-replica' });

      const userResult = await this.userManager.getOrCreateUserReplica(
        formattedDomain,
        accessToken,
        verificationResult.shopName
      );

      if (!userResult.success || !userResult.userId || !userResult.replicaUuid) {
        throw new Error(userResult.error || 'Failed to set up AI assistant');
      }

      const { userId, replicaUuid } = userResult;

      // Step 3: Handle based on connection mode
      let connectionState: ConnectionState;

      if (mode === 'verify') {
        // Quick connect - just verify and set up minimal state
        connectionState = await this.handleQuickConnect(
          formattedDomain,
          verificationResult.shopName || 'Shopify Store',
          userId,
          replicaUuid,
          onProgress
        );
      } else {
        // Full sync or force sync
        connectionState = await this.handleFullSync(
          formattedDomain,
          accessToken,
          verificationResult.shopName || 'Shopify Store',
          userId,
          replicaUuid,
          mode === 'force-sync',
          onProgress
        );
      }

      // Save connection state and user session
      const connectionStateForPersistence = {
        domain: connectionState.domain,
        shopName: connectionState.shopName,
        isConnected: connectionState.isConnected,
        lastSync: connectionState.lastSync || new Date().toISOString(),
        productCount: connectionState.productCount || 0,
        knowledgeBaseId: connectionState.knowledgeBaseId,
        replicaUuid: connectionState.replicaUuid,
        userId: connectionState.userId
      };
      ShopifyConnectionPersistence.saveConnection(connectionStateForPersistence);
      this.saveUserSession(connectionState);

      return connectionState;

    } catch (error: any) {
      console.error('Enhanced connection error:', error);
      throw new Error(error.message || 'Connection failed');
    }
  }

  /**
   * Handle quick connect mode with replica verification
   */
  private async handleQuickConnect(
    domain: string,
    shopName: string,
    userId: string,
    replicaUuid: string,
    onProgress?: (progress: ConnectionProgress) => void
  ): Promise<ConnectionState> {
    // Check if we have existing connection data
    const existingConnection = ShopifyConnectionPersistence.getConnection();

    console.log(`🚀 Quick Connect: existing productCount=${existingConnection?.productCount}`);

    onProgress?.({ message: 'Quick connection established!', percentage: 100, stage: 'completed' });

    return {
      connected: true,
      isConnected: true,
      domain,
      shopName,
      lastSync: existingConnection?.lastSync || new Date().toISOString(),
      productCount: existingConnection?.productCount || 0,
      knowledgeBaseId: existingConnection?.knowledgeBaseId,
      replicaUuid,
      userId,
      wasSkipped: true,
      hasReplica: true
    };
  }

  /**
   * Handle full sync with product data
   */
  private async handleFullSync(
    domain: string,
    accessToken: string,
    shopName: string,
    userId: string,
    replicaUuid: string,
    _forceSync: boolean,
    onProgress?: (progress: ConnectionProgress) => void
  ): Promise<ConnectionState> {
    onProgress?.({ message: 'Fetching products from Shopify...', percentage: 30, stage: 'syncing' });

    // Fetch products first using ShopifyClient
    const { ShopifyClient } = await import('@/lib/shopify/client');
    const shopifyClient = new ShopifyClient({ domain, accessToken });

    const rawProducts = await shopifyClient.getAllProducts();
    const processedProducts = shopifyClient.processProductData(rawProducts);

    console.log(`🛒 Enhanced Manager: Fetched ${processedProducts.length} products for sync`);

    onProgress?.({ message: 'Starting product synchronization...', percentage: 40, stage: 'syncing' });

    // Use the enhanced sync service with actual product data
    const syncResult = await this.syncService.syncProductsToKnowledgeBase(
      processedProducts, // Pass actual products, not empty array
      domain,
      accessToken,
      shopName,
      (syncProgress) => {
        onProgress?.({
          message: syncProgress.message,
          percentage: 40 + (syncProgress.progress * 0.6), // Map 0-100 to 40-100
          stage: 'syncing'
        });
      }
    );

    if (!syncResult.success) {
      throw new Error(syncResult.error || 'Product synchronization failed');
    }

    onProgress?.({ message: 'Synchronization completed!', percentage: 100, stage: 'completed' });

    // Ensure we return the actual product count from processed products
    const finalProductCount = syncResult.productCount || processedProducts.length || 0;

    console.log(`📊 Enhanced Manager: Returning productCount=${finalProductCount}`);

    return {
      connected: true,
      isConnected: true,
      domain,
      shopName,
      lastSync: new Date().toISOString(),
      productCount: finalProductCount,
      knowledgeBaseId: syncResult.knowledgeBaseId,
      replicaUuid,
      userId,
      hasReplica: true
    };
  }

  /**
   * Verify Shopify connection
   */
  private async verifyShopifyConnection(domain: string, accessToken: string): Promise<{
    connected: boolean;
    shopName?: string;
    error?: string;
  }> {
    try {
      const response = await fetch('/api/shopify/verify-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, accessToken })
      });

      if (!response.ok) {
        throw new Error('Failed to verify Shopify connection');
      }

      return await response.json();
    } catch (error: any) {
      return {
        connected: false,
        error: error.message || 'Connection verification failed'
      };
    }
  }

  /**
   * Save user session for chat interface access
   */
  private saveUserSession(connectionState: ConnectionState): void {
    if (connectionState.replicaUuid && connectionState.userId) {
      UserSessionManager.saveUserSession({
        userId: connectionState.userId,
        replicaUuid: connectionState.replicaUuid,
        shopifyDomain: connectionState.domain,
        storeName: connectionState.shopName,
        createdAt: new Date().toISOString()
      });
      console.log('💾 User session saved for chat interface access');
    }
  }

  /**
   * Get connection recommendations based on existing state
   */
  async getConnectionRecommendations(domain: string): Promise<{
    hasExistingConnection: boolean;
    hasReplica: boolean;
    lastSync?: string;
    recommendedMode: 'verify' | 'sync' | 'force-sync';
    reason: string;
  }> {
    const existingConnection = ShopifyConnectionPersistence.getConnection();

    if (!existingConnection) {
      return {
        hasExistingConnection: false,
        hasReplica: false,
        recommendedMode: 'sync',
        reason: 'First time setup - need to create AI assistant and sync products'
      };
    }

    const hasSameDomain = existingConnection.domain === domain;
    const hasReplica = !!existingConnection.replicaUuid;
    const lastSyncAge = existingConnection.lastSync ?
      Date.now() - new Date(existingConnection.lastSync).getTime() :
      Infinity;

    if (!hasSameDomain) {
      return {
        hasExistingConnection: false,
        hasReplica: false,
        recommendedMode: 'sync',
        reason: 'Different store - need full setup'
      };
    }

    if (!hasReplica) {
      return {
        hasExistingConnection: true,
        hasReplica: false,
        recommendedMode: 'sync',
        reason: 'Store connected but AI assistant not set up'
      };
    }

    if (lastSyncAge > 7 * 24 * 60 * 60 * 1000) { // 7 days
      return {
        hasExistingConnection: true,
        hasReplica: true,
        lastSync: existingConnection.lastSync,
        recommendedMode: 'sync',
        reason: 'Products may be outdated - recommend sync'
      };
    }

    return {
      hasExistingConnection: true,
      hasReplica: true,
      lastSync: existingConnection.lastSync,
      recommendedMode: 'verify',
      reason: 'Recent sync - quick connect recommended'
    };
  }
}