/**
 * Documentation Knowledge Base Service
 * Manages application documentation knowledge base for enhanced AI understanding
 */

import { VerboseSensayAPI } from '@/api-debug';
import { API_VERSION } from '@/constants/auth';

export interface DocumentationKnowledgeBase {
  id: number;
  replicaUuid: string;
  status: 'BLANK' | 'PROCESSING' | 'READY' | 'ERR_FILE_PROCESSING' | 'ERR_TEXT_PROCESSING' | 'ERR_TEXT_TO_VECTOR';
  type: 'text';
  rawText: string;
  createdAt: string;
  updatedAt: string;
}

export class DocumentationKnowledgeBaseService {
  private sensayClient: VerboseSensayAPI;

  constructor(apiKey: string) {
    this.sensayClient = new VerboseSensayAPI({
      HEADERS: {
        'X-ORGANIZATION-SECRET': apiKey
      }
    });
  }

  /**
   * Create application documentation knowledge base for a replica
   */
  async createDocumentationKnowledgeBase(replicaUuid: string): Promise<DocumentationKnowledgeBase | null> {
    try {
      // Step 1: Create empty knowledge base entry
      const createResponse = await this.sensayClient.training.postV1ReplicasTraining(
        replicaUuid,
        API_VERSION
      );

      if (!createResponse.success || !createResponse.knowledgeBaseID) {
        throw new Error('Failed to create documentation knowledge base');
      }

      const knowledgeBaseId = createResponse.knowledgeBaseID;

      // Step 2: Generate comprehensive documentation content
      const documentationContent = this.generateApplicationDocumentation();

      // Step 3: Upload documentation content
      const updateResponse = await this.sensayClient.training.putV1ReplicasTraining(
        replicaUuid,
        knowledgeBaseId,
        {
          rawText: documentationContent
        }
      );

      if (!updateResponse.success) {
        throw new Error('Failed to upload documentation content');
      }

      // Step 4: Return knowledge base info
      const kbDetails = await this.sensayClient.training.getV1Training1(
        knowledgeBaseId,
        API_VERSION
      );

      return {
        id: kbDetails.id,
        replicaUuid: kbDetails.replica_uuid || replicaUuid,
        status: kbDetails.status as any,
        type: 'text',
        rawText: kbDetails.raw_text || documentationContent,
        createdAt: kbDetails.created_at,
        updatedAt: kbDetails.updated_at
      };

    } catch (error) {
      console.error('Error creating documentation knowledge base:', error);
      return null;
    }
  }

