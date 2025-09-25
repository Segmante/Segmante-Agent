"use client"

import { Timeline } from "@/components/ui/timeline"
import Image from "next/image"
import { MessageSquare } from "lucide-react"

export function UsageTimeline() {
  const data = [
    {
      title: "Connect Your Shopify Store",
      content: (
        <div>
          {/* Screenshot Placeholder */}
          <div className="mb-8 rounded-lg overflow-hidden border border-slate-700">
            <Image
              src="/screenshot.png"
              alt="Connect Shopify Store Step"
              width={600}
              height={400}
              className="w-full h-auto"
            />
          </div>
          <p className="text-gray-300 text-sm md:text-sm font-normal mb-8">
            Enter your Shopify domain and private app token to securely connect your store.
            Our system will automatically sync your products, inventory, and customer data.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
              <Image
                src="/screenshot.png"
                alt="Store Data - Products, variants, inventory"
                width={300}
                height={200}
                className="w-full h-auto"
              />
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
              <Image
                src="/screenshot.png"
                alt="Secure Setup - Private app token authentication"
                width={300}
                height={200}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "AI Knowledge Base Creation",
      content: (
        <div>
          {/* Screenshot Placeholder */}
          <div className="mb-8 rounded-lg overflow-hidden border border-slate-700">
            <Image
              src="/screenshot.png"
              alt="AI Knowledge Base Creation Step"
              width={600}
              height={400}
              className="w-full h-auto"
            />
          </div>
          <p className="text-gray-300 text-sm md:text-sm font-normal mb-8">
            Our AI analyzes your product catalog and creates an intelligent knowledge base.
            Every product detail, description, and variant is vectorized for instant retrieval.
          </p>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
            <Image
              src="/screenshot.png"
              alt="AI Processing - Products analyzed: 1,247, Variants processed: 3,891, Knowledge vectors: 15,682"
              width={500}
              height={300}
              className="w-full h-auto"
            />
          </div>
        </div>
      ),
    },
    {
      title: "Launch AI Assistant",
      content: (
        <div>
          {/* Screenshot Placeholder */}
          <div className="mb-8 rounded-lg overflow-hidden border border-slate-700">
            <Image
              src="/screenshot.png"
              alt="Launch AI Assistant Step"
              width={600}
              height={400}
              className="w-full h-auto"
            />
          </div>
          <p className="text-gray-300 text-sm md:text-sm font-normal mb-8">
            Your intelligent product assistant is ready! Customers can now ask questions
            about your products and get instant, accurate responses powered by AI.
          </p>
          <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="bg-slate-700/50 rounded-lg p-3 mb-3">
                  <p className="text-gray-300 text-sm">
                    "Do you have any waterproof jackets in size large?"
                  </p>
                </div>
                <div className="bg-blue-600/20 rounded-lg p-3">
                  <p className="text-blue-200 text-sm">
                    "Yes! We have 3 waterproof jackets in large: the Alpine Pro (₹4,999),
                    Trail Master (₹6,499), and Summit Explorer (₹8,999). All feature
                    10,000mm waterproofing and breathable fabric. Would you like more details about any of these?"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Monitor & Optimize",
      content: (
        <div>
          {/* Screenshot Placeholder */}
          <div className="mb-8 rounded-lg overflow-hidden border border-slate-700">
            <Image
              src="/screenshot.png"
              alt="Monitor & Optimize Step"
              width={600}
              height={400}
              className="w-full h-auto"
            />
          </div>
          <p className="text-gray-300 text-sm md:text-sm font-normal mb-8">
            Track performance metrics, customer satisfaction, and conversion rates.
            Continuously improve your AI assistant with analytics and insights.
          </p>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
            <Image
              src="/screenshot.png"
              alt="Analytics Dashboard - 34% Conversion Increase, 2.1K Daily Interactions, 97% Satisfaction Rate"
              width={600}
              height={300}
              className="w-full h-auto"
            />
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="w-full bg-slate-900">
      <div className="max-w-4xl mx-auto py-20 px-4">
        <div className="text-center mb-16">
          <div className="text-sm font-medium text-blue-400 mb-4">[ HOW IT WORKS ]</div>
          <h2 className="text-4xl font-bold text-white mb-6">
            From Store to AI Assistant
            <br />
            <span className="text-3xl font-normal text-gray-300">in 4 Simple Steps</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Transform your Shopify store into an intelligent commerce experience
            with our AI-powered product assistant
          </p>
        </div>
        <Timeline data={data} />
      </div>
    </div>
  )
}