/**
 * Replica CRUD Service
 * Enhanced replica management with create, read, update, delete operations
 */

import { VerboseSensayAPI } from '@/api-debug';
import { API_VERSION } from '@/constants/auth';

export interface ReplicaCRUDInfo {
  uuid: string;
  name: string;
  shortDescription: string;
  greeting: string;
  type: 'individual' | 'character' | 'brand';
  ownerID: string;
  private: boolean;
  slug: string;
  tags: string[];
  profileImage?: string;
  suggestedQuestions?: string[];
  createdAt: string;
  llm: {
    model: string;
    memoryMode: string;
    systemMessage: string;
  };
}

export interface CreateReplicaRequest {
  name: string;
  shortDescription: string;
  greeting?: string;
  type?: 'individual' | 'character' | 'brand';
  private?: boolean;
  tags?: string[];
  profileImage?: string;
  suggestedQuestions?: string[];
  llm?: {
    model?: string;
    memoryMode?: string;
    systemMessage?: string;
  };
}

export interface UpdateReplicaRequest {
  name?: string;
  shortDescription?: string;
  greeting?: string;
  type?: 'individual' | 'character' | 'brand';
  private?: boolean;
  tags?: string[];
  profileImage?: string;
  suggestedQuestions?: string[];
  llm?: {
    model?: string;
    memoryMode?: string;
    systemMessage?: string;
  };
}

export class ReplicaCRUDService {
  private sensayClient: VerboseSensayAPI;

  constructor(apiKey: string) {
    this.sensayClient = new VerboseSensayAPI({
      HEADERS: {
        'X-ORGANIZATION-SECRET': apiKey
      }
    });
  }

  /**
   * Get all replicas with detailed information
   */
  async getAllReplicas(): Promise<ReplicaCRUDInfo[]> {
    try {
      const response = await this.sensayClient.replicas.getV1Replicas();

      if (!response.success || !response.items) {
        return [];
      }

      return response.items.map(item => ({
        uuid: item.uuid,
        name: item.name,
        shortDescription: item.shortDescription,
        greeting: item.greeting,
        type: item.type || 'character',
        ownerID: item.ownerID,
        private: item.private || false,
        slug: item.slug,
        tags: item.tags || [],
        profileImage: item.profileImage,
        suggestedQuestions: item.suggestedQuestions,
        createdAt: item.created_at || '',
        llm: {
          model: item.llm?.model || 'claude-3-7-sonnet-latest',
          memoryMode: (item.llm?.memoryMode as any) || 'prompt-caching',
          systemMessage: item.llm?.systemMessage || ''
        }
      }));
    } catch (error) {
      console.error('Error fetching replicas:', error);
      return [];
    }
  }

  /**
   * Get replica by UUID
   */
  async getReplicaByUuid(uuid: string): Promise<ReplicaCRUDInfo | null> {
    try {
      const response = await this.sensayClient.replicas.getV1Replicas1(uuid);

      if (!response) {
        return null;
      }

      return {
        uuid: response.uuid,
        name: response.name,
        shortDescription: response.shortDescription,
        greeting: response.greeting,
        type: response.type || 'character',
        ownerID: response.ownerID,
        private: response.private || false,
        slug: response.slug,
        tags: response.tags || [],
        profileImage: response.profileImage,
        suggestedQuestions: response.suggestedQuestions,
        createdAt: (response as any).created_at || '',
        llm: {
          model: response.llm?.model || 'claude-3-7-sonnet-latest',
          memoryMode: (response.llm?.memoryMode as any) || 'prompt-caching',
          systemMessage: response.llm?.systemMessage || ''
        }
      };
    } catch (error) {
      console.error('Error fetching replica:', error);
      return null;
    }
  }

