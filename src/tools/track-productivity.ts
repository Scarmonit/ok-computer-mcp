/**
 * Track productivity tool handler
 *
 * Tracks and analyzes productivity metrics.
 */

import type {
  ToolResult,
  TrackProductivityInput,
  InputSchema,
  ProductivityGoal
} from '../types/index.js';
import { createToolResult, createErrorResult } from '../types/index.js';
import type { ServerState } from './state.js';

/**
 * Input schema for track_productivity tool
 */
export const trackProductivityInputSchema: InputSchema = {
  type: 'object',
  properties: {
    task: {
      type: 'object',
      description: 'Task information to track',
      properties: {
        name: { type: 'string', description: 'Task name or description' },
        type: { type: 'string', description: 'Type of task' },
        toolsUsed: { type: 'array', items: { type: 'string' }, description: 'Tools used for this task' },
        duration: { type: 'number', description: 'Time taken in seconds' },
        success: { type: 'boolean', description: 'Whether task was completed successfully' },
        efficiency: { type: 'number', description: 'Efficiency rating (0-1)' }
      }
    },
    goal: {
      type: 'object',
      description: 'Productivity goal to set or update',
      properties: {
        description: { type: 'string', description: 'Goal description' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Goal priority' },
        deadline: { type: 'string', description: 'Target completion date (ISO string)' }
      }
    },
    action: {
      type: 'string',
      enum: ['add_task', 'complete_task', 'set_goal', 'get_metrics', 'analyze_efficiency'],
      description: 'Action to perform',
      default: 'get_metrics'
    }
  }
};

/**
 * Create track_productivity handler with access to server state
 */
export function createTrackProductivityHandler(state: ServerState) {
  /**
   * Analyze efficiency helper
   */
  function analyzeEfficiency(): string {
    const toolStats = Object.entries(state.productivityMetrics.toolEffectiveness)
      .map(([tool, stats]) => {
        const rate = stats.uses > 0 ? (stats.success / stats.uses * 100).toFixed(1) : 'N/A';
        return `${tool}: ${rate}% success rate`;
      })
      .join('\n');

    return `📈 Efficiency Analysis

🎯 Current Efficiency Score: ${(state.productivityMetrics.efficiencyScore * 100).toFixed(1)}%
📊 Productivity Score: ${(state.performanceMetrics.productivityScore * 100).toFixed(1)}%

🛠️ Tool Effectiveness:
${toolStats || 'No tool usage data available'}

💡 Recommendations:
- Focus on high-effectiveness tools
- Track task completion more consistently
- Set measurable goals with deadlines`;
  }

  return function handleTrackProductivity(args: TrackProductivityInput): ToolResult {
    const { action = 'get_metrics', task, goal } = args;

    switch (action) {
      case 'add_task': {
        if (!task) {
          return createErrorResult('❌ Task information required');
        }

        // Validate task structure
        if (!task.name || typeof task.name !== 'string') {
          console.error('Invalid task: missing or non-string name', { task });
          return createErrorResult('❌ Task name must be a non-empty string');
        }

        if (task.efficiency !== undefined && typeof task.efficiency !== 'number') {
          console.error('Invalid task: non-numeric efficiency', { task });
          return createErrorResult('❌ Task efficiency must be a number (0-1)');
        }

        if (task.efficiency !== undefined && (task.efficiency < 0 || task.efficiency > 1)) {
          console.error('Invalid task: efficiency out of range', { task });
          return createErrorResult('❌ Task efficiency must be between 0 and 1');
        }

        // Validate toolsUsed if present
        if (task.toolsUsed) {
          if (!Array.isArray(task.toolsUsed)) {
            console.error('Invalid task: toolsUsed not an array', { task });
            return createErrorResult('❌ toolsUsed must be an array of strings');
          }

          for (const tool of task.toolsUsed) {
            if (typeof tool !== 'string') {
              console.error('Invalid tool in toolsUsed array', { task, invalidTool: tool });
              return createErrorResult(`❌ All tools must be strings, found ${typeof tool}`);
            }
          }
        }

        // Now update metrics with validated data
        state.productivityMetrics.tasksCompleted++;

        // Track tool effectiveness
        if (task.toolsUsed) {
          task.toolsUsed.forEach(tool => {
            if (!state.productivityMetrics.toolEffectiveness[tool]) {
              state.productivityMetrics.toolEffectiveness[tool] = { uses: 0, success: 0 };
            }
            state.productivityMetrics.toolEffectiveness[tool].uses++;
            if (task.success !== false) {
              state.productivityMetrics.toolEffectiveness[tool].success++;
            }
          });
        }

        // Update efficiency score
        if (task.efficiency) {
          state.productivityMetrics.efficiencyScore =
            (state.productivityMetrics.efficiencyScore * 0.9) + (task.efficiency * 0.1);
        }

        return createToolResult(
          `✅ Task tracked: ${task.name}
📊 Productivity metrics updated
🎯 Tasks completed: ${state.productivityMetrics.tasksCompleted}
⚡ Current efficiency: ${(state.productivityMetrics.efficiencyScore * 100).toFixed(1)}%`
        );
      }

      case 'complete_task': {
        state.productivityMetrics.tasksCompleted++;
        state.performanceMetrics.productivityScore = Math.min(1.0, state.performanceMetrics.productivityScore + 0.02);

        return createToolResult(
          `🎉 Task completed!
📈 Productivity score: ${(state.performanceMetrics.productivityScore * 100).toFixed(1)}%
✅ Total tasks completed: ${state.productivityMetrics.tasksCompleted}`
        );
      }

      case 'set_goal': {
        if (!goal) {
          return createErrorResult('❌ Goal information required');
        }

        const newGoal: ProductivityGoal = {
          id: `goal_${Date.now()}`,
          description: goal.description,
          priority: goal.priority || 'medium',
          deadline: goal.deadline,
          created: new Date().toISOString()
        };

        state.productivityMetrics.userGoals.push(newGoal);

        return createToolResult(
          `🎯 Goal set: ${goal.description}
📅 Priority: ${goal.priority || 'medium'}
🚀 Goal added to productivity tracking`
        );
      }

      case 'get_metrics': {
        const toolStats = Object.entries(state.productivityMetrics.toolEffectiveness)
          .map(([tool, stats]) => {
            const successRate = stats.uses > 0 ? (stats.success / stats.uses * 100).toFixed(1) : 'N/A';
            return `${tool}: ${stats.success}/${stats.uses} (${successRate}% success)`;
          })
          .join('\n');

        return createToolResult(
          `📊 Productivity Metrics

🎯 Tasks Completed: ${state.productivityMetrics.tasksCompleted}
⚡ Efficiency Score: ${(state.productivityMetrics.efficiencyScore * 100).toFixed(1)}%
📈 Productivity Score: ${(state.performanceMetrics.productivityScore * 100).toFixed(1)}%
🛠️ Tool Effectiveness:\n${toolStats || 'No tool usage data yet'}
🎯 Active Goals: ${state.productivityMetrics.userGoals.length}
✅ Completed Goals: ${state.productivityMetrics.completedGoals.length}`
        );
      }

      case 'analyze_efficiency': {
        return createToolResult(analyzeEfficiency());
      }

      default:
        return createErrorResult('❌ Unknown action');
    }
  };
}
