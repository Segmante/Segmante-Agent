import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Key, Bot, Palette, Bell } from 'lucide-react';
import EnvChecker from '@/components/EnvChecker';

export default function SettingsPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Configure your AI agent, manage API keys, and customize your experience.
        </p>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* API Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Key className="h-5 w-5 text-primary" />
              <CardTitle>API Configuration</CardTitle>
            </div>
            <CardDescription>
              Manage your Sensay API keys and connection settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <EnvChecker />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">API Status</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                Connected
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Your Sensay API key is configured and working properly.
            </div>
          </CardContent>
        </Card>

        {/* AI Agent Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-primary" />
              <CardTitle>AI Agent Settings</CardTitle>
            </div>
            <CardDescription>
              Customize your AI agent's behavior and personality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">AI Model</span>
              <Badge variant="outline">Claude-3.7-Sonnet</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Memory Mode</span>
              <Badge variant="outline">RAG Search</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Response Style</span>
              <Badge variant="outline">Professional</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Palette className="h-5 w-5 text-primary" />
              <CardTitle>Appearance</CardTitle>
            </div>
            <CardDescription>
              Customize the look and feel of your application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Theme</span>
              <Badge variant="outline">System</Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Automatically switch between light and dark mode based on your system preferences.
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>
              Manage your notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Sync Notifications</span>
              <Badge variant="outline">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Error Alerts</span>
              <Badge variant="outline">Enabled</Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Get notified when important events occur with your stores and AI agent.
            </div>
          </CardContent>
        </Card>

      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>
            Current system status and configuration details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium text-muted-foreground">Version</div>
              <div>v1.0.0</div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">Environment</div>
              <div>Development</div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">API Version</div>
              <div>2025-03-25</div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">Status</div>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                Operational
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}