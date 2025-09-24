"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Bot, Store, Zap } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  return (
    <div className="relative">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-3xl" />

      <div className="px-6 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
            <Bot className="mr-2 h-4 w-4" />
            AI-Powered Shopify Management
          </Badge>

          {/* Main heading */}
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Next-Gen
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              AI Agent Shopify App
            </span>
          </h1>

          {/* Description */}
          <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-3xl mx-auto">
            Revolutionize your e-commerce with intelligent AI agents. Choose from{" "}
            <span className="font-semibold text-primary">20+ AI models</span> including{" "}
            <span className="font-semibold text-primary">GPT-4o, Claude-3.5-Haiku, Gemini-2.5-Flash, Grok-3</span>{" "}
            and more to transform customer experiences.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/chat">
              <Button size="lg" className="px-8 py-3 text-lg font-medium">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="px-8 py-3 text-lg font-medium">
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">10K+</div>
              <div className="text-sm text-muted-foreground font-medium">Active Stores</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">50M+</div>
              <div className="text-sm text-muted-foreground font-medium">AI Interactions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">99.9%</div>
              <div className="text-sm text-muted-foreground font-medium">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground font-medium">AI Support</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}