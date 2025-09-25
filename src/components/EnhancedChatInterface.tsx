'use client';

/**
 * Enhanced ChatInterface with Dual-Mode Operation
 * Supports both conversational Q&A and action execution modes
 * with comprehensive safety features and user confirmations.
 */

import { useState, useRef, useEffect } from 'react';
import { VerboseSensayAPI } from '@/api-debug';
import { SAMPLE_USER_ID, API_VERSION } from '@/constants/auth';
import { MessageSquare, AlertTriangle, CheckCircle, Clock, Settings, Zap } from 'lucide-react';
import { UserSessionManager } from '@/lib/user-session';
import { ShopifyConnectionPersistence } from '@/lib/shopify/connection-persistence';
import { SensayUserManager } from '@/lib/sensay/user-manager';

// Enhanced imports for dual-mode functionality
import { IntentDetectionService, IntentDetectionResult, ActionIntent } from '@/lib/ai/intent-detector';
import { SensayIntentAnalyzer, AnalysisContext } from '@/lib/ai/sensay-intent-analyzer';
import { ActionExecutor, ActionExecution, ExecutionContext } from '@/lib/ai/action-executor';
import { ShopifyClient } from '@/lib/shopify/client';

// Enhanced ChatMessage type with action support
interface EnhancedChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  name?: string;

  // Action-related properties
  actionExecution?: ActionExecution;
  actionPreview?: any;
  requiresConfirmation?: boolean;
  timestamp: Date;
  messageType: 'conversation' | 'action_preview' | 'action_result' | 'confirmation_request';
}

interface EnhancedChatInterfaceProps {
  apiKey?: string;
  shopifyConfig?: {
    domain: string;
    accessToken: string;
  };
}

type ChatMode = 'conversation' | 'action';

