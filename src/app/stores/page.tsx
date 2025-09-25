'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Store, Zap, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { ShopifyConnectionForm } from '@/components/shopify/connection-form';
import { ShopifyConnectionStatus } from '@/lib/shopify/types';

export default function StoresPage() {
  const [connectionStatus, setConnectionStatus] = useState<ShopifyConnectionStatus | null>(null);
  const [showConnectionForm, setShowConnectionForm] = useState(true);

  const handleConnectionSuccess = (status: ShopifyConnectionStatus) => {
    setConnectionStatus(status);
    setShowConnectionForm(false);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-32">
        {/* Page Header */}
        <div className="text-center space-y-8 mb-16">
          {/* Badge */}
          <div className="inline-flex items-center rounded-full px-4 py-2 bg-blue-500/10 backdrop-blur border border-blue-500/20">
            <Badge variant="secondary" className="bg-transparent border-0 text-blue-300 px-0">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              Store Integration
            </Badge>
            <span className="ml-2 text-sm text-gray-300">
              Real-time Shopify Synchronization
            </span>
            <ArrowRight className="ml-2 h-4 w-4 text-gray-400" />
          </div>

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
              {connectionStatus?.connected ? '1' : '0'}
            </div>
            <p className="text-sm text-gray-400">
              {connectionStatus?.connected ? 'Store active' : 'No stores yet'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-300">Products Synced</h3>
              <Zap className="h-5 w-5 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">0</div>
            <p className="text-sm text-gray-400">Ready for sync</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-300">Last Sync</h3>
              {connectionStatus?.connected ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-500" />
              )}
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {connectionStatus?.connected ? 'Now' : 'Never'}
            </div>
            <p className="text-sm text-gray-400">
              {connectionStatus?.connected ? 'Sync successful' : 'Connect first'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-300">AI Knowledge</h3>
              <Badge className="bg-green-500/20 border-green-500/30 text-green-400 text-xs">
                Ready
              </Badge>
            </div>
            <div className="text-3xl font-bold text-white mb-2">100%</div>
            <p className="text-sm text-gray-400">Sensay AI active</p>
          </div>
        </div>

        {/* Connection Form or Connected Store Info */}
        {showConnectionForm ? (
          <div className="flex justify-center mb-16">
            <div className="w-full max-w-2xl">
              <ShopifyConnectionForm onConnectionSuccess={handleConnectionSuccess} />
            </div>
          </div>
        ) : (
          connectionStatus && (
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur border border-green-500/30 rounded-3xl p-12 text-center mb-16">
              <div className="flex items-center justify-center w-20 h-20 mx-auto bg-green-500/20 rounded-full mb-6">
                <CheckCircle className="h-10 w-10 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Store Connected Successfully!
              </h3>
              <p className="text-gray-300 text-lg max-w-md mx-auto mb-6">
                {connectionStatus.domain && `Connected to ${connectionStatus.domain}`}
              </p>
              <p className="text-gray-400">
                Your products are now available to your AI agent. Start chatting to test the integration!
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
              Your product data is intelligently processed and added to your AI agent's knowledge base.
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur border border-slate-700 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-white mb-4">Analytics</h3>
            <p className="text-gray-400 leading-relaxed">
              Monitor sync status, track API usage, and optimize your store's AI performance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}