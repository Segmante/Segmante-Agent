'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  X,
  Bot,
  Save,
  Loader2,
  Settings,
  MessageSquare,
  Zap,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { ReplicaCRUDService, ReplicaCRUDInfo, UpdateReplicaRequest } from '@/lib/services/replica-crud-service';

interface ReplicaEditModalProps {
  replica: ReplicaCRUDInfo;
  apiKey: string;
  onClose: () => void;
  onUpdated: (updatedReplica: ReplicaCRUDInfo) => void;
}

export function ReplicaEditModal({ replica, apiKey, onClose, onUpdated }: ReplicaEditModalProps) {
  const [formData, setFormData] = useState<UpdateReplicaRequest>({
    name: replica.name,
    shortDescription: replica.shortDescription,
    greeting: replica.greeting,
    type: replica.type,
    private: replica.private,
    tags: replica.tags,
    suggestedQuestions: replica.suggestedQuestions,
    llm: {
      model: replica.llm.model,
      memoryMode: replica.llm.memoryMode,
      systemMessage: replica.llm.systemMessage
    }
  });

  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'system'>('basic');
  const [updateShopifySystem, setUpdateShopifySystem] = useState(false);

  const handleInputChange = (field: keyof UpdateReplicaRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLLMChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      llm: {
        ...prev.llm,
        [field]: value
      }
    }));
  };

  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    handleInputChange('tags', tags);
  };

  const handleSuggestedQuestionsChange = (questionsString: string) => {
    const questions = questionsString.split('\n').map(q => q.trim()).filter(q => q.length > 0);
    handleInputChange('suggestedQuestions', questions);
  };

  const handleUpdateShopifySystem = async () => {
    setUpdating(true);
    try {
      const crudService = new ReplicaCRUDService(apiKey);

      // Debug: Get the enhanced system message first
      const enhancedMessage = crudService.getShopifyActionSystemMessage();
      console.log('🔍 Enhanced system message preview:', enhancedMessage.substring(0, 200) + '...');
      console.log('🔍 Contains action patterns:', enhancedMessage.includes('CRITICAL: Intent Pattern Recognition'));

      const result = await crudService.updateReplicaForShopifyActions(replica.uuid);

      if (result.success && result.replica) {
        console.log('✅ Update successful');
        console.log('🔍 Returned system message preview:', result.replica.llm.systemMessage.substring(0, 200) + '...');
        console.log('🔍 Returned message contains patterns:', result.replica.llm.systemMessage.includes('CRITICAL: Intent Pattern Recognition'));

        // Update form data with the enhanced system message
        // Use the enhanced message we know is correct rather than relying on API response
        setFormData(prev => ({
          ...prev,
          llm: {
            ...prev.llm,
            systemMessage: enhancedMessage
          }
        }));

        console.log('✅ Updated system message for Shopify actions');
        console.log('🔍 Form updated with enhanced message containing patterns:', enhancedMessage.includes('CRITICAL: Intent Pattern Recognition'));
      } else {
        console.error('Failed to update system message:', result.error);
        alert('Failed to update system message: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating system message:', error);
      alert('Error updating system message: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const crudService = new ReplicaCRUDService(apiKey);
      const result = await crudService.updateReplica(replica.uuid, formData);

      if (result.success && result.replica) {
        onUpdated(result.replica);
        onClose();
      } else {
        console.error('Failed to update replica:', result.error);
      }
    } catch (error) {
      console.error('Error updating replica:', error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Edit Replica</h3>
              <p className="text-sm text-gray-400">{replica.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('basic')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'basic'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Settings className="w-4 h-4 inline-block mr-2" />
            Basic Info
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'advanced'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <MessageSquare className="w-4 h-4 inline-block mr-2" />
            Advanced
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'system'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Zap className="w-4 h-4 inline-block mr-2" />
            System Message
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-white">Name</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Enter replica name"
                  />
                </div>

                <div>
                  <Label htmlFor="shortDescription" className="text-white">Short Description</Label>
                  <Input
                    id="shortDescription"
                    value={formData.shortDescription || ''}
                    onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Brief description of the replica"
                  />
                </div>

                <div>
                  <Label htmlFor="greeting" className="text-white">Greeting Message</Label>
                  <Textarea
                    id="greeting"
                    value={formData.greeting || ''}
                    onChange={(e) => handleInputChange('greeting', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                    placeholder="How the replica greets users"
                  />
                </div>

                <div>
                  <Label htmlFor="type" className="text-white">Type</Label>
                  <select
                    id="type"
                    value={formData.type || 'character'}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                  >
                    <option value="character">Character</option>
                    <option value="individual">Individual</option>
                    <option value="brand">Brand</option>
                  </select>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="private"
                    checked={formData.private || false}
                    onChange={(e) => handleInputChange('private', e.target.checked)}
                    className="rounded border-slate-600"
                  />
                  <Label htmlFor="private" className="text-white">Private Replica</Label>
                </div>
              </div>
            )}

            {/* Advanced Tab */}
            {activeTab === 'advanced' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tags" className="text-white">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={(formData.tags || []).join(', ')}
                    onChange={(e) => handleTagsChange(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="shopify, ecommerce, assistant"
                  />
                  <p className="text-xs text-gray-400 mt-1">Tags help categorize and find your replica</p>
                </div>

                <div>
                  <Label htmlFor="suggestedQuestions" className="text-white">Suggested Questions (one per line)</Label>
                  <Textarea
                    id="suggestedQuestions"
                    value={(formData.suggestedQuestions || []).join('\n')}
                    onChange={(e) => handleSuggestedQuestionsChange(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white min-h-[120px]"
                    placeholder="What products do you have?&#10;How can I check my inventory?&#10;Can you update my prices?"
                  />
                </div>

                <div>
                  <Label htmlFor="model" className="text-white">AI Model</Label>
                  <select
                    id="model"
                    value={formData.llm?.model || 'claude-3-sonnet'}
                    onChange={(e) => handleLLMChange('model', e.target.value)}
                    className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                  >
                    <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                    <option value="claude-3-haiku">Claude 3 Haiku</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="memoryMode" className="text-white">Memory Mode</Label>
                  <select
                    id="memoryMode"
                    value={formData.llm?.memoryMode || 'adaptive'}
                    onChange={(e) => handleLLMChange('memoryMode', e.target.value)}
                    className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                  >
                    <option value="adaptive">Adaptive</option>
                    <option value="persistent">Persistent</option>
                    <option value="conversational">Conversational</option>
                  </select>
                </div>
              </div>
            )}

            {/* System Message Tab */}
            {activeTab === 'system' && (
              <div className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Zap className="w-5 h-5 text-blue-400" />
                    <h4 className="text-lg font-medium text-white">Shopify Action Optimization</h4>
                  </div>
                  <p className="text-gray-300 text-sm mb-4">
                    Update the system message with optimized instructions for handling Shopify actions and structured responses.
                    <br />
                    <strong className="text-blue-400">This will enable pattern recognition for commands like:</strong>
                    <br />
                    • &quot;infinix note 30 price to $10.00&quot; → JSON action response
                    <br />
                    • &quot;set product stock to 25&quot; → JSON action response
                  </p>
                  <Button
                    type="button"
                    onClick={handleUpdateShopifySystem}
                    disabled={updating}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {updating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Optimize for Shopify Actions
                      </>
                    )}
                  </Button>
                </div>

                <div>
                  <Label htmlFor="systemMessage" className="text-white">System Message</Label>
                  <Textarea
                    id="systemMessage"
                    value={formData.llm?.systemMessage || ''}
                    onChange={(e) => handleLLMChange('systemMessage', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white min-h-[300px] font-mono text-sm"
                    placeholder="System instructions that define how the AI behaves..."
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    The system message defines how your AI replica behaves and responds to users.
                  </p>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-slate-700">
          <Button variant="outline" onClick={onClose} disabled={updating}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={updating} className="bg-blue-600 hover:bg-blue-700">
            {updating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}