import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Key, Bot, Palette, Bell, ArrowRight } from 'lucide-react';
import EnvChecker from '@/components/EnvChecker';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-32">
        {/* Page Header */}
        <div className="text-center space-y-8 mb-16">
          {/* Badge */}
          <div className="inline-flex items-center rounded-full px-4 py-2 bg-blue-500/10 backdrop-blur border border-blue-500/20">
            <Badge variant="secondary" className="bg-transparent border-0 text-blue-300 px-0">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              Configuration
            </Badge>
            <span className="ml-2 text-sm text-gray-300">
              Customize Your AI Experience
            </span>
            <ArrowRight className="ml-2 h-4 w-4 text-gray-400" />
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            AI Agent
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Settings
            </span>
          </h1>

          {/* Description */}
          <p className="mx-auto max-w-3xl text-lg leading-8 text-gray-300">
            Configure your AI agent, manage API keys, and customize your experience.
            Fine-tune your intelligent shopping assistant for optimal performance.
          </p>
        </div>

        {/* Settings Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">

          {/* API Configuration */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 rounded-3xl p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Key className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">API Configuration</h3>
                <p className="text-gray-400 text-sm">Manage your Sensay API keys and connection settings</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
                <EnvChecker />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">API Status</span>
                <Badge className="bg-green-500/20 border-green-500/30 text-green-400">
                  Connected
                </Badge>
              </div>
              <div className="text-xs text-gray-400">
                Your Sensay API key is configured and working properly.
              </div>
            </div>
          </div>

          {/* AI Agent Settings */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 rounded-3xl p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Bot className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">AI Agent Settings</h3>
                <p className="text-gray-400 text-sm">Customize your AI agent&apos;s behavior and personality</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">AI Model</span>
                <Badge className="bg-slate-800 border-slate-600 text-gray-300">Claude-3.7-Sonnet</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Memory Mode</span>
                <Badge className="bg-slate-800 border-slate-600 text-gray-300">RAG Search</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Response Style</span>
                <Badge className="bg-slate-800 border-slate-600 text-gray-300">Professional</Badge>
              </div>
            </div>
          </div>

          {/* Theme Settings */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 rounded-3xl p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                <Palette className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Appearance</h3>
                <p className="text-gray-400 text-sm">Customize the look and feel of your application</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Theme</span>
                <Badge className="bg-slate-800 border-slate-600 text-gray-300">Dark Mode</Badge>
              </div>
              <div className="text-xs text-gray-400">
                Experience the modern dark theme optimized for extended use and reduced eye strain.
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-slate-700 rounded-3xl p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <Bell className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Notifications</h3>
                <p className="text-gray-400 text-sm">Manage your notification preferences</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Sync Notifications</span>
                <Badge className="bg-green-500/20 border-green-500/30 text-green-400">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Error Alerts</span>
                <Badge className="bg-green-500/20 border-green-500/30 text-green-400">Enabled</Badge>
              </div>
              <div className="text-xs text-gray-400">
                Get notified when important events occur with your stores and AI agent.
              </div>
            </div>
          </div>

        </div>

        {/* System Information */}
        <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur border border-slate-700 rounded-3xl p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">System Information</h3>
            <p className="text-gray-400">
              Current system status and configuration details
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-400">Version</div>
              <div className="text-xl font-bold text-white">v1.0.0</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-400">Environment</div>
              <div className="text-xl font-bold text-white">Development</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-400">API Version</div>
              <div className="text-xl font-bold text-white">2025-03-25</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-400">Status</div>
              <Badge className="bg-green-500/20 border-green-500/30 text-green-400 px-4 py-2">
                Operational
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}