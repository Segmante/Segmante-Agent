'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  X,
  Database,
  Clock,
  Package,
  FileText,
  Bot,
  Copy,
  CheckCircle,
  Loader2,
  AlertCircle,
  Download
} from 'lucide-react';
import { ReplicaService } from '@/lib/services/replica-service';

interface KnowledgeBaseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  knowledgeBaseId: number;
  apiKey: string;
}

interface KnowledgeBaseDetails {
  id: number;
  replicaUuid: string;
  type: string;
  status: string;
  rawText: string;
  filename?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function KnowledgeBaseDetailsModal({
  isOpen,
  onClose,
  knowledgeBaseId,
  apiKey
}: KnowledgeBaseDetailsModalProps) {
  const [details, setDetails] = useState<KnowledgeBaseDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && knowledgeBaseId) {
      fetchKnowledgeBaseDetails();
    }
  }, [isOpen, knowledgeBaseId]);

  const fetchKnowledgeBaseDetails = async () => {
    setLoading(true);
    try {
      const replicaService = new ReplicaService(apiKey);
      const result = await replicaService.getKnowledgeBaseDetails(knowledgeBaseId);
      setDetails(result);
    } catch (error) {
      console.error('Error fetching knowledge base details:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!details?.rawText) return;

    try {
      await navigator.clipboard.writeText(details.rawText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const downloadAsText = () => {
    if (!details?.rawText) return;

    const blob = new Blob([details.rawText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `knowledge-base-${details.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  const extractStats = (rawText: string) => {
    const totalProductsMatch = rawText.match(/Total Products:\s*(\d+)/i);
    const totalProducts = totalProductsMatch ? parseInt(totalProductsMatch[1], 10) : 0;

    const lines = rawText.split('\n').length;
    const words = rawText.split(/\s+/).length;
    const chars = rawText.length;

    return { totalProducts, lines, words, chars };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-slate-800 border-slate-700">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl text-white flex items-center gap-2">
                <Database className="h-6 w-6 text-purple-400" />
                Knowledge Base #{knowledgeBaseId}
              </DialogTitle>
              <DialogDescription className="text-gray-400 mt-1">
                View and manage knowledge base content
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            <span className="ml-2 text-gray-300">Loading knowledge base details...</span>
          </div>
        ) : details ? (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-gray-400">Status</div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(details.status)}
                  <Badge className={`text-xs ${getStatusColor(details.status)}`}>
                    {details.status}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-400">Type</div>
                <Badge className="bg-slate-700/50 border-slate-600 text-gray-300 text-xs">
                  {details.type}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-400">Created</div>
                <div className="text-sm text-gray-300">{formatDate(details.createdAt)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-400">Updated</div>
                <div className="text-sm text-gray-300">{formatDate(details.updatedAt)}</div>
              </div>
            </div>

            {/* Replica Info */}
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Bot className="h-4 w-4 text-blue-400" />
                <span className="text-sm text-gray-400">Associated Replica</span>
              </div>
              <code className="text-gray-300 bg-slate-700/50 px-3 py-2 rounded text-sm block">
                {details.replicaUuid}
              </code>
            </div>

            {/* Content Stats */}
            {details.rawText && (
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4 text-green-400" />
                  Content Statistics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {(() => {
                    const stats = extractStats(details.rawText);
                    return (
                      <>
                        <div>
                          <div className="text-gray-400">Products</div>
                          <div className="text-lg font-semibold text-green-400">{stats.totalProducts}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Lines</div>
                          <div className="text-lg font-semibold text-blue-400">{stats.lines.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Words</div>
                          <div className="text-lg font-semibold text-purple-400">{stats.words.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Characters</div>
                          <div className="text-lg font-semibold text-yellow-400">{stats.chars.toLocaleString()}</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Content Actions */}
            <div className="flex items-center space-x-2">
              <Button
                onClick={copyToClipboard}
                variant="outline"
                size="sm"
                className="border-slate-600 text-gray-300 hover:bg-slate-700"
                disabled={!details.rawText}
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {copied ? 'Copied!' : 'Copy Content'}
              </Button>
              <Button
                onClick={downloadAsText}
                variant="outline"
                size="sm"
                className="border-slate-600 text-gray-300 hover:bg-slate-700"
                disabled={!details.rawText}
              >
                <Download className="h-4 w-4 mr-2" />
                Download as Text
              </Button>
            </div>

            <Separator className="bg-slate-700" />

            {/* Content Display */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-gray-400" />
                <h3 className="text-white font-medium">Raw Content</h3>
              </div>

              {details.rawText ? (
                <ScrollArea className="h-96 w-full border border-slate-700 rounded-lg">
                  <pre className="text-sm text-gray-300 p-4 whitespace-pre-wrap font-mono">
                    {details.rawText}
                  </pre>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <div>No content available</div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <div>Failed to load knowledge base details</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}