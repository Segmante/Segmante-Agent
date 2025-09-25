'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, Store, User, Clock, MessageSquare, Zap, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { ReplicaInfo, ReplicaService } from '@/lib/services/replica-service';
import { UserSessionManager } from '@/lib/user-session';

interface ReplicaListProps {
  apiKey: string;
  onSelectReplica?: (replica: ReplicaInfo) => void;
  showSelection?: boolean;
}

export function ReplicaList({ apiKey, onSelectReplica, showSelection = false }: ReplicaListProps) {
  const [replicas, setReplicas] = useState<ReplicaInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReplicaUuid, setSelectedReplicaUuid] = useState<string | null>(null);

  useEffect(() => {
    fetchReplicas();

    // Get currently selected replica from session
    const session = UserSessionManager.getUserSession();
    if (session) {
      setSelectedReplicaUuid(session.replicaUuid);
    }
  }, []);

  const fetchReplicas = async () => {
    try {
      setLoading(true);
      const replicaService = new ReplicaService(apiKey);
      const allReplicas = await replicaService.getShopifyReplicas();
      setReplicas(allReplicas);
    } catch (error) {
      console.error('Error fetching replicas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReplica = (replica: ReplicaInfo) => {
    setSelectedReplicaUuid(replica.uuid);
    if (onSelectReplica) {
      onSelectReplica(replica);
    }
  };

  const getReplicaTypeIcon = (type: string) => {
    switch (type) {
      case 'brand':
        return <Store className="h-4 w-4" />;
      case 'individual':
        return <User className="h-4 w-4" />;
      default:
        return <Bot className="h-4 w-4" />;
    }
  };

  const getModelBadgeColor = (model: string) => {
    if (model.includes('claude')) return 'bg-blue-500/20 border-blue-500/30 text-blue-400';
    if (model.includes('gpt')) return 'bg-green-500/20 border-green-500/30 text-green-400';
    if (model.includes('gemini')) return 'bg-purple-500/20 border-purple-500/30 text-purple-400';
    return 'bg-gray-500/20 border-gray-500/30 text-gray-400';
  };

  const getShopifyDomain = (tags: string[]) => {
    const shopifyTag = tags.find(tag => tag.startsWith('shopify:'));
    return shopifyTag ? shopifyTag.replace('shopify:', '') : null;
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 rounded-3xl p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          <span className="ml-2 text-gray-300">Loading your AI replicas...</span>
        </div>
      </div>
    );
  }

  if (replicas.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 rounded-3xl p-8">
        <div className="text-center py-12">
          <Bot className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No AI Replicas Found</h3>
          <p className="text-gray-400 mb-6">
            Connect your Shopify store first to create an AI replica with your product knowledge.
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Store className="h-4 w-4 mr-2" />
            Connect Store
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Your AI Replicas</h2>
          <p className="text-gray-400">Manage and select your AI shopping assistants</p>
        </div>
        <Badge className="bg-blue-500/20 border-blue-500/30 text-blue-400">
          {replicas.length} Active
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {replicas.map((replica) => {
          const shopifyDomain = getShopifyDomain(replica.tags);
          const isSelected = selectedReplicaUuid === replica.uuid;

          return (
            <Card
              key={replica.uuid}
              className={`bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border transition-all duration-200 hover:border-blue-500/50 cursor-pointer ${
                isSelected ? 'border-blue-500/70 ring-1 ring-blue-500/20' : 'border-slate-700'
              }`}
              onClick={() => showSelection && handleSelectReplica(replica)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {replica.profileImage ? (
                        <img
                          src={replica.profileImage}
                          alt={replica.name}
                          className="w-12 h-12 rounded-full bg-slate-700 object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          {getReplicaTypeIcon(replica.type)}
                          <span className="text-white text-sm font-bold ml-1">AI</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg text-white truncate">
                        {replica.name}
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        {replica.shortDescription}
                      </CardDescription>
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Store Info */}
                {shopifyDomain && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Store className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-400">Connected to</span>
                    <span className="text-white font-medium">{shopifyDomain}</span>
                  </div>
                )}

                {/* Model Info */}
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-gray-500" />
                  <Badge className={`text-xs ${getModelBadgeColor(replica.llm.model)}`}>
                    {replica.llm.model}
                  </Badge>
                  <Badge className="bg-slate-700/50 border-slate-600 text-gray-300 text-xs">
                    {replica.llm.memoryMode}
                  </Badge>
                </div>

                {/* Tags */}
                {replica.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {replica.tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag}
                        className="bg-slate-700/30 border-slate-600 text-gray-300 text-xs"
                      >
                        {tag.replace('shopify:', '').replace('-', ' ')}
                      </Badge>
                    ))}
                    {replica.tags.length > 3 && (
                      <Badge className="bg-slate-700/30 border-slate-600 text-gray-300 text-xs">
                        +{replica.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t border-slate-700">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Created {new Date(replica.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-green-400">Active</span>
                  </div>
                </div>

                {/* Actions */}
                {showSelection && (
                  <div className="pt-4 border-t border-slate-700">
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      className={`w-full ${
                        isSelected
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "border-slate-600 text-gray-300 hover:bg-slate-700"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectReplica(replica);
                      }}
                    >
                      {isSelected ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Selected
                        </>
                      ) : (
                        <>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Use This Replica
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}