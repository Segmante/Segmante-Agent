'use client';

import React, { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';
import { ReplicaList } from '@/components/replica-list';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Bot, Zap, ArrowRight, Users, Settings } from 'lucide-react';
import { ReplicaInfo } from '@/lib/services/replica-service';

export default function ChatPage() {
  const [showReplicaSelection, setShowReplicaSelection] = useState(false);
  const [selectedReplica, setSelectedReplica] = useState<ReplicaInfo | null>(null);

  const handleSelectReplica = (replica: ReplicaInfo) => {
    setSelectedReplica(replica);
    setShowReplicaSelection(false);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-32">
        {/* Page Header */}
        <div className="text-center space-y-8 mb-12">
          {/* Badge */}
          <div className="inline-flex items-center rounded-full px-4 py-2 bg-blue-500/10 backdrop-blur border border-blue-500/20">
            <Badge variant="secondary" className="bg-transparent border-0 text-blue-300 px-0">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              AI Assistant
            </Badge>
            <span className="ml-2 text-sm text-gray-300">
              Powered by 20+ Advanced AI Models
            </span>
            <ArrowRight className="ml-2 h-4 w-4 text-gray-400" />
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Chat with Your
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI Shopping Assistant
            </span>
          </h1>

          {/* Description */}
          <p className="mx-auto max-w-3xl text-lg leading-8 text-gray-300">
            Ask questions about products, get personalized recommendations, and manage your inventory.
            Your intelligent assistant is powered by Sensay AI with real-time knowledge.
          </p>

          {/* AI Model Badges */}
          <div className="flex items-center justify-center space-x-4 flex-wrap gap-2">
            <Badge className="bg-slate-800/50 border border-slate-700 text-gray-300 px-4 py-2">
              <Bot className="h-4 w-4 mr-2" />
              Claude-3.7-Sonnet
            </Badge>
            <Badge className="bg-slate-800/50 border border-slate-700 text-gray-300 px-4 py-2">
              <Zap className="h-4 w-4 mr-2" />
              GPT-4o
            </Badge>
            <Badge className="bg-slate-800/50 border border-slate-700 text-gray-300 px-4 py-2">
              <MessageSquare className="h-4 w-4 mr-2" />
              Gemini-2.5-Flash
            </Badge>
            <Button
              onClick={() => setShowReplicaSelection(!showReplicaSelection)}
              className="bg-slate-800/50 border border-slate-700 text-gray-300 hover:bg-slate-700 hover:text-white"
            >
              <Users className="h-4 w-4 mr-2" />
              {selectedReplica ? selectedReplica.name : 'Select AI Replica'}
            </Button>
          </div>
        </div>

        {/* Replica Selection */}
        {showReplicaSelection && (
          <div className="mb-12">
            <ReplicaList
              apiKey={process.env.NEXT_PUBLIC_SENSAY_API_KEY_SECRET!}
              onSelectReplica={handleSelectReplica}
              showSelection={true}
            />
          </div>
        )}

        {/* Current Replica Info */}
        {selectedReplica && !showReplicaSelection && (
          <div className="mb-8">
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur border border-blue-500/30 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{selectedReplica.name}</h3>
                    <p className="text-gray-400 text-sm">{selectedReplica.shortDescription}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplicaSelection(true)}
                  className="text-gray-400 hover:text-white"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Interface */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 rounded-3xl p-8">
          <div className="h-[70vh]">
            <ChatInterface apiKey={process.env.NEXT_PUBLIC_SENSAY_API_KEY_SECRET} />
          </div>
        </div>

        {/* Quick Examples */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-500/10 backdrop-blur border border-blue-500/20 rounded-2xl p-6">
              <MessageSquare className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">Product Questions</h3>
              <p className="text-gray-400 text-sm">
                "Do you have waterproof jackets in size L?"
              </p>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-purple-500/10 backdrop-blur border border-purple-500/20 rounded-2xl p-6">
              <Bot className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">Recommendations</h3>
              <p className="text-gray-400 text-sm">
                "What are your best-selling winter items?"
              </p>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-green-500/10 backdrop-blur border border-green-500/20 rounded-2xl p-6">
              <Zap className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">Inventory Help</h3>
              <p className="text-gray-400 text-sm">
                "Show me products with low inventory"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}