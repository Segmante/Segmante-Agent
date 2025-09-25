'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Store, CheckCircle, XCircle, AlertCircle, Zap, Clock, TrendingUp,
  RefreshCw, Database, Bot, ArrowRight
} from 'lucide-react';
import { ShopifyConnectionStatus } from '@/lib/shopify/types';
import { ShopifyConnectionPersistence } from '@/lib/shopify/connection-persistence';
import { UserSessionManager } from '@/lib/user-session';

interface SmartConnectionFormProps {
  onConnectionSuccess?: (status: ShopifyConnectionStatus & {
    productCount?: number;
    knowledgeBaseId?: number;
    replicaUuid?: string;
    userId?: string;
    wasSkipped?: boolean;
  }) => void;
}

const formSchema = z.object({
  domain: z.string().min(1, 'Store domain is required'),
  accessToken: z.string().min(1, 'Access token is required')
});

type FormData = z.infer<typeof formSchema>;

interface ConnectionOption {
  id: 'verify' | 'sync' | 'force-sync';
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  recommended?: boolean;
}

const SmartConnectionForm: React.FC<SmartConnectionFormProps> = ({ onConnectionSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [connectionMode, setConnectionMode] = useState<'verify' | 'sync' | 'force-sync'>('verify');
  const [existingConnection, setExistingConnection] = useState<any>(null);
  const [progress, setProgress] = useState<{ message: string; percentage: number } | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema)
  });

  useEffect(() => {
    // Check for existing connection on component mount
    const existing = ShopifyConnectionPersistence.getConnection();
    if (existing) {
      setExistingConnection(existing);
      setValue('domain', existing.domain);

      // Auto-set mode based on existing connection state
      const options = ShopifyConnectionPersistence.getStorageOptions(existing);
      if (options.skipSync) {
        setConnectionMode('verify');
      }
    }
  }, [setValue]);

  const getConnectionOptions = (): ConnectionOption[] => {
    const baseOptions: ConnectionOption[] = [
      {
        id: 'verify',
        title: 'Quick Connect',
        description: 'Verify connection and use existing AI knowledge',
        icon: CheckCircle,
        recommended: true
      }
    ];

    if (existingConnection) {
      baseOptions.push(
        {
          id: 'sync',
          title: 'Smart Sync',
          description: 'Update with new products since last sync',
          icon: RefreshCw
        },
        {
          id: 'force-sync',
          title: 'Full Re-sync',
          description: 'Complete product data refresh (slower)',
          icon: Database
        }
      );
    } else {
      baseOptions.push(
        {
          id: 'sync',
          title: 'Connect & Sync',
          description: 'Full setup with AI knowledge base creation',
          icon: Bot,
          recommended: true
        }
      );
    }

    return baseOptions;
  };

  const onSubmit = async (data: FormData) => {
    setIsProcessing(true);
    setProgress({ message: 'Starting connection...', percentage: 0 });

    try {
      const formattedDomain = data.domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

      // Step 1: Always verify connection first
      setProgress({ message: 'Verifying Shopify connection...', percentage: 20 });

      const verifyResponse = await fetch('/api/shopify/verify-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: formattedDomain,
          accessToken: data.accessToken
        })
      });

      if (!verifyResponse.ok) {
        throw new Error('Failed to verify Shopify connection');
      }

      const verificationResult = await verifyResponse.json();
      if (!verificationResult.connected) {
        throw new Error(verificationResult.error || 'Connection verification failed');
      }

      // Update verification timestamp
      ShopifyConnectionPersistence.updateLastVerified(formattedDomain);

      // Step 2: Handle based on selected mode
      if (connectionMode === 'verify') {
        // Just verify and use existing knowledge base
        setProgress({ message: 'Connection verified successfully!', percentage: 100 });

        const connectionState = {
          connected: true,
          isConnected: true,
          domain: formattedDomain,
          shopName: verificationResult.shopName,
          lastSync: existingConnection?.lastSync || new Date().toISOString(),
          productCount: existingConnection?.productCount || 0,
          knowledgeBaseId: existingConnection?.knowledgeBaseId,
          replicaUuid: existingConnection?.replicaUuid,
          userId: existingConnection?.userId,
          wasSkipped: true
        };

        // Save updated connection state
        ShopifyConnectionPersistence.saveConnection(connectionState);

        setTimeout(() => {
          onConnectionSuccess?.(connectionState);
          setIsProcessing(false);
        }, 1000);

      } else {
        // Perform sync (either smart sync or force sync)
        setProgress({ message: 'Starting product synchronization...', percentage: 40 });

        const syncEndpoint = connectionMode === 'force-sync'
          ? '/api/shopify/sync-products-realtime'
          : '/api/shopify/sync-products-realtime';

        const response = await fetch(syncEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: formattedDomain,
            accessToken: data.accessToken,
            forceSync: connectionMode === 'force-sync',
            existingKnowledgeBaseId: existingConnection?.knowledgeBaseId,
            existingReplicaUuid: existingConnection?.replicaUuid
          })
        });

        if (!response.ok) {
          throw new Error('Failed to start sync process');
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        if (!reader) throw new Error('Stream not available');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const progressData = JSON.parse(line.slice(6));
                setProgress({
                  message: progressData.message,
                  percentage: progressData.progress
                });

                if (progressData.type === 'success') {
                  const connectionState = {
                    connected: true,
                    isConnected: true,
                    domain: formattedDomain,
                    shopName: verificationResult.shopName,
                    lastSync: new Date().toISOString(),
                    productCount: progressData.productCount,
                    knowledgeBaseId: progressData.knowledgeBaseId,
                    replicaUuid: progressData.replicaUuid,
                    userId: progressData.userId
                  };

                  ShopifyConnectionPersistence.saveConnection(connectionState);

                  // CRITICAL: Save user session so chat interface can access replica
                  if (progressData.replicaUuid && progressData.userId) {
                    UserSessionManager.saveUserSession({
                      userId: progressData.userId,
                      replicaUuid: progressData.replicaUuid,
                      shopifyDomain: formattedDomain,
                      storeName: verificationResult.shopName,
                      createdAt: new Date().toISOString()
                    });
                    console.log('💾 User session saved for chat interface access');
                  }

                  setTimeout(() => {
                    onConnectionSuccess?.(connectionState);
                    setIsProcessing(false);
                  }, 2000);
                  return;
                }

                if (progressData.type === 'error') {
                  throw new Error(progressData.message);
                }
              } catch (error) {
                console.error('Error parsing progress data:', error);
              }
            }
          }
        }
      }

    } catch (error: any) {
      console.error('Connection error:', error);
      setProgress({ message: error.message || 'Connection failed', percentage: 0 });
      setTimeout(() => setIsProcessing(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Existing Connection Status */}
      {existingConnection && (
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <h3 className="text-green-300 font-medium">Connection Found</h3>
                <p className="text-sm text-gray-400">
                  {existingConnection.domain} • {existingConnection.productCount} products •
                  Last sync: {new Date(existingConnection.lastSync).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="border-green-500/30 text-green-300">
                <Bot className="w-3 h-3 mr-1" />
                AI Ready
              </Badge>
              {existingConnection.knowledgeBaseId && (
                <Badge variant="outline" className="border-blue-500/30 text-blue-300">
                  <Database className="w-3 h-3 mr-1" />
                  KB #{existingConnection.knowledgeBaseId}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection Mode Selection */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Connection Options</CardTitle>
          <CardDescription>
            Choose how to connect your Shopify store
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {getConnectionOptions().map((option) => {
              const Icon = option.icon;
              return (
                <div
                  key={option.id}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    connectionMode === option.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                  onClick={() => setConnectionMode(option.id)}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-5 h-5 ${
                      connectionMode === option.id ? 'text-blue-400' : 'text-gray-400'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className={`font-medium ${
                          connectionMode === option.id ? 'text-white' : 'text-gray-300'
                        }`}>
                          {option.title}
                        </h4>
                        {option.recommended && (
                          <Badge variant="secondary" className="text-xs">Recommended</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{option.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Connection Form */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Shopify Store Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain" className="text-white">Store Domain</Label>
              <Input
                {...register('domain')}
                id="domain"
                placeholder="your-store.myshopify.com"
                disabled={isProcessing}
                className="bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-blue-500"
              />
              {errors.domain && (
                <p className="text-red-400 text-sm">{errors.domain.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessToken" className="text-white">Admin API Access Token</Label>
              <Input
                {...register('accessToken')}
                id="accessToken"
                type="password"
                placeholder="shpat_..."
                disabled={isProcessing}
                className="bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-blue-500"
              />
              {errors.accessToken && (
                <p className="text-red-400 text-sm">{errors.accessToken.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Store className="mr-2 h-4 w-4" />
                  {connectionMode === 'verify'
                    ? 'Verify Connection'
                    : connectionMode === 'sync'
                    ? 'Connect & Sync'
                    : 'Force Full Sync'
                  }
                </>
              )}
            </Button>
          </form>

          {/* Progress Display */}
          {progress && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white text-sm">{progress.message}</span>
                <span className="text-gray-400 text-sm">{progress.percentage}%</span>
              </div>
              <div className="w-full bg-slate-600 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Text */}
      <div className="text-xs text-gray-500 text-center">
        <p>
          Connection state is automatically saved. You won&apos;t need to re-sync unless you want to update product data.
        </p>
      </div>
    </div>
  );
};

export default SmartConnectionForm;