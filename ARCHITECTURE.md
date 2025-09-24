# 🏗️ **Segmante System Architecture**

*Comprehensive architectural overview of the Segmante Shopify AI Agent system*

---

## 🎯 **Architecture Overview**

Segmante is built on a modern, scalable architecture that seamlessly integrates Shopify stores with advanced AI capabilities through the Sensay platform. The system follows a microservices-inspired approach with clear separation of concerns.

```mermaid
graph TB
    subgraph "Client Layer"
        UI[React UI Components]
        Form[Shopify Connection Form]
        Chat[Chat Interface]
        Dashboard[Product Dashboard]
    end

    subgraph "Next.js Application"
        Pages[App Router Pages]
        API[API Routes Layer]
        Components[Reusable Components]
    end

    subgraph "Business Logic"
        ShopifyClient[Shopify Client]
        SensayIntegration[Sensay Integration]
        ProductSync[Product Sync Service]
        ReplicaManager[Replica Manager]
    end

    subgraph "External APIs"
        ShopifyAPI[Shopify Admin API]
        SensayAPI[Sensay AI Platform]
    end

    subgraph "Data Storage"
        KnowledgeBase[AI Knowledge Base]
        Vectors[Product Vectors]
        RAG[RAG Search Engine]
    end

    UI --> Pages
    Form --> API
    Chat --> API
    Dashboard --> API

    Pages --> Components
    API --> ShopifyClient
    API --> SensayIntegration
    API --> ProductSync
    API --> ReplicaManager

    ShopifyClient --> ShopifyAPI
    SensayIntegration --> SensayAPI
    ProductSync --> SensayAPI
    ReplicaManager --> SensayAPI

    SensayAPI --> KnowledgeBase
    KnowledgeBase --> Vectors
    Vectors --> RAG
    RAG --> Chat
```

---

## 🔄 **Data Flow Architecture**

### **1. Store Connection Flow**

```mermaid
sequenceDiagram
    participant User
    participant UI as Connection Form
    participant API as Next.js API Route
    participant SC as Shopify Client
    participant SA as Shopify Admin API

    User->>UI: Enter store domain & token
    UI->>API: POST /api/shopify/test-connection
    API->>SC: Initialize ShopifyClient
    SC->>SA: GET /admin/api/2023-10/shop.json
    SA-->>SC: Store information
    SC-->>API: Connection status
    API-->>UI: Connection result
    UI-->>User: Success/Error feedback
```

### **2. Product Synchronization Flow**

```mermaid
sequenceDiagram
    participant User
    participant UI as Dashboard
    participant API as Sync API Route
    participant SC as Shopify Client
    participant PS as Product Sync Service
    participant RM as Replica Manager
    participant SA as Sensay AI API
    participant KB as Knowledge Base

    User->>UI: Click "Sync Products"
    UI->>API: POST /api/shopify/sync-products
    API->>SC: Initialize connection
    SC->>SC: Fetch all products with pagination
    SC->>SC: Process product data
    API->>RM: Initialize replica session
    RM->>SA: Create/get user & replica
    SA-->>RM: Replica UUID & session
    API->>PS: Initialize sync service
    PS->>SA: Create knowledge base entry
    SA-->>PS: Knowledge base ID
    PS->>SA: Upload formatted product data
    SA->>KB: Process & vectorize data
    KB-->>SA: Processing status
    SA-->>PS: Upload confirmation
    PS-->>API: Sync results
    API-->>UI: Success with product count
    UI-->>User: Sync complete notification
```

### **3. AI Chat Interaction Flow**

```mermaid
sequenceDiagram
    participant User
    participant Chat as Chat Interface
    participant API as Chat API
    participant SA as Sensay AI API
    participant KB as Knowledge Base
    participant RAG as RAG Engine

    User->>Chat: Type product question
    Chat->>API: Send message with replica UUID
    API->>SA: POST /v1/replicas/{uuid}/chat/completions
    SA->>RAG: Query product knowledge base
    RAG->>KB: Search relevant product vectors
    KB-->>RAG: Matching product data
    RAG-->>SA: Contextualized information
    SA->>SA: Generate AI response
    SA-->>API: Chat completion response
    API-->>Chat: AI assistant reply
    Chat-->>User: Display intelligent answer
```

