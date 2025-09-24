"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, ArrowRight, Store, MessageSquare, Settings } from "lucide-react"
import Link from "next/link"

const steps = [
  {
    step: "01",
    icon: Store,
    title: "Connect Your Store",
    description: "Enter your Shopify store domain and API credentials. Our secure connection wizard guides you through the process.",
    action: "Connect Store",
    href: "/stores",
    completed: false
  },
  {
    step: "02",
    icon: MessageSquare,
    title: "Start Chatting",
    description: "Begin conversations with your AI agent. Ask about products, inventory, sales, or any store-related questions.",
    action: "Open Chat",
    href: "/chat",
    completed: true
  },
  {
    step: "03",
    icon: Settings,
    title: "Customize Agent",
    description: "Fine-tune your AI agent's personality, knowledge base, and response style to match your brand voice.",
    action: "Customize",
    href: "/settings",
    completed: false
  }
]

export function QuickStartSection() {
  return (
    <div className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Get started in minutes
          </h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            Three simple steps to transform your Shopify store with AI
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <Card key={index} className="relative group hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="font-mono text-xs px-2 py-1">
                      {step.step}
                    </Badge>
                    {step.completed && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg font-semibold">
                      {step.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-sm leading-6">
                    {step.description}
                  </CardDescription>
                  <Link href={step.href}>
                    <Button
                      variant={step.completed ? "default" : "outline"}
                      className="w-full group/button"
                    >
                      {step.action}
                      <ArrowRight className="ml-2 h-4 w-4 group-hover/button:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Sensay API configured and ready</span>
          </div>
        </div>
      </div>
    </div>
  )
}