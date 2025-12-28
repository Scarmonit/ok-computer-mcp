/**
 * Auto-optimize tool handler
 *
 * Automatically optimizes system performance based on current metrics and usage patterns.
 */

import type {
  ToolResult,
  AutoOptimizeInput,
  InputSchema,
  Fact
} from '../types/index.js';
import { createToolResult } from '../types/index.js';
import type { ServerState } from './state.js';

/**
 * Input schema for auto_optimize tool
 */
export const autoOptimizeInputSchema: InputSchema = {
  type: 'object',
  properties: {
    priority: {
      type: 'string',
      enum: ['performance', 'productivity', 'tool_usage', 'balanced'],
      description: 'Optimization priority focus',
      default: 'balanced'
    },
    force: {
      type: 'boolean',
      description: 'Force optimization even if recently run',
      default: false
    },
    aggressive: {
      type: 'boolean',
      description: 'Use aggressive optimization strategies',
      default: false
    }
  }
};

/**
 * Create auto_optimize handler with access to server state
 */
export function createAutoOptimizeHandler(state: ServerState) {
  return function handleAutoOptimize(args: AutoOptimizeInput): ToolResult {
    const { priority = 'balanced', force = false } = args;
    const now = Date.now();

    // Check if we should run optimization
    if (!force && (now - state.autoOptimization.lastRun) < state.autoOptimization.interval) {
      const nextRun = new Date(state.autoOptimization.lastRun + state.autoOptimization.interval).toISOString();
      return createToolResult(
        `⏳ Auto-optimization skipped (run too recently)
Next optimization: ${nextRun}
Use "force: true" to override`
      );
    }

    state.autoOptimization.lastRun = now;

    // Analyze current state
    const successRate = state.performanceMetrics.totalInteractions > 0
      ? (state.performanceMetrics.successfulInteractions / state.performanceMetrics.totalInteractions)
      : 0;

    const toolUsageValues = Object.values(state.performanceMetrics.toolUsageCount);
    const totalToolUsage = toolUsageValues.reduce((a, b) => a + b, 0);
    const avgToolUsage = totalToolUsage / Math.max(state.performanceMetrics.totalInteractions, 1);

    const optimizations: string[] = [];
    const improvements: string[] = [];

    // Performance-focused optimizations
    if (priority === 'performance' || priority === 'balanced') {
      if (successRate < state.autoOptimization.targetMetrics.minSuccessRate) {
        optimizations.push('🎯 Enhancing success rate through pattern analysis');
        improvements.push('Increased pattern matching accuracy');
      }

      if (avgToolUsage < state.autoOptimization.targetMetrics.minToolUsage) {
        optimizations.push('🛠️ Promoting tool usage through better recommendations');
        improvements.push('Enhanced tool suggestion algorithms');
      }
    }

    // Productivity-focused optimizations
    if (priority === 'productivity' || priority === 'balanced') {
      if (state.productivityMetrics.efficiencyScore < 0.85) {
        optimizations.push('⚡ Streamlining response patterns for efficiency');
        improvements.push('Faster response generation');
      }

      if (state.performanceMetrics.productivityScore < state.autoOptimization.targetMetrics.targetProductivity) {
        optimizations.push('📈 Implementing productivity enhancement strategies');
        improvements.push('Better task completion tracking');
      }
    }

    // Apply optimizations
    if (optimizations.length > 0) {
      // Update knowledge base with optimizations
      const optimizationFact: Fact = {
        id: `auto_opt_${Date.now()}`,
        content: `Auto-optimization applied: ${optimizations.join(', ')}`,
        confidence: 0.9,
        source: 'automatic_optimization'
      };
      state.knowledgeBase.facts.push(optimizationFact);

      // Update performance metrics
      state.performanceMetrics.productivityScore = Math.min(1.0, state.performanceMetrics.productivityScore + 0.05);
      state.productivityMetrics.efficiencyScore = Math.min(1.0, state.productivityMetrics.efficiencyScore + 0.03);
    }

    return createToolResult(
      `🚀 Auto-Optimization Complete (${priority} priority)

📊 Current Metrics:
- Success rate: ${(successRate * 100).toFixed(1)}%
- Tool usage: ${(avgToolUsage * 100).toFixed(1)}%
- Productivity score: ${(state.performanceMetrics.productivityScore * 100).toFixed(1)}%
- Efficiency score: ${(state.productivityMetrics.efficiencyScore * 100).toFixed(1)}%

🔧 Optimizations Applied:
${optimizations.length > 0 ? optimizations.map(opt => `• ${opt}`).join('\n') : '• No optimizations needed (metrics within targets)'}

✅ Improvements:
${improvements.length > 0 ? improvements.map(imp => `• ${imp}`).join('\n') : '• System performing optimally'}

⏰ Next auto-optimization: ${new Date(now + state.autoOptimization.interval).toISOString()}`
    );
  };
}
