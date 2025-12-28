#!/usr/bin/env node

/**
 * OK Computer MCP Server
 *
 * A self-improving MCP server with TypeScript type safety.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import type {
  ToolResult,
  MCPResource,
  MCPPrompt,
  PromptResult,
  EchoInput,
  SystemInfoInput,
  LearnFromInteractionInput,
  GetLearningInsightsInput,
  AdaptBehaviorInput,
  OptimizePerformanceInput,
  AutoOptimizeInput,
  TrackProductivityInput,
  EnhanceToolUsageInput
} from './types/index.js';

import { deepSanitize } from './utils/sanitize.js';

import {
  echoInputSchema,
  handleEcho,
  systemInfoInputSchema,
  handleSystemInfo,
  learnFromInteractionInputSchema,
  createLearnFromInteractionHandler,
  getLearningInsightsInputSchema,
  createGetLearningInsightsHandler,
  adaptBehaviorInputSchema,
  createAdaptBehaviorHandler,
  optimizePerformanceInputSchema,
  createOptimizePerformanceHandler,
  autoOptimizeInputSchema,
  createAutoOptimizeHandler,
  trackProductivityInputSchema,
  createTrackProductivityHandler,
  enhanceToolUsageInputSchema,
  createEnhanceToolUsageHandler,
} from './tools/index.js';

import { ServerStateManager } from './state/index.js';
import type { InputSchema } from './types/index.js';

/**
 * Tool handler type
 */
type ToolHandler = (args: unknown) => ToolResult | Promise<ToolResult>;

/**
 * Tool definition with proper InputSchema type
 */
interface ToolDefinition {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: InputSchema;
  readonly handler: ToolHandler;
}

/**
 * Universal MCP Server with TypeScript support
 *
 * Uses ServerStateManager for encapsulated state management.
 */
class UniversalMCPServer {
  private server: Server;
  private resources: Record<string, MCPResource>;
  private prompts: Record<string, MCPPrompt<Record<string, string>>>;
  private tools: Record<string, ToolDefinition>;
  private stateManager: ServerStateManager;

  constructor() {
    this.server = new Server(
      {
        name: 'universal-mcp-server',
        version: '1.5.0',
      },
      {
        capabilities: {
          resources: {},
          prompts: {},
          tools: {},
        },
      }
    );

    // Initialize state manager
    this.stateManager = new ServerStateManager();

    // Initialize components
    this.setupHandlers();
    this.resources = this.initializeResources();
    this.prompts = this.initializePrompts();
    this.tools = this.initializeTools();

    // Start auto-optimization
    this.startAutoOptimization();
  }

