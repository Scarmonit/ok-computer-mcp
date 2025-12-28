/**
 * Enhance tool usage tool handler
 *
 * Analyzes tool usage patterns and suggests enhancements to increase productivity.
 */

import type {
  ToolResult,
  EnhanceToolUsageInput,
  InputSchema
} from '../types/index.js';
import { createToolResult } from '../types/index.js';
import type { ServerState } from './state.js';

/**
 * Input schema for enhance_tool_usage tool
 */
export const enhanceToolUsageInputSchema: InputSchema = {
  type: 'object',
  properties: {
    analysisType: {
      type: 'string',
      enum: ['usage_patterns', 'effectiveness', 'recommendations', 'comprehensive'],
      description: 'Type of enhancement analysis',
      default: 'comprehensive'
    },
    targetTools: {
      type: 'array',
      items: { type: 'string' },
      description: 'Specific tools to analyze (if not all)'
    },
    timeframe: {
      type: 'string',
      enum: ['recent', 'hour', 'day', 'all'],
      description: 'Time period to analyze',
      default: 'recent'
    }
  }
};

/**
 * Create enhance_tool_usage handler with access to server state
 */
export function createEnhanceToolUsageHandler(state: ServerState) {
  return function handleEnhanceToolUsage(args: EnhanceToolUsageInput): ToolResult {
    const { analysisType = 'comprehensive' } = args;

    const analysis: string[] = [];
    const recommendations: string[] = [];

    // Analyze tool usage patterns
    if (analysisType === 'usage_patterns' || analysisType === 'comprehensive') {
      const toolUsage = state.performanceMetrics.toolUsageCount;
      const totalUsage = Object.values(toolUsage).reduce((a, b) => a + b, 0);

      if (totalUsage > 0) {
        const usageStats = Object.entries(toolUsage)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([tool, count]) => `${tool}: ${count} uses (${(count / totalUsage * 100).toFixed(1)}%)`)
          .join('\n');

        analysis.push(`📈 Tool Usage Patterns (Top 5):\n${usageStats}`);
      } else {
        analysis.push('📈 Tool Usage: No usage data available');
      }
    }

    // Analyze tool effectiveness
    if (analysisType === 'effectiveness' || analysisType === 'comprehensive') {
      const effectiveness = state.productivityMetrics.toolEffectiveness;

      if (Object.keys(effectiveness).length > 0) {
        const effectivenessStats = Object.entries(effectiveness)
          .map(([tool, stats]) => {
            const rate = stats.uses > 0 ? (stats.success / stats.uses * 100).toFixed(1) : '0';
            return `${tool}: ${rate}% success rate`;
          })
          .join('\n');

        analysis.push(`🎯 Tool Effectiveness:\n${effectivenessStats}`);
      } else {
        analysis.push('🎯 Tool Effectiveness: No effectiveness data available');
      }
    }

    // Generate recommendations
    if (analysisType === 'recommendations' || analysisType === 'comprehensive') {
      // Check for underutilized tools
      const allTools = [
        'learn_from_interaction',
        'get_learning_insights',
        'adapt_behavior',
        'optimize_performance',
        'auto_optimize',
        'track_productivity',
        'enhance_tool_usage'
      ];
      const usedTools = Object.keys(state.performanceMetrics.toolUsageCount);
      const unusedTools = allTools.filter(tool => !usedTools.includes(tool));

      if (unusedTools.length > 0) {
        recommendations.push(`🔍 Promote unused tools: ${unusedTools.join(', ')}`);
      }

      // Check for low tool usage
      const totalInteractions = state.performanceMetrics.totalInteractions;
      const totalToolUsage = Object.values(state.performanceMetrics.toolUsageCount).reduce((a, b) => a + b, 0);
      const toolUsageRate = totalToolUsage / Math.max(totalInteractions, 1);

      if (toolUsageRate < 0.5) {
        recommendations.push(`🚀 Increase tool usage: Current rate ${(toolUsageRate * 100).toFixed(1)}% (target: >50%)`);
      }

      // Performance recommendations
      recommendations.push('⚡ Implement tool usage prompts in responses');
      recommendations.push('📊 Add tool suggestions based on user input patterns');
      recommendations.push('🎯 Create tool usage tutorials or examples');
    }

    return createToolResult(
      `🛠️ Tool Usage Enhancement Analysis (${analysisType})

${analysis.join('\n\n')}

💡 Recommendations:
${recommendations.join('\n')}

🎯 Enhancement Impact:
- Improved productivity through better tool utilization
- Enhanced user experience with targeted tool suggestions
- Increased system effectiveness and user satisfaction`
    );
  };
}
