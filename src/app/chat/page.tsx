'use client';

import React, { useState, useEffect } from 'react';
import EnhancedChatInterface from '@/components/EnhancedChatInterface';
import { ReplicaList } from '@/components/replica-list';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Bot, Zap, ArrowRight, Users, Settings, AlertTriangle, Store } from 'lucide-react';
import { ReplicaInfo } from '@/lib/services/replica-service';
import { UserSessionManager } from '@/lib/user-session';
import { ShopifyConnectionPersistence } from '@/lib/shopify/connection-persistence';

export default function ChatPage() {
  const [showReplicaSelection, setShowReplicaSelection] = useState(false);
  const [selectedReplica, setSelectedReplica] = useState<ReplicaInfo | null>(null);
  const [shopifyConfig, setShopifyConfig] = useState<{domain: string; accessToken: string} | null>(null);
  const [isEnhancedMode, setIsEnhancedMode] = useState(false);
  const [connectionSummary, setConnectionSummary] = useState<any>(null);

  // Check for Shopify configuration on mount
  useEffect(() => {
    // First, try to get from our connection persistence system
    const connectionState = ShopifyConnectionPersistence.getConnection();
    const summary = ShopifyConnectionPersistence.getConnectionSummary();

    setConnectionSummary(summary);

    if (connectionState && connectionState.isConnected) {
      // We have a persisted Shopify connection - get access token from .env
      const accessToken = process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN;

      if (accessToken) {
        const config = {
          domain: connectionState.domain,
          accessToken
        };
        setShopifyConfig(config);
        setIsEnhancedMode(true);
        console.log('🛍️ Shopify configuration loaded from persistence:', {
          domain: connectionState.domain,
          productCount: connectionState.productCount,
          lastSync: connectionState.lastSync
        });

        // CRITICAL: Sync user session if missing but connection exists
        const userSession = UserSessionManager.getUserSession();
        if (!userSession && connectionState.replicaUuid && connectionState.userId) {
          UserSessionManager.saveUserSession({
            userId: connectionState.userId,
            replicaUuid: connectionState.replicaUuid,
            shopifyDomain: connectionState.domain,
            storeName: connectionState.shopName || connectionState.domain,
            createdAt: connectionState.connectionTimestamp || new Date().toISOString()
          });
          console.log('🔄 Synced user session from existing connection for chat access');
        }
      } else {
        console.warn('⚠️ Connection found but no access token in environment');
      }
    } else {
      // Fallback to environment variables only (legacy)
      const domain = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN;
      const accessToken = process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN;

      if (domain && accessToken) {
        const config = {
          domain,
          accessToken
        };
        setShopifyConfig(config);
        setIsEnhancedMode(true);
        console.log('🛍️ Shopify configuration loaded from environment (legacy mode)');
      } else {
        console.log('ℹ️ No Shopify configuration found, using conversation-only mode');
      }
    }
  }, []);

  const handleSelectReplica = (replica: ReplicaInfo) => {
    setSelectedReplica(replica);
    setShowReplicaSelection(false);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-32">
        {/* Page Header */}
        <div className="text-center space-y-8 mb-12">
          {/* Main Heading */}
          <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Chat with Your
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI Shopping Assistant
            </span>
          </h1>

          {/* Description */}
          <p className="mx-auto max-w-3xl text-lg leading-8 text-gray-300">
            Ask questions about products, get personalized recommendations, and manage your inventory.
            Your intelligent assistant is powered by Sensay AI with real-time knowledge.
          </p>

          {/* Enhanced Mode Indicator */}
          {isEnhancedMode && connectionSummary?.isConnected ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-full">
              <Zap className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-300 font-medium">Enhanced Mode Active</span>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Store className="w-3 h-3" />
                <span>{connectionSummary.domain} • {connectionSummary.productCount || 0} products</span>
              </div>
            </div>
          ) : isEnhancedMode ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-full">
              <Zap className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-300 font-medium">Enhanced Mode Active</span>
              <span className="text-xs text-gray-400">• Actions + Conversation</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-yellow-300 font-medium">Conversation Mode Only</span>
              <span className="text-xs text-gray-400">• Connect Shopify in stores page for actions</span>
            </div>
          )}

          {/* AI Model Badges */}
          <div className="flex items-center justify-center space-x-4 flex-wrap gap-2">
            <Badge className="bg-slate-800/50 border border-slate-700 text-gray-300 px-4 py-2">
              <Bot className="h-4 w-4 mr-2" />
              Claude-3.7-Sonnet
            </Badge>
            <Badge className="bg-slate-800/50 border border-slate-700 text-gray-300 px-4 py-2">
              <Zap className="h-4 w-4 mr-2" />
              GPT-4o
            </Badge>
            <Badge className="bg-slate-800/50 border border-slate-700 text-gray-300 px-4 py-2">
              <MessageSquare className="h-4 w-4 mr-2" />
              Gemini-2.5-Flash
            </Badge>
            <Button
              onClick={() => setShowReplicaSelection(!showReplicaSelection)}
              className="bg-slate-800/50 border border-slate-700 text-gray-300 hover:bg-slate-700 hover:text-white"
            >
              <Users className="h-4 w-4 mr-2" />
              {selectedReplica ? selectedReplica.name : 'Select AI Replica'}
            </Button>
          </div>
        </div>

        {/* Replica Selection */}
        {showReplicaSelection && (
          <div className="mb-12">
            <ReplicaList
              apiKey={process.env.NEXT_PUBLIC_SENSAY_API_KEY_SECRET!}
              onSelectReplica={handleSelectReplica}
              showSelection={true}
            />
          </div>
        )}

        {/* Current Replica Info */}
        {selectedReplica && !showReplicaSelection && (
          <div className="mb-8">
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur border border-blue-500/30 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{selectedReplica.name}</h3>
                    <p className="text-gray-400 text-sm">{selectedReplica.shortDescription}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplicaSelection(true)}
                  className="text-gray-400 hover:text-white"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Interface */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 rounded-3xl p-8">
          <div className="h-[70vh]">
            <EnhancedChatInterface
              apiKey={process.env.NEXT_PUBLIC_SENSAY_API_KEY_SECRET}
              shopifyConfig={shopifyConfig || undefined}
            />
          </div>
        </div>

        {/* Quick Examples */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-500/10 backdrop-blur border border-blue-500/20 rounded-2xl p-6">
              <MessageSquare className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">Product Questions</h3>
              <p className="text-gray-400 text-sm">
                &quot;What&apos;s the current iPhone stock?&quot;
              </p>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-purple-500/10 backdrop-blur border border-purple-500/20 rounded-2xl p-6">
              <Bot className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">
                {isEnhancedMode ? 'AI Actions' : 'Recommendations'}
              </h3>
              <p className="text-gray-400 text-sm">
                {isEnhancedMode
                  ? '&quot;Update iPhone price to $1,500&quot;'
                  : '&quot;What are your best-selling items?&quot;'
                }
              </p>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-green-500/10 backdrop-blur border border-green-500/20 rounded-2xl p-6">
              <Zap className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">
                {isEnhancedMode ? 'Stock Management' : 'Inventory Help'}
              </h3>
              <p className="text-gray-400 text-sm">
                {isEnhancedMode
                  ? '&quot;Update Samsung Galaxy stock to 100&quot;'
                  : '&quot;Show me products with low inventory&quot;'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Action Mode Instructions */}
        {isEnhancedMode && (
          <div className="mt-12 bg-gradient-to-r from-green-500/5 to-blue-500/5 border border-green-500/20 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-400" />
              Enhanced Action Mode - Command Examples:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p className="text-green-300 font-medium">💰 Price Updates:</p>
                <p className="text-gray-400">&quot;Update iPhone 14 price to $1,500&quot;</p>
                <p className="text-gray-400">&quot;Increase all Apple products by 10%&quot;</p>
              </div>
              <div className="space-y-2">
                <p className="text-blue-300 font-medium">📦 Stock Management:</p>
                <p className="text-gray-400">&quot;Update Samsung Galaxy stock to 50&quot;</p>
                <p className="text-gray-400">&quot;Update inventory for product ABC-123&quot;</p>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              ⚠️ All actions will show preview and request confirmation for security
            </div>
          </div>
        )}
      </div>
    </div>
  );
}