  /**
   * Create a new replica
   */
  async createReplica(replicaData: CreateReplicaRequest): Promise<{
    success: boolean;
    replica?: ReplicaCRUDInfo;
    error?: string;
  }> {
    try {
      const response = await this.sensayClient.replicas.postV1Replicas(
        API_VERSION,
        {
          name: replicaData.name,
          shortDescription: replicaData.shortDescription,
          greeting: replicaData.greeting || `Hello! I'm ${replicaData.name}, your AI assistant.`,
          type: replicaData.type || 'character',
          ownerID: '', // Will be auto-filled by API
          slug: replicaData.name.toLowerCase().replace(/\s+/g, '-'),
          private: replicaData.private || false,
          tags: replicaData.tags || [],
          profileImage: replicaData.profileImage,
          suggestedQuestions: replicaData.suggestedQuestions || [],
          llm: {
            model: (replicaData.llm?.model as any) || 'claude-3-7-sonnet-latest',
            memoryMode: (replicaData.llm?.memoryMode as any) || 'prompt-caching',
            systemMessage: replicaData.llm?.systemMessage || this.getDefaultSystemMessage()
          }
        } as any
      );

      if (!response.success) {
        return {
          success: false,
          error: 'Failed to create replica'
        };
      }

      // Get the created replica details
      if (response.uuid) {
        const createdReplica = await this.getReplicaByUuid(response.uuid);
        if (createdReplica) {
          return {
            success: true,
            replica: createdReplica
          };
        }
      }

      return {
        success: false,
        error: 'Replica created but could not retrieve details'
      };

    } catch (error: any) {
      console.error('Error creating replica:', error);
      return {
        success: false,
        error: error.message || 'Failed to create replica'
      };
    }
  }

  /**
   * Update an existing replica
   */
  async updateReplica(uuid: string, updateData: UpdateReplicaRequest): Promise<{
    success: boolean;
    replica?: ReplicaCRUDInfo;
    error?: string;
  }> {
    try {
      // Build update payload with only defined fields
      const payload: any = {};

      if (updateData.name !== undefined) payload.name = updateData.name;
      if (updateData.shortDescription !== undefined) payload.shortDescription = updateData.shortDescription;
      if (updateData.greeting !== undefined) payload.greeting = updateData.greeting;
      if (updateData.type !== undefined) payload.type = updateData.type;
      if (updateData.private !== undefined) payload.private = updateData.private;
      if (updateData.tags !== undefined) payload.tags = updateData.tags;
      if (updateData.profileImage !== undefined) payload.profileImage = updateData.profileImage;
      if (updateData.suggestedQuestions !== undefined) payload.suggestedQuestions = updateData.suggestedQuestions;

      if (updateData.llm) {
        payload.llm = {};
        if (updateData.llm.model !== undefined) payload.llm.model = updateData.llm.model;
        if (updateData.llm.memoryMode !== undefined) payload.llm.memoryMode = updateData.llm.memoryMode;
        if (updateData.llm.systemMessage !== undefined) payload.llm.systemMessage = updateData.llm.systemMessage;
      }

      const response = await this.sensayClient.replicas.putV1Replicas(
        uuid,
        API_VERSION,
        payload
      );

      if (!response.success) {
        return {
          success: false,
          error: 'Failed to update replica'
        };
      }

      // Get the updated replica details
      const updatedReplica = await this.getReplicaByUuid(uuid);
      if (updatedReplica) {
        return {
          success: true,
          replica: updatedReplica
        };
      }

      return {
        success: false,
        error: 'Replica updated but could not retrieve updated details'
      };

    } catch (error: any) {
      console.error('Error updating replica:', error);
      return {
        success: false,
        error: error.message || 'Failed to update replica'
      };
    }
  }

