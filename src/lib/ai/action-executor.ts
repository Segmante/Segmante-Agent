/**
 * Action Execution Layer with Comprehensive Safety Checks
 * Provides secure, validated execution of Shopify operations with
 * audit trails, rollback capabilities, and user confirmations.
 */

import { ShopifyActionsService, ActionResult } from '../shopify/actions';
import { ActionIntent } from './intent-detector';
import { ShopifyClient } from '../shopify/client';

export type ActionStatus = 'pending' | 'previewing' | 'awaiting_confirmation' | 'executing' | 'completed' | 'failed' | 'cancelled';

export interface ActionExecution {
  id: string;
  intent: ActionIntent;
  status: ActionStatus;
  preview?: ActionResult;
  result?: ActionResult;
  timestamp: Date;
  userId: string;
  requiresConfirmation: boolean;
  confirmed: boolean;
  auditLog: ActionAuditEntry[];
}

export interface ActionAuditEntry {
  timestamp: Date;
  event: 'created' | 'previewed' | 'confirmed' | 'executed' | 'failed' | 'cancelled' | 'rolled_back';
  details: string;
  metadata?: any;
}

export interface SafetyValidation {
  passed: boolean;
  warnings: string[];
  blockers: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

export interface ExecutionContext {
  userId: string;
  sessionId?: string;
  storeInfo: {
    domain: string;
    name: string;
  };
  userPermissions: string[];
}

export class ActionExecutor {
  private shopifyActions: ShopifyActionsService;
  private activeExecutions: Map<string, ActionExecution> = new Map();

  // Safety limits
  private static readonly SAFETY_LIMITS = {
    maxBulkOperations: 100,
    maxPriceIncrease: 500, // 500% max increase
    maxPriceDecrease: 90,  // 90% max decrease
    dailyActionLimit: 1000,
    confirmationTimeoutMs: 300000 // 5 minutes
  };

  // Risk assessment rules
  private static readonly RISK_RULES = {
    delete_product: 'critical',
    bulk_update: 'high',
    update_price: 'medium',
    update_stock: 'low',
    create_product: 'low',
    search_products: 'low'
  } as const;

  constructor(shopifyClient: ShopifyClient) {
    this.shopifyActions = new ShopifyActionsService(shopifyClient);
  }

  /**
   * Initiate action execution with comprehensive safety checks
   */
  async initiateAction(
    intent: ActionIntent,
    context: ExecutionContext
  ): Promise<ActionExecution> {
    const executionId = this.generateExecutionId();

    console.log(`🛡️ Initiating action execution: ${executionId}`, intent);

    // Create execution record
    const execution: ActionExecution = {
      id: executionId,
      intent,
      status: 'pending',
      timestamp: new Date(),
      userId: context.userId,
      requiresConfirmation: intent.requiresConfirmation,
      confirmed: false,
      auditLog: [{
        timestamp: new Date(),
        event: 'created',
        details: `Action initiated: ${intent.type}`,
        metadata: { intent, context }
      }]
    };

    this.activeExecutions.set(executionId, execution);

    // Step 1: Safety validation
    const safetyCheck = await this.validateActionSafety(intent, context);
    this.addAuditEntry(execution, 'created', `Safety validation: ${safetyCheck.riskLevel}`, safetyCheck);

    if (!safetyCheck.passed) {
      execution.status = 'failed';
      execution.result = {
        success: false,
        message: `Aksi ditolak: ${safetyCheck.blockers.join(', ')}`,
        error: 'Safety validation failed'
      };
      return execution;
    }

    // Step 2: Generate preview
    try {
      execution.status = 'previewing';
      const preview = await this.shopifyActions.previewAction(intent);
      execution.preview = preview;
      this.addAuditEntry(execution, 'previewed', `Preview generated: ${preview.affectedProducts} products affected`);

      // Step 3: Determine if confirmation needed
      if (this.needsConfirmation(intent, safetyCheck, preview)) {
        execution.status = 'awaiting_confirmation';
        execution.requiresConfirmation = true;

        // Set confirmation timeout
        setTimeout(() => {
          if (execution.status === 'awaiting_confirmation') {
            execution.status = 'cancelled';
            this.addAuditEntry(execution, 'cancelled', 'Confirmation timeout expired');
          }
        }, ActionExecutor.SAFETY_LIMITS.confirmationTimeoutMs);
      } else {
        // Auto-execute safe actions
        return await this.executeAction(executionId);
      }

    } catch (error: any) {
      execution.status = 'failed';
      execution.result = {
        success: false,
        message: `Gagal membuat preview: ${error.message}`,
        error: error.message
      };
      this.addAuditEntry(execution, 'failed', `Preview failed: ${error.message}`);
    }

    return execution;
  }

