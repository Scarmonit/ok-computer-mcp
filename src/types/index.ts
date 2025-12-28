/**
 * Core type definitions for OK Computer MCP Server
 *
 * This file defines the primary interfaces used throughout the MCP server.
 * Types are organized by domain: Tools, Prompts, Resources, Metrics, Knowledge.
 */

// =============================================================================
// MCP Protocol Types
// =============================================================================

/**
 * Content block returned in tool results
 */
export interface TextContent {
  readonly type: 'text';
  readonly text: string;
}

/**
 * Standard result returned by all tool handlers
 */
export interface ToolResult {
  readonly content: readonly TextContent[];
  readonly isError?: boolean;
}

/**
 * JSON Schema for tool input validation
 */
export interface InputSchema {
  type: 'object';
  properties: Record<string, PropertySchema>;
  required?: string[];
}

export interface PropertySchema {
  type: string;
  description?: string;
  enum?: string[];
  default?: unknown;
  properties?: Record<string, PropertySchema>;
  items?: PropertySchema;
  minimum?: number;
  maximum?: number;
}

/**
 * MCP Tool definition
 */
export interface MCPTool<TInput = unknown> {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: InputSchema;
  handler: (args: TInput) => ToolResult | Promise<ToolResult>;
}

/**
 * MCP Prompt definition
 */
export interface MCPPrompt<TArgs = unknown> {
  readonly name: string;
  readonly description: string;
  readonly arguments?: PromptArgument[];
  handler: (args: TArgs) => PromptResult;
}

export interface PromptArgument {
  readonly name: string;
  readonly description: string;
  readonly required?: boolean;
}

export interface PromptResult {
  messages: PromptMessage[];
}

export interface PromptMessage {
  role: 'user' | 'assistant';
  content: {
    type: 'text';
    text: string;
  };
}

/**
 * MCP Resource definition
 */
export interface MCPResource {
  readonly uri: string;
  readonly name: string;
  readonly description: string;
  readonly mimeType: string;
  readonly content: ResourceContent;
}

export interface ResourceContent {
  uri: string;
  mimeType: string;
  text: string;
}

// =============================================================================
// Performance Metrics Types
// =============================================================================

/**
 * Error record for tracking failures
 */
export interface ErrorRecord {
  readonly tool: string;
  readonly message: string;
  readonly timestamp: string;
  readonly stack?: string;
}

/**
 * Performance metrics tracked by the server
 */
export interface PerformanceMetrics {
  totalInteractions: number;
  successfulInteractions: number;
  averageResponseTime: number;
  userSatisfaction: number;
  toolUsageCount: Record<string, number>;
  productivityScore: number;
  lastOptimization: string | null;
  errorCount: number;
  lastError: ErrorRecord | null;
  lastSuccessfulOptimization?: number;
  optimizationSuccessCount?: number;
  optimizationFailureCount?: number;
  lastOptimizationError?: ErrorRecord;
}

// =============================================================================
// Productivity Metrics Types
// =============================================================================

/**
 * Statistics for individual tool usage
 */
export interface ToolStats {
  uses: number;
  success: number;
}

/**
 * Priority levels for goals
 */
export type GoalPriority = 'low' | 'medium' | 'high';

/**
 * User productivity goal
 */
export interface ProductivityGoal {
  readonly id: string;
  readonly description: string;
  readonly priority: GoalPriority;
  readonly deadline?: string;
  readonly created: string;
  readonly completed?: string;
}

/**
 * Productivity metrics tracked by the server
 */
export interface ProductivityMetrics {
  tasksCompleted: number;
  efficiencyScore: number;
  toolEffectiveness: Record<string, ToolStats>;
  userGoals: ProductivityGoal[];
  completedGoals: ProductivityGoal[];
}

// =============================================================================
// Knowledge Base Types
// =============================================================================

/**
 * Valid sources for facts in the knowledge base
 */
export type FactSource =
  | 'pattern_analysis'
  | 'metrics_analysis'
  | 'performance_analysis'
  | 'system_analysis'
  | 'user_feedback'
  | 'context_analysis'
  | 'behavioral_adaptation'
  | 'automatic_optimization';

/**
 * A fact stored in the knowledge base
 */
export interface Fact {
  readonly id: string;
  readonly content: string;
  readonly confidence: number;
  readonly source: FactSource;
  readonly timestamp?: string;
}

/**
 * A learned pattern in the knowledge base
 */
export interface Pattern {
  readonly pattern: string;
  readonly response_type: string;
  readonly effectiveness: number;
}

/**
 * Communication styles for AI behavior
 */
export type CommunicationStyle =
  | 'formal'
  | 'casual'
  | 'technical'
  | 'friendly'
  | 'professional';

/**
 * Response detail levels
 */
export type ResponseDetailLevel =
  | 'concise'
  | 'balanced'
  | 'detailed'
  | 'comprehensive';

