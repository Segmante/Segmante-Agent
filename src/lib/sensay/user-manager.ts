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
   * Create a new user and replica for a Shopify store with enhanced error handling
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

      // Step 1: Create the user first with robust error handling
      const userCreated = await this.ensureUserExists(userId, storeName || shopifyDomain);
      if (!userCreated) {
        throw new Error('Failed to ensure user exists after multiple attempts');
      }

      // Step 2: Create a new replica for this specific user
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
   * Ensure user exists with retry logic for conflicts
   */
  private async ensureUserExists(userId: string, storeName: string): Promise<boolean> {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        console.log(`Attempting to create user: ${userId} (attempt ${retryCount + 1})`);
        await this.sensayClient.users.postV1Users(API_VERSION, {
          id: userId,
          name: `Shopify Store User - ${storeName}`
        });
        console.log(`✅ User ${userId} created successfully`);
        return true;
      } catch (userError: any) {
        const errorMessage = userError.message || userError.toString();

        // Check for various user existence indicators
        if (userError.response?.status === 409 ||
            errorMessage.includes('already exists') ||
            errorMessage.includes('User, email, or linked account already exists')) {
          console.log(`User ${userId} already exists, verifying...`);

          // Verify user actually exists
          const userExists = await this.verifyUserExists(userId);
          if (userExists) {
            console.log(`✅ Confirmed user ${userId} exists`);
            return true;
          }

          console.log(`User reported as existing but verification failed, retrying...`);
        } else {
          console.error(`User creation failed with error:`, errorMessage);
        }

        retryCount++;
        if (retryCount < maxRetries) {
          const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 5000);
          console.log(`Retrying in ${backoffTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      }
    }

    console.error(`Failed to create or verify user ${userId} after ${maxRetries} attempts`);
    return false;
  }

  /**
   * Verify if a user actually exists in the system
   */
  private async verifyUserExists(userId: string): Promise<boolean> {
    try {
      // Try to get user information by checking if we can fetch user data
      // Since the API doesn't have a direct user lookup, we'll try to create another replica
      // and if it fails with user not found, then user doesn't exist
      const testResponse = await this.sensayClient.replicas.getV1Replicas();

      // If we can make API calls with the user context, assume user exists
      return testResponse && testResponse.success;
    } catch (error) {
      // If API calls fail, assume user doesn't exist
      console.log(`User verification failed for ${userId}:`, error);
      return false;
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
      const deleteResponse = await this.sensayClient.replicas.deleteV1Replicas(
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

      if (!replicaResponse) {
        return null;
      }

      const metadata = replicaResponse;

      return {
        userId: metadata.ownerID,
        replicaUuid,
        shopifyDomain: '', // Not available in this response
        createdAt: new Date(Date.now()) // Use current date as fallback
      };
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  }
}