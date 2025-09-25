'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, Sparkles, Zap, TrendingUp, Bot, Store, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SyncSuccessCelebrationProps {
  productCount: number;
  storeName: string;
  knowledgeBaseId?: number;
  onGetStarted?: () => void;
}

const SyncSuccessCelebration: React.FC<SyncSuccessCelebrationProps> = ({
  productCount,
  storeName,
  knowledgeBaseId,
  onGetStarted
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  // Celebration animation steps
  const celebrationSteps = [
    { icon: CheckCircle, text: "Store Connected!", color: "text-green-400", delay: 0 },
    { icon: TrendingUp, text: `${productCount} Products Synced!`, color: "text-blue-400", delay: 600 },
    { icon: Bot, text: "AI Assistant Ready!", color: "text-purple-400", delay: 1200 },
    { icon: Sparkles, text: "Setup Complete!", color: "text-yellow-400", delay: 1800 }
  ];

  useEffect(() => {
    // Trigger confetti effect
    setShowConfetti(true);

    // Animate through celebration steps
    celebrationSteps.forEach((_, index) => {
      setTimeout(() => {
        setCurrentStep(index + 1);
      }, celebrationSteps[index].delay);
    });

    // Hide confetti after animation
    setTimeout(() => {
      setShowConfetti(false);
    }, 3000);
  }, []);

  return (
    <div className="relative bg-gradient-to-br from-green-500/10 via-blue-500/10 to-purple-500/10 border border-green-500/30 rounded-3xl p-12 text-center overflow-hidden">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-pink-400 rounded-full opacity-70 animate-bounce`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Main Success Icon */}
      <div className="relative mb-6">
        <div className="flex items-center justify-center w-24 h-24 mx-auto bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full border-2 border-green-500/30 mb-6">
          <CheckCircle className="w-12 h-12 text-green-400" />
        </div>

        {showConfetti && (
          <div className="absolute -top-2 -right-2">
            <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
          </div>
        )}
      </div>

      {/* Main Heading */}
      <h2 className="text-3xl font-bold text-white mb-2">
        🎉 Awesome! Your Store is Now AI-Powered!
      </h2>

      <p className="text-gray-300 text-lg max-w-md mx-auto mb-8">
        {storeName} is now connected with an intelligent AI assistant ready to help your customers.
      </p>

      {/* Celebration Steps Animation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {celebrationSteps.map((step, index) => {
          const Icon = step.icon;
          const isVisible = currentStep > index;

          return (
            <div
              key={index}
              className={`transform transition-all duration-500 ${
                isVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-30'
              }`}
            >
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <Icon className={`w-6 h-6 mx-auto mb-2 ${step.color}`} />
                <p className="text-sm text-white font-medium">{step.text}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats Display */}
      <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Store className="w-5 h-5 text-blue-400" />
              <span className="text-blue-300 font-medium">Store</span>
            </div>
            <p className="text-white font-semibold">{storeName}</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-green-300 font-medium">Products</span>
            </div>
            <p className="text-white font-semibold">{productCount.toLocaleString()}</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Bot className="w-5 h-5 text-purple-400" />
              <span className="text-purple-300 font-medium">AI Knowledge</span>
            </div>
            <p className="text-white font-semibold">Ready</p>
          </div>
        </div>
      </div>

      {/* What's Next Section */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 mb-8">
        <h3 className="text-white font-semibold mb-4 flex items-center justify-center space-x-2">
          <Zap className="w-5 h-5 text-blue-400" />
          <span>What&apos;s Available Now</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div className="space-y-2">
            <h4 className="text-blue-300 font-medium">💬 Conversation Mode</h4>
            <ul className="space-y-1 text-sm text-gray-300">
              <li>• Ask questions about products</li>
              <li>• Get inventory information</li>
              <li>• Product recommendations</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-green-300 font-medium">⚡ Action Mode</h4>
            <ul className="space-y-1 text-sm text-gray-300">
              <li>• Update product prices</li>
              <li>• Manage inventory levels</li>
              <li>• Create/modify products</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={onGetStarted}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 font-medium"
        >
          <Bot className="w-4 h-4 mr-2" />
          Start Chatting with AI
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        <Button
          variant="outline"
          className="border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white px-8 py-3"
        >
          <Store className="w-4 h-4 mr-2" />
          Manage Store
        </Button>
      </div>

      {/* Additional Info */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          Your AI assistant is powered by Sensay AI with real-time knowledge of your inventory.
        </p>
        {knowledgeBaseId && (
          <p className="text-xs text-gray-600 mt-1">
            Knowledge Base ID: {knowledgeBaseId}
          </p>
        )}
      </div>
    </div>
  );
};

export default SyncSuccessCelebration;