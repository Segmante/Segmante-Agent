/**
 * Smart Intent Detection using Sensay AI
 * Leverages both product knowledge and application documentation for intelligent query analysis
 */

import { VerboseSensayAPI } from '@/api-debug';
import { API_VERSION } from '@/constants/auth';

export interface IntentAnalysis {
  type: 'information' | 'action';
  category: 'product_query' | 'price_update' | 'inventory_update' | 'product_create' | 'bulk_operation' | 'general';
  confidence: number;
  action?: {
    operation: string;
    parameters: Record<string, any>;
    shopifyEndpoint: string;
    method: string;
    confirmationRequired: boolean;
    description: string;
  };
  clarificationNeeded?: {
    question: string;
    missingInfo: string[];
  };
  response?: string;
}

export class SmartIntentDetector {
  private sensayClient: VerboseSensayAPI;
  private replicaUuid: string;

  constructor(apiKey: string, replicaUuid: string) {
    this.sensayClient = new VerboseSensayAPI({
      HEADERS: {
        'X-ORGANIZATION-SECRET': apiKey
      }
    });
    this.replicaUuid = replicaUuid;
  }

  /**
   * Analyze user intent using AI with application context
   */
  async analyzeIntent(userMessage: string, conversationHistory?: Array<{role: string, content: string}>): Promise<IntentAnalysis> {
    try {
      // Create context-aware prompt for intent analysis
      const intentPrompt = this.createIntentAnalysisPrompt(userMessage, conversationHistory);

      // Use Sensay chat completions to analyze intent with full application context
      const response = await this.sensayClient.chatCompletions.postV1ReplicasChatCompletions(
        this.replicaUuid,
        API_VERSION,
        {
          content: intentPrompt,
          skip_chat_history: true // Don't store this analysis in chat history
        }
      );

      if (!response.success || !response.content) {
        throw new Error('Failed to analyze intent');
      }

      // Parse AI response into structured intent analysis
      return this.parseIntentResponse(response.content, userMessage);

    } catch (error) {
      console.error('Error analyzing intent:', error);

      // Fallback to simple pattern-based detection
      return this.fallbackIntentDetection(userMessage);
    }
  }

  /**
   * Create comprehensive prompt for intent analysis
   */
  private createIntentAnalysisPrompt(userMessage: string, conversationHistory?: Array<{role: string, content: string}>): string {
    const historyContext = conversationHistory && conversationHistory.length > 0
      ? `\n\nConversation History:\n${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`
      : '';

    return `INTENT ANALYSIS TASK:

Analyze this user message and determine the intent using your knowledge of both product data and application capabilities:

USER MESSAGE: "${userMessage}"${historyContext}

Instructions:
1. Determine if this is an INFORMATION request (asking about products) or an ACTION request (wanting to modify something)
2. If it's an ACTION request, provide a structured JSON response with Shopify API details
3. If clarification is needed, specify what information is missing
4. Always consider the application's capabilities as documented in your knowledge base

Response Format (respond with valid JSON only):
{
  "type": "information" | "action",
  "category": "product_query" | "price_update" | "inventory_update" | "product_create" | "bulk_operation" | "general",
  "confidence": 0-100,
  "action": {
    "operation": "description of operation",
    "parameters": {"key": "value"},
    "shopifyEndpoint": "admin/api/2023-10/products.json",
    "method": "GET|POST|PUT|DELETE",
    "confirmationRequired": true,
    "description": "Human readable explanation"
  },
  "clarificationNeeded": {
    "question": "What specific information do you need?",
    "missingInfo": ["specific_product", "new_price", "etc"]
  },
  "response": "Direct answer for information queries"
}

Examples of ACTION requests that need structured responses:
- "Update iPhone price to $1500"
- "Set Samsung Galaxy inventory to 50"
- "Increase all Apple products by 10%"
- "Create a new product called XYZ"

Examples of INFORMATION requests:
- "What's the current iPhone stock?"
- "Show me product details"
- "What are the best selling items?"

Analyze the message and respond with JSON only.`;
  }