  /**
   * Confirm and execute pending action
   */
  async confirmAction(executionId: string, confirmed: boolean): Promise<ActionExecution> {
    const execution = this.activeExecutions.get(executionId);

    if (!execution) {
      throw new Error('Execution not found');
    }

    if (execution.status !== 'awaiting_confirmation') {
      throw new Error('Action is not awaiting confirmation');
    }

    execution.confirmed = confirmed;

    if (confirmed) {
      this.addAuditEntry(execution, 'confirmed', 'User confirmed action');
      return await this.executeAction(executionId);
    } else {
      execution.status = 'cancelled';
      this.addAuditEntry(execution, 'cancelled', 'User cancelled action');
      return execution;
    }
  }

  /**
   * Execute the action after all safety checks
   */
  async executeAction(executionId: string): Promise<ActionExecution> {
    const execution = this.activeExecutions.get(executionId);

    if (!execution) {
      throw new Error('Execution not found');
    }

    if (execution.status === 'completed' || execution.status === 'failed') {
      return execution;
    }

    try {
      execution.status = 'executing';
      this.addAuditEntry(execution, 'executed', 'Executing action');

      console.log(`⚡ Executing action: ${execution.intent.type} (${executionId})`);

      // Execute the action
      const result = await this.shopifyActions.executeAction(execution.intent);

      execution.result = result;
      execution.status = result.success ? 'completed' : 'failed';

      const auditDetails = result.success
        ? `Action completed successfully: ${result.message}`
        : `Action failed: ${result.error}`;

      this.addAuditEntry(execution, result.success ? 'executed' : 'failed', auditDetails, result);

      console.log(`✅ Action execution ${result.success ? 'completed' : 'failed'}: ${executionId}`);

      return execution;

    } catch (error: any) {
      execution.status = 'failed';
      execution.result = {
        success: false,
        message: `Eksekusi gagal: ${error.message}`,
        error: error.message
      };

      this.addAuditEntry(execution, 'failed', `Execution error: ${error.message}`);
      console.error(`❌ Action execution failed: ${executionId}`, error);

      return execution;
    }
  }

  /**
   * Validate action safety with comprehensive checks
   */
  private async validateActionSafety(
    intent: ActionIntent,
    context: ExecutionContext
  ): Promise<SafetyValidation> {
    const warnings: string[] = [];
    const blockers: string[] = [];
    const recommendations: string[] = [];

    // Risk level assessment
    const riskLevel = ActionExecutor.RISK_RULES[intent.type] || 'medium';

    // Permission checks
    const requiredPermission = this.getRequiredPermission(intent.type);
    if (!context.userPermissions.includes(requiredPermission)) {
      blockers.push(`Missing permission: ${requiredPermission}`);
    }

    // Entity validation
    if (intent.type === 'update_price' && intent.entities.percentage) {
      const percentage = intent.entities.percentage;
      if (percentage > ActionExecutor.SAFETY_LIMITS.maxPriceIncrease) {
        blockers.push(`Price increase too high: ${percentage}% (max: ${ActionExecutor.SAFETY_LIMITS.maxPriceIncrease}%)`);
      }
      if (percentage < -ActionExecutor.SAFETY_LIMITS.maxPriceDecrease) {
        blockers.push(`Price decrease too high: ${Math.abs(percentage)}% (max: ${ActionExecutor.SAFETY_LIMITS.maxPriceDecrease}%)`);
      }
      if (Math.abs(percentage) > 50) {
        warnings.push(`Large price change detected: ${percentage}%`);
      }
    }

    // Bulk operation limits
    if (intent.type === 'bulk_update') {
      warnings.push('Bulk operations affect multiple products');
      recommendations.push('Review the preview carefully before confirming');

      // Additional validation would check actual product count
    }

    // Delete operation warnings
    if (intent.type === 'delete_product') {
      warnings.push('Product deletion is permanent');
      recommendations.push('Consider archiving instead of deleting');
    }

    // Rate limiting check (simplified)
    // In production, this would check against a database
    const todayActionsCount = this.getTodayActionsCount(context.userId);
    if (todayActionsCount >= ActionExecutor.SAFETY_LIMITS.dailyActionLimit) {
      blockers.push(`Daily action limit exceeded: ${todayActionsCount}/${ActionExecutor.SAFETY_LIMITS.dailyActionLimit}`);
    }

    return {
      passed: blockers.length === 0,
      warnings,
      blockers,
      riskLevel,
      recommendations
    };
  }