  private setupHandlers(): void {
    // Resource handlers
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: Object.values(this.resources).map(resource => ({
          uri: resource.uri,
          name: resource.name,
          description: resource.description,
          mimeType: resource.mimeType,
        })),
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const resource = Object.values(this.resources).find(r => r.uri === request.params.uri);
      if (!resource) {
        throw new Error(`Resource not found: ${request.params.uri}`);
      }
      return resource.content;
    });

    // Prompt handlers
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: Object.values(this.prompts).map(prompt => ({
          name: prompt.name,
          description: prompt.description,
          arguments: prompt.arguments || [],
        })),
      };
    });

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const prompt = Object.values(this.prompts).find(p => p.name === request.params.name);
      if (!prompt) {
        throw new Error(`Prompt not found: ${request.params.name}`);
      }
      return prompt.handler((request.params.arguments || {}) as Record<string, string>);
    });

    // Tool handlers
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: Object.values(this.tools).map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const startTime = Date.now();
      const toolName = request.params.name;

      try {
        const tool = Object.values(this.tools).find(t => t.name === toolName);
        if (!tool) {
          const availableTools = Object.values(this.tools).map(t => t.name).join(', ');
          throw new Error(`Tool not found: ${toolName}. Available tools: ${availableTools}`);
        }

        // Deep sanitize arguments to prevent prototype pollution
        const rawArgs = request.params.arguments || {};
        let sanitizedArgs: unknown;
        try {
          sanitizedArgs = deepSanitize(rawArgs);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('Input sanitization failed - possible attack:', errorMessage);
          throw new Error('Invalid input format: ' + errorMessage);
        }

        const result = await tool.handler(sanitizedArgs);

        // Track successful invocation using state manager
        this.stateManager.trackToolUsage(toolName, true);
        const elapsed = Date.now() - startTime;
        this.stateManager.updateAverageResponseTime(elapsed);

        return result;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        // Log error with context
        console.error(`Tool "${toolName}" failed:`, errorMessage);

        // Track error metrics using state manager
        this.stateManager.recordError({
          tool: toolName,
          message: errorMessage,
          timestamp: new Date().toISOString()
        });

        // Re-throw for MCP SDK to handle
        throw error;
      }
    });
  }

  private initializeResources(): Record<string, MCPResource> {
    return {
      serverInfo: {
        uri: 'info://server',
        name: 'Server Information',
        description: 'Basic information about this MCP server',
        mimeType: 'application/json',
        content: {
          uri: 'info://server',
          mimeType: 'application/json',
          text: JSON.stringify({
            name: 'Universal MCP Server',
            version: '1.5.0',
            description: 'A universal server that any AI can connect to',
            uptime: process.uptime(),
            platform: process.platform,
            nodeVersion: process.version,
          }, null, 2),
        },
      },
      time: {
        uri: 'time://current',
        name: 'Current Time',
        description: 'Returns the current server time',
        mimeType: 'application/json',
        content: {
          uri: 'time://current',
          mimeType: 'application/json',
          text: JSON.stringify({
            timestamp: new Date().toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }, null, 2),
        },
      },
      echo: {
        uri: 'echo://{message}',
        name: 'Echo Resource',
        description: 'Echoes back any message provided in the URI',
        mimeType: 'text/plain',
        content: {
          uri: 'echo://sample',
          mimeType: 'text/plain',
          text: 'Use echo://your-message-here to get your message echoed back',
        },
      },
    };
  }

  private initializePrompts(): Record<string, MCPPrompt<Record<string, string>>> {
    return {
      assistant: {
        name: 'assistant',
        description: 'A helpful assistant prompt template',
        arguments: [
          {
            name: 'task',
            description: 'The task you need help with',
            required: true,
          },
          {
            name: 'style',
            description: 'Communication style (formal, casual, technical)',
            required: false,
          },
        ],
        handler: (args): PromptResult => {
          const style = args.style || 'helpful';
          return {
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `You are a ${style} assistant. Please help me with the following task: ${args.task}`,
                },
              },
            ],
          };
        },
      },
      codeReview: {
        name: 'code_review',
        description: 'Prompt template for code review',
        arguments: [
          {
            name: 'code',
            description: 'The code to review',
            required: true,
          },
          {
            name: 'language',
            description: 'Programming language',
            required: false,
          },
        ],
        handler: (args): PromptResult => {
          return {
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `Please review the following ${args.language || ''} code and provide feedback:\n\n\`\`\`\n${args.code}\n\`\`\``,
                },
              },
            ],
          };
        },
      },
    };
  }

  private initializeTools(): Record<string, ToolDefinition> {
    // Get state for backward-compatible tool factory injection
    const state = this.stateManager.getState();

    // Create handlers with state access
    const handleLearnFromInteraction = createLearnFromInteractionHandler(state);
    const handleGetLearningInsights = createGetLearningInsightsHandler(state);
    const handleAdaptBehavior = createAdaptBehaviorHandler(state);
    const handleOptimizePerformance = createOptimizePerformanceHandler(state);
    const handleAutoOptimize = createAutoOptimizeHandler(state);
    const handleTrackProductivity = createTrackProductivityHandler(state);
    const handleEnhanceToolUsage = createEnhanceToolUsageHandler(state);

    return {
      echo: {
        name: 'echo',
        description: 'Echo back the provided message',
        inputSchema: echoInputSchema,
        handler: (args) => handleEcho(args as EchoInput),
      },

      systemInfo: {
        name: 'system_info',
        description: 'Get system information',
        inputSchema: systemInfoInputSchema,
        handler: (args) => handleSystemInfo(args as SystemInfoInput),
      },

      learnFromInteraction: {
        name: 'learn_from_interaction',
        description: 'Learn from user interactions to improve future responses',
        inputSchema: learnFromInteractionInputSchema,
        handler: (args) => handleLearnFromInteraction(args as LearnFromInteractionInput),
      },

      getLearningInsights: {
        name: 'get_learning_insights',
        description: 'Get insights about what the AI has learned and performance metrics',
        inputSchema: getLearningInsightsInputSchema,
        handler: (args) => handleGetLearningInsights(args as GetLearningInsightsInput),
      },

      adaptBehavior: {
        name: 'adapt_behavior',
        description: 'Adapt AI behavior based on learned patterns and user preferences',
        inputSchema: adaptBehaviorInputSchema,
        handler: (args) => handleAdaptBehavior(args as AdaptBehaviorInput),
      },

      optimizePerformance: {
        name: 'optimize_performance',
        description: 'Analyze performance and suggest optimizations for better interactions',
        inputSchema: optimizePerformanceInputSchema,
        handler: (args) => handleOptimizePerformance(args as OptimizePerformanceInput),
      },

      autoOptimize: {
        name: 'auto_optimize',
        description: 'Automatically optimize system performance based on current metrics and usage patterns',
        inputSchema: autoOptimizeInputSchema,
        handler: (args) => handleAutoOptimize(args as AutoOptimizeInput),
      },

      trackProductivity: {
        name: 'track_productivity',
        description: 'Track and analyze productivity metrics. Monitor task completion, efficiency, and tool effectiveness.',
        inputSchema: trackProductivityInputSchema,
        handler: (args) => handleTrackProductivity(args as TrackProductivityInput),
      },

      enhanceToolUsage: {
        name: 'enhance_tool_usage',
        description: 'Analyze tool usage patterns and suggest enhancements to increase productivity and tool adoption.',
        inputSchema: enhanceToolUsageInputSchema,
        handler: (args) => handleEnhanceToolUsage(args as EnhanceToolUsageInput),
      },
    };
  }

  private startAutoOptimization(): void {
    const autoOptConfig = this.stateManager.getAutoOptimization();
    if (!autoOptConfig.enabled) return;

    // Wrap async call with catch to prevent unhandled rejections
    setInterval(async () => {
      try {
        await this.performAutoOptimization();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Unexpected error in auto-optimization interval:', errorMessage);
      }
    }, autoOptConfig.interval);

    // Also run immediately on startup
    setTimeout(async () => {
      try {
        await this.performAutoOptimization();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Initial auto-optimization failed:', errorMessage);
      }
    }, 5000);
  }

  private async performAutoOptimization(): Promise<void> {
    if (!this.stateManager.getAutoOptimization().enabled) return;

    try {
      // Await the promise from the handler
      const result = await this.tools.autoOptimize.handler({ priority: 'balanced', force: false });

      // Validate result structure before accessing
      if (!result || typeof result !== 'object') {
        throw new Error(`Auto-optimization returned invalid result type: ${typeof result}`);
      }

      const resultText = result?.content?.[0]?.text;
      if (typeof resultText === 'string') {
        console.error('🚀 Auto-optimization performed:', resultText.substring(0, 100) + '...');
      } else {
        console.error('⚠️ Auto-optimization returned unexpected result structure:', JSON.stringify(result));
      }

      // Track successful optimization
      this.stateManager.recordOptimization();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      console.error('⚠️ Auto-optimization failed:', errorMessage);

      // Track failure using state manager
      this.stateManager.recordError({
        tool: 'auto_optimize',
        message: errorMessage,
        timestamp: new Date().toISOString(),
        stack: errorStack
      });

      // Circuit breaker: disable if too many failures
      const metrics = this.stateManager.getPerformanceMetrics();
      if ((metrics.errorCount || 0) > 5) {
        console.error('🚨 Too many optimization failures, disabling auto-optimization');
        this.stateManager.setAutoOptimizationEnabled(false);
      }
    }
  }

  /**
   * Analyze efficiency using state manager
   * @returns Formatted efficiency analysis string
   */
  public analyzeEfficiency(): string {
    return this.stateManager.analyzeEfficiency();
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Universal MCP Server running on stdio (TypeScript v1.5.0)');
  }
}

// Main entry point
const server = new UniversalMCPServer();
server.run().catch(console.error);