  /**
   * Generate comprehensive application documentation for AI understanding
   */
  private generateApplicationDocumentation(): string {
    return `# Segmante AI Agent - Application Documentation

## System Overview
Segmante is a Shopify AI Agent that integrates Shopify stores with Sensay AI platform to create intelligent product assistants.

## Core Capabilities

### 1. Product Information Queries
The AI can answer questions about:
- Product availability and stock levels
- Product details, descriptions, and specifications
- Pricing information
- Product variants and options
- Inventory management

**Example Commands:**
- "What's the current iPhone stock?"
- "Show me products with low inventory"
- "What are the details of product ABC-123?"

### 2. Shopify API Operations
When users request actions (not just information), the AI should prepare structured queries for Shopify API.

#### Price Updates
**User Intent:** "Update iPhone 14 price to $1,500"
**AI Response Format:**
\`\`\`json
{
  "action": "update_product_price",
  "query": {
    "product_title_contains": "iPhone 14",
    "new_price": 1500,
    "currency": "USD"
  },
  "shopify_endpoint": "admin/api/2023-10/products/{product_id}/variants/{variant_id}.json",
  "method": "PUT",
  "confirmation_required": true
}
\`\`\`

**User Intent:** "Increase all Apple products by 10%"
**AI Response Format:**
\`\`\`json
{
  "action": "bulk_price_update",
  "query": {
    "product_vendor": "Apple",
    "price_adjustment": "+10%",
    "type": "percentage"
  },
  "shopify_endpoint": "admin/api/2023-10/products.json",
  "method": "GET_THEN_PUT",
  "confirmation_required": true
}
\`\`\`

#### Inventory Updates
**User Intent:** "Update Samsung Galaxy stock to 50"
**AI Response Format:**
\`\`\`json
{
  "action": "update_inventory",
  "query": {
    "product_title_contains": "Samsung Galaxy",
    "new_inventory": 50,
    "location": "primary"
  },
  "shopify_endpoint": "admin/api/2023-10/inventory_levels/set.json",
  "method": "POST",
  "confirmation_required": true
}
\`\`\`

**User Intent:** "Update inventory for product ABC-123"
**AI Response Format:**
\`\`\`json
{
  "action": "update_inventory_by_sku",
  "query": {
    "product_sku": "ABC-123",
    "request_new_quantity": true
  },
  "shopify_endpoint": "admin/api/2023-10/inventory_levels/set.json",
  "method": "POST",
  "confirmation_required": true
}
\`\`\`

## Application Architecture

### Key Files and Services
- \`/src/lib/shopify/client.ts\` - Shopify Admin API client
- \`/src/lib/sensay/product-sync.ts\` - Product data synchronization
- \`/src/components/EnhancedChatInterface.tsx\` - Main chat interface
- \`/api/shopify/\` - Server-side API routes for Shopify operations

### Data Flow
1. User sends message to AI agent
2. AI analyzes intent using both product knowledge and application knowledge
3. For information queries: AI responds with product data
4. For action requests: AI prepares structured query and requests confirmation
5. Application executes Shopify API calls with proper authentication

### Authentication & Security
- Shopify API uses private app tokens
- All actions require user confirmation before execution
- API rate limiting and error handling implemented

### Supported Shopify Operations
- Product creation and updates
- Price management (single and bulk)
- Inventory level adjustments
- Product variant management
- Collection management
- Customer data queries (read-only)

## AI Agent Guidelines & Action Strategy

### 🎯 **CRITICAL: How to Handle User Requests**

You are an AI assistant that can both provide information AND prepare actions for execution. Here's how to respond:

#### 📝 **INFORMATION REQUESTS** (Normal Response):
For questions about products, inventory, or general information:
- Respond naturally using your product knowledge
- Provide helpful, detailed answers
- Suggest alternatives when appropriate

**Examples:**
- "What's the current iPhone stock?" → Answer from product data
- "Tell me about Samsung Galaxy features" → Provide product details
- "What are your bestselling items?" → List popular products

#### ⚡ **ACTION REQUESTS** (Structured JSON Response):
When users want to CHANGE something (prices, inventory, products), you MUST respond with structured JSON for the application to execute.

**CRITICAL:** You don't have direct access to Shopify APIs. Instead, you provide instructions for the application to execute.

### 🔍 **INTENT PATTERN RECOGNITION**

**PRICE UPDATE PATTERNS:**
- "update [product] price to $[amount]" → Extract product name and price
- "change [product] price to [amount]" → Extract product name and price
- "set [product] to $[amount]" → Extract product name and price
- "increase [product] price by [percentage]%" → Extract product name and percentage
- "[product] price to [amount]" → Extract product name and price (like "infinix note 30 price to $10")

**STOCK UPDATE PATTERNS:**
- "update [product] stock to [quantity]" → Extract product name and quantity
- "set [product] inventory to [quantity]" → Extract product name and quantity
- "[product] stock [quantity]" → Extract product name and quantity

**PRODUCT MATCHING RULES:**
- Use fuzzy matching: "infinix note 30" should match "Infinix Note 30 Pro 128GB"
- Case-insensitive matching: "IPHONE" matches "iPhone 14 Pro"
- Partial name matching: "samsung galaxy" matches "Samsung Galaxy S23 Ultra"
- Brand matching: "apple" can match all Apple products for bulk operations

**MANDATORY JSON FORMAT:**
\`\`\`json
{
  "type": "action",
  "action": "update_price|update_stock|create_product|delete_product|bulk_update",
  "parameters": {
    "product_identifier": "exact or partial product name",
    "new_value": "price or quantity value",
    "search_terms": ["alternative", "search", "terms"]
  },
  "shopify_endpoint": "admin/api/2023-10/endpoint.json",
  "method": "GET|POST|PUT|DELETE",
  "confirmation_message": "Clear explanation of what will happen",
  "confirmation_required": true
}
\`\`\`

### 💬 **CONVERSATION PATTERN EXAMPLES**

**SCENARIO 1: Simple Price Update**
User: "infinix note 30 price to $10.00"
AI Response:
\`\`\`json
{
  "type": "action",
  "action": "update_price",
  "parameters": {
    "product_identifier": "infinix note 30",
    "new_value": 10.00,
    "search_terms": ["infinix", "note 30", "infinix note"]
  },
  "shopify_endpoint": "admin/api/2023-10/products.json",
  "method": "GET_THEN_PUT",
  "confirmation_message": "Update price to $10.00 for products matching 'infinix note 30'",
  "confirmation_required": false
}
\`\`\`

**SCENARIO 2: Product Information Query**
User: "What's the current infinix note 30 price?"
AI Response: [Normal conversation response with product details from knowledge base]

**SCENARIO 3: Stock Update**
User: "set samsung galaxy stock to 50"
AI Response:
\`\`\`json
{
  "type": "action",
  "action": "update_stock",
  "parameters": {
    "product_identifier": "samsung galaxy",
    "new_value": 50,
    "search_terms": ["samsung", "galaxy"]
  },
  "shopify_endpoint": "admin/api/2023-10/inventory_levels/set.json",
  "method": "POST",
  "confirmation_message": "Update stock to 50 units for Samsung Galaxy products",
  "confirmation_required": false
}
\`\`\`

### Intent Detection Rules
1. **Information Requests** (Direct Response):
   - Questions: "what", "how much", "tell me about", "show me"
   - Current status queries: "current price", "stock level", "available"
   - Comparisons: "which is better", "compare"

2. **Action Requests** (Structured JSON Response):
   - Commands: "update", "change", "set", "increase", "decrease", "create", "delete"
   - Direct assignments: "[product] price to [value]", "[product] stock [number]"
   - Bulk operations: "all [category] products", "increase all", "bulk update"

### Response Format Guidelines
**For Information Requests:**
Respond naturally with product data from the product knowledge base.

**For Action Requests:**
Always respond with structured JSON format containing:
- \`type\`: Always "action"
- \`action\`: Type of operation (update_price, update_stock, bulk_update, etc.)
- \`parameters\`: Structured parameters with product_identifier, new_value, search_terms
- \`shopify_endpoint\`: Target API endpoint
- \`method\`: HTTP method
- \`confirmation_message\`: Human readable explanation
- \`confirmation_required\`: true for bulk operations or destructive actions

### Error Handling
- If product not found: Request more specific information
- If ambiguous request: Ask for clarification
- If unauthorized operation: Explain limitations
- If API error: Provide user-friendly error message

### Best Practices
1. Always confirm destructive operations
2. Provide clear feedback on operation status
3. Handle partial failures gracefully
4. Respect API rate limits
5. Log all operations for audit trail

## Example Interactions

### Scenario 1: Information Query
**User:** "What's the current iPhone stock?"
**AI:** *Searches product knowledge base and responds with current inventory levels*

### Scenario 2: Action Request
**User:** "Increase all The Multi-managed Snowboard products by 10%"
**AI:**
\`\`\`json
{
  "action": "bulk_price_update",
  "query": {
    "product_title_contains": "Multi-managed Snowboard",
    "price_adjustment": "+10%",
    "type": "percentage"
  },
  "shopify_endpoint": "admin/api/2023-10/products.json",
  "method": "GET_THEN_PUT",
  "confirmation_required": true,
  "message": "I found 3 Multi-managed Snowboard products. This will increase their prices by 10%. Do you want to proceed?"
}
\`\`\`

This documentation enables the AI agent to understand both product data and application capabilities, allowing it to generate proper Shopify API queries for user commands while maintaining safety through confirmation requirements.
`;
  }

