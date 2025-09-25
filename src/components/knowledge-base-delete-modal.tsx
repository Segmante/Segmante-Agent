'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Trash2,
  Loader2,
  Database,
  Package,
  X
} from 'lucide-react';
import { ReplicaService } from '@/lib/services/replica-service';

interface KnowledgeBaseDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
  knowledgeBase: {
    id: number;
    replicaName?: string;
    productCount?: number;
    status: string;
  };
  apiKey: string;
}

export function KnowledgeBaseDeleteModal({
  isOpen,
  onClose,
  onDeleted,
  knowledgeBase,
  apiKey
}: KnowledgeBaseDeleteModalProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const replicaService = new ReplicaService(apiKey);
      const success = await replicaService.deleteKnowledgeBase(knowledgeBase.id);

      if (success) {
        console.log(`🗑️ Knowledge base ${knowledgeBase.id} deleted successfully`);
        onDeleted();
        onClose();
      } else {
        console.error(`❌ Failed to delete knowledge base ${knowledgeBase.id}`);
        // You could show a toast notification here
      }
    } catch (error) {
      console.error('Error deleting knowledge base:', error);
      // You could show a toast notification here
    } finally {
      setDeleting(false);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-slate-800 border-slate-700">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <DialogTitle className="text-white">Delete Knowledge Base</DialogTitle>
                <DialogDescription className="text-gray-400">
                  This action cannot be undone
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
              disabled={deleting}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Knowledge Base Info */}
          <div className="bg-slate-700/30 rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-purple-400" />
              <span className="text-white font-medium">Knowledge Base #{knowledgeBase.id}</span>
              <Badge className={`text-xs ${getStatusColor(knowledgeBase.status)}`}>
                {knowledgeBase.status}
              </Badge>
            </div>

            {knowledgeBase.replicaName && (
              <div className="text-sm text-gray-400">
                Associated with replica: <span className="text-gray-300">{knowledgeBase.replicaName}</span>
              </div>
            )}

            {knowledgeBase.productCount && knowledgeBase.productCount > 0 && (
              <div className="flex items-center space-x-2 text-sm">
                <Package className="h-4 w-4 text-blue-400" />
                <span className="text-gray-300">
                  Contains {knowledgeBase.productCount} product{knowledgeBase.productCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {/* Warning */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <div className="text-red-300 font-medium">Warning: Permanent Deletion</div>
                <div className="text-red-400/80 text-sm space-y-1">
                  <div>• All knowledge base content will be permanently deleted</div>
                  <div>• The AI replica will no longer have access to this information</div>
                  <div>• Product data and training content cannot be recovered</div>
                  <div>• You will need to re-sync to restore the data</div>
                </div>
              </div>
            </div>
          </div>

          {/* Confirmation */}
          <div className="text-gray-300 text-sm">
            Are you sure you want to delete this knowledge base? This will permanently remove all stored product information and cannot be undone.
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-600 text-gray-300 hover:bg-slate-700"
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Knowledge Base
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}