const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({
  apiKey,
  shopifyConfig
}) => {
  // Existing state
  const [messages, setMessages] = useState<EnhancedChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localApiKey, setLocalApiKey] = useState(apiKey || '');
  const [showConfig, setShowConfig] = useState(!apiKey);
  const [replicaUuid, setReplicaUuid] = useState<string | null>(null);

  // Enhanced state for dual-mode operation
  const [currentMode, setCurrentMode] = useState<ChatMode>('conversation');
  const [pendingExecution, setPendingExecution] = useState<ActionExecution | null>(null);
  const [sensayAnalyzer, setSensayAnalyzer] = useState<SensayIntentAnalyzer | null>(null);
  const [actionExecutor, setActionExecutor] = useState<ActionExecutor | null>(null);
  const [isActionMode, setIsActionMode] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Get the correct user ID based on shopify configuration
   * This matches the authentication system used in sync process
   */
  const getAuthenticatedUserId = (): string => {
    // First, try user session (preferred)
    const userSession = UserSessionManager.getUserSession();
    if (userSession && userSession.userId) {
      console.log('🔑 Using user ID from session:', userSession.userId);
      return userSession.userId;
    }

    // Second, try to generate from shopify config
    if (shopifyConfig) {
      const userManager = new SensayUserManager('dummy-key');
      const generatedUserId = userManager.generateUserId(shopifyConfig.domain, shopifyConfig.accessToken);
      console.log('🔑 Generated user ID from shopify config:', {
        domain: shopifyConfig.domain,
        userId: generatedUserId,
        accessTokenPreview: shopifyConfig.accessToken.substring(0, 10) + '...'
      });
      return generatedUserId;
    }

    // Last resort: use sample user ID (but this will likely fail)
    console.warn('⚠️ Using SAMPLE_USER_ID as fallback - this may cause connection issues');
    return SAMPLE_USER_ID;
  };

  // Initialize enhanced services when API key and replica are ready
  useEffect(() => {
    if (localApiKey && replicaUuid && shopifyConfig) {
      const userId = getAuthenticatedUserId();

      // Initialize Sensay analyzer
      const analyzer = new SensayIntentAnalyzer(localApiKey, replicaUuid, userId);
      setSensayAnalyzer(analyzer);

      // Initialize action executor with Shopify client
      const shopifyClient = new ShopifyClient({
        domain: shopifyConfig.domain,
        accessToken: shopifyConfig.accessToken
      });
      const executor = new ActionExecutor(shopifyClient);
      setActionExecutor(executor);

      console.log('🚀 Enhanced chat services initialized');
    }
  }, [localApiKey, replicaUuid, shopifyConfig]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update localApiKey when apiKey prop changes
  useEffect(() => {
    if (apiKey) {
      setLocalApiKey(apiKey);
      setShowConfig(false);
    }
  }, [apiKey]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalApiKey(e.target.value);
    setReplicaUuid(null);
  };

  /**
   * Enhanced message processing with dual-mode support
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim()) return;
    if (!localApiKey) {
      setError('Please provide an API key');
      return;
    }

    setError(null);

    // Add user message to chat
    const userMessage: EnhancedChatMessage = {
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
      messageType: 'conversation'
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      // Step 1: Intent Detection
      console.log('🤔 Analyzing user intent...');
      const basicIntentResult = IntentDetectionService.detectIntent(currentMessage);

      // Step 2: Enhanced analysis with Sensay (if available and needed)
      let finalIntentResult = basicIntentResult;

      if (sensayAnalyzer && (basicIntentResult.conversationFallback || (basicIntentResult.action?.confidence ?? 0) < 0.8)) {
        console.log('🧠 Using Sensay for enhanced intent analysis...');
        const context = await buildAnalysisContext();
        finalIntentResult = await sensayAnalyzer.enhanceIntentDetection(basicIntentResult, currentMessage, context);
      }

      // Step 3: Route to appropriate mode
      if (finalIntentResult.mode === 'action' && finalIntentResult.action && actionExecutor) {
        await handleActionMode(finalIntentResult.action, currentMessage);
      } else {
        await handleConversationMode(currentMessage);
      }

    } catch (err) {
      console.error('Error processing message:', err);
      await handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle action mode execution
   */
  const handleActionMode = async (actionIntent: ActionIntent, originalMessage: string) => {
    try {
      console.log('⚡ Entering action mode:', actionIntent.type);
      setCurrentMode('action');
      setIsActionMode(true);

      if (!actionExecutor) {
        throw new Error('Action executor not initialized');
      }

      // Build execution context
      const userId = getAuthenticatedUserId();
      const context: ExecutionContext = {
        userId,
        storeInfo: {
          domain: shopifyConfig?.domain || 'unknown',
          name: 'Your Store'
        },
        userPermissions: ['products.read', 'products.write', 'inventory.write'] // In production, get from session
      };

      // Initiate action execution
      const execution = await actionExecutor.initiateAction(actionIntent, context);

      // Add action preview message
      const previewMessage: EnhancedChatMessage = {
        role: 'assistant',
        content: formatActionPreview(execution),
        timestamp: new Date(),
        messageType: execution.status === 'awaiting_confirmation' ? 'confirmation_request' : 'action_preview',
        actionExecution: execution
      };

      setMessages(prev => [...prev, previewMessage]);

      // Handle confirmation requirement
      if (execution.status === 'awaiting_confirmation') {
        setPendingExecution(execution);
      } else if (execution.status === 'completed') {
        // Action completed immediately
        const resultMessage: EnhancedChatMessage = {
          role: 'assistant',
          content: formatActionResult(execution),
          timestamp: new Date(),
          messageType: 'action_result',
          actionExecution: execution
        };

        setMessages(prev => [...prev, resultMessage]);
      }

    } catch (error: any) {
      console.error('Action mode error:', error);

      const errorMessage: EnhancedChatMessage = {
        role: 'assistant',
        content: `❌ **Failed to execute action**: ${error.message}\n\nI'll help you the usual way. Please ask about your products or store.`,
        timestamp: new Date(),
        messageType: 'conversation'
      };

      setMessages(prev => [...prev, errorMessage]);

      // Fallback to conversation mode
      setCurrentMode('conversation');
      setIsActionMode(false);
    }
  };

  /**
   * Handle conversation mode (original functionality)
   */
  const handleConversationMode = async (message: string) => {
    try {
      console.log('💬 Using conversation mode');
      setCurrentMode('conversation');
      setIsActionMode(false);

      // Use existing session initialization with proper authentication
      const userId = getAuthenticatedUserId();

      const client = new VerboseSensayAPI({
        HEADERS: {
          'X-ORGANIZATION-SECRET': localApiKey,
          'X-USER-ID': userId
        }
      });

      const replica = await initializeSession(client);

      // Add assistant placeholder message
      const assistantMessage: EnhancedChatMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        messageType: 'conversation'
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Use standard chat completions
      const response = await client.chatCompletions.postV1ReplicasChatCompletions(
        replica,
        API_VERSION,
        {
          content: message,
          source: 'web',
          skip_chat_history: false
        }
      );

      // Update the placeholder message
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          ...newMessages[newMessages.length - 1],
          content: response.content
        };
        return newMessages;
      });

    } catch (error: any) {
      throw error; // Will be handled by parent catch block
    }
  };

  /**
   * Handle action confirmation
   */
  const handleActionConfirmation = async (confirmed: boolean) => {
    if (!pendingExecution || !actionExecutor) return;

    try {
      setIsLoading(true);

      const execution = await actionExecutor.confirmAction(pendingExecution.id, confirmed);

      let resultMessage: EnhancedChatMessage;

      if (confirmed && execution.status === 'completed') {
        resultMessage = {
          role: 'assistant',
          content: formatActionResult(execution),
          timestamp: new Date(),
          messageType: 'action_result',
          actionExecution: execution
        };
      } else {
        resultMessage = {
          role: 'assistant',
          content: confirmed ?
            '⏳ **Executing action...** Please wait a moment.' :
            '❌ **Action cancelled.** Thank you for being careful!',
          timestamp: new Date(),
          messageType: 'conversation'
        };
      }

      setMessages(prev => [...prev, resultMessage]);
      setPendingExecution(null);
      setIsActionMode(false);
      setCurrentMode('conversation');

    } catch (error: any) {
      console.error('Confirmation error:', error);
      await handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Build analysis context for Sensay
   */
  const buildAnalysisContext = async (): Promise<AnalysisContext> => {
    // In production, this would fetch recent products, user history, etc.
    return {
      storeInfo: {
        name: 'Your Store',
        currency: 'IDR',
        domain: shopifyConfig?.domain || 'unknown'
      }
    };
  };

  /**
   * Format action preview message
   */
  const formatActionPreview = (execution: ActionExecution): string => {
    const { intent, preview, status, requiresConfirmation } = execution;

    let message = `🎯 **Action Detected**: ${IntentDetectionService.describeIntent(intent)}\n\n`;

    if (preview) {
      message += `📊 **Preview**:\n`;
      message += `- Products affected: ${preview.affectedProducts || 0}\n`;

      if (preview.data && Array.isArray(preview.data)) {
        message += `- Example products: ${preview.data.slice(0, 3).map(p => p.title).join(', ')}\n`;
      }

      message += `\n${preview.message}\n\n`;
    }

    if (requiresConfirmation) {
      message += `⚠️ **Confirmation Required** - This action requires your approval before execution.\n\n`;
      message += `Are you sure you want to continue?`;
    } else {
      message += `✅ Safe action, executing automatically.`;
    }

    return message;
  }

  /**
   * Format action result message
   */
  const formatActionResult = (execution: ActionExecution): string => {
    const { result } = execution;

    if (!result) {
      return '⏳ Action still processing...';
    }

    if (result.success) {
      let message = `✅ **Success!** ${result.message}\n\n`;

      if (result.affectedProducts) {
        message += `📈 **Summary**: ${result.affectedProducts} products successfully updated\n\n`;
      }

      if (result.changes && result.changes.length > 0) {
        message += `📝 **Changes**:\n`;
        result.changes.forEach(change => {
          message += `- ${change.field}: ${change.oldValue} → ${change.newValue}\n`;
        });
        message += '\n';
      }

      message += `Is there anything else I can help you with?`;

      return message;
    } else {
      return `❌ **Failed**: ${result.message}\n\n${result.error ? `Details: ${result.error}` : 'Please try again or contact support.'}`;
    }
  }

  /**
   * Handle errors with appropriate user messaging
   */
  const handleError = async (err: any) => {
    let errorMessage = 'Terjadi kesalahan. Silakan coba lagi.';

    if (err instanceof Error) {
      errorMessage = err.message;

      if (errorMessage.includes('API key')) {
        errorMessage = 'API key tidak valid. Periksa konfigurasi Anda.';
      } else if (errorMessage.includes('Unauthorized')) {
        errorMessage = 'Tidak memiliki akses. Periksa API key dan permissions.';
      }
    }

    const errorChatMessage: EnhancedChatMessage = {
      role: 'assistant',
      content: `❌ ${errorMessage}`,
      timestamp: new Date(),
      messageType: 'conversation'
    };

    setMessages(prev => [...prev, errorChatMessage]);
    setError(errorMessage);
  };

  /**
   * Initialize session with smart fallback to connection persistence
   */
  const initializeSession = async (client: VerboseSensayAPI): Promise<string> => {
    // First, try user session (preferred)
    const userSession = UserSessionManager.getUserSession();
    if (userSession && userSession.replicaUuid) {
      console.log('🟢 Using replica from user session:', userSession.replicaUuid);
      setReplicaUuid(userSession.replicaUuid);
      return userSession.replicaUuid;
    }

    // Second, try from current state
    if (replicaUuid) {
      console.log('🟡 Using replica from state:', replicaUuid);
      return replicaUuid;
    }

    // CRITICAL FIX: Fallback to connection persistence with proper user ID verification
    console.log('🔄 No replica in session, checking connection persistence...');
    const connectionState = ShopifyConnectionPersistence.getConnection();

    console.log('📋 Connection state details:', {
      hasConnection: !!connectionState,
      isConnected: connectionState?.isConnected,
      hasReplicaUuid: !!connectionState?.replicaUuid,
      hasUserId: !!connectionState?.userId,
      domain: connectionState?.domain,
      replicaUuid: connectionState?.replicaUuid,
      userId: connectionState?.userId,
      productCount: connectionState?.productCount,
      knowledgeBaseId: connectionState?.knowledgeBaseId
    });

    if (connectionState && connectionState.replicaUuid && connectionState.userId) {
      // CRITICAL: Verify the user ID matches our authentication system
      const expectedUserId = getAuthenticatedUserId();

      console.log('🔍 Verifying user ID match:', {
        expected: expectedUserId,
        found: connectionState.userId,
        domain: connectionState.domain
      });

      if (connectionState.userId === expectedUserId) {
        console.log('🟢 Found matching replica from connection persistence:', connectionState.replicaUuid);

        // Save to user session for future use
        UserSessionManager.saveUserSession({
          userId: connectionState.userId,
          replicaUuid: connectionState.replicaUuid,
          shopifyDomain: connectionState.domain,
          storeName: connectionState.shopName || connectionState.domain,
          createdAt: new Date().toISOString()
        });

        setReplicaUuid(connectionState.replicaUuid);
        return connectionState.replicaUuid;
      } else {
        console.warn('⚠️ Connection user ID mismatch - this may indicate a different user or outdated data');
      }
    }

    // Last resort: Try to find/create replica based on current shopify config
    if (shopifyConfig && localApiKey) {
      console.log('🔄 No stored replica found, attempting to find/create replica...');

      try {
        const userManager = new SensayUserManager(localApiKey);
        const userResult = await userManager.getOrCreateUserReplica(
          shopifyConfig.domain,
          shopifyConfig.accessToken,
          shopifyConfig.domain
        );

        if (userResult.success && userResult.replicaUuid && userResult.userId) {
          console.log('🟢 Found/created replica:', {
            userId: userResult.userId,
            replicaUuid: userResult.replicaUuid
          });

          // Save to user session for future use
          UserSessionManager.saveUserSession({
            userId: userResult.userId,
            replicaUuid: userResult.replicaUuid,
            shopifyDomain: shopifyConfig.domain,
            storeName: shopifyConfig.domain,
            createdAt: new Date().toISOString()
          });

          setReplicaUuid(userResult.replicaUuid);
          return userResult.replicaUuid;
        }
      } catch (error) {
        console.error('❌ Failed to find/create replica:', error);
      }
    }

    // Ultimate fallback: Error with guidance
    throw new Error('No AI replica found. Please go to the Stores page and connect your Shopify store to create an AI assistant.');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatMessage = (content: string) => {
    return content.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        <br />
      </span>
    ));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Enhanced Header with Mode Indicator */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${
            isActionMode
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}>
            {isActionMode ? <Zap className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
            {isActionMode ? 'Action Mode' : 'Conversation Mode'}
          </div>
        </div>

        <button
          onClick={() => setShowConfig(!showConfig)}
          className="text-xs underline text-gray-400 hover:text-gray-300 transition-colors flex items-center gap-1"
        >
          <Settings className="w-3 h-3" />
          {showConfig ? 'Hide Config' : 'Config'}
        </button>
      </div>

      {/* Config Panel */}
      {showConfig && (
        <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl mb-4">
          <div className="mb-4">
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300 mb-2">
              Sensay API Key
            </label>
            <input
              id="apiKey"
              type="password"
              value={localApiKey}
              onChange={handleApiKeyChange}
              className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
              placeholder="Your Sensay API Key"
            />
          </div>

          {/* Enhanced status indicators */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className={`px-2 py-1 rounded ${sensayAnalyzer ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
              AI Analyzer: {sensayAnalyzer ? 'Ready' : 'Not Ready'}
            </span>
            <span className={`px-2 py-1 rounded ${actionExecutor ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
              Action Executor: {actionExecutor ? 'Ready' : 'Not Ready'}
            </span>
            <span className={`px-2 py-1 rounded ${shopifyConfig ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              Shopify: {shopifyConfig ? 'Connected' : 'Not Connected'}
            </span>
          </div>

          <p className="text-xs text-gray-400 mt-3">
            🤖 **Enhanced Mode**: Mendukung conversation Q&A + action execution<br/>
            🛡️ **Safety**: Semua aksi memiliki preview + confirmation untuk keamanan
          </p>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto mb-6 p-6 bg-slate-800/30 border border-slate-700/50 rounded-2xl backdrop-blur">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-white font-medium mb-2">Enhanced AI Assistant Ready</h3>
            <p className="text-gray-400 text-sm mb-4">
              I can help with conversations and execute actions for your store
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <p>💬 Ask about products: &quot;What&apos;s the iPhone stock?&quot;</p>
              <p>⚡ Execute actions: &quot;Update product ABC price to $500&quot;</p>
              <p>🔍 Search products: &quot;Find products with tag sale&quot;</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div key={index}>
                {/* Regular message display */}
                <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                      : message.messageType === 'action_preview' || message.messageType === 'action_result'
                      ? 'bg-gradient-to-r from-orange-600/20 to-red-600/20 border border-orange-500/30 text-gray-200'
                      : message.messageType === 'confirmation_request'
                      ? 'bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 text-gray-200'
                      : 'bg-slate-700/50 border border-slate-600 text-gray-200'
                  }`}>
                    <div className="text-xs opacity-70 mb-2 flex items-center gap-1">
                      {message.role === 'user' ? (
                        'You'
                      ) : (
                        <>
                          {message.messageType === 'action_preview' && <Zap className="w-3 h-3" />}
                          {message.messageType === 'action_result' && <CheckCircle className="w-3 h-3" />}
                          {message.messageType === 'confirmation_request' && <AlertTriangle className="w-3 h-3" />}
                          AI Assistant
                          {message.messageType !== 'conversation' && (
                            <span className="text-orange-400">• Action Mode</span>
                          )}
                        </>
                      )}
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {formatMessage(message.content)}
                    </div>
                  </div>
                </div>

                {/* Confirmation buttons for pending actions */}
                {message.messageType === 'confirmation_request' && pendingExecution && (
                  <div className="flex justify-start mt-3">
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleActionConfirmation(true)}
                        disabled={isLoading}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Yes, Execute
                      </button>
                      <button
                        onClick={() => handleActionConfirmation(false)}
                        disabled={isLoading}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Enhanced Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 backdrop-blur">
            <div className="flex">
              <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0" />
              <div className="ml-3 flex-1">
                <h3 className="text-md font-medium text-red-300">Error</h3>
                <div className="mt-2 text-sm text-red-200">{error}</div>
              </div>
            </div>
          </div>
        )}

        <div className="relative">
          <textarea
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isActionMode
              ? "Confirm the action above, or ask something else..."
              : "Ask about products, or give commands like 'update product XYZ price'..."
            }
            className={`w-full p-4 pr-24 border rounded-2xl focus:outline-none focus:ring-2 min-h-[120px] text-white placeholder-gray-400 resize-none transition-colors ${
              isActionMode
                ? 'bg-orange-700/20 border-orange-600 focus:ring-orange-500 focus:border-orange-500'
                : 'bg-slate-700/50 border-slate-600 focus:ring-blue-500 focus:border-blue-500'
            }`}
            disabled={isLoading}
          />
          <button
            type="submit"
            className={`absolute right-3 bottom-3 px-6 py-3 rounded-xl transition-all duration-200 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
              isActionMode
                ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
            }`}
            disabled={isLoading || !inputValue.trim()}
          >
            {isLoading ? (
              <>
                <Clock className="animate-spin w-4 h-4" />
                Processing...
              </>
            ) : (
              <>
                {isActionMode ? <Zap className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                Send
              </>
            )}
          </button>
        </div>
      </form>

      <p className="text-xs text-gray-400 mt-4 text-center">
        🤖 Enhanced with Action Mode • 🛡️ Safe Execution • Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
};

export default EnhancedChatInterface;