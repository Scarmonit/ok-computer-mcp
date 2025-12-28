/**
 * Input validation utilities for MCP tools
 *
 * Provides type-safe validation functions for tool inputs.
 */

import type {
  LearnFromInteractionInput,
  TaskInput,
  GoalInput
} from '../types/index.js';

/**
 * Validation result type
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Validates the interaction input for learn_from_interaction tool
 */
export function validateInteraction(
  input: unknown
): ValidationResult<LearnFromInteractionInput['interaction']> {
  if (!input || typeof input !== 'object') {
    return { success: false, error: 'Interaction object is required' };
  }

  const interaction = input as Record<string, unknown>;

  if (!interaction.userInput || typeof interaction.userInput !== 'string') {
    return { success: false, error: 'Interaction must have valid userInput (string)' };
  }

  if (!interaction.aiResponse || typeof interaction.aiResponse !== 'string') {
    return { success: false, error: 'Interaction must have valid aiResponse (string)' };
  }

  if (
    typeof interaction.success !== 'undefined' &&
    typeof interaction.success !== 'boolean'
  ) {
    return { success: false, error: 'Interaction success must be a boolean if provided' };
  }

  return {
    success: true,
    data: {
      userInput: interaction.userInput as string,
      aiResponse: interaction.aiResponse as string,
      userFeedback: interaction.userFeedback as string | undefined,
      success: interaction.success as boolean | undefined,
      context: interaction.context as string | undefined,
    }
  };
}

/**
 * Validates the task input for track_productivity tool
 */
export function validateTask(input: unknown): ValidationResult<TaskInput> {
  if (!input || typeof input !== 'object') {
    return { success: false, error: 'Task information required' };
  }

  const task = input as Record<string, unknown>;

  if (!task.name || typeof task.name !== 'string') {
    return { success: false, error: 'Task name must be a non-empty string' };
  }

  if (task.efficiency !== undefined) {
    if (typeof task.efficiency !== 'number') {
      return { success: false, error: 'Task efficiency must be a number (0-1)' };
    }
    if (task.efficiency < 0 || task.efficiency > 1) {
      return { success: false, error: 'Task efficiency must be between 0 and 1' };
    }
  }

  if (task.toolsUsed !== undefined) {
    if (!Array.isArray(task.toolsUsed)) {
      return { success: false, error: 'toolsUsed must be an array of strings' };
    }
    for (const tool of task.toolsUsed) {
      if (typeof tool !== 'string') {
        return { success: false, error: `All tools must be strings, found ${typeof tool}` };
      }
    }
  }

  return {
    success: true,
    data: {
      name: task.name as string,
      type: task.type as string | undefined,
      toolsUsed: task.toolsUsed as string[] | undefined,
      duration: task.duration as number | undefined,
      success: task.success as boolean | undefined,
      efficiency: task.efficiency as number | undefined,
    }
  };
}

/**
 * Validates the goal input for track_productivity tool
 */
export function validateGoal(input: unknown): ValidationResult<GoalInput> {
  if (!input || typeof input !== 'object') {
    return { success: false, error: 'Goal information required' };
  }

  const goal = input as Record<string, unknown>;

  if (!goal.description || typeof goal.description !== 'string') {
    return { success: false, error: 'Goal description must be a non-empty string' };
  }

  const validPriorities = ['low', 'medium', 'high'];
  if (goal.priority !== undefined && !validPriorities.includes(goal.priority as string)) {
    return { success: false, error: `Goal priority must be one of: ${validPriorities.join(', ')}` };
  }

  return {
    success: true,
    data: {
      description: goal.description as string,
      priority: goal.priority as 'low' | 'medium' | 'high' | undefined,
      deadline: goal.deadline as string | undefined,
    }
  };
}

/**
 * Generic assertion helper that throws on validation failure
 */
export function assertValid<T>(
  result: ValidationResult<T>,
  throwOnError: boolean = true
): T | null {
  if (result.success && result.data) {
    return result.data;
  }
  if (throwOnError) {
    throw new Error(result.error || 'Validation failed');
  }
  return null;
}
