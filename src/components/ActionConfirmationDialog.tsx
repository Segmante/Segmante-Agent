'use client';

/**
 * Action Confirmation Dialog Component
 * Provides detailed confirmation UI for potentially destructive or high-impact actions
 * with comprehensive preview, risk assessment, and user education.
 */

import { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info, Zap, Clock, Shield } from 'lucide-react';
import { ActionExecution } from '@/lib/ai/action-executor';
import { IntentDetectionService } from '@/lib/ai/intent-detector';

interface ActionConfirmationDialogProps {
  execution: ActionExecution;
  onConfirm: (confirmed: boolean) => void;
  isLoading?: boolean;
}

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

const ActionConfirmationDialog: React.FC<ActionConfirmationDialogProps> = ({
  execution,
  onConfirm,
  isLoading = false
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const getRiskLevel = (): RiskLevel => {
    const { intent, preview } = execution;

    if (intent.type === 'delete_product') return 'critical';
    if (intent.type === 'bulk_update') return 'high';

    if (intent.type === 'update_price' && intent.entities.percentage) {
      const percentage = Math.abs(intent.entities.percentage);
      if (percentage > 50) return 'high';
      if (percentage > 20) return 'medium';
    }

    if (preview?.affectedProducts && preview.affectedProducts > 50) return 'high';
    if (preview?.affectedProducts && preview.affectedProducts > 10) return 'medium';

    return 'low';
  };

  const getRiskConfig = (risk: RiskLevel) => {
    switch (risk) {
      case 'critical':
        return {
          color: 'red',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          textColor: 'text-red-400',
          icon: XCircle,
          label: 'CRITICAL RISK',
          description: 'This action may cause permanent data loss'
        };
      case 'high':
        return {
          color: 'orange',
          bgColor: 'bg-orange-500/10',
          borderColor: 'border-orange-500/30',
          textColor: 'text-orange-400',
          icon: AlertTriangle,
          label: 'HIGH RISK',
          description: 'This action affects a lot of data and is hard to undo'
        };
      case 'medium':
        return {
          color: 'yellow',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30',
          textColor: 'text-yellow-400',
          icon: AlertTriangle,
          label: 'MEDIUM RISK',
          description: 'This action requires special attention'
        };
      case 'low':
        return {
          color: 'green',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/30',
          textColor: 'text-green-400',
          icon: CheckCircle,
          label: 'LOW RISK',
          description: 'This action is relatively safe and can be undone'
        };
    }
  };

  const riskLevel = getRiskLevel();
  const riskConfig = getRiskConfig(riskLevel);
  const RiskIcon = riskConfig.icon;

  const formatActionDescription = () => {
    return IntentDetectionService.describeIntent(execution.intent);
  };

  const getImpactDetails = () => {
    const { preview, intent } = execution;
    const details = [];

    if (preview?.affectedProducts) {
      details.push(`${preview.affectedProducts} products will be affected`);
    }

    if (intent.entities.percentage) {
      details.push(`Price change: ${intent.entities.percentage > 0 ? '+' : ''}${intent.entities.percentage}%`);
    }

    if (intent.entities.price) {
      details.push(`New price: $${intent.entities.price.toLocaleString()}`);
    }

    if (intent.entities.quantity) {
      details.push(`New stock: ${intent.entities.quantity}`);
    }

    if (intent.type === 'delete_product') {
      details.push('Product data will be permanently deleted');
    }

    return details;
  };

  const getActionRecommendations = () => {
    const { intent } = execution;
    const recommendations = [];

    switch (intent.type) {
      case 'delete_product':
        recommendations.push('Consider deactivating the product instead of deleting');
        recommendations.push('Ensure there are no active orders for this product');
        recommendations.push('Backup product data if needed');
        break;

      case 'bulk_update':
        recommendations.push('Check the preview carefully before proceeding');
        recommendations.push('Ensure changes align with store policies');
        recommendations.push('Prepare a rollback plan if needed');
        break;

      case 'update_price':
        if (intent.entities.percentage && Math.abs(intent.entities.percentage) > 20) {
          recommendations.push('Large price changes can affect sales');
          recommendations.push('Consider the impact on competitors');
          recommendations.push('Inform customers about price changes');
        }
        break;

      default:
        recommendations.push('Review action details carefully before proceeding');
    }

    return recommendations;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-full ${riskConfig.bgColor} ${riskConfig.borderColor} border`}>
              <Shield className="w-6 h-6 text-slate-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Action Confirmation</h2>
              <p className="text-gray-400 text-sm">This action requires your approval</p>
            </div>
          </div>

          {/* Risk Level Badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${riskConfig.bgColor} ${riskConfig.borderColor} border`}>
            <RiskIcon className={`w-4 h-4 ${riskConfig.textColor}`} />
            <span className={`text-sm font-medium ${riskConfig.textColor}`}>
              {riskConfig.label}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Action Description */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-400" />
              Action to Execute
            </h3>
            <div className="bg-slate-700/50 rounded-xl p-4">
              <p className="text-gray-200 font-medium">{formatActionDescription()}</p>
              <p className="text-gray-400 text-sm mt-1">{riskConfig.description}</p>
            </div>
          </div>

          {/* Impact Details */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-400" />
              Impact Details
            </h3>
            <div className="space-y-2">
              {getImpactDetails().map((detail, index) => (
                <div key={index} className="flex items-center gap-2 text-gray-300">
                  <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0" />
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Preview Data */}
          {execution.preview?.data && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Product Preview</h3>
              <div className="bg-slate-700/30 rounded-xl p-4 max-h-32 overflow-y-auto">
                {Array.isArray(execution.preview.data) ? (
                  <div className="space-y-2">
                    {execution.preview.data.slice(0, 5).map((product: any, index: number) => (
                      <div key={index} className="text-sm text-gray-300 flex justify-between">
                        <span>{product.title || product.name}</span>
                        <span className="text-gray-400">{product.sku}</span>
                      </div>
                    ))}
                    {execution.preview.data.length > 5 && (
                      <div className="text-sm text-gray-400 text-center pt-2 border-t border-slate-600">
                        +{execution.preview.data.length - 5} more products
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-300 text-sm">{JSON.stringify(execution.preview.data)}</p>
                )}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {riskLevel !== 'low' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                Safety Recommendations
              </h3>
              <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
                <ul className="space-y-2">
                  {getActionRecommendations().map((rec, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Advanced Details Toggle */}
          <div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-blue-400 hover:text-blue-300 text-sm underline"
            >
              {showDetails ? 'Hide' : 'Show'} technical details
            </button>

            {showDetails && (
              <div className="mt-3 bg-slate-700/30 rounded-xl p-4">
                <div className="text-xs space-y-2">
                  <div>
                    <span className="text-gray-400">Execution ID:</span>
                    <span className="text-gray-300 ml-2">{execution.id}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Intent Type:</span>
                    <span className="text-gray-300 ml-2">{execution.intent.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Confidence:</span>
                    <span className="text-gray-300 ml-2">{(execution.intent.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Timestamp:</span>
                    <span className="text-gray-300 ml-2">{execution.timestamp.toLocaleString('id-ID')}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Original Message:</span>
                    <div className="text-gray-300 ml-2 mt-1 p-2 bg-slate-800 rounded text-sm">
                      &quot;{execution.intent.originalMessage}&quot;
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer with Action Buttons */}
        <div className="p-6 border-t border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Confirmation will expire in 5 minutes</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => onConfirm(false)}
              disabled={isLoading}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Cancel
            </button>

            <button
              onClick={() => onConfirm(true)}
              disabled={isLoading}
              className={`px-6 py-2 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2 ${
                riskLevel === 'critical'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : riskLevel === 'high'
                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isLoading ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  {riskLevel === 'critical' ? 'Yes, I&apos;m Sure' : 'Confirm & Execute'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionConfirmationDialog;