// Shopify API Types
export interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  template_suffix: string | null;
  published_scope: string;
  tags: string;
  status: string;
  admin_graphql_api_id: string;
  variants: ShopifyVariant[];
  options: ShopifyOption[];
  images: ShopifyImage[];
}

export interface ShopifyVariant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  sku: string;
  position: number;
  inventory_policy: string;
  compare_at_price: string | null;
  fulfillment_service: string;
  inventory_management: string | null;
  option1: string;
  option2: string | null;
  option3: string | null;
  created_at: string;
  updated_at: string;
  taxable: boolean;
  barcode: string;
  grams: number;
  weight: number;
  weight_unit: string;
  inventory_item_id: number;
  inventory_quantity: number;
  old_inventory_quantity: number;
  requires_shipping: boolean;
  admin_graphql_api_id: string;
}

export interface ShopifyOption {
  id: number;
  product_id: number;
  name: string;
  position: number;
  values: string[];
}

export interface ShopifyImage {
  id: number;
  product_id: number;
  position: number;
  created_at: string;
  updated_at: string;
  alt: string | null;
  width: number;
  height: number;
  src: string;
  variant_ids: number[];
  admin_graphql_api_id: string;
}

export interface ShopifyInventoryLevel {
  inventory_item_id: number;
  location_id: number;
  available: number;
  updated_at: string;
}

export interface ShopifyProductsResponse {
  products: ShopifyProduct[];
}

export interface ShopifyInventoryResponse {
  inventory_levels: ShopifyInventoryLevel[];
}

// Configuration Types
export interface ShopifyConfig {
  domain: string;
  accessToken: string;
  apiVersion?: string;
}

export interface ShopifyConnectionStatus {
  connected: boolean;
  domain?: string;
  lastSync?: string;
  productCount?: number;
  error?: string;
}

// Processed Product Data for Knowledge Base
export interface ProcessedProductData {
  id: string;
  title: string;
  description: string;
  price: string;
  compareAtPrice?: string;
  sku: string;
  vendor: string;
  productType: string;
  tags: string[];
  variants: ProcessedVariant[];
  images: string[];
  inventory: {
    available: number;
    tracked: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProcessedVariant {
  id: string;
  title: string;
  price: string;
  compareAtPrice?: string;
  sku: string;
  inventory: number;
  weight: number;
  weightUnit: string;
  options: Record<string, string>;
}