/**
 * Intent Detection Service
 * Analyzes user messages to determine if they contain actionable intents
 * for Shopify operations or are regular conversation queries.
 */

export type ChatMode = 'conversation' | 'action';

export interface ActionIntent {
  type: 'update_price' | 'update_stock' | 'create_product' | 'delete_product' | 'bulk_update' | 'search_products';
  confidence: number;
  entities: {
    productId?: string;
    sku?: string;
    productName?: string;
    quantity?: number;
    price?: number;
    percentage?: number;
    category?: string;
    searchQuery?: string;
  };
  originalMessage: string;
  requiresConfirmation: boolean;
}

export interface IntentDetectionResult {
  mode: ChatMode;
  action?: ActionIntent;
  conversationFallback: boolean;
}

export class IntentDetectionService {
  // Action keywords mapping with confidence weights
  private static readonly ACTION_KEYWORDS = {
    update_price: {
      keywords: ['update price', 'change price', 'set price', 'modify price', 'increase price', 'decrease price', 'price to', 'pricing'],
      weight: 0.8
    },
    update_stock: {
      keywords: ['update stock', 'change stock', 'set stock', 'add stock', 'reduce stock', 'inventory', 'stock level'],
      weight: 0.8
    },
    create_product: {
      keywords: ['create product', 'add product', 'new product', 'make product', 'add new product'],
      weight: 0.9
    },
    delete_product: {
      keywords: ['delete product', 'remove product', 'drop product', 'eliminate product'],
      weight: 0.95
    },
    bulk_update: {
      keywords: ['bulk update', 'batch update', 'mass update', 'update all', 'all products'],
      weight: 0.85
    },
    search_products: {
      keywords: ['search product', 'find product', 'look for product', 'show products', 'list products'],
      weight: 0.3 // Lower weight as this might be conversational
    }
  };

  // Entity extraction patterns
  private static readonly ENTITY_PATTERNS = {
    price: /(?:price|cost)\s*(?:to|at|is)?\s*(?:\$|USD|EUR|GBP)?\s*(\d+(?:[.,]\d{3})*(?:[.,]\d{1,2})?)/i,
    percentage: /(\d+(?:[.,]\d+)?)\s*%/,
    quantity: /(?:stock|inventory|quantity)\s*(?:to|at|is)?\s*(\d+)/i,
    productName: /(?:product|item)\s+([^\d\n]+?)(?:\s+(?:price|stock)|$)/i,
    sku: /sku[:\s]+([a-zA-Z0-9\-_]+)/i,
    productId: /product\s*id[:\s]+(\d+)/i
  };

  /**
   * Main intent detection method
   */
  static detectIntent(message: string): IntentDetectionResult {
    const normalizedMessage = message.toLowerCase().trim();

    // Quick keyword scan
    const actionKeywords = this.detectActionKeywords(normalizedMessage);

    if (actionKeywords.length === 0) {
      return {
        mode: 'conversation',
        conversationFallback: false
      };
    }

    // Determine primary action based on highest confidence
    const primaryAction = actionKeywords.reduce((max, current) =>
      current.confidence > max.confidence ? current : max
    );

    // Extract entities from the message
    const entities = this.extractEntities(message);

    // Build action intent
    const actionIntent: ActionIntent = {
      type: primaryAction.type,
      confidence: primaryAction.confidence,
      entities,
      originalMessage: message,
      requiresConfirmation: this.requiresConfirmation(primaryAction.type, entities)
    };

    // Determine if we should fallback to conversation
    const shouldFallback = primaryAction.confidence < 0.7 ||
                          (primaryAction.type === 'search_products' && Object.keys(entities).length === 0);

    return {
      mode: shouldFallback ? 'conversation' : 'action',
      action: shouldFallback ? undefined : actionIntent,
      conversationFallback: shouldFallback
    };
  }

