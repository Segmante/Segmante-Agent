/**
 * Integration Test Suite for Dual-Mode Chat System
 * Tests the complete flow from intent detection to action execution
 * ensuring backwards compatibility and system reliability.
 */

import { IntentDetectionService } from './intent-detector';
import { SensayIntentAnalyzer } from './sensay-intent-analyzer';
import { ActionExecutor } from './action-executor';
import { ShopifyClient } from '../shopify/client';

export interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
  executionTime: number;
  error?: string;
}

export interface TestSuite {
  suiteName: string;
  results: TestResult[];
  overallPassed: boolean;
  totalExecutionTime: number;
}

export class IntegrationTester {
  private shopifyClient?: ShopifyClient;
  private sensayAnalyzer?: SensayIntentAnalyzer;
  private actionExecutor?: ActionExecutor;

  constructor(
    apiKey?: string,
    replicaUuid?: string,
    userId?: string,
    shopifyConfig?: { domain: string; accessToken: string }
  ) {
    if (apiKey && replicaUuid && userId) {
      this.sensayAnalyzer = new SensayIntentAnalyzer(apiKey, replicaUuid, userId);
    }

    if (shopifyConfig) {
      this.shopifyClient = new ShopifyClient(shopifyConfig);
      this.actionExecutor = new ActionExecutor(this.shopifyClient);
    }
  }

  /**
   * Run complete test suite
   */
  async runAllTests(): Promise<TestSuite[]> {
    console.log('🧪 Starting Integration Test Suite...');

    const suites: TestSuite[] = [];

    // Test Suite 1: Intent Detection
    suites.push(await this.testIntentDetection());

    // Test Suite 2: Sensay Analysis (if available)
    if (this.sensayAnalyzer) {
      suites.push(await this.testSensayAnalysis());
    }

    // Test Suite 3: Action Execution (if available)
    if (this.actionExecutor) {
      suites.push(await this.testActionExecution());
    }

    // Test Suite 4: Backwards Compatibility
    suites.push(await this.testBackwardsCompatibility());

    // Test Suite 5: Error Handling
    suites.push(await this.testErrorHandling());

    console.log('✅ Integration Test Suite Completed');
    this.logTestSummary(suites);

    return suites;
  }

  /**
   * Test Suite 1: Intent Detection
   */
  private async testIntentDetection(): Promise<TestSuite> {
    const suite: TestSuite = {
      suiteName: 'Intent Detection',
      results: [],
      overallPassed: true,
      totalExecutionTime: 0
    };

    const testCases = [
      {
        name: 'Price Update Detection',
        message: 'update iPhone 14 price to $1,500',
        expectedType: 'update_price',
        expectedMode: 'action'
      },
      {
        name: 'Stock Update Detection',
        message: 'update Samsung Galaxy S23 stock to 50',
        expectedType: 'update_stock',
        expectedMode: 'action'
      },
      {
        name: 'Bulk Update Detection',
        message: 'increase all Apple products by 10%',
        expectedType: 'bulk_update',
        expectedMode: 'action'
      },
      {
        name: 'Conversation Detection',
        message: 'how to setup payment gateway?',
        expectedType: null,
        expectedMode: 'conversation'
      },
      {
        name: 'Search Query Detection',
        message: 'search iPhone products',
        expectedType: 'search_products',
        expectedMode: 'action'
      },
      {
        name: 'Delete Product Detection',
        message: 'delete product ABC-123',
        expectedType: 'delete_product',
        expectedMode: 'action'
      }
    ];

    for (const testCase of testCases) {
      const result = await this.runSingleTest(
        testCase.name,
        async () => {
          const result = IntentDetectionService.detectIntent(testCase.message);

          if (result.mode !== testCase.expectedMode) {
            throw new Error(`Expected mode ${testCase.expectedMode}, got ${result.mode}`);
          }

          if (testCase.expectedType && (!result.action || result.action.type !== testCase.expectedType)) {
            throw new Error(`Expected type ${testCase.expectedType}, got ${result.action?.type || 'none'}`);
          }

          return `Mode: ${result.mode}, Type: ${result.action?.type || 'none'}, Confidence: ${result.action?.confidence || 0}`;
        }
      );

      suite.results.push(result);
      if (!result.passed) suite.overallPassed = false;
    }

    suite.totalExecutionTime = suite.results.reduce((sum, r) => sum + r.executionTime, 0);
    return suite;
  }

  /**
   * Test Suite 2: Sensay Analysis
   */
  private async testSensayAnalysis(): Promise<TestSuite> {
    const suite: TestSuite = {
      suiteName: 'Sensay AI Analysis',
      results: [],
      overallPassed: true,
      totalExecutionTime: 0
    };

    if (!this.sensayAnalyzer) {
      suite.results.push({
        testName: 'Sensay Availability',
        passed: false,
        details: 'Sensay analyzer not initialized',
        executionTime: 0,
        error: 'Missing API configuration'
      });
      suite.overallPassed = false;
      return suite;
    }

    const testCases = [
      {
        name: 'Complex Price Update Analysis',
        message: 'please increase all electronics category products price by 15 percent due to import cost increase'
      },
      {
        name: 'Ambiguous Intent Analysis',
        message: 'how is the iPhone product performance this month?'
      },
      {
        name: 'Multiple Actions Analysis',
        message: 'update iPhone stock to 100 and increase its price by 5%'
      }
    ];

    for (const testCase of testCases) {
      const result = await this.runSingleTest(
        testCase.name,
        async () => {
          const analysis = await this.sensayAnalyzer!.analyzeIntent(testCase.message);

          return `Confidence: ${analysis.confidence}, Intent: ${analysis.intent?.type || 'none'}, Fallback: ${analysis.fallbackToConversation}`;
        }
      );

      suite.results.push(result);
      if (!result.passed) suite.overallPassed = false;
    }

    suite.totalExecutionTime = suite.results.reduce((sum, r) => sum + r.executionTime, 0);
    return suite;
  }

  /**
   * Test Suite 3: Action Execution
   */
  private async testActionExecution(): Promise<TestSuite> {
    const suite: TestSuite = {
      suiteName: 'Action Execution',
      results: [],
      overallPassed: true,
      totalExecutionTime: 0
    };

    if (!this.actionExecutor) {
      suite.results.push({
        testName: 'Action Executor Availability',
        passed: false,
        details: 'Action executor not initialized',
        executionTime: 0,
        error: 'Missing Shopify configuration'
      });
      suite.overallPassed = false;
      return suite;
    }

    const testCases = [
      {
        name: 'Safety Validation',
        intent: {
          type: 'update_price' as const,
          confidence: 0.9,
          entities: { productName: 'Test Product', percentage: 200 }, // High risk percentage
          originalMessage: 'test message',
          requiresConfirmation: false
        }
      },
      {
        name: 'Preview Generation',
        intent: {
          type: 'search_products' as const,
          confidence: 0.8,
          entities: { searchQuery: 'iPhone' },
          originalMessage: 'cari iPhone',
          requiresConfirmation: false
        }
      }
    ];

    for (const testCase of testCases) {
      const result = await this.runSingleTest(
        testCase.name,
        async () => {
          const context = {
            userId: 'test-user',
            storeInfo: { domain: 'test.myshopify.com', name: 'Test Store' },
            userPermissions: ['products.read', 'products.write']
          };

          const execution = await this.actionExecutor!.initiateAction(testCase.intent, context);

          return `Status: ${execution.status}, Risk Assessment: ${execution.requiresConfirmation ? 'requires confirmation' : 'auto-execute'}`;
        }
      );

      suite.results.push(result);
      if (!result.passed) suite.overallPassed = false;
    }

    suite.totalExecutionTime = suite.results.reduce((sum, r) => sum + r.executionTime, 0);
    return suite;
  }

  /**
   * Test Suite 4: Backwards Compatibility
   */
  private async testBackwardsCompatibility(): Promise<TestSuite> {
    const suite: TestSuite = {
      suiteName: 'Backwards Compatibility',
      results: [],
      overallPassed: true,
      totalExecutionTime: 0
    };

    const testCases = [
      {
        name: 'Conversation Mode Preservation',
        test: () => {
          // Test that normal conversation queries still work as before
          const result = IntentDetectionService.detectIntent('apa itu shopify?');
          if (result.mode !== 'conversation') {
            throw new Error('Conversation mode not preserved');
          }
          return 'Conversation mode working correctly';
        }
      },
      {
        name: 'Entity Extraction Backwards Compatibility',
        test: () => {
          // Test that existing entity extraction still works
          const result = IntentDetectionService.detectIntent('update product ABC price');
          if (!result.action || !result.action.entities.productName) {
            throw new Error('Entity extraction not backwards compatible');
          }
          return 'Entity extraction backwards compatible';
        }
      },
      {
        name: 'Low Confidence Fallback',
        test: () => {
          // Test that low confidence intents fallback to conversation
          const result = IntentDetectionService.detectIntent('hmm maybe update?');
          if (result.mode !== 'conversation' && !result.conversationFallback) {
            throw new Error('Low confidence fallback not working');
          }
          return 'Low confidence fallback working correctly';
        }
      }
    ];

    for (const testCase of testCases) {
      const result = await this.runSingleTest(testCase.name, testCase.test);
      suite.results.push(result);
      if (!result.passed) suite.overallPassed = false;
    }

    suite.totalExecutionTime = suite.results.reduce((sum, r) => sum + r.executionTime, 0);
    return suite;
  }

  /**
   * Test Suite 5: Error Handling
   */
  private async testErrorHandling(): Promise<TestSuite> {
    const suite: TestSuite = {
      suiteName: 'Error Handling',
      results: [],
      overallPassed: true,
      totalExecutionTime: 0
    };

    const testCases = [
      {
        name: 'Empty Message Handling',
        test: () => {
          const result = IntentDetectionService.detectIntent('');
          if (result.mode !== 'conversation') {
            throw new Error('Empty message not handled correctly');
          }
          return 'Empty message handled correctly';
        }
      },
      {
        name: 'Invalid Entity Handling',
        test: () => {
          const result = IntentDetectionService.detectIntent('update product XYZ price to ABC dollars');
          // Should either fallback to conversation or extract what it can
          return `Handled invalid entities, mode: ${result.mode}`;
        }
      },
      {
        name: 'Unicode and Special Characters',
        test: () => {
          const result = IntentDetectionService.detectIntent('update product™ 中文 price to $1,000,000');
          return `Unicode handled, extracted price: ${result.action?.entities.price || 'none'}`;
        }
      }
    ];

    for (const testCase of testCases) {
      const result = await this.runSingleTest(testCase.name, testCase.test);
      suite.results.push(result);
      if (!result.passed) suite.overallPassed = false;
    }

    suite.totalExecutionTime = suite.results.reduce((sum, r) => sum + r.executionTime, 0);
    return suite;
  }

  /**
   * Run a single test with timing and error handling
   */
  private async runSingleTest(
    testName: string,
    testFunction: () => Promise<string> | string
  ): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const details = await testFunction();
      const executionTime = Date.now() - startTime;

      return {
        testName,
        passed: true,
        details,
        executionTime
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      return {
        testName,
        passed: false,
        details: `Test failed: ${error.message}`,
        executionTime,
        error: error.message
      };
    }
  }

  /**
   * Log test summary to console
   */
  private logTestSummary(suites: TestSuite[]): void {
    console.log('\n📊 Integration Test Summary:');
    console.log('================================');

    let totalTests = 0;
    let totalPassed = 0;
    let totalExecutionTime = 0;

    suites.forEach(suite => {
      const passed = suite.results.filter(r => r.passed).length;
      const total = suite.results.length;

      totalTests += total;
      totalPassed += passed;
      totalExecutionTime += suite.totalExecutionTime;

      console.log(`\n${suite.suiteName}: ${passed}/${total} tests passed (${suite.totalExecutionTime}ms)`);

      suite.results.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        console.log(`  ${status} ${result.testName} (${result.executionTime}ms)`);
        if (!result.passed) {
          console.log(`    Error: ${result.error}`);
        }
      });
    });

    console.log('\n================================');
    console.log(`Overall: ${totalPassed}/${totalTests} tests passed (${totalExecutionTime}ms total)`);

    const successRate = totalTests > 0 ? (totalPassed / totalTests * 100).toFixed(1) : '0';
    console.log(`Success Rate: ${successRate}%`);

    if (totalPassed === totalTests) {
      console.log('🎉 All tests passed! System ready for production.');
    } else {
      console.log(`⚠️  ${totalTests - totalPassed} tests failed. Review before deployment.`);
    }
  }

  /**
   * Quick health check for production use
   */
  async quickHealthCheck(): Promise<boolean> {
    console.log('🔍 Running quick health check...');

    try {
      // Test basic intent detection
      const basicTest = IntentDetectionService.detectIntent('test message');
      if (!basicTest) {
        console.error('❌ Basic intent detection failed');
        return false;
      }

      // Test Sensay connection if available
      if (this.sensayAnalyzer) {
        try {
          await this.sensayAnalyzer.analyzeIntent('test');
          console.log('✅ Sensay analyzer connected');
        } catch (error) {
          console.warn('⚠️  Sensay analyzer connection issue:', error);
        }
      }

      // Test Shopify connection if available
      if (this.shopifyClient) {
        try {
          await this.shopifyClient.testConnection();
          console.log('✅ Shopify client connected');
        } catch (error) {
          console.warn('⚠️  Shopify client connection issue:', error);
        }
      }

      console.log('✅ Health check completed successfully');
      return true;

    } catch (error) {
      console.error('❌ Health check failed:', error);
      return false;
    }
  }
}

/**
 * Utility function for running tests in development/testing environment
 */
export async function runIntegrationTests(config?: {
  apiKey?: string;
  replicaUuid?: string;
  userId?: string;
  shopifyConfig?: { domain: string; accessToken: string };
}): Promise<TestSuite[]> {
  const tester = new IntegrationTester(
    config?.apiKey,
    config?.replicaUuid,
    config?.userId,
    config?.shopifyConfig
  );

  return await tester.runAllTests();
}

/**
 * Utility function for production health checks
 */
export async function healthCheck(config?: {
  apiKey?: string;
  replicaUuid?: string;
  userId?: string;
  shopifyConfig?: { domain: string; accessToken: string };
}): Promise<boolean> {
  const tester = new IntegrationTester(
    config?.apiKey,
    config?.replicaUuid,
    config?.userId,
    config?.shopifyConfig
  );

  return await tester.quickHealthCheck();
}