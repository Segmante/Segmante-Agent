/**
 * Sensay-Powered Intent Analyzer
 * Uses Sensay AI to provide advanced intent analysis and entity extraction
 * for complex user requests that go beyond simple keyword matching.
 */

import { VerboseSensayAPI } from '@/api-debug';
import { API_VERSION } from '@/constants/auth';
import { ActionIntent, IntentDetectionResult } from './intent-detector';

export interface SensayAnalysisResult {
  confidence: number;
  intent: ActionIntent | null;
  reasoning: string;
  suggestions: string[];
  fallbackToConversation: boolean;
}

export interface AnalysisContext {
  recentProducts?: Array<{
    id: string;
    title: string;
    sku: string;
    price: string;
  }>;
  userHistory?: string[];
  storeInfo?: {
    name: string;
    currency: string;
    domain: string;
  };
}

export class SensayIntentAnalyzer {
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
   * Analyze user message using Sensay AI for advanced intent detection
   */
  async analyzeIntent(
    message: string,
    context?: AnalysisContext
  ): Promise<SensayAnalysisResult> {
    try {
      console.log('🧠 Sensay Intent Analysis started for:', message);

      const analysisPrompt = this.buildAnalysisPrompt(message, context);

      // Use experimental endpoint for structured response
      const response = await this.sensayClient.chatCompletions.postV1ExperimentalReplicasChatCompletions(
        this.replicaUuid,
        {
          messages: [
            {
              role: 'system',
              content: analysisPrompt
            },
            {
              role: 'user',
              content: message
            }
          ],
          store: false // Don't store this analysis in chat history
        }
      );

      const analysisText = response.choices[0]?.message?.content;
      if (!analysisText) {
        throw new Error('No analysis response from Sensay');
      }

      // Parse the structured response
      const analysis = this.parseAnalysisResponse(analysisText, message);
      console.log('🧠 Sensay Analysis completed:', analysis);

      return analysis;

    } catch (error: any) {
      console.error('❌ Sensay Intent Analysis failed:', error);

      return {
        confidence: 0,
        intent: null,
        reasoning: `Analysis failed: ${error.message}`,
        suggestions: ['Try using more specific commands'],
        fallbackToConversation: true
      };
    }
  }

  /**
   * Build comprehensive analysis prompt for Sensay
   */
  private buildAnalysisPrompt(message: string, context?: AnalysisContext): string {
    const contextInfo = context ? `
STORE CONTEXT:
${context.storeInfo ? `Store: ${context.storeInfo.name} (${context.storeInfo.domain})` : ''}
${context.recentProducts ? `Recent Products: ${context.recentProducts.map(p => `${p.title} (${p.sku})`).join(', ')}` : ''}
${context.userHistory ? `Recent Commands: ${context.userHistory.slice(-3).join(', ')}` : ''}
` : '';

    return `You are an expert intent analyzer for a Shopify store management system. Your job is to analyze user messages and determine if they contain actionable requests for product management.

${contextInfo}

SUPPORTED ACTIONS:
1. update_price - Change product prices (by amount or percentage)
2. update_stock - Modify inventory levels
3. create_product - Add new products
4. delete_product - Remove products (requires high confidence)
5. bulk_update - Mass operations on multiple products
6. search_products - Find products by criteria

ANALYSIS REQUIREMENTS:
- Determine if the message contains a clear actionable intent
- Extract specific entities: product names, SKUs, prices, quantities, percentages
- Assess confidence level (0.0 to 1.0)
- Identify if confirmation is needed for risky operations
- Provide reasoning for your decision

RESPONSE FORMAT (JSON):
{
  "action_detected": true/false,
  "action_type": "update_price|update_stock|create_product|delete_product|bulk_update|search_products|none",
  "confidence": 0.0-1.0,
  "entities": {
    "product_name": "extracted product name",
    "sku": "extracted SKU",
    "product_id": "extracted ID",
    "price": numeric_value,
    "percentage": numeric_value,
    "quantity": numeric_value,
    "category": "product category",
    "search_query": "search terms"
  },
  "requires_confirmation": true/false,
  "reasoning": "explain your analysis",
  "suggestions": ["helpful suggestions for user"],
  "fallback_conversation": true/false
}

EXAMPLES:
User: "update iPhone 14 price to $1,500"
→ action_type: "update_price", confidence: 0.9, entities: {product_name: "iPhone 14", price: 15000000}

User: "increase all Apple products by 10%"
→ action_type: "bulk_update", confidence: 0.8, entities: {category: "Apple", percentage: 10}

User: "gimana cara setting payment gateway?"
→ action_detected: false, fallback_conversation: true

IMPORTANT:
- Be conservative with confidence scores for ambiguous requests
- Always require confirmation for delete operations
- Extract numerical values carefully (handle Indonesian number format)
- Consider context from recent products and commands
- If unsure, recommend conversation mode

Analyze this message and respond with valid JSON only:`;
  }

  /**
   * Parse the structured response from Sensay
   */
  private parseAnalysisResponse(analysisText: string, originalMessage: string): SensayAnalysisResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const analysis = JSON.parse(jsonMatch[0]);

      // Validate and transform to our format
      if (!analysis.action_detected || analysis.fallback_conversation) {
        return {
          confidence: 0,
          intent: null,
          reasoning: analysis.reasoning || 'No clear action detected',
          suggestions: analysis.suggestions || ['Try using more specific commands'],
          fallbackToConversation: true
        };
      }