  /**
   * Detect action keywords in message
   */
  private static detectActionKeywords(message: string): Array<{type: ActionIntent['type'], confidence: number}> {
    const results: Array<{type: ActionIntent['type'], confidence: number}> = [];

    for (const [actionType, config] of Object.entries(this.ACTION_KEYWORDS)) {
      let maxConfidence = 0;

      for (const keyword of config.keywords) {
        if (message.includes(keyword.toLowerCase())) {
          // Calculate confidence based on keyword match and context
          const confidence = this.calculateKeywordConfidence(message, keyword, config.weight);
          maxConfidence = Math.max(maxConfidence, confidence);
        }
      }

      if (maxConfidence > 0) {
        results.push({
          type: actionType as ActionIntent['type'],
          confidence: maxConfidence
        });
      }
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculate confidence score for keyword match
   */
  private static calculateKeywordConfidence(message: string, keyword: string, baseWeight: number): number {
    const keywordLength = keyword.length;
    const messageLength = message.length;

    // Base confidence from keyword match
    let confidence = baseWeight;

    // Boost confidence for longer, more specific keywords
    if (keywordLength > 10) {
      confidence += 0.1;
    }

    // Reduce confidence if keyword is small part of long message
    if (messageLength > 100 && keywordLength < 10) {
      confidence -= 0.1;
    }

    // Boost confidence if message is focused (short and specific)
    if (messageLength < 50 && keywordLength > 5) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Extract entities (products, prices, quantities, etc.) from message
   */
  private static extractEntities(message: string): ActionIntent['entities'] {
    const entities: ActionIntent['entities'] = {};

    // Extract price
    const priceMatch = message.match(this.ENTITY_PATTERNS.price);
    if (priceMatch) {
      entities.price = parseFloat(priceMatch[1].replace(/[.,]/g, '.'));
    }

    // Extract percentage
    const percentageMatch = message.match(this.ENTITY_PATTERNS.percentage);
    if (percentageMatch) {
      entities.percentage = parseFloat(percentageMatch[1].replace(',', '.'));
    }

    // Extract quantity/stock
    const quantityMatch = message.match(this.ENTITY_PATTERNS.quantity);
    if (quantityMatch) {
      entities.quantity = parseInt(quantityMatch[1]);
    }

    // Extract product name
    const productNameMatch = message.match(this.ENTITY_PATTERNS.productName);
    if (productNameMatch) {
      entities.productName = productNameMatch[1].trim();
    }

    // Extract SKU
    const skuMatch = message.match(this.ENTITY_PATTERNS.sku);
    if (skuMatch) {
      entities.sku = skuMatch[1];
    }

    // Extract product ID
    const productIdMatch = message.match(this.ENTITY_PATTERNS.productId);
    if (productIdMatch) {
      entities.productId = productIdMatch[1];
    }

    // For search queries, use the entire message if no specific entities found
    if (Object.keys(entities).length === 0) {
      entities.searchQuery = message;
    }

    return entities;
  }

  /**
   * Determine if action requires user confirmation
   */
  private static requiresConfirmation(actionType: ActionIntent['type'], entities: ActionIntent['entities']): boolean {
    // Always require confirmation for destructive actions
    if (actionType === 'delete_product') {
      return true;
    }

    // Require confirmation for bulk operations
    if (actionType === 'bulk_update') {
      return true;
    }

    // Require confirmation for significant price changes
    if (actionType === 'update_price' && entities.percentage && entities.percentage > 20) {
      return true;
    }

    // Require confirmation for creating products
    if (actionType === 'create_product') {
      return true;
    }

    // Standard updates with specific entities don't need confirmation
    return false;
  }

  /**
   * Validate if message has sufficient entities for action execution
   */
  static hasRequiredEntities(actionIntent: ActionIntent): boolean {
    const { type, entities } = actionIntent;

    switch (type) {
      case 'update_price':
        return !!(entities.price || entities.percentage) &&
               !!(entities.productName || entities.sku || entities.productId);

      case 'update_stock':
        return !!entities.quantity &&
               !!(entities.productName || entities.sku || entities.productId);

      case 'delete_product':
        return !!(entities.productName || entities.sku || entities.productId);

      case 'create_product':
        return !!entities.productName;

      case 'bulk_update':
        return !!(entities.price || entities.percentage || entities.quantity);

      case 'search_products':
        return true; // Search can work with any input

      default:
        return false;
    }
  }

  /**
   * Generate human-readable description of detected intent
   */
  static describeIntent(actionIntent: ActionIntent): string {
    const { type, entities } = actionIntent;

    switch (type) {
      case 'update_price':
        if (entities.percentage) {
          return `Update price by ${entities.percentage}% for ${entities.productName || entities.sku || 'product'}`;
        }
        return `Update price to $${entities.price?.toLocaleString()} for ${entities.productName || entities.sku || 'product'}`;

      case 'update_stock':
        return `Update stock to ${entities.quantity} for ${entities.productName || entities.sku || 'product'}`;

      case 'delete_product':
        return `Delete product: ${entities.productName || entities.sku || entities.productId}`;

      case 'create_product':
        return `Create new product: ${entities.productName}`;

      case 'bulk_update':
        return `Bulk update for ${entities.category || 'all products'}`;

      case 'search_products':
        return `Search products: ${entities.searchQuery}`;

      default:
        return 'Unknown action';
    }
  }
}