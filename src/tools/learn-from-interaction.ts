/**
 * Learn from interaction tool handler
 *
 * Records user interactions to improve future responses.
 */

import type {
  ToolResult,
  LearnFromInteractionInput,
  InputSchema,
  Fact,
  Pattern
} from '../types/index.js';
import { createToolResult } from '../types/index.js';
import type { ServerState } from './state.js';

/**
 * Input schema for learn_from_interaction tool
 */
export const learnFromInteractionInputSchema: InputSchema = {
  type: 'object',
  properties: {
    interaction: {
      type: 'object',
      description: 'Details of the interaction to learn from',
      properties: {
        userInput: { type: 'string', description: 'What the user said or requested' },
        aiResponse: { type: 'string', description: 'How the AI responded' },
        userFeedback: { type: 'string', description: 'User feedback on the interaction' },
        success: { type: 'boolean', description: 'Whether the interaction was successful' },
        context: { type: 'string', description: 'Additional context about the interaction' }
      },
    },
  },
  required: ['interaction'],
};

/**
 * Create learn_from_interaction handler with access to server state
 */
export function createLearnFromInteractionHandler(state: ServerState) {
  return function handleLearnFromInteraction(args: LearnFromInteractionInput): ToolResult {
    const { interaction } = args;
    const timestamp = new Date().toISOString();

    // Validate required fields
    if (!interaction) {
      throw new Error('Interaction object is required');
    }

    if (!interaction.userInput || typeof interaction.userInput !== 'string') {
      throw new Error('Interaction must have valid userInput (string)');
    }

    if (!interaction.aiResponse || typeof interaction.aiResponse !== 'string') {
      throw new Error('Interaction must have valid aiResponse (string)');
    }

    if (typeof interaction.success !== 'undefined' && typeof interaction.success !== 'boolean') {
      throw new Error('Interaction success must be a boolean if provided');
    }

    // Store validated interaction
    state.interactionHistory.push({
      ...interaction,
      timestamp,
      id: `interaction_${Date.now()}`
    });

    // Update performance metrics
    state.performanceMetrics.totalInteractions++;
    if (interaction.success !== false) {
      state.performanceMetrics.successfulInteractions++;
    }

    // Analyze patterns and improve
    const improvements: string[] = [];

    // Learn from feedback
    if (interaction.userFeedback) {
      state.feedbackData.push({
        feedback: interaction.userFeedback,
        timestamp,
        relatedInteraction: interaction
      });

      // Simple pattern recognition
      if (interaction.userFeedback.toLowerCase().includes('good') ||
          interaction.userFeedback.toLowerCase().includes('great')) {
        improvements.push('Positive feedback noted - reinforcing similar response patterns');

        // Add to knowledge base
        const newFact: Fact = {
          id: `fact_${Date.now()}`,
          content: `Successful interaction pattern: "${interaction.userInput}" -> "${interaction.aiResponse}"`,
          confidence: 0.7,
          source: 'user_feedback'
        };
        state.knowledgeBase.facts.push(newFact);
      }

      if (interaction.userFeedback.toLowerCase().includes('bad') ||
          interaction.userFeedback.toLowerCase().includes('improve')) {
        improvements.push('Constructive feedback noted - adjusting response patterns');

        // Learn what to avoid
        const newPattern: Pattern = {
          pattern: 'avoid_response_type',
          response_type: interaction.aiResponse,
          effectiveness: 0.2
        };
        state.knowledgeBase.patterns.push(newPattern);
      }
    }

    // Learn from context
    if (interaction.context) {
      const contextFact: Fact = {
        id: `context_${Date.now()}`,
        content: `Context learning: ${interaction.context}`,
        confidence: 0.6,
        source: 'context_analysis'
      };
      state.knowledgeBase.facts.push(contextFact);
    }

    const successRate = (state.performanceMetrics.successfulInteractions /
      state.performanceMetrics.totalInteractions * 100).toFixed(1);

    return createToolResult(
      `🧠 Learning completed successfully!

📊 Performance Update:
- Total interactions: ${state.performanceMetrics.totalInteractions}
- Success rate: ${successRate}%
- Knowledge base size: ${state.knowledgeBase.facts.length} facts, ${state.knowledgeBase.patterns.length} patterns

🔧 Improvements Made:
${improvements.map(imp => `- ${imp}`).join('\n') || '- No specific improvements needed'}

✅ Ready to provide better responses in future interactions!`
    );
  };
}