      // Build ActionIntent from analysis
      const actionIntent: ActionIntent = {
        type: analysis.action_type,
        confidence: analysis.confidence || 0,
        entities: this.normalizeEntities(analysis.entities || {}),
        originalMessage,
        requiresConfirmation: analysis.requires_confirmation || false
      };

      return {
        confidence: analysis.confidence || 0,
        intent: actionIntent,
        reasoning: analysis.reasoning || 'Action detected by Sensay AI',
        suggestions: analysis.suggestions || [],
        fallbackToConversation: false
      };

    } catch (error: any) {
      console.error('Failed to parse Sensay analysis:', error);

      // Fallback to basic keyword extraction
      return {
        confidence: 0.3,
        intent: null,
        reasoning: `Failed to parse AI analysis: ${error.message}`,
        suggestions: ['Try using clearer command format'],
        fallbackToConversation: true
      };
    }
  }

  /**
   * Normalize entities from Sensay response to match our ActionIntent format
   */
  private normalizeEntities(rawEntities: any): ActionIntent['entities'] {
    const entities: ActionIntent['entities'] = {};

    // Map and validate entity fields
    if (rawEntities.product_name) {
      entities.productName = String(rawEntities.product_name).trim();
    }

    if (rawEntities.sku) {
      entities.sku = String(rawEntities.sku).trim();
    }

    if (rawEntities.product_id) {
      entities.productId = String(rawEntities.product_id);
    }

    if (typeof rawEntities.price === 'number') {
      entities.price = rawEntities.price;
    } else if (rawEntities.price) {
      // Try to parse price from string (handle Indonesian format)
      const priceStr = String(rawEntities.price).replace(/[^\d.,]/g, '');
      const price = parseFloat(priceStr.replace(',', '.'));
      if (!isNaN(price)) {
        entities.price = price;
      }
    }

    if (typeof rawEntities.percentage === 'number') {
      entities.percentage = rawEntities.percentage;
    } else if (rawEntities.percentage) {
      const percentage = parseFloat(String(rawEntities.percentage));
      if (!isNaN(percentage)) {
        entities.percentage = percentage;
      }
    }

    if (typeof rawEntities.quantity === 'number') {
      entities.quantity = rawEntities.quantity;
    } else if (rawEntities.quantity) {
      const quantity = parseInt(String(rawEntities.quantity));
      if (!isNaN(quantity)) {
        entities.quantity = quantity;
      }
    }

    if (rawEntities.category) {
      entities.category = String(rawEntities.category).trim();
    }

    if (rawEntities.search_query) {
      entities.searchQuery = String(rawEntities.search_query).trim();
    }

    return entities;
  }

  /**
   * Enhance basic intent detection with Sensay analysis
   */
  async enhanceIntentDetection(
    basicResult: IntentDetectionResult,
    message: string,
    context?: AnalysisContext
  ): Promise<IntentDetectionResult> {
    // Only use Sensay for ambiguous cases or when basic detection fails
    if (basicResult.mode === 'action' &&
        basicResult.action &&
        basicResult.action.confidence > 0.8) {
      console.log('🎯 Basic detection confident, skipping Sensay enhancement');
      return basicResult;
    }

    console.log('🤔 Basic detection uncertain, using Sensay enhancement');

    const sensayAnalysis = await this.analyzeIntent(message, context);

    if (sensayAnalysis.fallbackToConversation || !sensayAnalysis.intent) {
      return {
        mode: 'conversation',
        conversationFallback: true
      };
    }

    // Use Sensay result if it's more confident
    if (sensayAnalysis.confidence > (basicResult.action?.confidence || 0)) {
      return {
        mode: 'action',
        action: sensayAnalysis.intent,
        conversationFallback: false
      };
    }

    // Otherwise, stick with basic result or fallback to conversation
    return basicResult.mode === 'action' ? basicResult : {
      mode: 'conversation',
      conversationFallback: true
    };
  }

  /**
   * Get context-aware suggestions for user
   */
  async getSuggestions(message: string, context?: AnalysisContext): Promise<string[]> {
    try {
      const suggestionsPrompt = `
Based on the user message: "${message}"

Provide 3-5 helpful suggestions for Shopify store management commands they might want to try.

Context: ${context ? JSON.stringify(context) : 'None'}

Return suggestions as a simple array of strings, one per line.
Focus on actionable commands related to product management.

Examples:
- Update iPhone product stock to 50
- Increase all Samsung products price by 15%
- Search products with tag "sale"
`;

      const response = await this.sensayClient.chatCompletions.postV1ReplicasChatCompletions(
        this.replicaUuid,
        API_VERSION,
        {
          content: suggestionsPrompt,
          skip_chat_history: true,
          source: 'web'
        }
      );

      // Parse suggestions from response
      const suggestions = response.content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('-'))
        .slice(0, 5);

      return suggestions.length > 0 ? suggestions : [
        'Try commands like "update [product name] price to [price]"',
        'Or "update [product name] stock to [quantity]"',
        'Type "search product [keyword]" to search products'
      ];

    } catch (error) {
      console.error('Failed to get suggestions:', error);
      return [
        'Try commands like "update [product name] price to [price]"',
        'Or "update [product name] stock to [quantity]"'
      ];
    }
  }
}