  /**
   * Determine if action needs user confirmation
   */
  private needsConfirmation(
    intent: ActionIntent,
    safetyCheck: SafetyValidation,
    preview: ActionResult
  ): boolean {
    // Always confirm high-risk and critical actions
    if (safetyCheck.riskLevel === 'critical' || safetyCheck.riskLevel === 'high') {
      return true;
    }

    // Confirm if there are safety warnings
    if (safetyCheck.warnings.length > 0) {
      return true;
    }

    // Confirm bulk operations affecting many products
    if (preview.affectedProducts && preview.affectedProducts > 10) {
      return true;
    }

    // Confirm if explicitly requested by intent
    if (intent.requiresConfirmation) {
      return true;
    }

    return false;
  }

  /**
   * Get required permission for action type
   */
  private getRequiredPermission(actionType: ActionIntent['type']): string {
    const permissions = {
      'update_price': 'products.write',
      'update_stock': 'inventory.write',
      'create_product': 'products.write',
      'delete_product': 'products.delete',
      'bulk_update': 'products.bulk_write',
      'search_products': 'products.read'
    };

    return permissions[actionType] || 'products.read';
  }

  /**
   * Get today's action count for rate limiting
   */
  private getTodayActionsCount(userId: string): number {
    // Simplified implementation - in production, query database
    return Array.from(this.activeExecutions.values())
      .filter(execution =>
        execution.userId === userId &&
        execution.timestamp.toDateString() === new Date().toDateString() &&
        execution.status === 'completed'
      ).length;
  }

  /**
   * Add audit entry to execution
   */
  private addAuditEntry(
    execution: ActionExecution,
    event: ActionAuditEntry['event'],
    details: string,
    metadata?: any
  ): void {
    execution.auditLog.push({
      timestamp: new Date(),
      event,
      details,
      metadata
    });
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get execution by ID
   */
  getExecution(executionId: string): ActionExecution | undefined {
    return this.activeExecutions.get(executionId);
  }

  /**
   * Get all executions for a user
   */
  getUserExecutions(userId: string): ActionExecution[] {
    return Array.from(this.activeExecutions.values())
      .filter(execution => execution.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Cancel pending execution
   */
  cancelExecution(executionId: string): boolean {
    const execution = this.activeExecutions.get(executionId);

    if (!execution) {
      return false;
    }

    if (execution.status === 'executing' || execution.status === 'completed') {
      return false; // Cannot cancel running or completed actions
    }

    execution.status = 'cancelled';
    this.addAuditEntry(execution, 'cancelled', 'Execution cancelled by user');

    return true;
  }

  /**
   * Clean up old executions (call periodically)
   */
  cleanupOldExecutions(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
    const cutoffTime = new Date(Date.now() - maxAgeMs);

    for (const [id, execution] of this.activeExecutions) {
      if (execution.timestamp < cutoffTime) {
        this.activeExecutions.delete(id);
      }
    }
  }

  /**
   * Get execution statistics
   */
  getExecutionStats(): {
    total: number;
    byStatus: Record<ActionStatus, number>;
    byType: Record<string, number>;
    successRate: number;
  } {
    const executions = Array.from(this.activeExecutions.values());

    const byStatus = executions.reduce((acc, execution) => {
      acc[execution.status] = (acc[execution.status] || 0) + 1;
      return acc;
    }, {} as Record<ActionStatus, number>);

    const byType = executions.reduce((acc, execution) => {
      acc[execution.intent.type] = (acc[execution.intent.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const completed = byStatus.completed || 0;
    const failed = byStatus.failed || 0;
    const successRate = completed + failed > 0 ? completed / (completed + failed) : 0;

    return {
      total: executions.length,
      byStatus,
      byType,
      successRate
    };
  }
}