/**
 * Proactivity levels for AI behavior
 */
export type ProactivityLevel =
  | 'passive'
  | 'responsive'
  | 'proactive'
  | 'very_proactive';

/**
 * Learning rate settings
 */
export type LearningRate =
  | 'conservative'
  | 'moderate'
  | 'aggressive';

/**
 * User preferences stored in knowledge base
 */
export interface Preferences {
  communicationStyle: CommunicationStyle;
  responseDetailLevel: ResponseDetailLevel;
  learn_from_feedback: boolean;
  auto_optimize: boolean;
  productivity_focus: boolean;
  tool_usage_priority: boolean;
  proactivityLevel?: ProactivityLevel;
  learningRate?: LearningRate;
  [key: string]: unknown; // Allow custom preferences
}

/**
 * Complete knowledge base structure
 */
export interface KnowledgeBase {
  facts: Fact[];
  patterns: Pattern[];
  preferences: Preferences;
}

// =============================================================================
// Auto-Optimization Types
// =============================================================================

/**
 * Optimization priority areas
 */
export type OptimizationPriority =
  | 'performance'
  | 'productivity'
  | 'tool_usage'
  | 'response_time'
  | 'balanced';

/**
 * Target metrics for auto-optimization
 */
export interface OptimizationTargets {
  readonly minSuccessRate: number;
  readonly maxResponseTime: number;
  readonly minToolUsage: number;
  readonly targetProductivity: number;
}

/**
 * Auto-optimization configuration
 */
export interface AutoOptimizationConfig {
  enabled: boolean;
  readonly interval: number;
  lastRun: number;
  readonly priorityAreas: readonly OptimizationPriority[];
  readonly targetMetrics: OptimizationTargets;
}

// =============================================================================
// Tool Input Types
// =============================================================================

/**
 * Input for learn_from_interaction tool
 */
export interface LearnFromInteractionInput {
  interaction: {
    userInput: string;
    aiResponse: string;
    userFeedback?: string;
    success?: boolean;
    context?: string;
  };
}

/**
 * Input for get_learning_insights tool
 */
export interface GetLearningInsightsInput {
  detailLevel?: 'summary' | 'detailed' | 'full';
  focusArea?: 'performance' | 'patterns' | 'knowledge' | 'feedback' | 'all';
}

/**
 * Input for adapt_behavior tool
 */
export interface AdaptBehaviorInput {
  adaptation: {
    communicationStyle?: CommunicationStyle;
    responseDetailLevel?: ResponseDetailLevel;
    proactivityLevel?: ProactivityLevel;
    learningRate?: LearningRate;
    customPreferences?: Record<string, unknown>;
  };
  reason?: string;
}

/**
 * Input for optimize_performance tool
 */
export interface OptimizePerformanceInput {
  optimizationType?: 'response_time' | 'accuracy' | 'user_satisfaction' | 'efficiency' | 'comprehensive';
  includeImplementation?: boolean;
}

/**
 * Input for auto_optimize tool
 */
export interface AutoOptimizeInput {
  priority?: OptimizationPriority;
  force?: boolean;
  aggressive?: boolean;
}

/**
 * Task input for track_productivity
 */
export interface TaskInput {
  name: string;
  type?: string;
  toolsUsed?: string[];
  duration?: number;
  success?: boolean;
  efficiency?: number;
}

/**
 * Goal input for track_productivity
 */
export interface GoalInput {
  description: string;
  priority?: GoalPriority;
  deadline?: string;
}

/**
 * Input for track_productivity tool
 */
export interface TrackProductivityInput {
  action?: 'add_task' | 'complete_task' | 'set_goal' | 'get_metrics' | 'analyze_efficiency';
  task?: TaskInput;
  goal?: GoalInput;
}

/**
 * Input for enhance_tool_usage tool
 */
export interface EnhanceToolUsageInput {
  analysisType?: 'usage_patterns' | 'effectiveness' | 'recommendations' | 'comprehensive';
  timeframe?: 'recent' | 'hour' | 'day' | 'all';
  targetTools?: string[];
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Interaction history entry
 */
export interface InteractionEntry {
  readonly userInput: string;
  readonly aiResponse: string;
  readonly timestamp: string;
  readonly success?: boolean;
  readonly feedback?: string;
}

/**
 * Feedback data entry
 */
export interface FeedbackEntry {
  readonly content: string;
  readonly sentiment: 'positive' | 'negative' | 'neutral';
  readonly timestamp: string;
}

/**
 * Server configuration
 */
export interface ServerConfig {
  readonly name: string;
  readonly version: string;
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a successful tool result
 */
export function createToolResult(text: string): ToolResult {
  return {
    content: [{ type: 'text', text }]
  };
}

/**
 * Create an error tool result
 */
export function createErrorResult(text: string): ToolResult {
  return {
    content: [{ type: 'text', text }],
    isError: true
  };
}
