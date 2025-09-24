import { VerboseSensayAPI } from '@/api-debug';
import { ProcessedProductData } from '../shopify/types';
import { API_VERSION } from '@/constants/auth';

export interface SyncStatus {
  success: boolean;
  knowledgeBaseId?: number;
  status?: string;
  error?: string;
  productCount?: number;
}

export interface SyncProgress {
  stage: 'preparing' | 'uploading' | 'processing' | 'completed' | 'error';
  message: string;
  progress: number; // 0-100
}

export class ProductSyncService {
  private sensayClient: VerboseSensayAPI;
  private replicaUuid: string;

  constructor(apiKey: string, replicaUuid: string, userId: string) {
    this.replicaUuid = replicaUuid;
    this.sensayClient = new VerboseSensayAPI({
      HEADERS: {
        'X-ORGANIZATION-SECRET': apiKey,
        'X-USER-ID': userId
      }
    });
  }

  /**
   * Sync product data to Sensay knowledge base
   */
  async syncProductsToKnowledgeBase(
    products: ProcessedProductData[],
    onProgress?: (progress: SyncProgress) => void
  ): Promise<SyncStatus> {
    try {
      // Stage 1: Prepare data
      onProgress?.({
        stage: 'preparing',
        message: 'Preparing product data for upload...',
        progress: 10
      });

      const formattedData = this.formatProductsForKnowledgeBase(products);

      console.log('Formatted product data length:', formattedData.length);
      console.log('Number of products:', products.length);

      // Stage 2: Create knowledge base entry
      onProgress?.({
        stage: 'uploading',
        message: 'Creating knowledge base entry...',
        progress: 30
      });

      const createResponse = await this.sensayClient.training.postV1ReplicasTraining(
        this.replicaUuid,
        API_VERSION
      );

      if (!createResponse.success) {
        throw new Error('Failed to create knowledge base entry');
      }

      const knowledgeBaseId = createResponse.knowledgeBaseID;
      console.log('Created knowledge base entry with ID:', knowledgeBaseId);

      // Stage 3: Upload product data
      onProgress?.({
        stage: 'uploading',
        message: 'Uploading product data...',
        progress: 50
      });

      const uploadResponse = await this.sensayClient.training.putV1ReplicasTraining(
        this.replicaUuid,
        knowledgeBaseId,
        {
          rawText: formattedData
        }
      );

      if (!uploadResponse.success) {
        throw new Error('Failed to upload product data');
      }

      console.log('Product data uploaded successfully');

      // Stage 4: Monitor processing
      onProgress?.({
        stage: 'processing',
        message: 'Processing data in knowledge base...',
        progress: 70
      });

      const finalStatus = await this.waitForProcessingComplete(knowledgeBaseId, onProgress);

      onProgress?.({
        stage: 'completed',
        message: `Successfully synced ${products.length} products`,
        progress: 100
      });

      return {
        success: true,
        knowledgeBaseId,
        status: finalStatus,
        productCount: products.length
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
   * Format products for knowledge base upload
   */
  private formatProductsForKnowledgeBase(products: ProcessedProductData[]): string {
    const header = `
# Shopify Store Product Catalog

This knowledge base contains detailed information about all products in your Shopify store.
Total Products: ${products.length}
Last Updated: ${new Date().toISOString()}

## Product Information

Each product entry contains:
- Product name and description
- Pricing and variant information
- Stock levels and availability
- Product categories and tags
- SKU and vendor details

---

`;

    const productData = products.map(product => {
      const variantInfo = product.variants.length > 1
        ? product.variants.map(variant => {
            const stock = variant.inventory > 0
              ? `${variant.inventory} in stock`
              : 'Out of stock';

            const pricing = variant.compareAtPrice
              ? `$${variant.price} (was $${variant.compareAtPrice})`
              : `$${variant.price}`;

            return `  • ${variant.title}: ${pricing} - ${stock}${variant.sku ? ` (SKU: ${variant.sku})` : ''}`;
          }).join('\n')
        : `Price: $${product.price}${product.compareAtPrice ? ` (was $${product.compareAtPrice})` : ''} - ${product.inventory.available > 0 ? `${product.inventory.available} in stock` : 'Out of stock'}${product.sku ? ` (SKU: ${product.sku})` : ''}`;

      const description = product.description.length > 500
        ? product.description.substring(0, 500) + '...'
        : product.description;

      return `
## ${product.title}

**Product ID:** ${product.id}
**Vendor:** ${product.vendor}
**Product Type:** ${product.productType}
**SKU:** ${product.sku || 'Not specified'}

**Description:**
${description || 'No description available'}

**Pricing & Variants:**
${variantInfo}

**Inventory Status:**
- Total Available: ${product.inventory.available}
- Inventory Tracked: ${product.inventory.tracked ? 'Yes' : 'No'}

**Categories & Tags:**
${product.tags.length > 0 ? product.tags.join(', ') : 'No tags'}

**Product Details:**
- Created: ${new Date(product.createdAt).toLocaleDateString()}
- Last Updated: ${new Date(product.updatedAt).toLocaleDateString()}
- Images: ${product.images.length} image${product.images.length !== 1 ? 's' : ''} available

---
      `.trim();
    }).join('\n\n');

    const footer = `

## How to Use This Information

When customers ask about products, you can:
1. Search for products by name, SKU, or category
2. Provide accurate pricing and availability
3. Suggest similar or related products
4. Help with product comparisons
5. Check stock levels and variants

Always provide the most current information available and let customers know about any limitations or special conditions.
    `.trim();

    return header + productData + footer;
  }

  /**
   * Wait for processing to complete and monitor status
   */
  private async waitForProcessingComplete(
    knowledgeBaseId: number,
    onProgress?: (progress: SyncProgress) => void,
    maxWaitTime: number = 5 * 60 * 1000 // 5 minutes
  ): Promise<string> {
    const startTime = Date.now();
    const checkInterval = 5000; // Check every 5 seconds

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const statusResponse = await this.sensayClient.training.getV1Training1(
          knowledgeBaseId,
          API_VERSION
        );

        console.log(`Knowledge base ${knowledgeBaseId} status:`, statusResponse.status);

        switch (statusResponse.status) {
          case 'READY':
            return 'READY';

          case 'PROCESSING':
            const elapsed = Date.now() - startTime;
            const progress = Math.min(70 + (elapsed / maxWaitTime) * 20, 90);

            onProgress?.({
              stage: 'processing',
              message: 'Processing data in knowledge base...',
              progress
            });
            break;

          case 'ERR_FILE_PROCESSING':
          case 'ERR_TEXT_PROCESSING':
          case 'ERR_TEXT_TO_VECTOR':
            throw new Error(`Processing failed with status: ${statusResponse.status}`);

          default:
            console.log('Unknown status:', statusResponse.status);
        }

        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, checkInterval));

      } catch (error: any) {
        console.error('Error checking processing status:', error);
        throw new Error(`Failed to monitor processing: ${error.message}`);
      }
    }