---

## 🏛️ **System Components**

### **Frontend Layer**

```mermaid
graph LR
    subgraph "UI Components"
        A[Floating Header]
        B[Theme Toggle]
        C[Navigation Menu]
    end

    subgraph "Page Components"
        D[Landing Page]
        E[Dashboard]
        F[Stores Page]
        G[Chat Interface]
        H[Settings]
    end

    subgraph "Shopify Components"
        I[Connection Form]
        J[Store Card]
        K[Sync Progress]
        L[Product Stats]
    end

    A --> D
    A --> E
    A --> F
    A --> G
    A --> H

    F --> I
    F --> J
    E --> L
    I --> K
```

### **Backend Services**

```mermaid
graph TB
    subgraph "API Routes"
        A[/api/shopify/test-connection]
        B[/api/shopify/sync-products]
    end

    subgraph "Core Services"
        C[ShopifyClient]
        D[ProductSyncService]
        E[ReplicaManager]
    end

    subgraph "Utilities"
        F[Data Processing]
        G[Error Handling]
        H[Progress Tracking]
    end

    A --> C
    B --> C
    B --> D
    B --> E

    C --> F
    D --> G
    E --> H
```

---

## 🔗 **Integration Patterns**

### **1. Shopify Integration**

**Connection Pattern:**
- Uses Admin API with access token authentication
- Implements proper error handling for common issues (401, 403, 404)
- Supports pagination for large product catalogs
- Handles rate limiting gracefully

**Data Processing Pattern:**
```typescript
// Product data transformation pipeline
ShopifyProduct → ProcessedProduct → FormattedKnowledgeBase → AIVectors
```

### **2. Sensay AI Integration**

**Session Management Pattern:**
```mermaid
graph LR
    A[Check User Exists] --> B[Create User if Needed]
    B --> C[List User Replicas]
    C --> D[Find/Create Target Replica]
    D --> E[Return Session Context]
```

**Knowledge Base Pattern:**
```mermaid
graph LR
    A[Create Training Entry] --> B[Upload Product Data]
    B --> C[Process & Vectorize]
    C --> D[Enable RAG Search]
```

---

## 🔒 **Security Architecture**

### **Authentication & Authorization**

```mermaid
graph TB
    subgraph "Client Side"
        A[Environment Variables]
        B[API Key Storage]
    end

    subgraph "Server Side"
        C[API Route Protection]
        D[Token Validation]
        E[CORS Configuration]
    end

    subgraph "External APIs"
        F[Shopify Admin API]
        G[Sensay AI Platform]
    end

    A --> C
    B --> D
    C --> E
    D --> F
    D --> G
```

**Security Measures:**
- 🔐 Environment-based API key management
- 🛡️ Server-side API calls to prevent CORS issues
- 🔒 No sensitive data stored client-side
- ✅ Input validation with Zod schemas
- 🚫 Rate limiting and error handling

---

## 📊 **Data Models**

### **Shopify Product Model**

```mermaid
erDiagram
    PRODUCT {
        string id PK
        string title
        string description
        string vendor
        string product_type
        string[] tags
        datetime created_at
        datetime updated_at
    }

    VARIANT {
        string id PK
        string product_id FK
        string title
        decimal price
        decimal compare_at_price
        string sku
        integer inventory_quantity
        string option1
        string option2
        string option3
    }

    INVENTORY {
        integer available
        boolean tracked
    }

    PRODUCT ||--o{ VARIANT : has
    PRODUCT ||--|| INVENTORY : tracks
```

### **Processed Data Model**

```mermaid
erDiagram
    PROCESSED_PRODUCT {
        string id PK
        string title
        string description
        decimal price
        string sku
        string vendor
        string product_type
        string[] tags
        datetime created_at
        datetime updated_at
    }

    PROCESSED_VARIANT {
        string id PK
        string product_id FK
        string title
        decimal price
        string sku
        integer inventory
        object options
    }

    KNOWLEDGE_BASE_ENTRY {
        integer id PK
        string replica_uuid FK
        text raw_text
        string status
        datetime created_at
    }

    PROCESSED_PRODUCT ||--o{ PROCESSED_VARIANT : has
    PROCESSED_PRODUCT ||--|| KNOWLEDGE_BASE_ENTRY : generates
```

