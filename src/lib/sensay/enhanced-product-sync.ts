import { VerboseSensayAPI } from '@/api-debug';
import { ProcessedProductData } from '../shopify/types';
import { API_VERSION } from '@/constants/auth';
import { SensayUserManager } from './user-manager';
import { DocumentationKnowledgeBaseService } from '@/lib/services/documentation-knowledge-base';

export interface SyncStatus {
  success: boolean;
  knowledgeBaseId?: number;
  status?: string;
  error?: string;
  productCount?: number;
  isUpdate?: boolean;
}

export interface SyncProgress {
  stage: 'preparing' | 'uploading' | 'processing' | 'completed' | 'error';
  message: string;
  progress: number; // 0-100
}

export interface UserKnowledgeBase {
  userId: string;
  replicaUuid: string;
  knowledgeBaseId: number;
  lastSyncAt: Date;
  productCount: number;
}

export class EnhancedProductSyncService {
  private sensayClient: VerboseSensayAPI;
  private userManager: SensayUserManager;
  private documentationService: DocumentationKnowledgeBaseService;
  private apiKey: string;
  private knowledgeBaseStorage: Map<string, UserKnowledgeBase> = new Map();

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.userManager = new SensayUserManager(apiKey);
    this.documentationService = new DocumentationKnowledgeBaseService(apiKey);
    this.sensayClient = new VerboseSensayAPI({
      HEADERS: {
        'X-ORGANIZATION-SECRET': apiKey
      }
    });
  }

  /**
   * Smart sync that updates existing knowledge base or creates new one
   */
  async syncProductsToKnowledgeBase(
    products: ProcessedProductData[],
    shopifyDomain: string,
    shopifyAccessToken: string,
    storeName?: string,
    onProgress?: (progress: SyncProgress) => void
  ): Promise<SyncStatus & { userId?: string; replicaUuid?: string }> {
    try {
      // Stage 1: Get or create user-specific replica
      onProgress?.({
        stage: 'preparing',
        message: 'Setting up user-specific AI replica...',
        progress: 5
      });

      const userResult = await this.userManager.getOrCreateUserReplica(
        shopifyDomain,
        shopifyAccessToken,
        storeName
      );

      if (!userResult.success || !userResult.userId || !userResult.replicaUuid) {
        throw new Error(userResult.error || 'Failed to create user replica');
      }

      const { userId, replicaUuid } = userResult;

      // Update client with user ID for this session
      this.sensayClient = new VerboseSensayAPI({
        HEADERS: {
          'X-ORGANIZATION-SECRET': this.apiKey,
          'X-USER-ID': userId
        }
      });

      // Stage 2: Check for existing knowledge base
      onProgress?.({
        stage: 'preparing',
        message: 'Checking for existing product knowledge base...',
        progress: 15
      });

      const existingKnowledgeBase = await this.findExistingKnowledgeBase(userId, replicaUuid);

      let knowledgeBaseId: number;
      let isUpdate = false;

      if (existingKnowledgeBase) {
        // Update existing knowledge base
        knowledgeBaseId = existingKnowledgeBase.knowledgeBaseId;
        isUpdate = true;
        console.log(`Updating existing knowledge base ${knowledgeBaseId} for user ${userId}`);
      } else {
        // Create new knowledge base
        onProgress?.({
          stage: 'uploading',
          message: 'Creating new knowledge base entry...',
          progress: 25
        });

        const createResponse = await this.sensayClient.training.postV1ReplicasTraining(
          replicaUuid,
          API_VERSION
        );

        if (!createResponse.success) {
          throw new Error('Failed to create knowledge base entry');
        }

        knowledgeBaseId = createResponse.knowledgeBaseID!;
        console.log(`Created new knowledge base ${knowledgeBaseId} for user ${userId}`);
      }

      // Stage 3: Prepare enhanced data with facts
      onProgress?.({
        stage: 'preparing',
        message: 'Preparing enhanced product data...',
        progress: 35
      });

      console.log(`📊 Formatting ${products.length} products for knowledge base...`);

      // Validate products data before formatting
      if (!products || products.length === 0) {
        throw new Error('No products provided to sync - check Shopify product fetch');
      }

      const { rawText, generatedFacts } = this.formatEnhancedProductData(products, storeName || shopifyDomain);

      console.log(`📝 Generated knowledge base content:`);
      console.log(`   - Length: ${rawText.length} characters`);
      console.log(`   - Facts: ${generatedFacts.length}`);
      console.log(`   - Sample: ${rawText.substring(0, 200)}...`);

      if (rawText.length < 100) {
        console.warn('⚠️ Warning: Knowledge base content is very short!');
        console.log('Raw text:', rawText);
      }

      // Stage 4: Upload or update product data
      const uploadProgress = isUpdate ? 50 : 45;
      onProgress?.({
        stage: 'uploading',
        message: isUpdate ? 'Updating product knowledge base...' : 'Uploading product data...',
        progress: uploadProgress
      });

      if (isUpdate) {
        // For updates, delete the old knowledge base and create a new one
        // This is because the current SDK doesn't support PATCH for knowledge base
        try {
          console.log(`Deleting old knowledge base ${knowledgeBaseId} for update`);
          await this.sensayClient.training.deleteV1Training(knowledgeBaseId, API_VERSION);

          // Create new knowledge base
          const createResponse = await this.sensayClient.training.postV1ReplicasTraining(
            replicaUuid,
            API_VERSION
          );

          if (!createResponse.success) {
            throw new Error('Failed to create new knowledge base for update');
          }

          knowledgeBaseId = createResponse.knowledgeBaseID!;
          console.log(`Created new knowledge base ${knowledgeBaseId} for update`);
        } catch (deleteError) {
          console.warn('Could not delete old knowledge base, creating new one:', deleteError);

          // If delete fails, just create a new knowledge base
          const createResponse = await this.sensayClient.training.postV1ReplicasTraining(
            replicaUuid,
            API_VERSION
          );

          if (!createResponse.success) {
            throw new Error('Failed to create knowledge base after delete failure');
          }

          knowledgeBaseId = createResponse.knowledgeBaseID!;
          console.log(`Created fallback knowledge base ${knowledgeBaseId}`);
        }
      }

      // Upload data to knowledge base (both new and updated)
      console.log(`📤 Uploading to knowledge base ${knowledgeBaseId}...`);
      console.log(`   - Replica UUID: ${replicaUuid}`);
      console.log(`   - Content size: ${rawText.length} characters`);

      const uploadResponse = await this.sensayClient.training.putV1ReplicasTraining(
        replicaUuid,
        knowledgeBaseId,
        {
          rawText
        }
      );

      console.log(`📤 Upload response:`, {
        success: uploadResponse.success,
        // Note: uploadResponse may not have status/error properties in all cases
        ...(uploadResponse as any).status && { status: (uploadResponse as any).status },
        ...(uploadResponse as any).error && { error: (uploadResponse as any).error }
      });

      if (!uploadResponse.success) {
        const errorMsg = (uploadResponse as any).error || 'Unknown error';
        throw new Error(`Failed to upload product data: ${errorMsg}`);
      }

      console.log(`✅ Product data ${isUpdate ? 'updated' : 'uploaded'} successfully to KB ${knowledgeBaseId}`);

      // Stage 5: Monitor processing
      onProgress?.({
        stage: 'processing',
        message: 'Processing updated product knowledge...',
        progress: 70
      });

      const finalStatus = await this.improvedProcessingCheck(knowledgeBaseId, onProgress);

      // Stage 6: Create or update documentation knowledge base
      onProgress?.({
        stage: 'processing',
        message: 'Setting up application documentation for AI...',
        progress: 85
      });

      await this.ensureDocumentationKnowledgeBase(replicaUuid);

      // Stage 7: Store knowledge base reference
      this.storeKnowledgeBaseReference(userId, replicaUuid, knowledgeBaseId, products.length);

      onProgress?.({
        stage: 'completed',
        message: `Successfully ${isUpdate ? 'updated' : 'synced'} ${products.length} products with AI documentation`,
        progress: 100
      });

      return {
        success: true,
        knowledgeBaseId,
        status: finalStatus,
        productCount: products.length,
        userId,
        replicaUuid,
        isUpdate
      };

    } catch (error: any) {
      console.error('Error syncing products to knowledge base:', error);

      onProgress?.({
        stage: 'error',
        message: `Sync failed: ${error.message}`,
        progress: 0
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Find existing knowledge base for user
   */
  private async findExistingKnowledgeBase(userId: string, replicaUuid: string): Promise<UserKnowledgeBase | null> {
    try {
      // Check local storage first
      const storageKey = `${userId}_${replicaUuid}`;
      if (this.knowledgeBaseStorage.has(storageKey)) {
        return this.knowledgeBaseStorage.get(storageKey)!;
      }

      // Query API for existing knowledge bases
      const trainingData = await this.sensayClient.training.getV1Training(
        'READY', // Only get ready knowledge bases
        'text',   // Text type
        '1',      // Page 1
        '50',     // Limit 50
        API_VERSION
      );

      if (!trainingData.success || !trainingData.items) {
        return null;
      }

      // Find the most recent knowledge base for this user
      // Note: This assumes knowledge bases have identifiable metadata or naming
      const recentKnowledgeBase = trainingData.items
        .filter(item => item.status === 'READY')
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
        [0];

      if (recentKnowledgeBase && recentKnowledgeBase.id) {
        const knowledgeBase: UserKnowledgeBase = {
          userId,
          replicaUuid,
          knowledgeBaseId: recentKnowledgeBase.id,
          lastSyncAt: new Date(recentKnowledgeBase.created_at || Date.now()),
          productCount: 0 // Will be updated on next sync
        };

        this.knowledgeBaseStorage.set(storageKey, knowledgeBase);
        return knowledgeBase;
      }

      return null;
    } catch (error) {
      console.error('Error finding existing knowledge base:', error);
      return null;
    }
  }

  /**
   * Store knowledge base reference for future updates
   */
  private storeKnowledgeBaseReference(
    userId: string,
    replicaUuid: string,
    knowledgeBaseId: number,
    productCount: number
  ) {
    const storageKey = `${userId}_${replicaUuid}`;
    const knowledgeBase: UserKnowledgeBase = {
      userId,
      replicaUuid,
      knowledgeBaseId,
      lastSyncAt: new Date(),
      productCount
    };

    this.knowledgeBaseStorage.set(storageKey, knowledgeBase);

    // In a real application, you might want to persist this to a database
    console.log(`Stored knowledge base reference: ${knowledgeBaseId} for user ${userId}`);
  }

  /**
   * Enhanced product formatting with generated facts
   */
  private formatEnhancedProductData(
    products: ProcessedProductData[],
    storeName: string
  ): { rawText: string; generatedFacts: string[] } {
    console.log(`🎨 Formatting enhanced product data:`);
    console.log(`   - Products to format: ${products.length}`);
    console.log(`   - Store name: ${storeName}`);

    if (!products || products.length === 0) {
      console.warn('⚠️ No products to format!');
      return {
        rawText: `# ${storeName} - Empty Store\n\nNo products found in this store.`,
        generatedFacts: ['Store has no products']
      };
    }
    // Safe extraction with fallbacks
    const productTypes = [...new Set(products.map(p => p.productType || 'Uncategorized').filter(Boolean))];
    const vendors = [...new Set(products.map(p => p.vendor || 'Unknown').filter(Boolean))];
    const prices = products.map(p => parseFloat(p.price || '0')).filter(p => p > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const totalInventory = products.reduce((sum, p) => sum + (p.inventory?.available || 0), 0);
    const inStock = products.filter(p => (p.inventory?.available || 0) > 0).length;
    const outOfStock = products.length - inStock;

    const generatedFacts = [
      `Store has ${products.length} total products`,
      `Product categories: ${productTypes.slice(0, 10).join(', ') || 'No categories'}`,
      `Available vendors: ${vendors.slice(0, 10).join(', ') || 'No vendors'}`,
      `Price range: $${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`,
      `Total inventory items: ${totalInventory}`,
      `Products in stock: ${inStock}`,
      `Products out of stock: ${outOfStock}`
    ];

    console.log(`📊 Generated facts:`, generatedFacts);

    const header = `
# ${storeName} - AI Product Knowledge Base

This comprehensive knowledge base contains real-time information about all products in the ${storeName} Shopify store.

## Store Overview
- **Total Products**: ${products.length}
- **Last Updated**: ${new Date().toLocaleString()}
- **Categories**: ${[...new Set(products.map(p => p.productType).filter(Boolean))].slice(0, 10).join(', ')}
- **Active Vendors**: ${[...new Set(products.map(p => p.vendor).filter(Boolean))].slice(0, 10).join(', ')}

## Key Store Statistics
${generatedFacts.map(fact => `- ${fact}`).join('\n')}

---

`;

    console.log(`🏷️ Processing ${products.length} products...`);

    const productData = products.map((product, index) => {
      if (index < 3) {
        console.log(`   Processing product ${index + 1}: ${product.title}`);
      }
      const variantInfo = product.variants.length > 1
        ? product.variants.map(variant => {
            const stock = variant.inventory > 0
              ? `${variant.inventory} in stock`
              : 'Out of stock';

            const pricing = variant.compareAtPrice
              ? `$${variant.price} (was $${variant.compareAtPrice})`
              : `$${variant.price}`;

            return `  • **${variant.title}**: ${pricing} - ${stock}${variant.sku ? ` (SKU: ${variant.sku})` : ''}`;
          }).join('\n')
        : `**Price**: $${product.price}${product.compareAtPrice ? ` (was $${product.compareAtPrice})` : ''} - ${product.inventory.available > 0 ? `${product.inventory.available} in stock` : 'Out of stock'}${product.sku ? ` (SKU: ${product.sku})` : ''}`;

      const description = (product.description && product.description.length > 500)
        ? product.description.substring(0, 500) + '...'
        : (product.description || 'No description available');

      return `
## ${product.title}

**Product Details:**
- **ID**: ${product.id}
- **Vendor**: ${product.vendor}
- **Category**: ${product.productType}
- **SKU**: ${product.sku || 'Not specified'}

**Description:**
${description || 'No description available'}

**Pricing & Availability:**
${variantInfo}

**Inventory Information:**
- **Total Available**: ${product.inventory.available} units
- **Inventory Tracking**: ${product.inventory.tracked ? 'Enabled' : 'Disabled'}
- **Stock Status**: ${product.inventory.available > 0 ? '✅ In Stock' : '❌ Out of Stock'}

**Product Classification:**
- **Tags**: ${product.tags.length > 0 ? product.tags.join(', ') : 'No tags assigned'}
- **Created**: ${new Date(product.createdAt).toLocaleDateString()}
- **Last Updated**: ${new Date(product.updatedAt).toLocaleDateString()}
- **Images**: ${product.images.length} image${product.images.length !== 1 ? 's' : ''} available

---
      `.trim();
    }).join('\n\n');

    const footer = `

## AI Assistant Guidelines

When customers inquire about products:

### 🔍 **Search & Discovery**
- Use product names, SKUs, categories, or tags for searches
- Suggest alternatives when specific products are unavailable
- Provide detailed comparisons between similar products

### 💰 **Pricing & Availability**
- Always mention current pricing and any sale prices
- Check real-time stock levels before confirming availability
- Inform about estimated restock if items are out of stock

### 🛍️ **Recommendations**
- Suggest complementary products based on customer interests
- Recommend higher or lower-priced alternatives as appropriate
- Consider customer preferences and budget constraints

### 📋 **Product Information**
- Provide comprehensive product details including specifications
- Mention key features and benefits clearly
- Include vendor information and warranty details when relevant

### ⚠️ **Important Notes**
- All information is current as of the last sync: ${new Date().toLocaleString()}
- Stock levels and pricing may change rapidly
- Always encourage customers to check the store for the most current information
    `.trim();

    const finalRawText = header + productData + footer;

    console.log(`✅ Formatting complete:`);
    console.log(`   - Header length: ${header.length}`);
    console.log(`   - Product data length: ${productData.length}`);
    console.log(`   - Footer length: ${footer.length}`);
    console.log(`   - Total length: ${finalRawText.length}`);

    return {
      rawText: finalRawText,
      generatedFacts
    };
  }

  /**
   * Improved processing check with shorter polling and graceful timeout
   */
  private async improvedProcessingCheck(
    knowledgeBaseId: number,
    onProgress?: (progress: SyncProgress) => void
  ): Promise<string> {
    const maxWaitTime = 2 * 60 * 1000; // 2 minutes
    const checkInterval = 3000; // Check every 3 seconds
    const maxRetries = 3;

    const startTime = Date.now();
    let retryCount = 0;

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const statusResponse = await this.sensayClient.training.getV1Training1(
          knowledgeBaseId,
          API_VERSION
        );

        console.log(`Knowledge base ${knowledgeBaseId} status:`, statusResponse.status);

        switch (statusResponse.status) {
          case 'READY':
            console.log('✅ Knowledge base processing completed successfully');
            return 'READY';

          case 'PROCESSING':
            const elapsed = Date.now() - startTime;
            const progress = Math.min(70 + (elapsed / maxWaitTime) * 25, 95);

            onProgress?.({
              stage: 'processing',
              message: 'Processing updated product knowledge...',
              progress
            });
            break;

          case 'ERR_FILE_PROCESSING':
          case 'ERR_TEXT_PROCESSING':
          case 'ERR_TEXT_TO_VECTOR':
            throw new Error(`Processing failed with status: ${statusResponse.status}`);

          default:
            console.log('Unknown status, continuing to monitor:', statusResponse.status);
        }

        await new Promise(resolve => setTimeout(resolve, checkInterval));
        retryCount = 0;

      } catch (error: any) {
        console.error('Error checking processing status:', error);
        retryCount++;

        if (retryCount >= maxRetries) {
          console.warn(`⚠️ Max retries reached for status check, verifying existence`);
          return await this.verifyKnowledgeBaseExists(knowledgeBaseId);
        }

        await new Promise(resolve => setTimeout(resolve, checkInterval));
      }
    }

    console.warn('⚠️ Processing timeout reached, verifying knowledge base exists');
    return await this.verifyKnowledgeBaseExists(knowledgeBaseId);
  }

  /**
   * Verify knowledge base exists as fallback when status polling fails
   */
  private async verifyKnowledgeBaseExists(knowledgeBaseId: number): Promise<string> {
    try {
      await this.sensayClient.training.getV1Training1(knowledgeBaseId, API_VERSION);
      console.log('✅ Knowledge base exists, assuming successful processing');
      return 'READY';
    } catch (error: any) {
      console.error('❌ Knowledge base verification failed:', error);
      throw new Error('Knowledge base processing failed - could not verify completion');
    }
  }

  /**
   * Get synchronization history for a user
   */
  async getSyncHistory(userId: string, replicaUuid: string): Promise<UserKnowledgeBase | null> {
    const storageKey = `${userId}_${replicaUuid}`;
    return this.knowledgeBaseStorage.get(storageKey) || null;
  }

  /**
   * Force clean knowledge base (delete and recreate)
   */
  async cleanSync(
    products: ProcessedProductData[],
    shopifyDomain: string,
    shopifyAccessToken: string,
    storeName?: string,
    onProgress?: (progress: SyncProgress) => void
  ): Promise<SyncStatus & { userId?: string; replicaUuid?: string }> {
    // Clear stored knowledge base to force creation of new one
    const userResult = await this.userManager.getOrCreateUserReplica(
      shopifyDomain,
      shopifyAccessToken,
      storeName
    );

    if (userResult.success && userResult.userId && userResult.replicaUuid) {
      const storageKey = `${userResult.userId}_${userResult.replicaUuid}`;
      this.knowledgeBaseStorage.delete(storageKey);
    }

    return this.syncProductsToKnowledgeBase(
      products,
      shopifyDomain,
      shopifyAccessToken,
      storeName,
      onProgress
    );
  }

  /**
   * Ensure documentation knowledge base exists for replica
   */
  private async ensureDocumentationKnowledgeBase(replicaUuid: string): Promise<void> {
    try {
      // Check if documentation knowledge base already exists
      const hasDocumentation = await this.documentationService.hasDocumentationKnowledgeBase(replicaUuid);

      if (!hasDocumentation) {
        console.log(`Creating documentation knowledge base for replica ${replicaUuid}`);
        const docKB = await this.documentationService.createDocumentationKnowledgeBase(replicaUuid);

        if (docKB) {
          console.log(`✅ Documentation knowledge base created with ID: ${docKB.id}`);
        } else {
          console.warn('⚠️ Could not create documentation knowledge base, but continuing...');
        }
      } else {
        console.log(`✅ Documentation knowledge base already exists for replica ${replicaUuid}`);
      }
    } catch (error) {
      console.error('Error ensuring documentation knowledge base:', error);
      // Don't throw error - documentation KB is helpful but not critical
    }
  }
}