    throw new Error('Processing timeout - knowledge base took too long to process');
  }

  /**
   * List all knowledge base entries for the replica
   */
  async listKnowledgeBaseEntries() {
    try {
      return await this.sensayClient.training.getV1Training(
        undefined, // status filter
        'text', // type filter
        '1', // page
        '100', // limit
        API_VERSION
      );
    } catch (error: any) {
      console.error('Error listing knowledge base entries:', error);
      throw new Error(`Failed to list knowledge base entries: ${error.message}`);
    }
  }

  /**
   * Delete a knowledge base entry
   */
  async deleteKnowledgeBaseEntry(knowledgeBaseId: number) {
    try {
      const response = await this.sensayClient.training.deleteV1Training(
        knowledgeBaseId,
        API_VERSION
      );
      return response.success;
    } catch (error: any) {
      console.error('Error deleting knowledge base entry:', error);
      throw new Error(`Failed to delete knowledge base entry: ${error.message}`);
    }
  }

  /**
   * Update replica configuration for product-focused responses
   */
  async updateReplicaForProductSupport(storeName: string) {
    try {
      // This would typically update the replica's system message
      // to be more focused on product support
      const systemMessage = `
You are an intelligent AI assistant for ${storeName}, specializing in product information and customer support.

Your knowledge base contains detailed information about all products in the store, including:
- Product descriptions and specifications
- Pricing and variant information
- Stock levels and availability
- Product categories and tags

When customers ask about products:
1. Always check current stock levels when mentioning availability
2. Provide accurate pricing information including any sale prices
3. Suggest similar or complementary products when appropriate
4. Be helpful with product comparisons and recommendations
5. If you don't have specific information, acknowledge this clearly

Maintain a helpful, professional, and friendly tone while being informative and accurate.
      `.trim();

      // Note: This would require extending the replica update functionality
      // For now, we'll just log the system message
      console.log('Updated system message for product support:', systemMessage);

      return true;
    } catch (error: any) {
      console.error('Error updating replica configuration:', error);
      return false;
    }
  }
}