---

## 🚀 **Scalability Considerations**

### **Performance Optimizations**

```mermaid
graph TB
    subgraph "Frontend Optimizations"
        A[Component Lazy Loading]
        B[React Suspense]
        C[Optimistic UI Updates]
    end

    subgraph "Backend Optimizations"
        D[Shopify Pagination]
        E[Batch Processing]
        F[Error Recovery]
    end

    subgraph "AI Optimizations"
        G[Knowledge Base Caching]
        H[Vector Search Optimization]
        I[Response Streaming]
    end

    A --> D
    B --> E
    C --> F
    D --> G
    E --> H
    F --> I
```

### **Scalability Patterns**

1. **Horizontal Scaling**
   - Stateless API routes
   - External service dependencies
   - Session management via Sensay

2. **Data Handling**
   - Streaming for large datasets
   - Pagination for product lists
   - Progressive loading UI

3. **Error Resilience**
   - Graceful degradation
   - Retry mechanisms
   - User feedback systems

---

## 🔄 **Deployment Architecture**

### **Development Environment**

```mermaid
graph LR
    subgraph "Local Development"
        A[Next.js Dev Server]
        B[Hot Reloading]
        C[TypeScript Compiler]
    end

    subgraph "External Services"
        D[Shopify Store]
        E[Sensay AI API]
    end

    A --> D
    A --> E
    B --> A
    C --> A
```

### **Production Deployment**

```mermaid
graph TB
    subgraph "Build Process"
        A[npm run build]
        B[TypeScript Compilation]
        C[Static Generation]
    end

    subgraph "Deployment Target"
        D[Vercel/Netlify]
        E[Docker Container]
        F[Custom Server]
    end

    subgraph "Environment Config"
        G[Production Env Vars]
        H[API Keys]
        I[Domain Configuration]
    end

    A --> B
    B --> C
    C --> D
    C --> E
    C --> F
    G --> D
    H --> D
    I --> D
```

---

## 📈 **Monitoring & Analytics**

### **System Health Monitoring**

```mermaid
graph TB
    subgraph "Application Metrics"
        A[API Response Times]
        B[Error Rates]
        C[User Interactions]
    end

    subgraph "External API Monitoring"
        D[Shopify API Health]
        E[Sensay API Performance]
        F[Rate Limit Tracking]
    end

    subgraph "Business Metrics"
        G[Store Connections]
        H[Product Sync Success]
        I[Chat Interactions]
    end

    A --> D
    B --> E
    C --> F
    D --> G
    E --> H
    F --> I
```

### **Logging Strategy**

- 📋 **Request/Response Logging**: API interactions
- 🐛 **Error Tracking**: Comprehensive error capture
- 📊 **Performance Metrics**: Response times and success rates
- 👤 **User Analytics**: Feature usage and engagement

---

## 🔮 **Future Architecture Enhancements**

### **Planned Improvements**

```mermaid
graph TB
    subgraph "Phase 2: Multi-tenant"
        A[User Authentication]
        B[Team Management]
        C[Store Permissions]
    end

    subgraph "Phase 3: Advanced AI"
        D[Custom Training]
        E[Personalization]
        F[Analytics Dashboard]
    end

    subgraph "Phase 4: Enterprise"
        G[Webhooks Support]
        H[Real-time Sync]
        I[Advanced Security]
    end

    A --> D
    B --> E
    C --> F
    D --> G
    E --> H
    F --> I
```

### **Technical Roadmap**

1. **Authentication System**
   - User accounts and sessions
   - Multi-store management per user
   - Role-based access control

2. **Real-time Features**
   - Shopify webhooks integration
   - Live inventory updates
   - Real-time chat notifications

3. **Advanced Analytics**
   - Customer interaction insights
   - Product performance metrics
   - AI conversation analytics

4. **Enterprise Features**
   - White-label solutions
   - Advanced security controls
   - Custom AI model training

---

*This architecture document provides a comprehensive overview of the current system implementation and future scalability considerations. For implementation details, see the [API Documentation](./API.md).*