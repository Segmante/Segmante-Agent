'use client';

import React from 'react';
import ChatInterface from '@/components/ChatInterface';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Bot, Zap } from 'lucide-react';

export default function ChatPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <MessageSquare className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">AI Chat Interface</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Start conversations with your AI agent powered by Sensay. Ask questions, get insights, and manage your business intelligently.
        </p>
        <div className="flex items-center justify-center space-x-4">
          <Badge variant="secondary" className="px-3 py-1">
            <Bot className="h-3 w-3 mr-1" />
            Claude-3.7-Sonnet
          </Badge>
          <Badge variant="secondary" className="px-3 py-1">
            <Zap className="h-3 w-3 mr-1" />
            Real-time
          </Badge>
        </div>
      </div>

      {/* Chat Interface */}
      <Card className="h-[75vh] border-2">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Chat with AI Agent</CardTitle>
          <CardDescription>
            Your intelligent assistant is ready to help with product questions, inventory management, and more.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-full pb-6">
          <div className="h-full">
            <ChatInterface apiKey={process.env.NEXT_PUBLIC_SENSAY_API_KEY_SECRET} />
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">💬 Sample Questions</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="space-y-1">
              <li>• "Tell me about your capabilities"</li>
              <li>• "How can you help me?"</li>
              <li>• "What do you know about AI?"</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">⚡ Pro Tips</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="space-y-1">
              <li>• Be specific with your questions</li>
              <li>• Ask follow-up questions for clarity</li>
              <li>• Use natural language</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">🔒 Privacy</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="space-y-1">
              <li>• Your conversations are secure</li>
              <li>• Data is encrypted in transit</li>
              <li>• No data is stored permanently</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}