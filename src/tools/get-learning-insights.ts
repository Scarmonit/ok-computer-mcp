/**
 * Get learning insights tool handler
 *
 * Returns insights about what the AI has learned and performance metrics.
 */

import type {
  ToolResult,
  GetLearningInsightsInput,
  InputSchema
} from '../types/index.js';
import { createToolResult } from '../types/index.js';
import type { ServerState } from './state.js';

/**
 * Input schema for get_learning_insights tool
 */
export const getLearningInsightsInputSchema: InputSchema = {
  type: 'object',
  properties: {
    detailLevel: {
      type: 'string',
      enum: ['summary', 'detailed', 'full'],
      description: 'Level of detail for insights',
      default: 'summary'
    },
    focusArea: {
      type: 'string',
      enum: ['performance', 'patterns', 'knowledge', 'feedback', 'all'],
      description: 'Specific area to focus on',
      default: 'all'
    }
  }
};

/**
 * Create get_learning_insights handler with access to server state
 */
export function createGetLearningInsightsHandler(state: ServerState) {
  return function handleGetLearningInsights(args: GetLearningInsightsInput): ToolResult {
    const { detailLevel = 'summary', focusArea = 'all' } = args;

    const insights: string[] = [];

    // Performance insights
    if (focusArea === 'all' || focusArea === 'performance') {
      const successRate = state.performanceMetrics.totalInteractions > 0
        ? (state.performanceMetrics.successfulInteractions /
            state.performanceMetrics.totalInteractions * 100).toFixed(1)
        : '0';

      insights.push(`📊 Performance Metrics:
- Total interactions: ${state.performanceMetrics.totalInteractions}
- Successful interactions: ${state.performanceMetrics.successfulInteractions}
- Success rate: ${successRate}%
- Feedback entries: ${state.feedbackData.length}`);
    }

    // Pattern insights
    if (focusArea === 'all' || focusArea === 'patterns') {
      const effectivePatterns = state.knowledgeBase.patterns.filter(p => p.effectiveness > 0.7);
      insights.push(`🧠 Learned Patterns:
- Total patterns: ${state.knowledgeBase.patterns.length}
- High-effectiveness patterns: ${effectivePatterns.length}
- Most effective pattern type: ${effectivePatterns.length > 0 ? effectivePatterns[0].pattern : 'None yet'}`);
    }

    // Knowledge insights
    if (focusArea === 'all' || focusArea === 'knowledge') {
      const highConfidenceFacts = state.knowledgeBase.facts.filter(f => f.confidence > 0.8);
      const sources = [...new Set(state.knowledgeBase.facts.map(f => f.source))];
      insights.push(`🎓 Knowledge Base:
- Total facts: ${state.knowledgeBase.facts.length}
- High-confidence facts: ${highConfidenceFacts.length}
- Learning sources: ${sources.join(', ')}`);
    }

    // Recent learning
    if (detailLevel === 'detailed' || detailLevel === 'full') {
      const recentInteractions = state.interactionHistory.slice(-5);
      insights.push(`🔄 Recent Learning (${recentInteractions.length} recent interactions):
${recentInteractions.map(interaction =>
  `- "${interaction.userInput}" -> ${interaction.success !== false ? '✅ Success' : '❌ Failed'}`
).join('\n') || '- No recent interactions'}`);
    }

    // Recommendations
    insights.push(`💡 Recommendations:
- Continue providing feedback to improve response quality
- Use specific context to help the AI learn better
- Interact regularly to maintain learning momentum`);

    return createToolResult(
      `🧠 AI Learning Insights (${detailLevel} view)

${insights.join('\n\n')}`
    );
  };
}
