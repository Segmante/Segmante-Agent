# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core Commands

### Development
```bash
# Start the development server on http://localhost:3000
npm run dev

# Build the application for production
npm run build

# Start the production server
npm run start

# Run linting
npm run lint

# Generate/update Sensay API SDK from OpenAPI schema
npm run generate-sdk
```

## Project Architecture

This is Segmante, a Shopify AI Agent built with Next.js that integrates Shopify stores with Sensay AI platform to create intelligent product assistants.

### Key Components

1. **Shopify Integration**:
   - `src/lib/shopify/client.ts`: Shopify Admin API client
   - `src/components/shopify/connection-form.tsx`: Store connection UI
   - `src/app/api/shopify/`: Server-side API routes for CORS resolution

2. **AI Intelligence**:
   - `src/lib/sensay/product-sync.ts`: Product data synchronization service
   - `src/lib/sensay/replica-manager.ts`: AI replica session management
   - `src/components/ChatInterface.tsx`: Intelligent chat interface

3. **Modern UI/UX**:
   - `src/components/floating-header.tsx`: Professional navigation
   - `src/app/(dashboard)/`: Dashboard, stores, chat, and settings pages
   - Built with shadcn/ui components and Tailwind CSS

### Key Dependencies

- **Next.js**: React framework with App Router
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Axios**: HTTP client for API requests
- **React Syntax Highlighter**: For code highlighting in examples

### Authentication Flow

The application uses API key authentication to interact with the Sensay API:
- API keys can be provided via environment variable (`SENSAY_API_KEY_SECRET`)
- Or entered directly in the UI
- The client automatically creates or reuses a replica at runtime

### Data Flow

1. User inputs message in the chat interface
2. Application sends request to Sensay API using the SDK
3. For streaming responses, chunks are appended to the UI as they arrive
4. Chat history is managed in component state

## Project Architecture

This project implements a Shopify Product AI Agent using the Sensay platform. For comprehensive architectural details, implementation guidelines, and best practices, see:

**[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete system design and technical specifications

**[UI_RESTRUCTURE_PLAN.md](./UI_RESTRUCTURE_PLAN.md)** - Professional UI/UX design plan using shadcn/ui

## Environment Setup

The application requires:
- Node.js >= 18.17.0 (v20+ recommended)
- A Sensay AI API key for AI functionality
- Shopify store with Admin API access for product integration

Environment variables are set in `.env.local`:
```
NEXT_PUBLIC_SENSAY_API_KEY_SECRET=your_sensay_api_key_here
SHOPIFY_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_your_shopify_private_app_token_here
```

## Core Features

### 🛍️ Shopify Store Integration
- Connect any Shopify store using domain and private app token
- Real-time product synchronization with comprehensive data extraction
- Support for complex products with multiple variants and inventory tracking

### 🤖 AI-Powered Product Assistant
- Natural language conversations about products and inventory
- RAG-powered knowledge base with vectorized product information
- Context-aware responses with smart product recommendations

### 📊 Professional Dashboard
- Modern UI built with shadcn/ui components
- Real-time sync progress tracking with visual feedback
- Dark/light theme support with automatic detection