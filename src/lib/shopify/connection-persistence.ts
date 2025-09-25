interface ShopifyConnectionState {
  domain: string;
  shopName: string;
  isConnected: boolean;
  lastSync: string;
  productCount: number;
  knowledgeBaseId?: number;
  replicaUuid?: string;
  userId?: string;
  connectionTimestamp: string;
  lastVerified?: string;
}

interface StorageOptions {
  skipSync?: boolean;
  useExistingKnowledgeBase?: boolean;
}

class ShopifyConnectionPersistence {
  private static STORAGE_KEY = 'shopify_connection_state';
  private static VERIFICATION_THRESHOLD = 5 * 60 * 1000; // 5 minutes

  static saveConnection(state: Omit<ShopifyConnectionState, 'connectionTimestamp'>): void {
    const connectionState: ShopifyConnectionState = {
      ...state,
      connectionTimestamp: new Date().toISOString()
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(connectionState));
      console.log('🔒 Connection state saved:', { domain: state.domain, hasKnowledgeBase: !!state.knowledgeBaseId });
    }
  }

  static getConnection(): ShopifyConnectionState | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const state = JSON.parse(stored) as any;

      // MIGRATION: Fix old data structure that used 'connected' instead of 'isConnected'
      if (state.connected !== undefined && state.isConnected === undefined) {
        state.isConnected = state.connected;
        // Save the migrated data back
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
        console.log('🔄 Migrated connection state from old format');
      }

      console.log('🔓 Connection state loaded:', {
        domain: state.domain,
        isConnected: state.isConnected,
        hasKnowledgeBase: !!state.knowledgeBaseId,
        lastSync: state.lastSync
      });

      return state as ShopifyConnectionState;
    } catch (error) {
      console.error('Error loading connection state:', error);
      return null;
    }
  }

  static clearConnection(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('🗑️ Connection state cleared');
    }
  }

  static needsVerification(state: ShopifyConnectionState): boolean {
    if (!state.lastVerified) return true;

    const lastVerifiedTime = new Date(state.lastVerified).getTime();
    const now = Date.now();

    return (now - lastVerifiedTime) > this.VERIFICATION_THRESHOLD;
  }

  static updateLastVerified(domain: string): void {
    const state = this.getConnection();
    if (state && state.domain === domain) {
      state.lastVerified = new Date().toISOString();
      this.saveConnection(state);
    }
  }

  static shouldSkipSync(state: ShopifyConnectionState): boolean {
    // Skip sync if we already have a knowledge base and it's recent
    if (!state.knowledgeBaseId) return false;

    const lastSyncTime = new Date(state.lastSync).getTime();
    const now = Date.now();
    const syncThreshold = 24 * 60 * 60 * 1000; // 24 hours

    return (now - lastSyncTime) < syncThreshold;
  }

  static getStorageOptions(state: ShopifyConnectionState): StorageOptions {
    return {
      skipSync: this.shouldSkipSync(state),
      useExistingKnowledgeBase: !!state.knowledgeBaseId
    };
  }

  // Check if connection exists for a specific domain
  static hasConnectionForDomain(domain: string): boolean {
    const state = this.getConnection();
    return state?.domain === domain && state?.isConnected === true;
  }

  // Get connection summary for UI
  static getConnectionSummary(): {
    isConnected: boolean;
    domain?: string;
    productCount?: number;
    lastSync?: string;
    canSkipSync?: boolean;
  } {
    const state = this.getConnection();

    if (!state) {
      return { isConnected: false };
    }

    return {
      isConnected: state.isConnected,
      domain: state.domain,
      productCount: state.productCount,
      lastSync: state.lastSync,
      canSkipSync: this.shouldSkipSync(state)
    };
  }
}

export { ShopifyConnectionPersistence };
export type { ShopifyConnectionState, StorageOptions };