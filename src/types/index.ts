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
 * JSON Schema types supported by MCP
 */
export type JSONSchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null';

/**
 * Content block returned in tool results
 */
export interface TextContent {
  readonly type: 'text';
  readonly text: string;
}

/**
 * Standard result returned by all tool handlers
 * Index signature required for MCP SDK compatibility
 */
export interface ToolResult {
  readonly content: readonly TextContent[];
  readonly isError?: boolean;
  readonly [key: string]: unknown;
}

/**
 * JSON Schema for tool input validation
 */
export interface InputSchema {
  readonly type: 'object';
  readonly properties: Readonly<Record<string, PropertySchema>>;
  readonly required?: readonly string[];
}

export interface PropertySchema {
  readonly type: JSONSchemaType;
  readonly description?: string;
  readonly enum?: readonly string[];
  readonly default?: unknown;
  readonly properties?: Readonly<Record<string, PropertySchema>>;
  readonly items?: PropertySchema;
  readonly minimum?: number;
  readonly maximum?: number;
}

/**
 * MCP Tool definition
 */
export interface MCPTool<TInput = unknown> {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: InputSchema;
  readonly handler: (args: TInput) => ToolResult | Promise<ToolResult>;
}

/**
 * MCP Prompt definition
 */
export interface MCPPrompt<TArgs = unknown> {
  readonly name: string;
  readonly description: string;
  readonly arguments?: readonly PromptArgument[];
  readonly handler: (args: TArgs) => PromptResult;
}

export interface PromptArgument {
  readonly name: string;
  readonly description: string;
  readonly required?: boolean;
}

/**
 * Result from prompt handler
 * Index signature required for MCP SDK compatibility
 */
export interface PromptResult {
  readonly messages: readonly PromptMessage[];
  readonly [key: string]: unknown;
}

export interface PromptMessage {
  readonly role: 'user' | 'assistant';
  readonly content: {
    readonly type: 'text';
    readonly text: string;
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

/**
 * Resource content returned by resource handlers
 * Index signature required for MCP SDK compatibility
 */
export interface ResourceContent {
  readonly uri: string;
  readonly mimeType: string;
  readonly text: string;
  readonly [key: string]: unknown;
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
 * @property userSatisfaction - Score from 0 to 1
 * @property productivityScore - Score from 0 to 1
 */
export interface PerformanceMetrics {
  totalInteractions: number;
  successfulInteractions: number;
  averageResponseTime: number;
  /** Score from 0 to 1 */
  userSatisfaction: number;
  toolUsageCount: Record<string, number>;
  /** Score from 0 to 1 */
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
 * @property efficiencyScore - Score from 0 to 1
 */
export interface ProductivityMetrics {
  tasksCompleted: number;
  /** Score from 0 to 1 */
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
 * @property confidence - Score from 0 to 1
 */
export interface Fact {
  readonly id: string;
  readonly content: string;
  /** Score from 0 to 1 */
  readonly confidence: number;
  readonly source: FactSource;
  readonly timestamp?: string;
}

/**
 * A learned pattern in the knowledge base
 * @property effectiveness - Score from 0 to 1
 */
export interface Pattern {
  readonly pattern: string;
  readonly response_type: string;
  /** Score from 0 to 1 */
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
 * Core user preferences (typed)
 */
export interface CorePreferences {
  communicationStyle: CommunicationStyle;
  responseDetailLevel: ResponseDetailLevel;
  learn_from_feedback: boolean;
  auto_optimize: boolean;
  productivity_focus: boolean;
  tool_usage_priority: boolean;
  proactivityLevel?: ProactivityLevel;
  learningRate?: LearningRate;
}

/**
 * User preferences with custom extensions
 */
export interface Preferences extends CorePreferences {
  customPreferences?: Record<string, unknown>;
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
 * All scores are from 0 to 1
 */
export interface OptimizationTargets {
  /** Minimum success rate (0-1) */
  readonly minSuccessRate: number;
  /** Maximum response time in milliseconds */
  readonly maxResponseTime: number;
  /** Minimum tool usage rate (0-1) */
  readonly minToolUsage: number;
  /** Target productivity score (0-1) */
  readonly targetProductivity: number;
}

/**
 * Auto-optimization configuration
 */
export interface AutoOptimizationConfig {
  enabled: boolean;
  /** Optimization interval in milliseconds */
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
 * @property efficiency - Score from 0 to 1
 */
export interface TaskInput {
  name: string;
  type?: string;
  toolsUsed?: string[];
  duration?: number;
  success?: boolean;
  /** Score from 0 to 1 */
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
// Echo and System Info Input Types
// =============================================================================

/**
 * Input for echo tool
 */
export interface EchoInput {
  message: string;
}

/**
 * Input for system_info tool
 */
export interface SystemInfoInput {
  detail?: 'basic' | 'full';
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
  readonly id?: string;
}

/**
 * Feedback data entry
 */
export interface FeedbackEntry {
  readonly feedback: string;
  readonly timestamp: string;
  readonly relatedInteraction?: unknown;
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

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Check if a value is a valid FactSource
 */
export function isFactSource(value: unknown): value is FactSource {
  const sources: FactSource[] = [
    'pattern_analysis', 'metrics_analysis', 'performance_analysis',
    'system_analysis', 'user_feedback', 'context_analysis',
    'behavioral_adaptation', 'automatic_optimization'
  ];
  return typeof value === 'string' && sources.includes(value as FactSource);
}

/**
 * Check if a value is a valid CommunicationStyle
 */
export function isCommunicationStyle(value: unknown): value is CommunicationStyle {
  return ['formal', 'casual', 'technical', 'friendly', 'professional'].includes(value as string);
}

/**
 * Check if a value is a valid confidence score (0-1)
 */
export function isValidConfidence(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && value >= 0 && value <= 1;
}

/**
 * Check if a value is a valid GoalPriority
 */
export function isGoalPriority(value: unknown): value is GoalPriority {
  return ['low', 'medium', 'high'].includes(value as string);
}
