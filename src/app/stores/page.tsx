'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Store, Zap, AlertCircle, CheckCircle, ArrowRight, Database, Bot, RefreshCw } from 'lucide-react';
import SmartConnectionForm from '@/components/shopify/smart-connection-form';
import SyncSuccessCelebration from '@/components/shopify/sync-success-celebration';
import { KnowledgeBaseList } from '@/components/knowledge-base-list';
import { ReplicaList } from '@/components/replica-list';
import { ShopifyConnectionStatus } from '@/lib/shopify/types';
import { ShopifyConnectionPersistence } from '@/lib/shopify/connection-persistence';

export default function StoresPage() {
  const [connectionStatus, setConnectionStatus] = useState<ShopifyConnectionStatus | null>(null);
  const [showConnectionForm, setShowConnectionForm] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [syncResults, setSyncResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'connection' | 'replicas' | 'knowledge'>('connection');
  const [connectionSummary, setConnectionSummary] = useState<any>(null);

  // Load connection state on mount
  useEffect(() => {
    const summary = ShopifyConnectionPersistence.getConnectionSummary();
    console.log(`📊 Stores Page: Loaded connection summary:`, summary);
    setConnectionSummary(summary);

    if (summary.isConnected) {
      setConnectionStatus({
        connected: true,
        domain: summary.domain!,
        shopName: summary.domain!,
        lastSync: summary.lastSync!
      });

      // Only show form if user wants to make changes
      setShowConnectionForm(false);
    }
  }, []);

  const handleConnectionSuccess = (status: ShopifyConnectionStatus & {
    productCount?: number;
    knowledgeBaseId?: number;
    replicaUuid?: string;
    userId?: string;
    wasSkipped?: boolean;
  }) => {
    setConnectionStatus(status);
    setSyncResults(status);
    setShowConnectionForm(false);

    // Update connection summary with debug logging
    const summary = ShopifyConnectionPersistence.getConnectionSummary();
    console.log(`🔄 Stores Page: Updated connection summary after success:`, summary);
    setConnectionSummary(summary);

    // Show celebration if products were synced (not just verified)
    if (!status.wasSkipped && status.productCount && status.productCount > 0) {
      setShowCelebration(true);
    }
  };

  const handleShowConnectionForm = () => {
    setShowConnectionForm(true);
    setShowCelebration(false);
  };

  const handleDisconnect = () => {
    ShopifyConnectionPersistence.clearConnection();
    setConnectionStatus(null);
    setConnectionSummary(null);
    setShowConnectionForm(true);
    setShowCelebration(false);
  };

  const handleGetStarted = () => {
    // Navigate to chat page or close celebration
    setShowCelebration(false);
    // Could add navigation here: router.push('/chat');
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-32">
        {/* Page Header */}
        <div className="text-center space-y-8 mb-16">
          {/* Main Heading */}
          <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Connect Your
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Shopify Store
            </span>
          </h1>

          {/* Description */}
          <p className="mx-auto max-w-3xl text-lg leading-8 text-gray-300">
            Seamlessly integrate your Shopify store with AI-powered product management.
            Sync inventory, automate customer service, and boost sales with intelligent recommendations.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-300">Connected Stores</h3>
              <Store className="h-5 w-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {connectionSummary?.isConnected ? '1' : '0'}
            </div>
            <p className="text-sm text-gray-400">
              {connectionSummary?.isConnected ? connectionSummary.domain : 'No stores connected'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-300">Products Synced</h3>
              <Zap className="h-5 w-5 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {connectionSummary?.productCount || 0}
            </div>
            <p className="text-sm text-gray-400">
              {connectionSummary?.productCount ? 'Products in AI knowledge' : 'Ready for sync'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-300">Last Sync</h3>
              {connectionSummary?.isConnected ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-500" />
              )}
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {connectionSummary?.lastSync
                ? new Date(connectionSummary.lastSync).toLocaleDateString()
                : 'Never'
              }
            </div>
            <p className="text-sm text-gray-400">
              {connectionSummary?.canSkipSync
                ? '✅ Data is current'
                : connectionSummary?.isConnected
                  ? '⚠️ Consider updating'
                  : 'Connect first'
              }
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-300">AI Knowledge</h3>
              <Badge className={`text-xs ${
                connectionSummary?.productCount
                  ? 'bg-green-500/20 border-green-500/30 text-green-400'
                  : 'bg-gray-500/20 border-gray-500/30 text-gray-400'
              }`}>
                {connectionSummary?.productCount ? 'Ready' : 'Waiting'}
              </Badge>
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {connectionSummary?.productCount ? '100%' : '0%'}
            </div>
            <p className="text-sm text-gray-400">
              {connectionSummary?.productCount ? 'AI assistant active' : 'Sync products first'}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-center space-x-4 mb-16">
          <Button
            onClick={() => setActiveTab('connection')}
            variant={activeTab === 'connection' ? 'default' : 'outline'}
            className={`${
              activeTab === 'connection'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'border-slate-600 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Store className="h-4 w-4 mr-2" />
            Store Connection
          </Button>
          <Button
            onClick={() => setActiveTab('replicas')}
            variant={activeTab === 'replicas' ? 'default' : 'outline'}
            className={`${
              activeTab === 'replicas'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'border-slate-600 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Bot className="h-4 w-4 mr-2" />
            AI Replicas
          </Button>
          <Button
            onClick={() => setActiveTab('knowledge')}
            variant={activeTab === 'knowledge' ? 'default' : 'outline'}
            className={`${
              activeTab === 'knowledge'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'border-slate-600 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Database className="h-4 w-4 mr-2" />
            Knowledge Bases
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === 'connection' && (
          <>
            {/* Connection Form or Connected Store Info */}
            {showConnectionForm ? (
              <div className="flex justify-center mb-16">
                <div className="w-full max-w-4xl">
                  <SmartConnectionForm onConnectionSuccess={handleConnectionSuccess} />
                </div>
              </div>
            ) : showCelebration && syncResults ? (
              <div className="flex justify-center mb-16">
                <div className="w-full max-w-4xl">
                  <SyncSuccessCelebration
                    productCount={syncResults.productCount || 0}
                    storeName={syncResults.shopName || syncResults.domain || 'Your Store'}
                    knowledgeBaseId={syncResults.knowledgeBaseId}
                    onGetStarted={handleGetStarted}
                  />
                </div>
              </div>
            ) : (
              connectionSummary?.isConnected && (
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur border border-green-500/30 rounded-3xl p-12 text-center mb-16">
                  <div className="flex items-center justify-center w-20 h-20 mx-auto bg-green-500/20 rounded-full mb-6">
                    <CheckCircle className="h-10 w-10 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Store Connected & Ready!
                  </h3>
                  <p className="text-gray-300 text-lg max-w-md mx-auto mb-6">
                    Connected to {connectionSummary.domain} • {connectionSummary.productCount || 0} products in AI knowledge
                  </p>

                  <div className="flex items-center justify-center space-x-4 mb-6">
                    <Badge variant="outline" className="border-green-500/30 text-green-300">
                      <Bot className="w-3 h-3 mr-1" />
                      AI Ready
                    </Badge>
                    {connectionSummary.canSkipSync && (
                      <Badge variant="outline" className="border-blue-500/30 text-blue-300">
                        <Database className="w-3 h-3 mr-1" />
                        Data Current
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-center space-x-4">
                    <Button
                      onClick={handleShowConnectionForm}
                      variant="outline"
                      className="border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Update Connection
                    </Button>
                    <Button
                      onClick={handleDisconnect}
                      variant="outline"
                      className="border-red-600 text-red-300 hover:bg-red-700 hover:text-white"
                    >
                      Disconnect Store
                    </Button>
                  </div>

                  <p className="text-gray-400 text-sm mt-6">
                    Your AI assistant is ready to help customers!
                    {connectionSummary.canSkipSync
                      ? ' No sync needed - data is current.'
                      : ' Consider refreshing data if products changed recently.'
                    }
                  </p>
                </div>
              )
            )}

            {/* Feature Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur border border-slate-700 rounded-2xl p-8 text-center">
                <div className="text-4xl mb-4">🔄</div>
                <h3 className="text-xl font-semibold text-white mb-4">Auto Sync</h3>
                <p className="text-gray-400 leading-relaxed">
                  Automatically sync product data, inventory levels, and pricing updates in real-time.
                </p>
              </div>

              <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur border border-slate-700 rounded-2xl p-8 text-center">
                <div className="text-4xl mb-4">🧠</div>
                <h3 className="text-xl font-semibold text-white mb-4">AI Training</h3>
                <p className="text-gray-400 leading-relaxed">
                  Your product data is intelligently processed and added to your AI agent&apos;s knowledge base.
                </p>
              </div>

              <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur border border-slate-700 rounded-2xl p-8 text-center">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-white mb-4">Analytics</h3>
                <p className="text-gray-400 leading-relaxed">
                  Monitor sync status, track API usage, and optimize your store&apos;s AI performance.
                </p>
              </div>
            </div>
          </>
        )}

        {/* Replicas Tab */}
        {activeTab === 'replicas' && (
          <div>
            <ReplicaList
              apiKey={process.env.NEXT_PUBLIC_SENSAY_API_KEY_SECRET!}
              showSelection={false}
            />
          </div>
        )}

        {/* Knowledge Bases Tab */}
        {activeTab === 'knowledge' && (
          <div>
            <KnowledgeBaseList
              apiKey={process.env.NEXT_PUBLIC_SENSAY_API_KEY_SECRET!}
              showActions={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}