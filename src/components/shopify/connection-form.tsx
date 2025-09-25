"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Store, CheckCircle, AlertCircle, Loader2, ExternalLink } from "lucide-react"
import { SyncProgress } from "@/lib/sensay/product-sync"
import { ShopifyConnectionStatus } from "@/lib/shopify/types"
import { UserSessionManager } from "@/lib/user-session"

const formSchema = z.object({
  domain: z.string().min(1, "Store domain is required").regex(
    /^[a-zA-Z0-9\-]+\.myshopify\.com$|^[a-zA-Z0-9\-]+$/,
    "Enter a valid Shopify store domain (e.g., your-store.myshopify.com or your-store)"
  ),
  accessToken: z.string().min(1, "Access token is required").min(32, "Access token must be at least 32 characters")
})

type FormData = z.infer<typeof formSchema>

interface ShopifyConnectionFormProps {
  onConnectionSuccess?: (status: ShopifyConnectionStatus) => void
}

export function ShopifyConnectionForm({ onConnectionSuccess }: ShopifyConnectionFormProps) {
  const [connectionStatus, setConnectionStatus] = useState<ShopifyConnectionStatus | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null)
  const [productCount, setProductCount] = useState<number | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      domain: "",
      accessToken: ""
    }
  })

  const formatDomain = (domain: string): string => {
    // Remove protocol if present
    domain = domain.replace(/^https?:\/\//, '')

    // Add .myshopify.com if not present
    if (!domain.includes('.myshopify.com')) {
      domain = `${domain}.myshopify.com`
    }

    return domain
  }

  const handleConnection = async (data: FormData) => {
    setIsConnecting(true)
    setConnectionStatus(null)
    setSyncProgress(null)
    setProductCount(null)

    try {
      const formattedDomain = formatDomain(data.domain)

      // Step 1: Test connection via API route
      setSyncProgress({
        stage: 'preparing',
        message: 'Testing Shopify connection...',
        progress: 10
      })

      const testResponse = await fetch('/api/shopify/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          domain: formattedDomain,
          accessToken: data.accessToken
        })
      })

      const connectionResult = await testResponse.json()

      if (!testResponse.ok || !connectionResult.connected) {
        setConnectionStatus({
          connected: false,
          error: connectionResult.error || 'Connection failed'
        })
        setSyncProgress(null)
        return
      }

      setConnectionStatus(connectionResult)
      setProductCount(connectionResult.productCount || 0)

      if (!connectionResult.productCount || connectionResult.productCount === 0) {
        setSyncProgress({
          stage: 'completed',
          message: 'Store connected successfully! No products found to sync.',
          progress: 100
        })
        onConnectionSuccess?.(connectionResult)
        return
      }

      // Step 2: Sync products via API route
      setSyncProgress({
        stage: 'uploading',
        message: `Syncing ${connectionResult.productCount} products to AI knowledge base...`,
        progress: 30
      })

      const syncResponse = await fetch('/api/shopify/sync-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          domain: formattedDomain,
          accessToken: data.accessToken
        })
      })

      const syncResult = await syncResponse.json()

      if (!syncResponse.ok || !syncResult.success) {
        throw new Error(syncResult.error || 'Product sync failed')
      }

      setSyncProgress({
        stage: 'processing',
        message: 'Processing products in AI knowledge base...',
        progress: 70
      })

      // Simulate processing time (in real implementation, this would be polling)
      await new Promise(resolve => setTimeout(resolve, 3000))

      setSyncProgress({
        stage: 'completed',
        message: `Successfully synced ${syncResult.productCount} products to AI agent!`,
        progress: 100
      })

      // Save user session for chat functionality
      if (syncResult.userId && syncResult.replicaUuid) {
        UserSessionManager.saveUserSession({
          userId: syncResult.userId,
          replicaUuid: syncResult.replicaUuid,
          shopifyDomain: formattedDomain,
          storeName: connectionResult.shopName,
          createdAt: new Date().toISOString()
        });
        console.log('User session saved for chat functionality');
      }

      onConnectionSuccess?.(connectionResult)

    } catch (error: any) {
      console.error('Connection error:', error)
      setConnectionStatus({
        connected: false,
        error: error.message
      })
      setSyncProgress({
        stage: 'error',
        message: error.message,
        progress: 0
      })
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="w-full bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 rounded-3xl p-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-blue-500/20 rounded-full mb-4">
          <Store className="h-8 w-8 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Connect Shopify Store</h2>
        <p className="text-gray-400">
          Enter your Shopify store domain and Admin API access token to connect your store.
        </p>
      </div>
      <div className="space-y-6">

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleConnection)} className="space-y-4">

            <FormField
              control={form.control}
              name="domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300 font-medium">Store Domain</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="your-store.myshopify.com"
                      autoComplete="url"
                      {...field}
                      disabled={isConnecting}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 rounded-xl p-4"
                    />
                  </FormControl>
                  <FormDescription className="text-gray-400 text-sm">
                    Enter your Shopify store domain (with or without .myshopify.com)
                  </FormDescription>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accessToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300 font-medium">Admin API Access Token</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="shpca_..."
                      autoComplete="current-password"
                      {...field}
                      disabled={isConnecting}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 rounded-xl p-4"
                    />
                  </FormControl>
                  <FormDescription className="text-gray-400 text-sm">
                    Private app access token from your Shopify admin
                  </FormDescription>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium px-8 py-4 rounded-xl transition-all duration-200 shadow-lg disabled:opacity-50"
              disabled={isConnecting}
              size="lg"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Store className="mr-2 h-5 w-5" />
                  Connect Store
                </>
              )}
            </Button>
          </form>
        </Form>

        {/* Connection Status */}
        {connectionStatus && (
          <div className={connectionStatus.connected
            ? "bg-green-500/10 border border-green-500/30 rounded-xl p-4"
            : "bg-red-500/10 border border-red-500/30 rounded-xl p-4"
          }>
            <div className="flex items-start space-x-3">
              {connectionStatus.connected ? (
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
              )}
              <div className={connectionStatus.connected ? "text-green-200" : "text-red-200"}>
                {connectionStatus.connected ? (
                  <div className="space-y-2">
                    <div className="font-medium">✅ Successfully connected to your Shopify store!</div>
                    {connectionStatus.domain && (
                      <div className="text-sm opacity-90">Store: {connectionStatus.domain}</div>
                    )}
                    {productCount !== null && (
                      <div className="text-sm opacity-90">Found {productCount} products</div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="font-medium">❌ Connection failed</div>
                    <div className="text-sm mt-1 opacity-90">{connectionStatus.error}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sync Progress */}
        {syncProgress && (
          <div className="space-y-4 bg-slate-800/30 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">
                {syncProgress.stage === 'error' ? 'Error' : 'Syncing Products'}
              </span>
              <Badge className={syncProgress.stage === 'error'
                ? "bg-red-500/20 border-red-500/30 text-red-400"
                : "bg-blue-500/20 border-blue-500/30 text-blue-400"
              }>
                {syncProgress.stage === 'completed' ? '100%' : `${syncProgress.progress}%`}
              </Badge>
            </div>
            <Progress
              value={syncProgress.progress}
              className="w-full"
            />
            <p className="text-sm text-gray-400">
              {syncProgress.message}
            </p>

            {syncProgress.stage === 'completed' && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mt-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                  <div className="text-green-200">
                    <div className="font-medium">🎉 Products synced successfully!</div>
                    <div className="text-sm mt-1 opacity-90">
                      Your products have been added to your AI agent&apos;s knowledge base. You can now start chatting!
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Help Information */}
        <div className="border-t border-slate-700 pt-6">
          <h4 className="text-sm font-medium mb-4 text-gray-300">Need help getting your API credentials?</h4>
          <div className="space-y-3 text-sm text-gray-400">
            <div className="flex items-center space-x-3">
              <span className="bg-slate-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">1</span>
              <span>Go to your Shopify admin → Apps → Manage private apps</span>
              <ExternalLink className="h-3 w-3" />
            </div>
            <div className="flex items-center space-x-3">
              <span className="bg-slate-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">2</span>
              <span>Create a new private app with Admin API permissions</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="bg-slate-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">3</span>
              <span>Copy the Admin API access token and paste it above</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}