/**
 * Input sanitization utilities for security
 *
 * Provides deep sanitization to prevent prototype pollution attacks.
 */

/**
 * Properties that could be used for prototype pollution attacks
 */
const DANGEROUS_PROPS: readonly string[] = ['__proto__', 'constructor', 'prototype'];

/**
 * Maximum allowed nesting depth to prevent stack overflow
 */
const MAX_DEPTH = 10;

/**
 * Recursively sanitizes an object by removing dangerous properties
 * that could be used for prototype pollution attacks.
 *
 * @param obj - The object to sanitize
 * @param depth - Current recursion depth (internal use)
 * @returns A new object with dangerous properties removed
 * @throws Error if nesting exceeds MAX_DEPTH
 *
 * @example
 * ```typescript
 * const malicious = { __proto__: { isAdmin: true }, name: 'user' };
 * const safe = deepSanitize(malicious);
 * // Result: { name: 'user' }
 * ```
 */
export function deepSanitize<T>(obj: T, depth: number = 0): T {
  if (depth > MAX_DEPTH) {
    throw new Error('Object nesting too deep - possible prototype pollution attack');
  }

  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepSanitize(item, depth + 1)) as T;
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (DANGEROUS_PROPS.includes(key)) {
      console.warn('Blocked dangerous property:', key);
      continue;
    }
    sanitized[key] = deepSanitize(value, depth + 1);
  }

  return sanitized as T;
}

/**
 * Type guard to check if a value is a non-null object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard to check if a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Type guard to check if a value is a number in a given range
 */
export function isNumberInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && !isNaN(value) && value >= min && value <= max;
}

/**
 * Type guard to check if a value is an array of strings
 */
export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}