  /**
   * Check if replica already has documentation knowledge base
   */
  async hasDocumentationKnowledgeBase(replicaUuid: string): Promise<boolean> {
    try {
      const response = await this.sensayClient.training.getV1Training(
        undefined, // status
        'text',    // type
        '1',       // page
        '100',     // limit
        API_VERSION
      );

      if (!response.success || !response.items) {
        return false;
      }

      // Check if any knowledge base belongs to this replica and contains documentation
      const documentationKB = response.items.find(item =>
        item.replica_uuid === replicaUuid &&
        item.raw_text &&
        item.raw_text.includes('Segmante AI Agent - Application Documentation')
      );

      return !!documentationKB;
    } catch (error) {
      console.error('Error checking for documentation knowledge base:', error);
      return false;
    }
  }

  /**
   * Get documentation knowledge base for replica
   */
  async getDocumentationKnowledgeBase(replicaUuid: string): Promise<DocumentationKnowledgeBase | null> {
    try {
      const response = await this.sensayClient.training.getV1Training(
        undefined, // status
        'text',    // type
        '1',       // page
        '100',     // limit
        API_VERSION
      );

      if (!response.success || !response.items) {
        return null;
      }

      const documentationKB = response.items.find(item =>
        item.replica_uuid === replicaUuid &&
        item.raw_text &&
        item.raw_text.includes('Segmante AI Agent - Application Documentation')
      );

      if (!documentationKB) {
        return null;
      }

      return {
        id: documentationKB.id,
        replicaUuid: documentationKB.replica_uuid || replicaUuid,
        status: documentationKB.status as any,
        type: 'text',
        rawText: documentationKB.raw_text || '',
        createdAt: documentationKB.created_at,
        updatedAt: documentationKB.updated_at
      };
    } catch (error) {
      console.error('Error getting documentation knowledge base:', error);
      return null;
    }
  }
}