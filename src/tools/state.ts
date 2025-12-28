/**
 * Server state interface for MCP tool handlers
 *
 * This module defines the shared state that tool handlers can access and modify.
 */

import type {
  PerformanceMetrics,
  ProductivityMetrics,
  KnowledgeBase,
  AutoOptimizationConfig,
  InteractionEntry,
  FeedbackEntry
} from '../types/index.js';

/**
 * Complete server state accessible to tool handlers
 */
export interface ServerState {
  interactionHistory: InteractionEntry[];
  feedbackData: FeedbackEntry[];
  performanceMetrics: PerformanceMetrics;
  productivityMetrics: ProductivityMetrics;
  knowledgeBase: KnowledgeBase;
  autoOptimization: AutoOptimizationConfig;
}

/**
 * Create initial server state with default values
 */
export function createInitialState(): ServerState {
  return {
    interactionHistory: [],
    feedbackData: [],
    performanceMetrics: {
      totalInteractions: 0,
      successfulInteractions: 0,
      averageResponseTime: 0,
      userSatisfaction: 0,
      toolUsageCount: {},
      productivityScore: 0.75,
      lastOptimization: null,
      errorCount: 0,
      lastError: null
    },
    productivityMetrics: {
      tasksCompleted: 0,
      efficiencyScore: 0.8,
      toolEffectiveness: {},
      userGoals: [],
      completedGoals: []
    },
    knowledgeBase: {
      facts: [
        { id: 'greeting_1', content: 'Users appreciate friendly greetings', confidence: 0.8, source: 'pattern_analysis' },
        { id: 'efficiency_1', content: 'Quick responses improve user satisfaction', confidence: 0.9, source: 'metrics_analysis' },
        { id: 'productivity_1', content: 'Tool usage increases task completion rates', confidence: 0.95, source: 'performance_analysis' },
        { id: 'optimization_1', content: 'Continuous optimization improves system performance', confidence: 0.9, source: 'system_analysis' }
      ],
      patterns: [
        { pattern: 'feedback_positive', response_type: 'acknowledgment', effectiveness: 0.85 },
        { pattern: 'feedback_negative', response_type: 'apology_and_improve', effectiveness: 0.75 },
        { pattern: 'tool_usage_success', response_type: 'enhance_tool_capabilities', effectiveness: 0.9 },
        { pattern: 'productivity_focus', response_type: 'prioritize_efficiency', effectiveness: 0.88 }
      ],
      preferences: {
        communicationStyle: 'professional',
        responseDetailLevel: 'balanced',
        learn_from_feedback: true,
        auto_optimize: true,
        productivity_focus: true,
        tool_usage_priority: true
      }
    },
    autoOptimization: {
      enabled: true,
      interval: 300000, // 5 minutes
      lastRun: Date.now(),
      priorityAreas: ['performance', 'productivity', 'tool_usage', 'response_time'],
      targetMetrics: {
        minSuccessRate: 0.85,
        maxResponseTime: 2000,
        minToolUsage: 0.7,
        targetProductivity: 0.9
      }
    }
  };
}