  /**
   * Parse AI response into structured intent analysis
   */
  private parseIntentResponse(aiResponse: string, originalMessage: string): IntentAnalysis {
    try {
      // Try to extract JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and normalize the response
      return {
        type: parsed.type === 'action' ? 'action' : 'information',
        category: this.validateCategory(parsed.category),
        confidence: Math.max(0, Math.min(100, parsed.confidence || 50)),
        action: parsed.action ? {
          operation: parsed.action.operation || 'unknown',
          parameters: parsed.action.parameters || {},
          shopifyEndpoint: parsed.action.shopifyEndpoint || '',
          method: parsed.action.method || 'GET',
          confirmationRequired: parsed.action.confirmationRequired !== false,
          description: parsed.action.description || ''
        } : undefined,
        clarificationNeeded: parsed.clarificationNeeded ? {
          question: parsed.clarificationNeeded.question || 'Could you provide more details?',
          missingInfo: parsed.clarificationNeeded.missingInfo || []
        } : undefined,
        response: parsed.response || undefined
      };

    } catch (error) {
      console.error('Error parsing AI intent response:', error);
      return this.fallbackIntentDetection(originalMessage);
    }
  }

  /**
   * Validate category values
   */
  private validateCategory(category: string): IntentAnalysis['category'] {
    const validCategories: IntentAnalysis['category'][] = [
      'product_query', 'price_update', 'inventory_update', 'product_create', 'bulk_operation', 'general'
    ];

    return validCategories.includes(category as any)
      ? category as IntentAnalysis['category']
      : 'general';
  }

  /**
   * Fallback intent detection using simple patterns
   */
  private fallbackIntentDetection(userMessage: string): IntentAnalysis {
    const message = userMessage.toLowerCase();

    // Action patterns
    const priceUpdatePatterns = [
      /update.*price|set.*price|change.*price|price.*to/,
      /increase.*by|decrease.*by|raise.*price|lower.*price/
    ];

    const inventoryPatterns = [
      /update.*stock|set.*inventory|stock.*to|inventory.*to/,
      /update.*quantity|set.*quantity/
    ];

    const bulkPatterns = [
      /all products|bulk|increase all|decrease all|update all/
    ];

    // Check for action patterns
    if (priceUpdatePatterns.some(pattern => pattern.test(message))) {
      return {
        type: 'action',
        category: bulkPatterns.some(pattern => pattern.test(message)) ? 'bulk_operation' : 'price_update',
        confidence: 70,
        clarificationNeeded: {
          question: 'Could you specify which product and the new price?',
          missingInfo: ['specific_product', 'new_price']
        }
      };
    }

    if (inventoryPatterns.some(pattern => pattern.test(message))) {
      return {
        type: 'action',
        category: bulkPatterns.some(pattern => pattern.test(message)) ? 'bulk_operation' : 'inventory_update',
        confidence: 70,
        clarificationNeeded: {
          question: 'Could you specify which product and the new stock level?',
          missingInfo: ['specific_product', 'new_quantity']
        }
      };
    }

    // Default to information request
    return {
      type: 'information',
      category: 'product_query',
      confidence: 60,
      response: 'I can help you with product information. What would you like to know?'
    };
  }

  /**
   * Process action request with Shopify API integration
   */
  async processActionRequest(intent: IntentAnalysis, userMessage: string): Promise<{
    success: boolean;
    actionPlan?: any;
    error?: string;
    needsConfirmation?: boolean;
  }> {
    if (intent.type !== 'action' || !intent.action) {
      return { success: false, error: 'Not an action request' };
    }

    try {
      // Create detailed action plan based on intent
      const actionPlan = {
        operation: intent.action.operation,
        parameters: intent.action.parameters,
        shopifyEndpoint: intent.action.shopifyEndpoint,
        method: intent.action.method,
        description: intent.action.description,
        originalMessage: userMessage,
        confirmationRequired: intent.action.confirmationRequired
      };

      return {
        success: true,
        actionPlan,
        needsConfirmation: intent.action.confirmationRequired
      };

    } catch (error) {
      console.error('Error processing action request:', error);
      return {
        success: false,
        error: 'Failed to process action request'
      };
    }
  }

  /**
   * Get response for information requests
   */
  async getInformationResponse(userMessage: string, conversationHistory?: Array<{role: string, content: string}>): Promise<string> {
    try {
      const response = await this.sensayClient.chatCompletions.postV1ReplicasChatCompletions(
        this.replicaUuid,
        API_VERSION,
        {
          content: userMessage
        }
      );

      return response.success && response.content ? response.content : 'I apologize, but I cannot process your request right now.';

    } catch (error) {
      console.error('Error getting information response:', error);
      return 'I apologize, but I cannot process your request right now.';
    }
  }
}