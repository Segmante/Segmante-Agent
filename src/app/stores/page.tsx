'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Store, Zap, AlertCircle, CheckCircle } from 'lucide-react';
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
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Store className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Store Management</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Connect and manage your Shopify stores. Sync product data, monitor inventory, and optimize your AI agent's knowledge base.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Stores</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectionStatus?.connected ? '1' : '0'}</div>
            <p className="text-xs text-muted-foreground">
              {connectionStatus?.connected ? 'Store connected' : 'No stores connected yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products Synced</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Ready for sync</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
            {connectionStatus?.connected ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {connectionStatus?.connected ? 'Just now' : 'Never'}
            </div>
            <p className="text-xs text-muted-foreground">
              {connectionStatus?.connected ? 'Products synced successfully' : 'Connect a store first'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Knowledge</CardTitle>
            <Badge variant="secondary" className="text-xs">Ready</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <p className="text-xs text-muted-foreground">Sensay API active</p>
          </CardContent>
        </Card>
      </div>

      {/* Connection Form or Connected Store Info */}
      {showConnectionForm ? (
        <div className="flex justify-center">
          <ShopifyConnectionForm onConnectionSuccess={handleConnectionSuccess} />
        </div>
      ) : (
        connectionStatus && (
          <Card className="border-green-200 bg-green-50 dark:bg-green-950">
            <CardHeader className="text-center pb-6">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 dark:bg-green-900 rounded-full mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl text-green-800 dark:text-green-100">
                Store Connected Successfully!
              </CardTitle>
              <CardDescription className="max-w-md mx-auto text-green-700 dark:text-green-200">
                {connectionStatus.domain && `Connected to ${connectionStatus.domain}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-green-700 dark:text-green-200">
                Your products are now available to your AI agent. Start chatting to test the integration!
              </p>
            </CardContent>
          </Card>
        )
      )}

      {/* Feature Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">🔄 Auto Sync</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Automatically sync product data, inventory levels, and pricing updates in real-time.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">🧠 AI Training</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Your product data is intelligently processed and added to your AI agent's knowledge base.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">📊 Analytics</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Monitor sync status, track API usage, and optimize your store's AI performance.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}