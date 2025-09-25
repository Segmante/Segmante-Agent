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
  RefreshCw
} from 'lucide-react';
import { KnowledgeBaseInfo, ReplicaService } from '@/lib/services/replica-service';
import { KnowledgeBaseDetailsModal } from '@/components/knowledge-base-details-modal';
import { KnowledgeBaseDeleteModal } from '@/components/knowledge-base-delete-modal';

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
  const [loading, setLoading] = useState(true);
  const [selectedKB, setSelectedKB] = useState<KnowledgeBaseInfo | null>(null);

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
      const replicas = await replicaService.getAllReplicas();
      const replicaMap = new Map(replicas.map(r => [r.uuid, r.name]));

      const enrichedKBs: EnrichedKnowledgeBase[] = kbList.map(kb => ({
        ...kb,
        replicaName: replicaMap.get(kb.replicaUuid) || 'Unknown Replica'
      }));

      setKnowledgeBases(enrichedKBs);
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
    <div className="space-y-6">
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