  /**
   * Delete a replica
   */
  async deleteReplica(uuid: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const response = await this.sensayClient.replicas.deleteV1Replicas(uuid, API_VERSION);

      if (!response.success) {
        return {
          success: false,
          error: 'Failed to delete replica'
        };
      }

      return {
        success: true
      };

    } catch (error: any) {
      console.error('Error deleting replica:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete replica'
      };
    }
  }

  /**
   * Get default system message optimized for Shopify actions
   */
  private getDefaultSystemMessage(): string {
    return `You are an intelligent AI assistant specialized in e-commerce and Shopify store management.

Your core capabilities:
1. Answer questions about products, inventory, and store information
2. Provide structured action plans for store modifications
3. Help users with product recommendations and customer service

IMPORTANT: When users request actions (price changes, inventory updates, product modifications), respond with structured JSON format for the application to execute. You do not have direct API access - you provide instructions.

For information queries, respond naturally with helpful details.
For action requests, use this JSON format:

{
  "type": "action",
  "action": "operation_type",
  "parameters": { "specific": "parameters" },
  "shopify_endpoint": "api_endpoint",
  "method": "HTTP_method",
  "confirmation_message": "Clear explanation",
  "confirmation_required": true
}

Always prioritize user safety and require confirmation for any modifications.`;
  }

  /**
   * Get enhanced system message for Shopify action handling
   */
  getShopifyActionSystemMessage(): string {
    return `You are an advanced AI assistant for Shopify store management with both conversational and action capabilities.

## Your Role:
- Provide product information and customer support
- Generate structured action plans for store modifications
- Ensure all changes require user confirmation for safety

## 🎯 CRITICAL: Intent Pattern Recognition

### PRICE UPDATE PATTERNS (respond with JSON):
- "infinix note 30 price to $10.00" → PRICE UPDATE ACTION
- "update [product] price to $[amount]" → PRICE UPDATE ACTION
- "set [product] to $[amount]" → PRICE UPDATE ACTION
- "change [product] price to [amount]" → PRICE UPDATE ACTION

### STOCK UPDATE PATTERNS (respond with JSON):
- "set [product] stock to [number]" → STOCK UPDATE ACTION
- "update [product] inventory to [number]" → STOCK UPDATE ACTION

### INFORMATION PATTERNS (respond conversationally):
- "What is the price of [product]?" → NORMAL CONVERSATION
- "Tell me about [product]" → NORMAL CONVERSATION
- "How much inventory do we have?" → NORMAL CONVERSATION

## Response Strategy:

### For INFORMATION requests:
Respond naturally with helpful product details, inventory status, recommendations, etc.

### For ACTION requests:
You must respond with structured JSON that the application will execute:

\`\`\`json
{
  "type": "action",
  "action": "update_price",
  "parameters": {
    "product_identifier": "infinix note 30",
    "new_value": 10.00,
    "search_terms": ["infinix", "note 30"]
  },
  "shopify_endpoint": "admin/api/2023-10/products.json",
  "method": "GET_THEN_PUT",
  "confirmation_message": "Update price to $10.00 for infinix note 30",
  "confirmation_required": false
}
\`\`\`

### CRITICAL EXAMPLE:

**User Input:** "infinix note 30 price to $10.00"
**Your Response:**
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
  "confirmation_message": "Update price to $10.00 for infinix note 30",
  "confirmation_required": false
}
\`\`\`

**User Input:** "What's the current price of infinix note 30?"
**Your Response:** [Normal conversation with current product details from knowledge base]

### Product Matching Rules:
- Use fuzzy matching: "infinix note 30" matches "Infinix note 30"
- Case-insensitive: "SAMSUNG" matches "Samsung Galaxy"
- Partial matching: "galaxy" matches "Samsung Galaxy S23"

### Action Types:
- update_price: For price changes
- update_stock: For inventory changes
- bulk_update: For multiple products

You have comprehensive knowledge of the store's products and can both inform and act as requested.`;
  }

  /**
   * Update replica with Shopify-optimized system message
   */
  async updateReplicaForShopifyActions(uuid: string): Promise<{
    success: boolean;
    replica?: ReplicaCRUDInfo;
    error?: string;
  }> {
    return this.updateReplica(uuid, {
      llm: {
        systemMessage: this.getShopifyActionSystemMessage()
      }
    });
  }
}