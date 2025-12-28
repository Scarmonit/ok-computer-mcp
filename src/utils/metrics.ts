/**
 * Shared metrics calculation utilities
 *
 * Extracted to eliminate code duplication across tool handlers.
 */

import type { ToolStats } from '../types/index.js';

/**
 * Calculate success rate from total and successful counts
 * @param total - Total number of attempts
 * @param successful - Number of successful attempts
 * @returns Success rate as a decimal (0-1)
 */
export function calculateSuccessRate(total: number, successful: number): number {
  return total > 0 ? successful / total : 0;
}

/**
 * Format a decimal value as a percentage string
 * @param value - Decimal value (0-1)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string (e.g., "85.5")
 */
export function formatPercentage(value: number, decimals = 1): string {
  return (value * 100).toFixed(decimals);
}

/**
 * Calculate and format success rate as a percentage string
 * @param total - Total number of attempts
 * @param successful - Number of successful attempts
 * @returns Formatted percentage string (e.g., "85.5%")
 */
export function formatSuccessRate(total: number, successful: number): string {
  return formatPercentage(calculateSuccessRate(total, successful)) + '%';
}

/**
 * Format tool effectiveness statistics as a multi-line string
 * @param effectiveness - Map of tool names to their stats
 * @returns Formatted string with success rates for each tool
 */
export function formatToolStats(
  effectiveness: Record<string, ToolStats>
): string {
  const entries = Object.entries(effectiveness);
  if (entries.length === 0) {
    return 'No tool usage data available';
  }

  return entries
    .map(([tool, stats]) => {
      const rate = stats.uses > 0
        ? formatPercentage(stats.success / stats.uses)
        : 'N/A';
      return `${tool}: ${rate}% success rate`;
    })
    .join('\n');
}

/**
 * Calculate average response time
 * @param currentAvg - Current average
 * @param newValue - New value to incorporate
 * @returns Updated average
 */
export function updateRunningAverage(currentAvg: number, newValue: number): number {
  return (currentAvg + newValue) / 2;
}
