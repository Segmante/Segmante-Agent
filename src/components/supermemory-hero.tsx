"use client"

import { Button } from "@/components/ui/button"
import { Cover } from "@/components/ui/cover"
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Bot, Store, Zap, ShoppingCart, Users, TrendingUp } from "lucide-react"
import Link from "next/link"

export function SuperMemoryHero() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      {/* Content */}
      <div className="relative z-10 px-6 py-32 sm:py-40 lg:py-48">
        <div className="mx-auto max-w-6xl text-center">
          {/* Update Badge */}
          <div className="mb-8 inline-flex items-center rounded-full px-4 py-2 bg-blue-500/10 backdrop-blur border border-blue-500/20">
            <Badge variant="secondary" className="bg-transparent border-0 text-blue-300 px-0">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              New
            </Badge>
            <span className="ml-2 text-sm text-gray-300">
              AI-Powered Shopify Assistant with 20+ AI Models
            </span>
            <ArrowRight className="ml-2 h-4 w-4 text-gray-400" />
          </div>

          {/* Main heading with Cover effect */}
          <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl lg:text-8xl mb-8">
            Next-Gen <Cover>AI Agent</Cover> for Shopify.
          </h1>

          {/* Description */}
          <p className="mx-auto max-w-3xl text-lg leading-8 text-gray-300 mb-12">
            Transform your Shopify store with intelligent AI agents. Choose from 20+ AI models
            including GPT-4o, Claude-3.5-Haiku, Gemini-2.5-Flash, and Grok-3 to create
            personalized shopping experiences that boost conversion rates.
          </p>

          {/* Two column cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
            {/* Left Card - Blue */}
            <div className="relative p-8 rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 overflow-hidden">
              <div className="relative z-10 text-left">
                <div className="text-sm font-medium text-blue-100 mb-2">
                  SEGMANTE AGENT • SHOPIFY INTEGRATION
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Connect your store
                  <br />
                  in minutes
                </h3>
                <div className="flex space-x-4">
                  <HoverBorderGradient
                    containerClassName="rounded-lg"
                    className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-2 font-medium"
                  >
                    Connect Store →
                  </HoverBorderGradient>
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    View Demo
                  </Button>
                </div>
              </div>
              {/* Store icon illustration */}
              <div className="absolute top-4 right-4 w-32 h-32 opacity-30">
                <div className="w-full h-full bg-blue-400/20 rounded-lg flex items-center justify-center">
                  <Store className="w-16 h-16 text-blue-200" />
                </div>
              </div>
            </div>

            {/* Right Card - Purple */}
            <div className="relative p-8 rounded-3xl bg-gradient-to-br from-purple-600 to-purple-700 overflow-hidden">
              <div className="relative z-10 text-left">
                <div className="text-sm font-medium text-purple-100 mb-2">
                  AI CHAT ASSISTANT • POWERED BY SENSAY
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Smart customer service
                  <br />
                  with AI agents
                </h3>
                <div className="flex space-x-4">
                  <HoverBorderGradient
                    containerClassName="rounded-lg"
                    className="bg-white text-purple-600 hover:bg-purple-50 px-6 py-2 font-medium"
                  >
                    Try Chat →
                  </HoverBorderGradient>
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    See Models
                  </Button>
                </div>
              </div>
              {/* AI Bot illustration */}
              <div className="absolute top-4 right-4 w-32 h-32 opacity-30">
                <div className="w-full h-full bg-purple-400/20 rounded-lg flex items-center justify-center rotate-12">
                  <Bot className="w-16 h-16 text-purple-200" />
                </div>
              </div>
            </div>
          </div>

          {/* Developer Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-5xl mx-auto">
            <div className="text-left">
              <div className="text-sm font-medium text-blue-400 mb-4">[ FOR E-COMMERCE ]</div>
              <h2 className="text-3xl font-bold text-white mb-6">
                Intelligent Product
                <br />
                Assistant & Analytics
              </h2>
              <ul className="space-y-4 text-gray-300 mb-8">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-3 mr-3 flex-shrink-0"></div>
                  Real-time product sync with your Shopify store
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-3 mr-3 flex-shrink-0"></div>
                  Natural language product recommendations
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-3 mr-3 flex-shrink-0"></div>
                  Boost conversions with personalized experiences
                </li>
              </ul>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Connect Store →
              </Button>
            </div>

            {/* API Illustration */}
            <div className="relative">
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-medium">
                      Query
                    </div>
                  </div>
                  <div className="h-px bg-slate-600"></div>
                  <div className="w-16 h-16 bg-slate-700 rounded-xl flex items-center justify-center mx-auto">
                    <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                      <span className="text-black font-bold text-sm">S</span>
                    </div>
                  </div>
                  <div className="h-px bg-slate-600"></div>
                  <div className="flex items-center justify-between">
                    <div className="bg-green-500 text-white px-3 py-1 rounded text-sm font-medium">
                      Answer
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}