"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Store, BarChart3, Zap, Brain, Shield } from "lucide-react"

const features = [
  {
    icon: MessageSquare,
    title: "Intelligent Chat Interface",
    description: "Natural language conversations with your Shopify data. Ask about products, inventory, and sales instantly.",
    badge: "Live Chat"
  },
  {
    icon: Store,
    title: "Seamless Store Integration",
    description: "Connect your Shopify store in seconds. Automatic product sync and real-time inventory updates.",
    badge: "One-Click Setup"
  },
  {
    icon: Brain,
    title: "Multi-Model AI Support",
    description: "Choose from 20+ AI models including GPT-4o, Claude-3.5, and Grok-3 for different use cases.",
    badge: "Advanced AI"
  },
  {
    icon: BarChart3,
    title: "Smart Analytics",
    description: "Get insights on product performance, customer queries, and optimization recommendations.",
    badge: "Data Insights"
  },
  {
    icon: Zap,
    title: "Lightning Fast Responses",
    description: "Sub-second response times with intelligent caching and optimized knowledge retrieval.",
    badge: "High Performance"
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-level security with encrypted data, secure API connections, and compliance standards.",
    badge: "Secure"
  }
]

export function FeaturesSection() {
  return (
    <div className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need to manage your store
          </h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            Powerful AI agent capabilities designed for modern e-commerce businesses
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} className="relative group hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-semibold leading-6">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-7">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}