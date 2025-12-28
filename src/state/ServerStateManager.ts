/**
 * ServerStateManager - Centralized state management for MCP server
 *
 * Encapsulates all server state operations with:
 * - Private state storage
 * - Validated mutations
 * - Bounded collections to prevent memory leaks
 * - Helper methods for common calculations
 *
 * @module state/ServerStateManager
 */

import type {
  PerformanceMetrics,
  ProductivityMetrics,
  KnowledgeBase,
  AutoOptimizationConfig,
  InteractionEntry,
  FeedbackEntry,
  Fact,
  Pattern,
  Preferences,
  ProductivityGoal,
  ToolStats,
  ErrorRecord
} from '../types/index.js';

import { isValidConfidence, isFactSource, isCommunicationStyle } from '../types/index.js';
import { calculateSuccessRate, formatPercentage, formatToolStats } from '../utils/metrics.js';

/**
 * Configuration options for ServerStateManager
 */
export interface StateManagerConfig {
  /** Maximum number of interactions to keep in history */
  maxHistorySize?: number;
  /** Maximum number of feedback entries to keep */
  maxFeedbackSize?: number;
  /** Maximum number of facts in knowledge base */
  maxFactsSize?: number;
  /** Maximum number of patterns in knowledge base */
  maxPatternsSize?: number;
  /** Maximum number of goals to track */
  maxGoalsSize?: number;
}

/**
 * Complete server state structure
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
 * Default configuration values
 */
const DEFAULT_CONFIG: Required<StateManagerConfig> = {
  maxHistorySize: 1000,
  maxFeedbackSize: 500,
  maxFactsSize: 200,
  maxPatternsSize: 100,
  maxGoalsSize: 50
};

/**
 * ServerStateManager class
 *
 * Manages all server state with encapsulation, validation, and bounded collections.
 *
 * @example
 * ```typescript
 * const stateManager = new ServerStateManager();
 *
 * // Record an interaction
 * stateManager.addInteraction({
 *   id: 'int_123',
 *   userInput: 'Hello',
 *   aiResponse: 'Hi there!',
 *   timestamp: new Date().toISOString(),
 *   success: true
 * });
 *
 * // Get success rate
 * const rate = stateManager.getSuccessRate(); // 0.85
 * ```
 */
export class ServerStateManager {
  private readonly state: ServerState;
  private readonly config: Required<StateManagerConfig>;

  /**
   * Create a new ServerStateManager instance
   * @param config - Optional configuration overrides
   */
  constructor(config?: StateManagerConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = this.createInitialState();
  }

  // ============================================================================
  // State Initialization
  // ============================================================================

