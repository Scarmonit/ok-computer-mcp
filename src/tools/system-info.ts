/**
 * System info tool handler
 *
 * Returns system information with security-hardened environment exposure.
 */

import type { ToolResult, SystemInfoInput, InputSchema } from '../types/index.js';
import { createToolResult } from '../types/index.js';

/**
 * Input schema for system_info tool
 */
export const systemInfoInputSchema: InputSchema = {
  type: 'object',
  properties: {
    detail: {
      type: 'string',
      enum: ['basic', 'full'],
      description: 'Level of detail for system information',
    },
  },
};

/**
 * System info handler
 */
export function handleSystemInfo(args: SystemInfoInput): ToolResult {
  const detail = args.detail || 'basic';

  interface SystemInfo {
    platform: NodeJS.Platform;
    arch: string;
    nodeVersion: string;
    uptime: number;
    memory: NodeJS.MemoryUsage;
    safeEnv?: {
      NODE_ENV: string;
      TZ: string;
    };
    versions?: NodeJS.ProcessVersions;
  }

  const info: SystemInfo = {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };

  if (detail === 'full') {
    // Only expose safe, non-sensitive environment info
    info.safeEnv = {
      NODE_ENV: process.env.NODE_ENV || 'unknown',
      TZ: process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    info.versions = process.versions;
  }

  return createToolResult(
    `System Information (${detail}):\n\`\`\`json\n${JSON.stringify(info, null, 2)}\n\`\`\``
  );
}

/**
 * System info tool definition
 */
export const systemInfoTool = {
  name: 'system_info',
  description: 'Get system information',
  inputSchema: systemInfoInputSchema,
  handler: handleSystemInfo,
} as const;
