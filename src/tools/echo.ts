/**
 * Echo tool handler
 *
 * Simple tool that echoes back the provided message.
 */

import type { ToolResult, EchoInput, InputSchema } from '../types/index.js';
import { createToolResult } from '../types/index.js';

/**
 * Input schema for echo tool
 */
export const echoInputSchema: InputSchema = {
  type: 'object',
  properties: {
    message: {
      type: 'string',
      description: 'Message to echo back',
    },
  },
  required: ['message'],
};

/**
 * Echo tool handler
 */
export function handleEcho(args: EchoInput): ToolResult {
  return createToolResult(`Echo: ${args.message}`);
}

/**
 * Echo tool definition
 */
export const echoTool = {
  name: 'echo',
  description: 'Echo back the provided message',
  inputSchema: echoInputSchema,
  handler: handleEcho,
} as const;
