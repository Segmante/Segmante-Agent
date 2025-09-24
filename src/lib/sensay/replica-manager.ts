import { VerboseSensayAPI } from '@/api-debug';
import { SAMPLE_USER_ID, SAMPLE_REPLICA_SLUG, API_VERSION } from '@/constants/auth';

interface ReplicaSession {
  replicaUuid: string;
  userId: string;
}

export class ReplicaManager {
  private sensayClient: VerboseSensayAPI;

  constructor(apiKey: string) {
    this.sensayClient = new VerboseSensayAPI({
      HEADERS: {
        'X-ORGANIZATION-SECRET': apiKey
      }
    });
  }

  /**
   * Initialize or get existing replica session
   * This mirrors the logic from ChatInterface
   */
  async initializeSession(): Promise<ReplicaSession> {
    console.log('--- INITIALIZING REPLICA SESSION ---');

    try {
      // Step 1: Check if the sample user exists (authenticate without X-USER-ID)
      console.log('Step 1: Checking if sample user exists...');
      const orgOnlyClient = new VerboseSensayAPI({
        HEADERS: {
          'X-ORGANIZATION-SECRET': process.env.NEXT_PUBLIC_SENSAY_API_KEY_SECRET
        }
      });

      let userExists = false;

      try {
        // Try to get the user
        console.log(`Attempting to get user with ID: ${SAMPLE_USER_ID}`);
        await orgOnlyClient.users.getV1Users(SAMPLE_USER_ID);
        userExists = true;
        console.log(`✅ User ${SAMPLE_USER_ID} exists`);
      } catch (error) {
        console.log(`❌ User ${SAMPLE_USER_ID} does not exist, will create it`);
        console.log('Get user error details:', error);
      }

      // Step 2: Create the user if it doesn't exist
      if (!userExists) {
        console.log('Step 2: Creating new user...');
        try {
          const newUser = await orgOnlyClient.users.postV1Users(API_VERSION, {
            id: SAMPLE_USER_ID,
            name: "Sample User"
          });
          console.log(`✅ Created user ${SAMPLE_USER_ID}:`, newUser);
        } catch (createUserError) {
          console.error('❌ Failed to create user:', createUserError);
          throw createUserError;
        }
      }

      // Step 3: Now use the user-authenticated client for further operations
      console.log('Step 3: Creating user-authenticated client...');
      const userClient = new VerboseSensayAPI({
        HEADERS: {
          'X-ORGANIZATION-SECRET': process.env.NEXT_PUBLIC_SENSAY_API_KEY_SECRET,
          'X-USER-ID': SAMPLE_USER_ID
        }
      });

      // Step 4: List all replicas for this user
      console.log('Step 4: Listing all replicas for user...');
      let replicas;
      try {
        replicas = await userClient.replicas.getV1Replicas();
        console.log('Replicas response:', replicas);
      } catch (listReplicasError) {
        console.error('❌ Failed to list replicas:', listReplicasError);
        throw listReplicasError;
      }

      // Check if we have a replica with our sample slug
      let uuid: string | undefined;
      if (replicas && replicas.items) {
        console.log('Looking for an existing replica');
        const sampleReplica = replicas.items[0];
        if (sampleReplica) {
          uuid = sampleReplica.uuid;
          console.log(`✅ Found existing replica: ${SAMPLE_REPLICA_SLUG} with UUID: ${uuid}`);
        } else {
          console.log('❌ No replica found');
        }
      } else {
        console.log('No replicas found or replicas.items is undefined');
      }

      // Step 5: Create a replica if it doesn't exist
      if (!uuid) {
        console.log('Step 5: Creating new replica...');
        try {
          // Generate a unique slug by adding a timestamp and random string
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(2, 8);
          const uniqueSlug = `${SAMPLE_REPLICA_SLUG}-${timestamp}-${randomStr}`;

          console.log(`Generated unique slug: ${uniqueSlug}`);

          const replicaPayload = {
            name: "Shopify Product Assistant",
            shortDescription: "An AI assistant specialized in Shopify product management and customer support",
            greeting: "Hello! I'm your Shopify product assistant. I have access to your store's product catalog and can help you with product information, inventory checks, and customer support. How can I help you today?",
            slug: uniqueSlug,
            ownerID: SAMPLE_USER_ID,
            llm: {
              model: 'claude-3-7-sonnet-latest' as any,
              memoryMode: 'rag-search' as any, // Use RAG for product knowledge
              systemMessage: `You are an intelligent AI assistant specialized in Shopify product management and customer support.

Your knowledge base contains detailed information about products in the connected Shopify store, including:
- Product names, descriptions, and specifications
- Pricing information and variant details
- Current stock levels and availability
- Product categories, tags, and vendor information
- SKU numbers and product IDs

When customers ask about products:
1. Provide accurate and helpful information based on your knowledge base
2. Check current stock levels when mentioning availability
3. Suggest similar or complementary products when appropriate
4. Help with product comparisons and recommendations
5. If you don't have specific information about a product, acknowledge this clearly

Always maintain a helpful, professional, and friendly tone while being informative and accurate.`
            }
          };
          console.log('Creating replica with payload:', replicaPayload);

          const newReplica = await userClient.replicas.postV1Replicas(API_VERSION, replicaPayload);
          uuid = newReplica.uuid;
          console.log(`✅ Created new replica with unique slug: ${uniqueSlug}, UUID: ${uuid}`);
        } catch (createReplicaError: any) {
          console.error('❌ Failed to create replica:', createReplicaError);
          throw createReplicaError;
        }
      }

      console.log(`Setting replica UUID: ${uuid}`);
      console.log('--- REPLICA SESSION INITIALIZATION COMPLETE ---');

      return {
        replicaUuid: uuid,
        userId: SAMPLE_USER_ID
      };

    } catch (error: any) {
      console.error('❌❌❌ Error initializing replica session:', error);
      throw new Error(`Failed to initialize replica session: ${error.message}`);
    }
  }
}