  /**
   * Create initial server state with default values
   */
  private createInitialState(): ServerState {
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

  // ============================================================================
  // Read-Only Accessors
  // ============================================================================

  /**
   * Get the full state object (for backward compatibility)
   * @returns The complete server state
   */
  getState(): ServerState {
    return this.state;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): Readonly<PerformanceMetrics> {
    return this.state.performanceMetrics;
  }

  /**
   * Get productivity metrics
   */
  getProductivityMetrics(): Readonly<ProductivityMetrics> {
    return this.state.productivityMetrics;
  }

  /**
   * Get knowledge base
   */
  getKnowledgeBase(): Readonly<KnowledgeBase> {
    return this.state.knowledgeBase;
  }

  /**
   * Get auto-optimization configuration
   */
  getAutoOptimization(): Readonly<AutoOptimizationConfig> {
    return this.state.autoOptimization;
  }

  /**
   * Get interaction history
   */
  getInteractionHistory(): readonly InteractionEntry[] {
    return this.state.interactionHistory;
  }

  /**
   * Get feedback data
   */
  getFeedbackData(): readonly FeedbackEntry[] {
    return this.state.feedbackData;
  }

  /**
   * Get current preferences
   */
  getPreferences(): Readonly<Preferences> {
    return this.state.knowledgeBase.preferences;
  }

  // ============================================================================
  // Metrics Calculations
  // ============================================================================

  /**
   * Calculate current success rate
   * @returns Success rate as decimal (0-1)
   */
  getSuccessRate(): number {
    const { totalInteractions, successfulInteractions } = this.state.performanceMetrics;
    return calculateSuccessRate(totalInteractions, successfulInteractions);
  }

  /**
   * Get formatted success rate as percentage string
   * @returns Formatted percentage (e.g., "85.5")
   */
  formatSuccessRate(): string {
    return formatPercentage(this.getSuccessRate());
  }

  /**
   * Get average tool usage rate
   * @returns Tool usage rate as decimal (0-1)
   */
  getAverageToolUsage(): number {
    const toolUsage = Object.values(this.state.performanceMetrics.toolUsageCount);
    const totalUsage = toolUsage.reduce((a, b) => a + b, 0);
    return totalUsage / Math.max(this.state.performanceMetrics.totalInteractions, 1);
  }

  /**
   * Get formatted tool effectiveness statistics
   * @returns Multi-line string of tool stats
   */
  getToolEffectivenessStats(): string {
    return formatToolStats(this.state.productivityMetrics.toolEffectiveness);
  }

  // ============================================================================
  // Interaction Management
  // ============================================================================

  /**
   * Add an interaction to history
   * Automatically evicts oldest entries when limit is reached
   * @param entry - Interaction entry to add
   */
  addInteraction(entry: InteractionEntry): void {
    this.state.interactionHistory.push(entry);
    this.pruneArray(this.state.interactionHistory, this.config.maxHistorySize);

    // Update metrics
    this.state.performanceMetrics.totalInteractions++;
    if (entry.success) {
      this.state.performanceMetrics.successfulInteractions++;
    }
  }

  /**
   * Add feedback data
   * @param entry - Feedback entry to add
   */
  addFeedback(entry: FeedbackEntry): void {
    this.state.feedbackData.push(entry);
    this.pruneArray(this.state.feedbackData, this.config.maxFeedbackSize);
  }

  // ============================================================================
  // Knowledge Base Management
  // ============================================================================

  /**
   * Add a fact to the knowledge base
   * @param fact - Fact to add
   * @throws Error if confidence is invalid
   */
  addFact(fact: Fact): void {
    if (!isValidConfidence(fact.confidence)) {
      throw new Error(`Invalid confidence score: ${fact.confidence}. Must be between 0 and 1.`);
    }
    if (!isFactSource(fact.source)) {
      throw new Error(`Invalid fact source: ${fact.source}`);
    }

    this.state.knowledgeBase.facts.push(fact);
    this.pruneArray(this.state.knowledgeBase.facts, this.config.maxFactsSize);
  }

  /**
   * Add a pattern to the knowledge base
   * @param pattern - Pattern to add
   */
  addPattern(pattern: Pattern): void {
    this.state.knowledgeBase.patterns.push(pattern);
    this.pruneArray(this.state.knowledgeBase.patterns, this.config.maxPatternsSize);
  }

  /**
   * Update preferences
   * @param updates - Partial preferences to merge
   */
  updatePreferences(updates: Partial<Preferences>): void {
    if (updates.communicationStyle && !isCommunicationStyle(updates.communicationStyle)) {
      throw new Error(`Invalid communication style: ${updates.communicationStyle}`);
    }

    Object.assign(this.state.knowledgeBase.preferences, updates);
  }

  // ============================================================================
  // Productivity Management
  // ============================================================================

  /**
   * Increment tasks completed counter
   */
  incrementTasksCompleted(): void {
    this.state.productivityMetrics.tasksCompleted++;
  }

  /**
   * Update efficiency score
   * @param efficiency - New efficiency value (0-1)
   */
  updateEfficiencyScore(efficiency: number): void {
    if (efficiency < 0 || efficiency > 1) {
      throw new Error(`Invalid efficiency score: ${efficiency}. Must be between 0 and 1.`);
    }
    // Weighted average: 90% old, 10% new
    this.state.productivityMetrics.efficiencyScore =
      (this.state.productivityMetrics.efficiencyScore * 0.9) + (efficiency * 0.1);
  }

  /**
   * Track tool usage effectiveness
   * @param toolName - Name of the tool
   * @param success - Whether the tool use was successful
   */
  trackToolUsage(toolName: string, success: boolean): void {
    // Track in performance metrics
    this.state.performanceMetrics.toolUsageCount[toolName] =
      (this.state.performanceMetrics.toolUsageCount[toolName] || 0) + 1;

    // Track effectiveness
    if (!this.state.productivityMetrics.toolEffectiveness[toolName]) {
      this.state.productivityMetrics.toolEffectiveness[toolName] = { uses: 0, success: 0 };
    }
    this.state.productivityMetrics.toolEffectiveness[toolName].uses++;
    if (success) {
      this.state.productivityMetrics.toolEffectiveness[toolName].success++;
    }
  }

  /**
   * Add a productivity goal
   * @param goal - Goal to add
   */
  addGoal(goal: ProductivityGoal): void {
    this.state.productivityMetrics.userGoals.push(goal);
    this.pruneArray(this.state.productivityMetrics.userGoals, this.config.maxGoalsSize);
  }

  /**
   * Complete a goal
   * @param goalId - ID of the goal to complete
   */
  completeGoal(goalId: string): boolean {
    const index = this.state.productivityMetrics.userGoals.findIndex(g => g.id === goalId);
    if (index === -1) return false;

    const [goal] = this.state.productivityMetrics.userGoals.splice(index, 1);
    this.state.productivityMetrics.completedGoals.push(goal);
    return true;
  }

  // ============================================================================
  // Performance Metrics Management
  // ============================================================================

  /**
   * Update productivity score
   * @param score - New score (clamped to 0-1)
   */
  updateProductivityScore(score: number): void {
    this.state.performanceMetrics.productivityScore = Math.min(1.0, Math.max(0, score));
  }

  /**
   * Increment productivity score by amount
   * @param amount - Amount to increment (clamped to max 1.0)
   */
  incrementProductivityScore(amount: number): void {
    this.updateProductivityScore(this.state.performanceMetrics.productivityScore + amount);
  }

  /**
   * Update average response time
   * @param responseTime - New response time in ms
   */
  updateAverageResponseTime(responseTime: number): void {
    this.state.performanceMetrics.averageResponseTime =
      (this.state.performanceMetrics.averageResponseTime + responseTime) / 2;
  }

  /**
   * Record an error
   * @param error - Error record to store
   */
  recordError(error: ErrorRecord): void {
    this.state.performanceMetrics.errorCount++;
    this.state.performanceMetrics.lastError = error;
  }

  /**
   * Record last optimization timestamp
   */
  recordOptimization(): void {
    this.state.performanceMetrics.lastOptimization = new Date().toISOString();
  }

  // ============================================================================
  // Auto-Optimization Management
  // ============================================================================

  /**
   * Update last run timestamp
   */
  updateAutoOptimizationLastRun(): void {
    this.state.autoOptimization.lastRun = Date.now();
  }

  /**
   * Check if optimization should run
   * @param force - Force optimization regardless of timing
   */
  shouldOptimize(force = false): boolean {
    if (force) return true;
    const elapsed = Date.now() - this.state.autoOptimization.lastRun;
    return elapsed >= this.state.autoOptimization.interval;
  }

  /**
   * Enable or disable auto-optimization
   * @param enabled - Whether to enable
   */
  setAutoOptimizationEnabled(enabled: boolean): void {
    this.state.autoOptimization.enabled = enabled;
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  /**
   * Prune array to maximum size by removing oldest entries
   * @param array - Array to prune
   * @param maxSize - Maximum allowed size
   */
  private pruneArray<T>(array: T[], maxSize: number): void {
    while (array.length > maxSize) {
      array.shift(); // Remove oldest (first) entry
    }
  }

  // ============================================================================
  // Efficiency Analysis
  // ============================================================================

  /**
   * Generate efficiency analysis report
   * @returns Formatted efficiency analysis string
   */
  analyzeEfficiency(): string {
    const toolStats = this.getToolEffectivenessStats();

    return `📈 Efficiency Analysis

🎯 Current Efficiency Score: ${formatPercentage(this.state.productivityMetrics.efficiencyScore)}%
📊 Productivity Score: ${formatPercentage(this.state.performanceMetrics.productivityScore)}%

🛠️ Tool Effectiveness:
${toolStats}

💡 Recommendations:
- Focus on high-effectiveness tools
- Track task completion more consistently
- Set measurable goals with deadlines`;
  }
}

/**
 * Create a new ServerStateManager instance
 * Factory function for backward compatibility
 * @param config - Optional configuration
 */
export function createStateManager(config?: StateManagerConfig): ServerStateManager {
  return new ServerStateManager(config);
}
