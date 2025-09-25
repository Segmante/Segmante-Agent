import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  ShopifyConfig,
  ShopifyProduct,
  ShopifyProductsResponse,
  ShopifyInventoryResponse,
  ShopifyConnectionStatus,
  ProcessedProductData,
  ProcessedVariant
} from './types';

export class ShopifyClient {
  private client: AxiosInstance;
  private config: ShopifyConfig;

  constructor(config: ShopifyConfig) {
    this.config = {
      ...config,
      apiVersion: config.apiVersion || '2023-10'
    };

    this.client = axios.create({
      baseURL: `https://${this.config.domain}/admin/api/${this.config.apiVersion}`,
      headers: {
        'X-Shopify-Access-Token': this.config.accessToken,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  /**
   * Test the connection to Shopify store
   */
  async testConnection(): Promise<ShopifyConnectionStatus> {
    try {
      const response = await this.client.get('/shop.json');
      const shop = response.data.shop;

      return {
        connected: true,
        domain: shop.domain,
        shopName: shop.name || shop.domain,
        lastSync: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('Shopify connection test failed:', error);

      let errorMessage = 'Unknown connection error';
      if (error.response?.status === 401) {
        errorMessage = 'Invalid access token';
      } else if (error.response?.status === 404) {
        errorMessage = 'Store not found';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'Invalid store domain';
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors;
      }

      return {
        connected: false,
        error: errorMessage
      };
    }
  }

  /**
   * Fetch all products from Shopify store
   */
  async getAllProducts(): Promise<ShopifyProduct[]> {
    const allProducts: ShopifyProduct[] = [];
    let nextPageInfo: string | null = null;
    const limit = 250; // Maximum allowed by Shopify

    try {
      do {
        const params: any = { limit };
        if (nextPageInfo) {
          params.page_info = nextPageInfo;
        }

        const response: AxiosResponse<ShopifyProductsResponse> = await this.client.get('/products.json', {
          params
        });

        allProducts.push(...response.data.products);

        // Check for pagination
        const linkHeader = response.headers.link;
        nextPageInfo = this.extractNextPageInfo(linkHeader);

      } while (nextPageInfo);

      console.log(`Fetched ${allProducts.length} products from Shopify`);
      return allProducts;

    } catch (error: any) {
      console.error('Error fetching products from Shopify:', error);
      throw new Error(`Failed to fetch products: ${error.message}`);
    }
  }

  /**
   * Fetch inventory levels for products
   */
  async getInventoryLevels(inventoryItemIds: number[]): Promise<ShopifyInventoryResponse> {
    try {
      const idsParam = inventoryItemIds.join(',');
      const response = await this.client.get('/inventory_levels.json', {
        params: {
          inventory_item_ids: idsParam,
          limit: 250
        }
      });

      return response.data;
    } catch (error: any) {
      console.error('Error fetching inventory levels:', error);
      throw new Error(`Failed to fetch inventory: ${error.message}`);
    }
  }

  /**
   * Process raw Shopify product data for knowledge base
   */
  processProductData(products: ShopifyProduct[]): ProcessedProductData[] {
    return products.map(product => {
      const variants: ProcessedVariant[] = product.variants.map(variant => ({
        id: variant.id.toString(),
        title: variant.title || 'Default',
        price: variant.price || '0',
        compareAtPrice: variant.compare_at_price || undefined,
        sku: variant.sku || '',
        inventory: variant.inventory_quantity || 0,
        weight: variant.weight || 0,
        weightUnit: variant.weight_unit || 'g',
        options: {
          option1: variant.option1 || '',
          ...(variant.option2 && { option2: variant.option2 }),
          ...(variant.option3 && { option3: variant.option3 })
        }
      }));

      const images = product.images.map(img => img.src);
      const tags = product.tags ? product.tags.split(',').map(tag => tag.trim()) : [];

      // Calculate total inventory
      const totalInventory = product.variants.reduce((sum, variant) => {
        return sum + (variant.inventory_quantity || 0);
      }, 0);

      return {
        id: product.id.toString(),
        title: product.title,
        description: product.body_html ? product.body_html.replace(/<[^>]*>/g, '') : '', // Strip HTML, handle null
        price: product.variants[0]?.price || '0',
        compareAtPrice: product.variants[0]?.compare_at_price || undefined,
        sku: product.variants[0]?.sku || '',
        vendor: product.vendor || '',
        productType: product.product_type || '',
        tags,
        variants,
        images,
        inventory: {
          available: totalInventory,
          tracked: product.variants.some(v => v.inventory_management === 'shopify')
        },
        createdAt: product.created_at,
        updatedAt: product.updated_at
      };
    });
  }

  /**
   * Format product data for Sensay knowledge base
   */
  formatForKnowledgeBase(products: ProcessedProductData[]): string {
    return products.map(product => {
      const variantInfo = product.variants.length > 1
        ? product.variants.map(v =>
            `  - ${v.title}: $${v.price}${v.inventory > 0 ? ` (${v.inventory} in stock)` : ' (Out of stock)'}`
          ).join('\n')
        : `Price: $${product.price}${product.inventory.available > 0 ? ` (${product.inventory.available} in stock)` : ' (Out of stock)'}`;

      return `
Product: ${product.title}
ID: ${product.id}
SKU: ${product.sku}
Vendor: ${product.vendor}
Type: ${product.productType}
Description: ${product.description}

${product.variants.length > 1 ? 'Variants:' : 'Pricing:'}
${variantInfo}

Tags: ${product.tags.join(', ')}
Created: ${new Date(product.createdAt).toLocaleDateString()}
Updated: ${new Date(product.updatedAt).toLocaleDateString()}

---
      `.trim();
    }).join('\n\n');
  }

  /**
   * Extract next page info from Link header for pagination
   */
  private extractNextPageInfo(linkHeader?: string): string | null {
    if (!linkHeader) return null;

    const links = linkHeader.split(',');
    const nextLink = links.find(link => link.includes('rel="next"'));

    if (!nextLink) return null;

    const match = nextLink.match(/page_info=([^&>]+)/);
    return match ? match[1] : null;
  }

  /**
   * Get store information
   */
  async getStoreInfo() {
    try {
      const response = await this.client.get('/shop.json');
      return response.data.shop;
    } catch (error: any) {
      console.error('Error fetching store info:', error);
      throw new Error(`Failed to fetch store info: ${error.message}`);
    }
  }

  /**
   * Get product count
   */
  async getProductCount(): Promise<number> {
    try {
      const response = await this.client.get('/products/count.json');
      return response.data.count;
    } catch (error: any) {
      console.error('Error fetching product count:', error);
      return 0;
    }
  }
}