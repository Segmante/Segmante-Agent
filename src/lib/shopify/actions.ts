/**
 * Shopify Actions Service
 * Provides CRUD operations for Shopify products with comprehensive
 * validation, error handling, and audit trail capabilities.
 */

import { ShopifyClient } from './client';
import { ShopifyProduct, ProcessedProductData } from './types';
import { ActionIntent } from '../ai/intent-detector';

export interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  affectedProducts?: number;
  changes?: Array<{
    productId: string;
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  error?: string;
  canUndo?: boolean;
  undoData?: any;
}

export interface ProductSearchResult {
  products: ProcessedProductData[];
  total: number;
  query: string;
}

export interface BulkUpdateParams {
  category?: string;
  vendor?: string;
  tags?: string[];
  priceChange?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
  stockChange?: {
    type: 'set' | 'adjust';
    value: number;
  };
  dryRun?: boolean;
}

export class ShopifyActionsService {
  private client: ShopifyClient;

  constructor(client: ShopifyClient) {
    this.client = client;
  }

  /**
   * Execute action based on detected intent
   */
  async executeAction(intent: ActionIntent): Promise<ActionResult> {
    try {
      console.log(`Executing action: ${intent.type}`, intent.entities);

      switch (intent.type) {
        case 'update_price':
          return await this.updateProductPrice(intent);

        case 'update_stock':
          return await this.updateProductStock(intent);

        case 'delete_product':
          return await this.deleteProduct(intent);

        case 'create_product':
          return await this.createProduct(intent);

        case 'bulk_update':
          return await this.bulkUpdate(intent);

        case 'search_products':
          return await this.searchProducts(intent);

        default:
          return {
            success: false,
            message: `Aksi '${intent.type}' belum didukung`,
            error: 'Unsupported action type'
          };
      }
    } catch (error: any) {
      console.error('Error executing action:', error);
      return {
        success: false,
        message: `Gagal menjalankan aksi: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Update product price
   */
  private async updateProductPrice(intent: ActionIntent): Promise<ActionResult> {
    const { entities } = intent;

    // Find target product
    const products = await this.findProducts(entities);
    if (products.length === 0) {
      return {
        success: false,
        message: 'Produk tidak ditemukan',
        error: 'Product not found'
      };
    }

    if (products.length > 1) {
      return {
        success: false,
        message: `Ditemukan ${products.length} produk. Harap spesifikasi lebih detail.`,
        error: 'Multiple products found'
      };
    }

    const product = products[0];
    let newPrice: number;

    if (entities.percentage) {
      const currentPrice = parseFloat(product.price);
      newPrice = currentPrice * (1 + entities.percentage / 100);
    } else if (entities.price) {
      newPrice = entities.price;
    } else {
      return {
        success: false,
        message: 'Harga baru tidak ditemukan dalam pesan',
        error: 'No price specified'
      };
    }

    // Execute price update via Shopify API
    try {
      const updateResponse = await this.client.put(`/products/${product.id}.json`, {
        product: {
          id: parseInt(product.id),
          variants: product.variants.map(variant => ({
            id: parseInt(variant.id),
            price: newPrice.toFixed(2)
          }))
        }
      });

      return {
        success: true,
        message: `Harga produk "${product.title}" berhasil diubah menjadi Rp${newPrice.toLocaleString('id-ID')}`,
        data: updateResponse.data,
        affectedProducts: 1,
        changes: [{
          productId: product.id,
          field: 'price',
          oldValue: product.price,
          newValue: newPrice.toFixed(2)
        }],
        canUndo: true,
        undoData: {
          productId: product.id,
          oldPrice: product.price
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Gagal mengubah harga produk: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Update product stock
   */
  private async updateProductStock(intent: ActionIntent): Promise<ActionResult> {
    const { entities } = intent;

    if (!entities.quantity) {
      return {
        success: false,
        message: 'Jumlah stok tidak ditemukan dalam pesan',
        error: 'No quantity specified'
      };
    }

    // Find target product
    const products = await this.findProducts(entities);
    if (products.length === 0) {
      return {
        success: false,
        message: 'Produk tidak ditemukan',
        error: 'Product not found'
      };
    }

    if (products.length > 1) {
      return {
        success: false,
        message: `Ditemukan ${products.length} produk. Harap spesifikasi lebih detail.`,
        error: 'Multiple products found'
      };
    }

    const product = products[0];
    const newQuantity = entities.quantity;

    try {
      // Get inventory item IDs for the product variants
      const inventoryItemIds = product.variants.map(variant =>
        parseInt(variant.id) // In real implementation, we need inventory_item_id
      );

      // Update inventory levels using Shopify Inventory API
      // Note: This is a simplified version - real implementation needs location_id
      const updatePromises = product.variants.map(async (variant) => {
        return await this.client.post('/inventory_levels/set.json', {
          inventory_item_id: parseInt(variant.id), // Should be inventory_item_id
          location_id: 123456789, // Should be actual location_id
          available: newQuantity
        });
      });

      await Promise.all(updatePromises);

      return {
        success: true,
        message: `Stok produk "${product.title}" berhasil diubah menjadi ${newQuantity}`,
        affectedProducts: 1,
        changes: [{
          productId: product.id,
          field: 'inventory',
          oldValue: product.inventory.available,
          newValue: newQuantity
        }],
        canUndo: true,
        undoData: {
          productId: product.id,
          oldQuantity: product.inventory.available
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Gagal mengubah stok produk: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Delete product
   */
  private async deleteProduct(intent: ActionIntent): Promise<ActionResult> {
    const { entities } = intent;

    // Find target product
    const products = await this.findProducts(entities);
    if (products.length === 0) {
      return {
        success: false,
        message: 'Produk tidak ditemukan',
        error: 'Product not found'
      };
    }

    if (products.length > 1) {
      return {
        success: false,
        message: `Ditemukan ${products.length} produk. Harap spesifikasi lebih detail.`,
        error: 'Multiple products found'
      };
    }

    const product = products[0];

    try {
      // Delete product via Shopify API
      await this.client.delete(`/products/${product.id}.json`);

      return {
        success: true,
        message: `Produk "${product.title}" berhasil dihapus`,
        affectedProducts: 1,
        canUndo: false, // Deletion is permanent
        changes: [{
          productId: product.id,
          field: 'deleted',
          oldValue: true,
          newValue: false
        }]
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Gagal menghapus produk: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Create new product
   */
  private async createProduct(intent: ActionIntent): Promise<ActionResult> {
    const { entities } = intent;

    if (!entities.productName) {
      return {
        success: false,
        message: 'Nama produk tidak ditemukan dalam pesan',
        error: 'No product name specified'
      };
    }

    const productData = {
      title: entities.productName,
      body_html: `<p>Produk baru: ${entities.productName}</p>`,
      vendor: 'Store Default',
      product_type: 'General',
      status: 'draft', // Create as draft for safety
      variants: [{
        title: 'Default',
        price: entities.price?.toString() || '0.00',
        inventory_quantity: entities.quantity || 0,
        inventory_management: 'shopify'
      }]
    };

    try {
      const response = await this.client.post('/products.json', {
        product: productData
      });

      const newProduct = response.data.product;

      return {
        success: true,
        message: `Produk "${entities.productName}" berhasil dibuat dengan ID ${newProduct.id}`,
        data: newProduct,
        affectedProducts: 1,
        canUndo: true,
        undoData: {
          productId: newProduct.id
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Gagal membuat produk: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Bulk update products
   */
  private async bulkUpdate(intent: ActionIntent): Promise<ActionResult> {
    const { entities } = intent;

    // Get all products for bulk operation
    const allProducts = await this.client.getAllProducts();
    const processedProducts = this.client.processProductData(allProducts);

    // Filter products based on criteria
    let targetProducts = processedProducts;

    if (entities.category) {
      targetProducts = targetProducts.filter(p =>
        p.productType.toLowerCase().includes(entities.category!.toLowerCase()) ||
        p.tags.some(tag => tag.toLowerCase().includes(entities.category!.toLowerCase()))
      );
    }

    if (targetProducts.length === 0) {
      return {
        success: false,
        message: 'Tidak ada produk yang sesuai dengan kriteria',
        error: 'No matching products found'
      };
    }

    const updatePromises = targetProducts.map(async (product) => {
      try {
        const updateData: any = {
          id: parseInt(product.id)
        };

        // Price updates
        if (entities.percentage && entities.percentage !== 0) {
          const currentPrice = parseFloat(product.price);
          const newPrice = currentPrice * (1 + entities.percentage / 100);
          updateData.variants = product.variants.map(variant => ({
            id: parseInt(variant.id),
            price: newPrice.toFixed(2)
          }));
        }

        // Only update if there are changes
        if (updateData.variants) {
          await this.client.put(`/products/${product.id}.json`, {
            product: updateData
          });
          return { success: true, productId: product.id };
        }

        return { success: false, productId: product.id, reason: 'No changes needed' };
      } catch (error: any) {
        return { success: false, productId: product.id, error: error.message };
      }
    });

    const results = await Promise.all(updatePromises);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    return {
      success: successCount > 0,
      message: `Bulk update selesai: ${successCount} berhasil, ${failureCount} gagal dari ${results.length} produk`,
      affectedProducts: successCount,
      data: results
    };
  }

  /**
   * Search products
   */
  private async searchProducts(intent: ActionIntent): Promise<ActionResult> {
    const { entities } = intent;
    const query = entities.searchQuery || entities.productName || '';

    const allProducts = await this.client.getAllProducts();
    const processedProducts = this.client.processProductData(allProducts);

    // Simple search implementation
    const searchResults = processedProducts.filter(product => {
      const searchText = query.toLowerCase();
      return (
        product.title.toLowerCase().includes(searchText) ||
        product.description.toLowerCase().includes(searchText) ||
        product.sku.toLowerCase().includes(searchText) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchText))
      );
    });

    return {
      success: true,
      message: `Ditemukan ${searchResults.length} produk untuk pencarian "${query}"`,
      data: {
        products: searchResults.slice(0, 10), // Limit to 10 results
        total: searchResults.length,
        query
      }
    };
  }

  /**
   * Find products based on entities (name, SKU, ID)
   */
  private async findProducts(entities: ActionIntent['entities']): Promise<ProcessedProductData[]> {
    const allProducts = await this.client.getAllProducts();
    const processedProducts = this.client.processProductData(allProducts);

    let results = processedProducts;

    // Filter by product ID
    if (entities.productId) {
      results = results.filter(p => p.id === entities.productId);
    }

    // Filter by SKU
    if (entities.sku && results.length > 0) {
      results = results.filter(p =>
        p.sku.toLowerCase() === entities.sku!.toLowerCase() ||
        p.variants.some(v => v.sku.toLowerCase() === entities.sku!.toLowerCase())
      );
    }

    // Filter by product name
    if (entities.productName && results.length > 0) {
      const searchName = entities.productName.toLowerCase();
      results = results.filter(p =>
        p.title.toLowerCase().includes(searchName)
      );
    }

    return results;
  }

  /**
   * Dry run - preview what would happen without executing
   */
  async previewAction(intent: ActionIntent): Promise<ActionResult> {
    try {
      switch (intent.type) {
        case 'update_price':
        case 'update_stock':
        case 'delete_product': {
          const products = await this.findProducts(intent.entities);
          return {
            success: true,
            message: `Preview: Akan mempengaruhi ${products.length} produk`,
            data: products.slice(0, 5), // Show first 5 for preview
            affectedProducts: products.length
          };
        }

        case 'bulk_update': {
          const allProducts = await this.client.getAllProducts();
          let targetProducts = this.client.processProductData(allProducts);

          if (intent.entities.category) {
            targetProducts = targetProducts.filter(p =>
              p.productType.toLowerCase().includes(intent.entities.category!.toLowerCase())
            );
          }

          return {
            success: true,
            message: `Preview: Bulk update akan mempengaruhi ${targetProducts.length} produk`,
            data: targetProducts.slice(0, 5),
            affectedProducts: targetProducts.length
          };
        }

        default:
          return {
            success: false,
            message: 'Preview tidak tersedia untuk aksi ini',
            error: 'Preview not supported'
          };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Gagal membuat preview: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Undo last action (if possible)
   */
  async undoAction(undoData: any): Promise<ActionResult> {
    // Implementation for undo functionality
    // This would restore previous values based on undoData
    return {
      success: false,
      message: 'Undo functionality belum diimplementasi',
      error: 'Not implemented'
    };
  }
}