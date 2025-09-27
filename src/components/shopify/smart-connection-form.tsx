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
import { EnhancedConnectionManager, ConnectionProgress } from '@/lib/shopify/enhanced-connection-manager';

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
  const [connectionRecommendations, setConnectionRecommendations] = useState<any>(null);

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

  // Get recommendations when domain changes
  useEffect(() => {
    const getRecommendations = async () => {
      const domain = new URLSearchParams(window.location.search).get('domain');
      if (domain) {
        const sensayApiKey = process.env.NEXT_PUBLIC_SENSAY_API_KEY_SECRET;
        if (sensayApiKey) {
          const connectionManager = new EnhancedConnectionManager(sensayApiKey);
          const recommendations = await connectionManager.getConnectionRecommendations(domain);
          setConnectionRecommendations(recommendations);
          setConnectionMode(recommendations.recommendedMode);
        }
      }
    };

    getRecommendations();
  }, []);

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

      // Get Sensay API key
      const sensayApiKey = process.env.NEXT_PUBLIC_SENSAY_API_KEY_SECRET;
      if (!sensayApiKey) {
        throw new Error('AI service configuration error - API key not found');
      }

      // Use Enhanced Connection Manager for better error handling
      const connectionManager = new EnhancedConnectionManager(sensayApiKey);

      const progressHandler = (progress: ConnectionProgress) => {
        setProgress({
          message: progress.message,
          percentage: progress.percentage
        });
      };

      // Smart connection with enhanced error handling
      const connectionState = await connectionManager.smartConnect(
        formattedDomain,
        data.accessToken,
        connectionMode,
        progressHandler
      );

      // Success - notify parent component with debug logging
      console.log(`💾 SmartConnectionForm: Saving connection state:`, {
        productCount: connectionState.productCount,
        knowledgeBaseId: connectionState.knowledgeBaseId,
        replicaUuid: connectionState.replicaUuid,
        userId: connectionState.userId
      });

      setTimeout(() => {
        onConnectionSuccess?.({
          ...connectionState,
          connected: connectionState.isConnected // backwards compatibility
        });
        setIsProcessing(false);
      }, 1000);

    } catch (error: any) {
      console.error('Enhanced connection error:', error);

      // More descriptive error messages
      let errorMessage = error.message || 'Connection failed';

      if (errorMessage.includes('User, email, or linked account already exists')) {
        errorMessage = 'Setting up AI assistant - this may take a moment...';
        // Retry logic is now handled in EnhancedConnectionManager
      } else if (errorMessage.includes('AI service configuration error')) {
        errorMessage = 'AI service configuration error - please check your setup';
      } else if (errorMessage.includes('Connection verification failed')) {
        errorMessage = 'Invalid Shopify credentials - please check your domain and access token';
      }

      setProgress({ message: errorMessage, percentage: 0 });
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