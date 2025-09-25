import { createHash } from 'crypto';
import { VerboseSensayAPI } from '@/api-debug';
import { API_VERSION } from '@/constants/auth';

export interface SensayUser {
  userId: string;
  replicaUuid: string;
  shopifyDomain: string;
  createdAt: Date;
}

export interface UserCreationResult {
  success: boolean;
  userId?: string;
  replicaUuid?: string;
  error?: string;
}

export class SensayUserManager {
  private sensayClient: VerboseSensayAPI;

  constructor(apiKey: string) {
    this.sensayClient = new VerboseSensayAPI({
      HEADERS: {
        'X-ORGANIZATION-SECRET': apiKey
      }
    });
  }

  /**
   * Generate a unique user ID based on Shopify store domain and access token
   */
  generateUserId(shopifyDomain: string, accessToken: string): string {
    // Create a unique hash from domain and token for user identification
    const combined = `${shopifyDomain}_${accessToken}`;
    return createHash('sha256').update(combined).digest('hex').substring(0, 16);
  }

  /**
   * Create a new user and replica for a Shopify store
   */
  async createUserAndReplica(
    shopifyDomain: string,
    accessToken: string,
    storeName?: string
  ): Promise<UserCreationResult> {
    try {
      const userId = this.generateUserId(shopifyDomain, accessToken);

      console.log(`Creating user and replica for store: ${shopifyDomain}`);
      console.log(`Generated user ID: ${userId}`);

      // Step 1: Create the user first (required before creating replica)
      try {
        console.log(`Creating user with ID: ${userId}`);
        await this.sensayClient.users.postV1Users(API_VERSION, {
          id: userId,
          name: `Shopify Store User - ${storeName || shopifyDomain}`
        });
        console.log(`✅ User ${userId} created successfully`);
      } catch (userError: any) {
        // User might already exist, which is okay
        if (userError.response?.status !== 409) { // 409 = Conflict (user exists)
          console.error('Failed to create user:', userError);
          throw new Error(`Failed to create user: ${userError.message}`);
        }
        console.log(`User ${userId} already exists, continuing...`);
      }

      // Step 2: Create a new replica for this specific user
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const uniqueSlug = `shopify-assistant-${userId}-${randomStr}`;

      const replicaResponse = await this.sensayClient.replicas.postV1Replicas(API_VERSION, {
        name: `${storeName || shopifyDomain} Store Assistant`,
        shortDescription: `Shopify product AI assistant`,
        greeting: `Hello! I'm your AI assistant for ${storeName || shopifyDomain}. I have access to your store's product catalog and can help you with product information, inventory checks, and customer support. How can I help you today?`,
        type: 'brand',
        ownerID: userId,
        private: true,
        slug: uniqueSlug,
        tags: [`shopify:${shopifyDomain}`, 'e-commerce', 'product-assistant'],
        llm: {
          model: 'claude-3-7-sonnet-latest',
          memoryMode: 'rag-search',
          systemMessage: `You are an intelligent AI assistant specialized in Shopify product management and customer support for ${storeName || shopifyDomain}.

Your knowledge base contains detailed information about products in this Shopify store, including:
- Product names, descriptions, and specifications
- Pricing information and variant details
- Current stock levels and availability
- Product categories, tags, and vendor information
- SKU numbers and product IDs

When customers ask about products:
1. Provide accurate and helpful information based on your knowledge base
2. Check current stock levels when mentioning availability
3. Suggest similar or complementary products when appropriate
4. Help with product comparisons and recommendations
5. If you don't have specific information about a product, acknowledge this clearly

Always maintain a helpful, professional, and friendly tone while being informative and accurate.`
        }
      });

      if (!replicaResponse.success || !replicaResponse.uuid) {
        throw new Error('Failed to create replica for user');
      }

      const replicaUuid = replicaResponse.uuid;
      console.log(`Created replica with UUID: ${replicaUuid} for user: ${userId}`);

      return {
        success: true,
        userId,
        replicaUuid
      };

    } catch (error: any) {
      console.error('Error creating user and replica:', error);
      return {
        success: false,
        error: error.message || 'Failed to create user and replica'
      };
    }
  }

  /**
   * Get or create user and replica for a Shopify store
   */
  async getOrCreateUserReplica(
    shopifyDomain: string,
    accessToken: string,
    storeName?: string
  ): Promise<UserCreationResult> {
    try {
      const userId = this.generateUserId(shopifyDomain, accessToken);

      // Try to find existing replica for this user
      const existingReplica = await this.findUserReplica(userId, shopifyDomain);

      if (existingReplica) {
        console.log(`Found existing replica for user ${userId}: ${existingReplica}`);
        return {
          success: true,
          userId,
          replicaUuid: existingReplica
        };
      }

      // Create new replica if none exists
      return await this.createUserAndReplica(shopifyDomain, accessToken, storeName);

    } catch (error: any) {
      console.error('Error getting or creating user replica:', error);
      return {
        success: false,
        error: error.message || 'Failed to get or create user replica'
      };
    }
  }

  /**
   * Find existing replica for a user
   */
  private async findUserReplica(userId: string, shopifyDomain: string): Promise<string | null> {
    try {
      // Get all replicas without owner_uuid filter first
      const replicasResponse = await this.sensayClient.replicas.getV1Replicas();

      if (!replicasResponse.success || !replicasResponse.items) {
        return null;
      }

      // Find replica with matching ownerID and tags
      for (const replica of replicasResponse.items) {
        if (replica.ownerID === userId &&
            replica.tags?.includes(`shopify:${shopifyDomain}`)) {
          return replica.uuid;
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding user replica:', error);
      return null;
    }
  }

  /**
   * Delete user replica (for cleanup)
   */
  async deleteUserReplica(userId: string, replicaUuid: string): Promise<boolean> {
    try {
      const deleteResponse = await this.sensayClient.replicas.deleteV1Replicas1(
        replicaUuid,
        API_VERSION
      );

      if (deleteResponse.success) {
        console.log(`Successfully deleted replica ${replicaUuid} for user ${userId}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error deleting user replica:', error);
      return false;
    }
  }

  /**
   * Get user info from replica UUID
   */
  async getUserInfo(replicaUuid: string): Promise<SensayUser | null> {
    try {
      const replicaResponse = await this.sensayClient.replicas.getV1Replicas1(
        replicaUuid,
        API_VERSION
      );

      if (!replicaResponse.success || !replicaResponse.metadata) {
        return null;
      }

      const metadata = replicaResponse.metadata;

      return {
        userId: metadata.userId,
        replicaUuid,
        shopifyDomain: metadata.shopifyDomain,
        createdAt: new Date(metadata.createdAt)
      };
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  }
}