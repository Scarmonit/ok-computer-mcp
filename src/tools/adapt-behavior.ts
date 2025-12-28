/**
 * Adapt behavior tool handler
 *
 * Adapts AI behavior based on learned patterns and user preferences.
 */

import type {
  ToolResult,
  AdaptBehaviorInput,
  InputSchema,
  Fact
} from '../types/index.js';
import { createToolResult, createErrorResult } from '../types/index.js';
import type { ServerState } from './state.js';

/**
 * Input schema for adapt_behavior tool
 */
export const adaptBehaviorInputSchema: InputSchema = {
  type: 'object',
  properties: {
    adaptation: {
      type: 'object',
      description: 'Behavior adaptation parameters',
      properties: {
        communicationStyle: {
          type: 'string',
          enum: ['formal', 'casual', 'technical', 'friendly', 'professional'],
          description: 'How the AI should communicate'
        },
        responseDetailLevel: {
          type: 'string',
          enum: ['concise', 'balanced', 'detailed', 'comprehensive'],
          description: 'How detailed responses should be'
        },
        proactivityLevel: {
          type: 'string',
          enum: ['passive', 'responsive', 'proactive', 'very_proactive'],
          description: 'How proactive the AI should be'
        },
        learningRate: {
          type: 'string',
          enum: ['conservative', 'moderate', 'aggressive'],
          description: 'How quickly the AI should adopt new behaviors'
        },
        customPreferences: {
          type: 'object',
          description: 'Custom user preferences as key-value pairs'
        }
      }
    },
    reason: {
      type: 'string',
      description: 'Reason for this adaptation (helps with learning)'
    }
  },
  required: ['adaptation']
};

/**
 * Create adapt_behavior handler with access to server state
 */
export function createAdaptBehaviorHandler(state: ServerState) {
  return function handleAdaptBehavior(args: AdaptBehaviorInput): ToolResult {
    const { adaptation, reason } = args;

    // Validate adaptation object exists
    if (!adaptation || typeof adaptation !== 'object' || Array.isArray(adaptation)) {
      return createErrorResult('❌ Adaptation object is required and must be an object');
    }

    // Update preferences
    const changes: string[] = [];

    if (adaptation.communicationStyle) {
      const oldStyle = state.knowledgeBase.preferences.communicationStyle;
      state.knowledgeBase.preferences.communicationStyle = adaptation.communicationStyle;
      changes.push(`Communication style: ${oldStyle} → ${adaptation.communicationStyle}`);
    }

    if (adaptation.responseDetailLevel) {
      const oldLevel = state.knowledgeBase.preferences.responseDetailLevel;
      state.knowledgeBase.preferences.responseDetailLevel = adaptation.responseDetailLevel;
      changes.push(`Response detail: ${oldLevel} → ${adaptation.responseDetailLevel}`);
    }

    if (adaptation.proactivityLevel) {
      state.knowledgeBase.preferences.proactivityLevel = adaptation.proactivityLevel;
      changes.push(`Proactivity level: ${adaptation.proactivityLevel}`);
    }

    if (adaptation.learningRate) {
      state.knowledgeBase.preferences.learningRate = adaptation.learningRate;
      changes.push(`Learning rate: ${adaptation.learningRate}`);
    }

    if (adaptation.customPreferences) {
      if (!state.knowledgeBase.preferences.customPreferences) {
        state.knowledgeBase.preferences.customPreferences = {};
      }
      Object.assign(state.knowledgeBase.preferences.customPreferences, adaptation.customPreferences);
      changes.push(`Custom preferences: ${Object.keys(adaptation.customPreferences).join(', ')}`);
    }

    // Log the adaptation
    const adaptationFact: Fact = {
      id: `adaptation_${Date.now()}`,
      content: `Behavior adaptation: ${changes.join(', ')}${reason ? ` (Reason: ${reason})` : ''}`,
      confidence: 0.9,
      source: 'behavioral_adaptation'
    };
    state.knowledgeBase.facts.push(adaptationFact);

    return createToolResult(
      `🎯 Behavior Adaptation Complete!

${changes.map(change => `✅ ${change}`).join('\n') || '✅ No changes applied'}

🔄 AI behavior has been updated based on learned patterns and preferences.
${reason ? `\n💭 Adaptation reason: ${reason}` : ''}

🚀 Future interactions will reflect these new behavioral preferences!`
    );
  };
}
