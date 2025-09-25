import { VerboseSensayAPI } from '@/api-debug';
import { API_VERSION } from '@/constants/auth';

export interface ReplicaInfo {
  uuid: string;
  name: string;
  shortDescription: string;
  greeting: string;
  type: 'individual' | 'character' | 'brand';
  ownerID: string;
  private: boolean;
  slug: string;
  tags: string[];
  profileImage?: string;
  suggestedQuestions?: string[];
  createdAt: string;
  llm: {
    model: string;
    memoryMode: string;
    systemMessage: string;
  };
}

export interface KnowledgeBaseInfo {
  id: number;
  replicaUuid: string;
  type: string;
  filename?: string;
  status: 'BLANK' | 'PROCESSING' | 'READY' | 'ERR_FILE_PROCESSING' | 'ERR_TEXT_PROCESSING' | 'ERR_TEXT_TO_VECTOR';
  rawTextPreview?: string;
  createdAt?: string;
  updatedAt?: string;
  productCount?: number;
}

export class ReplicaService {
  private sensayClient: VerboseSensayAPI;

  constructor(apiKey: string) {
    this.sensayClient = new VerboseSensayAPI({
      HEADERS: {
        'X-ORGANIZATION-SECRET': apiKey
      }
    });
  }

  /**
   * Get all replicas for the current organization
   */
  async getAllReplicas(): Promise<ReplicaInfo[]> {
    try {
      const response = await this.sensayClient.replicas.getV1Replicas();

      if (!response.success || !response.items) {
        return [];
      }

      return response.items.map(item => ({
        uuid: item.uuid,
        name: item.name,
        shortDescription: item.shortDescription,
        greeting: item.greeting,
        type: item.type || 'character',
        ownerID: item.ownerID,
        private: item.private || false,
        slug: item.slug,
        tags: item.tags || [],
        profileImage: item.profileImage,
        suggestedQuestions: item.suggestedQuestions,
        createdAt: item.created_at || '',
        llm: {
          model: item.llm?.model || 'unknown',
          memoryMode: item.llm?.memoryMode || 'unknown',
          systemMessage: item.llm?.systemMessage || ''
        }
      }));
    } catch (error) {
      console.error('Error fetching replicas:', error);
      return [];
    }
  }

  /**
   * Get replicas filtered by tags (e.g., Shopify replicas)
   */
  async getShopifyReplicas(): Promise<ReplicaInfo[]> {
    const allReplicas = await this.getAllReplicas();
    return allReplicas.filter(replica =>
      replica.tags.some(tag => tag.startsWith('shopify:'))
    );
  }

  /**
   * Get all knowledge bases across all replicas
   */
  async getAllKnowledgeBases(): Promise<KnowledgeBaseInfo[]> {
    try {
      const response = await this.sensayClient.training.getV1Training(
        undefined, // status filter
        'text',     // type filter
        '1',        // page
        '100',      // limit
        API_VERSION
      );

      if (!response.success || !response.items) {
        return [];
      }

      return response.items.map(item => ({
        id: item.id,
        replicaUuid: item.replica_uuid || '',
        type: item.type || 'text',
        filename: item.filename || undefined,
        status: item.status as any || 'BLANK',
        rawTextPreview: item.raw_text ?
          item.raw_text.substring(0, 200) + (item.raw_text.length > 200 ? '...' : '') :
          undefined,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        productCount: this.extractProductCount(item.raw_text || '')
      }));
    } catch (error) {
      console.error('Error fetching knowledge bases:', error);
      return [];
    }
  }

  /**
   * Get knowledge bases for a specific replica
   */
  async getReplicaKnowledgeBases(replicaUuid: string): Promise<KnowledgeBaseInfo[]> {
    const allKnowledgeBases = await this.getAllKnowledgeBases();
    return allKnowledgeBases.filter(kb => kb.replicaUuid === replicaUuid);
  }

  /**
   * Extract product count from knowledge base text
   */
  private extractProductCount(rawText?: string): number | undefined {
    if (!rawText) return undefined;

    // Look for "Total Products: X" pattern
    const totalProductsMatch = rawText.match(/Total Products:\s*(\d+)/i);
    if (totalProductsMatch) {
      return parseInt(totalProductsMatch[1], 10);
    }

    // Fallback: count product headings (## Product Name)
    const productHeadings = rawText.match(/^##\s+[^#]/gm);
    if (productHeadings) {
      // Subtract non-product headings like "## Product Information", etc.
      const nonProductHeadings = ['Product Information', 'How to Use This Information', 'AI Assistant Guidelines'];
      const productCount = productHeadings.filter(heading =>
        !nonProductHeadings.some(nonProduct => heading.includes(nonProduct))
      ).length;
      return productCount > 0 ? productCount : undefined;
    }

    return undefined;
  }

  /**
   * Get detailed replica info including knowledge bases
   */
  async getReplicaWithKnowledgeBases(replicaUuid: string): Promise<(ReplicaInfo & { knowledgeBases: KnowledgeBaseInfo[] }) | null> {
    const allReplicas = await this.getAllReplicas();
    const replica = allReplicas.find(r => r.uuid === replicaUuid);

    if (!replica) {
      return null;
    }

    const knowledgeBases = await this.getReplicaKnowledgeBases(replicaUuid);

    return {
      ...replica,
      knowledgeBases
    };
  }
}