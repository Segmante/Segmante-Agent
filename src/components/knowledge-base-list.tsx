'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Database,
  Bot,
  Clock,
  FileText,
  Package,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  MoreHorizontal,
  Trash2,
  RefreshCw,
  BookOpen,
  Plus,
  Zap,
  Settings
} from 'lucide-react';
import { KnowledgeBaseInfo, ReplicaService, ReplicaInfo } from '@/lib/services/replica-service';
import { KnowledgeBaseDetailsModal } from '@/components/knowledge-base-details-modal';
import { KnowledgeBaseDeleteModal } from '@/components/knowledge-base-delete-modal';
import { DocumentationKnowledgeBaseService } from '@/lib/services/documentation-knowledge-base';

interface KnowledgeBaseListProps {
  apiKey: string;
  replicaUuid?: string; // Filter by specific replica
  showActions?: boolean;
}

interface EnrichedKnowledgeBase extends KnowledgeBaseInfo {
  replicaName?: string;
}

export function KnowledgeBaseList({ apiKey, replicaUuid, showActions = false }: KnowledgeBaseListProps) {
  const [knowledgeBases, setKnowledgeBases] = useState<EnrichedKnowledgeBase[]>([]);
  const [replicas, setReplicas] = useState<ReplicaInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKB, setSelectedKB] = useState<KnowledgeBaseInfo | null>(null);
  const [creatingTemplate, setCreatingTemplate] = useState<string | null>(null); // replicaUuid being processed

  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedKnowledgeBaseId, setSelectedKnowledgeBaseId] = useState<number | null>(null);
  const [knowledgeBaseToDelete, setKnowledgeBaseToDelete] = useState<EnrichedKnowledgeBase | null>(null);

  useEffect(() => {
    fetchKnowledgeBases();
  }, [replicaUuid]);

  const fetchKnowledgeBases = async () => {
    try {
      setLoading(true);
      const replicaService = new ReplicaService(apiKey);

      let kbList: KnowledgeBaseInfo[];
      if (replicaUuid) {
        kbList = await replicaService.getReplicaKnowledgeBases(replicaUuid);
      } else {
        kbList = await replicaService.getAllKnowledgeBases();
      }

      // Enrich with replica names
      const allReplicas = await replicaService.getAllReplicas();
      const replicaMap = new Map(allReplicas.map(r => [r.uuid, r.name]));

      const enrichedKBs: EnrichedKnowledgeBase[] = kbList.map(kb => ({
        ...kb,
        replicaName: replicaMap.get(kb.replicaUuid) || 'Unknown Replica'
      }));

      setKnowledgeBases(enrichedKBs);
      setReplicas(allReplicas);
    } catch (error) {
      console.error('Error fetching knowledge bases:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'READY':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'PROCESSING':
        return <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />;
      case 'BLANK':
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'READY':
        return 'bg-green-500/20 border-green-500/30 text-green-400';
      case 'PROCESSING':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-400';
      case 'BLANK':
        return 'bg-gray-500/20 border-gray-500/30 text-gray-400';
      default:
        return 'bg-red-500/20 border-red-500/30 text-red-400';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // CRUD Action Handlers
  const handleViewDetails = (knowledgeBase: EnrichedKnowledgeBase) => {
    setSelectedKnowledgeBaseId(knowledgeBase.id);
    setShowDetailsModal(true);
  };

  const handleDeleteClick = (knowledgeBase: EnrichedKnowledgeBase) => {
    setKnowledgeBaseToDelete(knowledgeBase);
    setShowDeleteModal(true);
  };

  const handleDeleteSuccess = () => {
    // Refresh the knowledge base list after successful deletion
    fetchKnowledgeBases();
  };

  const handleCloseModals = () => {
    setShowDetailsModal(false);
    setShowDeleteModal(false);
    setSelectedKnowledgeBaseId(null);
    setKnowledgeBaseToDelete(null);
  };

  const handleCreateDocumentationTemplate = async (targetReplicaUuid: string) => {
    try {
      setCreatingTemplate(targetReplicaUuid);

      const docService = new DocumentationKnowledgeBaseService(apiKey);
      const result = await docService.createDocumentationKnowledgeBase(targetReplicaUuid);

      if (result) {
        console.log('✅ Documentation template created:', result.id);
        // Refresh knowledge bases to show the new template
        await fetchKnowledgeBases();
      } else {
        console.error('Failed to create documentation template');
      }
    } catch (error) {
      console.error('Error creating documentation template:', error);
    } finally {
      setCreatingTemplate(null);
    }
  };

  const hasDocumentationKB = (targetReplicaUuid: string): boolean => {
    return knowledgeBases.some(kb =>
      kb.replicaUuid === targetReplicaUuid &&
      kb.rawTextPreview?.includes('Segmante AI Agent - Application Documentation')
    );
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 rounded-3xl p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          <span className="ml-2 text-gray-300">Loading knowledge bases...</span>
        </div>
      </div>
    );
  }

  if (knowledgeBases.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 rounded-3xl p-8">
        <div className="text-center py-12">
          <Database className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Knowledge Bases Found</h3>
          <p className="text-gray-400 mb-6">
            {replicaUuid
              ? "This replica doesn't have any knowledge bases yet."
              : "No knowledge bases have been created yet."}
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Package className="h-4 w-4 mr-2" />
            Sync Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Knowledge Bases</h2>
          <p className="text-gray-400">AI training data and product information</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className="bg-blue-500/20 border-blue-500/30 text-blue-400">
            {knowledgeBases.length} Total
          </Badge>
          <Badge className="bg-green-500/20 border-green-500/30 text-green-400">
            {knowledgeBases.filter(kb => kb.status === 'READY').length} Ready
          </Badge>
        </div>
      </div>

      {/* Application Documentation Template Section */}
      {!replicaUuid && replicas.length > 0 && (
        <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur border border-purple-500/20 rounded-3xl p-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-500/20 rounded-full">
              <BookOpen className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Application Documentation Template</h3>
              <p className="text-gray-300">
                Add comprehensive application documentation to your replicas for enhanced AI understanding
              </p>
            </div>
          </div>

          <div className="bg-slate-800/30 rounded-2xl p-6 mb-6">
            <h4 className="text-lg font-medium text-white mb-3">📋 What&apos;s Included:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Settings className="w-4 h-4 text-blue-400" />
                  <span>Shopify API integration guide</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-green-400" />
                  <span>Smart intent detection examples</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 text-purple-400" />
                  <span>Structured query formats</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Bot className="w-4 h-4 text-yellow-400" />
                  <span>AI agent guidelines</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-orange-400" />
                  <span>Command examples & responses</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Best practices & safety</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-medium text-white">🤖 Available Replicas:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {replicas.map((replica) => {
                const hasDocKB = hasDocumentationKB(replica.uuid);
                const isCreating = creatingTemplate === replica.uuid;

                return (
                  <div
                    key={replica.uuid}
                    className={`p-4 rounded-xl border ${
                      hasDocKB
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-slate-800/30 border-slate-600 hover:border-blue-500/50'
                    } transition-all duration-200`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          hasDocKB ? 'bg-green-500/20' : 'bg-slate-700'
                        }`}>
                          <Bot className={`w-4 h-4 ${hasDocKB ? 'text-green-400' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <h5 className="text-white font-medium text-sm">{replica.name}</h5>
                          <p className="text-xs text-gray-400 truncate max-w-32">
                            {replica.shortDescription}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          hasDocKB
                            ? 'border-green-500/30 text-green-400'
                            : 'border-gray-500/30 text-gray-400'
                        }`}
                      >
                        {hasDocKB ? '✅ Documentation Ready' : '📝 Needs Documentation'}
                      </Badge>
                    </div>

                    {!hasDocKB && (
                      <Button
                        onClick={() => handleCreateDocumentationTemplate(replica.uuid)}
                        disabled={isCreating}
                        className="w-full mt-3 bg-purple-600 hover:bg-purple-700 text-white"
                        size="sm"
                      >
                        {isCreating ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3 mr-2" />
                            Add Documentation
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {knowledgeBases.map((kb) => (
          <Card
            key={kb.id}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 hover:border-blue-500/50 transition-all duration-200"
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Database className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg text-white">
                        Knowledge Base #{kb.id}
                      </CardTitle>
                      {getStatusIcon(kb.status)}
                    </div>
                    <CardDescription className="text-gray-400">
                      {kb.replicaName}
                    </CardDescription>
                  </div>
                </div>
                {showActions && (
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Status and Type */}
              <div className="flex items-center space-x-4">
                <Badge className={`text-xs ${getStatusColor(kb.status)}`}>
                  {kb.status}
                </Badge>
                <Badge className="bg-slate-700/50 border-slate-600 text-gray-300 text-xs">
                  {kb.type}
                </Badge>
                {kb.productCount && (
                  <Badge className="bg-blue-500/20 border-blue-500/30 text-blue-400 text-xs">
                    <Package className="h-3 w-3 mr-1" />
                    {kb.productCount} Products
                  </Badge>
                )}
              </div>

              {/* Replica UUID */}
              <div className="flex items-center space-x-2 text-sm">
                <Bot className="h-4 w-4 text-gray-500" />
                <span className="text-gray-400">Replica:</span>
                <code className="text-gray-300 bg-slate-700/50 px-2 py-1 rounded text-xs">
                  {kb.replicaUuid.substring(0, 8)}...{kb.replicaUuid.substring(kb.replicaUuid.length - 8)}
                </code>
              </div>

              {/* Content Preview */}
              {kb.rawTextPreview && (
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-400">Content Preview</span>
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-3">
                    {kb.rawTextPreview}
                  </p>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 pt-2 border-t border-slate-700">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <div>
                    <div className="text-gray-400">Created</div>
                    <div className="text-gray-300">{formatDate(kb.createdAt)}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4" />
                  <div>
                    <div className="text-gray-400">Updated</div>
                    <div className="text-gray-300">{formatDate(kb.updatedAt)}</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {showActions && (
                <div className="flex space-x-2 pt-4 border-t border-slate-700">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-gray-300 hover:bg-slate-700"
                    onClick={() => handleViewDetails(kb)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  {kb.status === 'READY' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                      onClick={() => {
                        // TODO: Implement resync functionality
                        console.log('Resync KB:', kb.id);
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Resync
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 ml-auto"
                    onClick={() => handleDeleteClick(kb)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modals */}
      {selectedKnowledgeBaseId && (
        <KnowledgeBaseDetailsModal
          isOpen={showDetailsModal}
          onClose={handleCloseModals}
          knowledgeBaseId={selectedKnowledgeBaseId}
          apiKey={apiKey}
        />
      )}

      {knowledgeBaseToDelete && (
        <KnowledgeBaseDeleteModal
          isOpen={showDeleteModal}
          onClose={handleCloseModals}
          onDeleted={handleDeleteSuccess}
          knowledgeBase={{
            id: knowledgeBaseToDelete.id,
            replicaName: knowledgeBaseToDelete.replicaName,
            productCount: knowledgeBaseToDelete.productCount,
            status: knowledgeBaseToDelete.status
          }}
          apiKey={apiKey}
        />
      )}
    </div>
  );
}