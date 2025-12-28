/**
 * Input validation utilities for MCP tools
 *
 * Provides type-safe validation functions for tool inputs.
 * Uses discriminated unions for compile-time safe result handling.
 */

import type {
  LearnFromInteractionInput,
  TaskInput,
  GoalInput
} from '../types/index.js';

// =============================================================================
// Validation Result Types (Discriminated Union)
// =============================================================================

/**
 * Successful validation result
 */
export interface ValidationSuccess<T> {
  readonly success: true;
  readonly data: T;
}

/**
 * Failed validation result
 */
export interface ValidationFailure {
  readonly success: false;
  readonly error: string;
}

/**
 * Discriminated union for validation results
 * Guarantees that success=true has data, success=false has error
 */
export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a successful validation result
 */
export function validationSuccess<T>(data: T): ValidationSuccess<T> {
  return { success: true, data };
}

/**
 * Create a failed validation result
 */
export function validationFailure(error: string): ValidationFailure {
  return { success: false, error };
}

// =============================================================================
// Validation Functions
// =============================================================================

/**
 * Validates the interaction input for learn_from_interaction tool
 */
export function validateInteraction(
  input: unknown
): ValidationResult<LearnFromInteractionInput['interaction']> {
  if (!input || typeof input !== 'object') {
    return validationFailure('Interaction object is required');
  }

  const interaction = input as Record<string, unknown>;

  if (!interaction.userInput || typeof interaction.userInput !== 'string') {
    return validationFailure('Interaction must have valid userInput (string)');
  }

  if (!interaction.aiResponse || typeof interaction.aiResponse !== 'string') {
    return validationFailure('Interaction must have valid aiResponse (string)');
  }

  if (
    typeof interaction.success !== 'undefined' &&
    typeof interaction.success !== 'boolean'
  ) {
    return validationFailure('Interaction success must be a boolean if provided');
  }

  return validationSuccess({
    userInput: interaction.userInput as string,
    aiResponse: interaction.aiResponse as string,
    userFeedback: interaction.userFeedback as string | undefined,
    success: interaction.success as boolean | undefined,
    context: interaction.context as string | undefined,
  });
}

/**
 * Validates the task input for track_productivity tool
 */
export function validateTask(input: unknown): ValidationResult<TaskInput> {
  if (!input || typeof input !== 'object') {
    return validationFailure('Task information required');
  }

  const task = input as Record<string, unknown>;

  if (!task.name || typeof task.name !== 'string') {
    return validationFailure('Task name must be a non-empty string');
  }

  if (task.efficiency !== undefined) {
    if (typeof task.efficiency !== 'number') {
      return validationFailure('Task efficiency must be a number (0-1)');
    }
    if (task.efficiency < 0 || task.efficiency > 1) {
      return validationFailure('Task efficiency must be between 0 and 1');
    }
  }

  if (task.toolsUsed !== undefined) {
    if (!Array.isArray(task.toolsUsed)) {
      return validationFailure('toolsUsed must be an array of strings');
    }
    for (const tool of task.toolsUsed) {
      if (typeof tool !== 'string') {
        return validationFailure(`All tools must be strings, found ${typeof tool}`);
      }
    }
  }

  return validationSuccess({
    name: task.name as string,
    type: task.type as string | undefined,
    toolsUsed: task.toolsUsed as string[] | undefined,
    duration: task.duration as number | undefined,
    success: task.success as boolean | undefined,
    efficiency: task.efficiency as number | undefined,
  });
}

/**
 * Validates the goal input for track_productivity tool
 */
export function validateGoal(input: unknown): ValidationResult<GoalInput> {
  if (!input || typeof input !== 'object') {
    return validationFailure('Goal information required');
  }

  const goal = input as Record<string, unknown>;

  if (!goal.description || typeof goal.description !== 'string') {
    return validationFailure('Goal description must be a non-empty string');
  }

  const validPriorities = ['low', 'medium', 'high'];
  if (goal.priority !== undefined && !validPriorities.includes(goal.priority as string)) {
    return validationFailure(`Goal priority must be one of: ${validPriorities.join(', ')}`);
  }

  return validationSuccess({
    description: goal.description as string,
    priority: goal.priority as 'low' | 'medium' | 'high' | undefined,
    deadline: goal.deadline as string | undefined,
  });
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Extract data from validation result or throw error
 * Type-safe: only returns data when success is true
 */
export function unwrapValidation<T>(result: ValidationResult<T>): T {
  if (result.success === true) {
    return result.data;
  }
  // TypeScript now knows result is ValidationFailure
  throw new Error(result.error);
}

/**
 * Extract data from validation result or return null
 * Type-safe: only returns data when success is true
 */
export function unwrapValidationOrNull<T>(result: ValidationResult<T>): T | null {
  if (result.success === true) {
    return result.data;
  }
  return null;
}

/**
 * Check if validation succeeded (type guard)
 */
export function isValidationSuccess<T>(
  result: ValidationResult<T>
): result is ValidationSuccess<T> {
  return result.success === true;
}

/**
 * Check if validation failed (type guard)
 */
export function isValidationFailure<T>(
  result: ValidationResult<T>
): result is ValidationFailure {
  return result.success === false;
}
