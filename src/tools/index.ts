/**
 * Tool handlers barrel export
 *
 * Re-exports all tool handlers and their schemas for use in the main server.
 */

// State management
export { createInitialState } from './state.js';
export type { ServerState } from './state.js';

// Echo tool (stateless)
export { echoTool, echoInputSchema, handleEcho } from './echo.js';

// System info tool (stateless)
export { systemInfoTool, systemInfoInputSchema, handleSystemInfo } from './system-info.js';

// Stateful tool handler factories
export {
  learnFromInteractionInputSchema,
  createLearnFromInteractionHandler
} from './learn-from-interaction.js';

export {
  getLearningInsightsInputSchema,
  createGetLearningInsightsHandler
} from './get-learning-insights.js';

export {
  adaptBehaviorInputSchema,
  createAdaptBehaviorHandler
} from './adapt-behavior.js';

export {
  optimizePerformanceInputSchema,
  createOptimizePerformanceHandler
} from './optimize-performance.js';

export {
  autoOptimizeInputSchema,
  createAutoOptimizeHandler
} from './auto-optimize.js';

export {
  trackProductivityInputSchema,
  createTrackProductivityHandler
} from './track-productivity.js';

export {
  enhanceToolUsageInputSchema,
  createEnhanceToolUsageHandler
} from './enhance-tool-usage.js';
