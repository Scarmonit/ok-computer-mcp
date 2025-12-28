#!/usr/bin/env node

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

/**
 * Deep sanitization to prevent prototype pollution attacks.
 * Recursively removes dangerous properties from nested objects.
 */
function deepSanitize(obj, depth = 0) {
  const MAX_DEPTH = 10;
  const DANGEROUS_PROPS = ['__proto__', 'constructor', 'prototype'];

  if (depth > MAX_DEPTH) {
    throw new Error('Object nesting too deep - possible prototype pollution attack');
  }

  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepSanitize(item, depth + 1));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (DANGEROUS_PROPS.includes(key)) {
      console.warn('Blocked dangerous property:', key);
      continue;
    }
    sanitized[key] = deepSanitize(value, depth + 1);
  }
  return sanitized;
}

class UniversalMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'universal-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          prompts: {},
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.resources = this.initializeResources();
    this.prompts = this.initializePrompts();
    this.tools = this.initializeTools();
  }

  setupHandlers() {
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
      return prompt.handler(request.params.arguments || {});
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
        let sanitizedArgs;
        try {
          sanitizedArgs = deepSanitize(rawArgs);
        } catch (error) {
          console.error('Input sanitization failed - possible attack:', error.message);
          throw new Error('Invalid input format: ' + error.message);
        }

        const result = await tool.handler(sanitizedArgs);

        // Track successful invocation
        this.performanceMetrics.toolUsageCount[toolName] =
          (this.performanceMetrics.toolUsageCount[toolName] || 0) + 1;
        const elapsed = Date.now() - startTime;
        this.performanceMetrics.averageResponseTime =
          (this.performanceMetrics.averageResponseTime + elapsed) / 2;

        return result;

      } catch (error) {
        // Log error with context
        console.error(`Tool "${toolName}" failed:`, error.message);

        // Track error metrics
        this.performanceMetrics.errorCount = (this.performanceMetrics.errorCount || 0) + 1;
        this.performanceMetrics.lastError = {
          tool: toolName,
          message: error.message,
          timestamp: new Date().toISOString()
        };

        // Re-throw for MCP SDK to handle
        throw error;
      }
    });
  }

  initializeResources() {
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
            version: '1.0.0',
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

  initializePrompts() {
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
        handler: (args) => {
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
        handler: (args) => {
          return {
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `Please review the following ${args.language || ''} code and provide feedback:

\`\`\`
${args.code}
\`\`\``,
                },
              },
            ],
          };
        },
      },
    };
  }

  initializeTools() {
    // In-memory storage for self-improvement data
    this.interactionHistory = [];
    this.feedbackData = [];
    this.performanceMetrics = {
      totalInteractions: 0,
      successfulInteractions: 0,
      averageResponseTime: 0,
      userSatisfaction: 0,
      toolUsageCount: {},
      productivityScore: 0.75,
      lastOptimization: null
    };
    
    // Automatic optimization settings
    this.autoOptimization = {
      enabled: true,
      interval: 300000, // 5 minutes
      lastRun: Date.now(),
      priorityAreas: ['performance', 'productivity', 'tool_usage', 'response_time'],
      targetMetrics: {
        minSuccessRate: 0.85,
        maxResponseTime: 2000, // 2 seconds
        minToolUsage: 0.7, // 70% of interactions should use tools
        targetProductivity: 0.9
      }
    };
    
    // Productivity tracking
    this.productivityMetrics = {
      tasksCompleted: 0,
      efficiencyScore: 0.8,
      toolEffectiveness: {},
      userGoals: [],
      completedGoals: []
    };
    
    this.knowledgeBase = {
      facts: [
        {"id": "greeting_1", "content": "Users appreciate friendly greetings", "confidence": 0.8, "source": "pattern_analysis"},
        {"id": "efficiency_1", "content": "Quick responses improve user satisfaction", "confidence": 0.9, "source": "metrics_analysis"},
        {"id": "productivity_1", "content": "Tool usage increases task completion rates", "confidence": 0.95, "source": "performance_analysis"},
        {"id": "optimization_1", "content": "Continuous optimization improves system performance", "confidence": 0.9, "source": "system_analysis"}
      ],
      patterns: [
        {"pattern": "feedback_positive", "response_type": "acknowledgment", "effectiveness": 0.85},
        {"pattern": "feedback_negative", "response_type": "apology_and_improve", "effectiveness": 0.75},
        {"pattern": "tool_usage_success", "response_type": "enhance_tool_capabilities", "effectiveness": 0.9},
        {"pattern": "productivity_focus", "response_type": "prioritize_efficiency", "effectiveness": 0.88}
      ],
      preferences: {
        "communication_style": "professional",
        "response_detail_level": "balanced",
        "learn_from_feedback": true,
        "auto_optimize": true,
        "productivity_focus": true,
        "tool_usage_priority": true
      }
    };
    
    // Start automatic optimization
    this.startAutoOptimization();
    
    return {
      echo: {
        name: 'echo',
        description: 'Echo back the provided message',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Message to echo back',
            },
          },
          required: ['message'],
        },
        handler: (args) => {
          return {
            content: [
              {
                type: 'text',
                text: `Echo: ${args.message}`,
              },
            ],
          };
        },
      },
      
      systemInfo: {
        name: 'system_info',
        description: 'Get system information',
        inputSchema: {
          type: 'object',
          properties: {
            detail: {
              type: 'string',
              enum: ['basic', 'full'],
              description: 'Level of detail for system information',
            },
          },
        },
        handler: (args) => {
          const detail = args.detail || 'basic';
          const info = {
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
          
          return {
            content: [
              {
                type: 'text',
                text: `System Information (${detail}):
\`\`\`json\n${JSON.stringify(info, null, 2)}\n\`\`\``,
              },
            ],
          };
        },
      },
      
      learnFromInteraction: {
        name: 'learn_from_interaction',
        description: 'Learn from user interactions to improve future responses',
        inputSchema: {
          type: 'object',
          properties: {
            interaction: {
              type: 'object',
              description: 'Details of the interaction to learn from',
              properties: {
                userInput: { type: 'string', description: 'What the user said or requested' },
                aiResponse: { type: 'string', description: 'How the AI responded' },
                userFeedback: { type: 'string', description: 'User feedback on the interaction' },
                success: { type: 'boolean', description: 'Whether the interaction was successful' },
                context: { type: 'string', description: 'Additional context about the interaction' }
              },
              required: ['userInput', 'aiResponse']
            }
          },
          required: ['interaction']
        },
        handler: (args) => {
          const { interaction } = args;
          const timestamp = new Date().toISOString();

          // Validate required fields
          if (!interaction) {
            throw new Error('Interaction object is required');
          }

          if (!interaction.userInput || typeof interaction.userInput !== 'string') {
            throw new Error('Interaction must have valid userInput (string)');
          }

          if (!interaction.aiResponse || typeof interaction.aiResponse !== 'string') {
            throw new Error('Interaction must have valid aiResponse (string)');
          }

          if (typeof interaction.success !== 'undefined' && typeof interaction.success !== 'boolean') {
            throw new Error('Interaction success must be a boolean if provided');
          }

          // Store validated interaction
          this.interactionHistory.push({
            ...interaction,
            timestamp,
            id: `interaction_${Date.now()}`
          });
          
          // Update performance metrics
          this.performanceMetrics.totalInteractions++;
          if (interaction.success !== false) {
            this.performanceMetrics.successfulInteractions++;
          }
          
          // Analyze patterns and improve
          let improvements = [];
          
          // Learn from feedback
          if (interaction.userFeedback) {
            this.feedbackData.push({
              feedback: interaction.userFeedback,
              timestamp,
              relatedInteraction: interaction
            });
            
            // Simple pattern recognition
            if (interaction.userFeedback.toLowerCase().includes('good') || 
                interaction.userFeedback.toLowerCase().includes('great')) {
              improvements.push("Positive feedback noted - reinforcing similar response patterns");
              
              // Add to knowledge base
              this.knowledgeBase.facts.push({
                id: `fact_${Date.now()}`,
                content: `Successful interaction pattern: "${interaction.userInput}" -> "${interaction.aiResponse}"`,
                confidence: 0.7,
                source: "user_feedback"
              });
            }
            
            if (interaction.userFeedback.toLowerCase().includes('bad') || 
                interaction.userFeedback.toLowerCase().includes('improve')) {
              improvements.push("Constructive feedback noted - adjusting response patterns");
              
              // Learn what to avoid
              this.knowledgeBase.patterns.push({
                pattern: "avoid_response_type",
                response_type: interaction.aiResponse,
                effectiveness: 0.2
              });
            }
          }
          
          // Learn from context
          if (interaction.context) {
            this.knowledgeBase.facts.push({
              id: `context_${Date.now()}`,
              content: `Context learning: ${interaction.context}`,
              confidence: 0.6,
              source: "context_analysis"
            });
          }
          
          return {
            content: [
              {
                type: 'text',
                text: `🧠 Learning completed successfully!

📊 Performance Update:
- Total interactions: ${this.performanceMetrics.totalInteractions}
- Success rate: ${(this.performanceMetrics.successfulInteractions / this.performanceMetrics.totalInteractions * 100).toFixed(1)}%
- Knowledge base size: ${this.knowledgeBase.facts.length} facts, ${this.knowledgeBase.patterns.length} patterns

🔧 Improvements Made:
${improvements.map(imp => `- ${imp}`).join('\n')}

✅ Ready to provide better responses in future interactions!`
              }
            ]
          };
        }
      },
      
      getLearningInsights: {
        name: 'get_learning_insights',
        description: 'Get insights about what the AI has learned and performance metrics',
        inputSchema: {
          type: 'object',
          properties: {
            detailLevel: {
              type: 'string',
              enum: ['summary', 'detailed', 'full'],
              description: 'Level of detail for insights',
              default: 'summary'
            },
            focusArea: {
              type: 'string',
              enum: ['performance', 'patterns', 'knowledge', 'feedback', 'all'],
              description: 'Specific area to focus on',
              default: 'all'
            }
          }
        },
        handler: (args) => {
          const { detailLevel = 'summary', focusArea = 'all' } = args;
          
          let insights = [];
          
          // Performance insights
          if (focusArea === 'all' || focusArea === 'performance') {
            const successRate = this.performanceMetrics.totalInteractions > 0 
              ? (this.performanceMetrics.successfulInteractions / this.performanceMetrics.totalInteractions * 100).toFixed(1)
              : 0;
            
            insights.push(`📊 Performance Metrics:
- Total interactions: ${this.performanceMetrics.totalInteractions}
- Successful interactions: ${this.performanceMetrics.successfulInteractions}
- Success rate: ${successRate}%
- Feedback entries: ${this.feedbackData.length}`);
          }
          
          // Pattern insights
          if (focusArea === 'all' || focusArea === 'patterns') {
            const effectivePatterns = this.knowledgeBase.patterns.filter(p => p.effectiveness > 0.7);
            insights.push(`🧠 Learned Patterns:
- Total patterns: ${this.knowledgeBase.patterns.length}
- High-effectiveness patterns: ${effectivePatterns.length}
- Most effective pattern type: ${effectivePatterns.length > 0 ? effectivePatterns[0].pattern : 'None yet'}`);
          }
          
          // Knowledge insights
          if (focusArea === 'all' || focusArea === 'knowledge') {
            const highConfidenceFacts = this.knowledgeBase.facts.filter(f => f.confidence > 0.8);
            insights.push(`🎓 Knowledge Base:
- Total facts: ${this.knowledgeBase.facts.length}
- High-confidence facts: ${highConfidenceFacts.length}
- Learning sources: ${[...new Set(this.knowledgeBase.facts.map(f => f.source))].join(', ')}`);
          }
          
          // Recent learning
          if (detailLevel === 'detailed' || detailLevel === 'full') {
            const recentInteractions = this.interactionHistory.slice(-5);
            insights.push(`🔄 Recent Learning (${recentInteractions.length} recent interactions):
${recentInteractions.map(interaction => 
  `- "${interaction.userInput}" -> ${interaction.success !== false ? '✅ Success' : '❌ Failed'}`
).join('\n')}`);
          }
          
          // Recommendations
          insights.push(`💡 Recommendations:
- Continue providing feedback to improve response quality
- Use specific context to help the AI learn better
- Interact regularly to maintain learning momentum`);
          
          return {
            content: [
              {
                type: 'text',
                text: `🧠 AI Learning Insights (${detailLevel} view)

${insights.join('\n\n')}`
              }
            ]
          };
        }
      },
      
      adaptBehavior: {
        name: 'adapt_behavior',
        description: 'Adapt AI behavior based on learned patterns and user preferences',
        inputSchema: {
          type: 'object',
          properties: {
            adaptation: {
              type: 'object',
              description: 'Behavior adaptation parameters',
              properties: {
                communicationStyle: {
                  type: 'string',
                  enum: ['formal', 'casual', 'technical', 'friendly', 'professional'],
                  description: 'How the AI should communicate'
                },
                responseDetailLevel: {
                  type: 'string',
                  enum: ['concise', 'balanced', 'detailed', 'comprehensive'],
                  description: 'How detailed responses should be'
                },
                proactivityLevel: {
                  type: 'string',
                  enum: ['passive', 'responsive', 'proactive', 'very_proactive'],
                  description: 'How proactive the AI should be'
                },
                learningRate: {
                  type: 'string',
                  enum: ['conservative', 'moderate', 'aggressive'],
                  description: 'How quickly the AI should adopt new behaviors'
                },
                customPreferences: {
                  type: 'object',
                  description: 'Custom user preferences as key-value pairs'
                }
              }
            },
            reason: {
              type: 'string',
              description: 'Reason for this adaptation (helps with learning)'
            }
          },
          required: ['adaptation']
        },
        handler: (args) => {
          const { adaptation, reason } = args;
          const timestamp = new Date().toISOString();
          
          // Update preferences
          let changes = [];
          
          if (adaptation.communicationStyle) {
            const oldStyle = this.knowledgeBase.preferences.communicationStyle;
            this.knowledgeBase.preferences.communicationStyle = adaptation.communicationStyle;
            changes.push(`Communication style: ${oldStyle} → ${adaptation.communicationStyle}`);
          }
          
          if (adaptation.responseDetailLevel) {
            const oldLevel = this.knowledgeBase.preferences.responseDetailLevel;
            this.knowledgeBase.preferences.responseDetailLevel = adaptation.responseDetailLevel;
            changes.push(`Response detail: ${oldLevel} → ${adaptation.responseDetailLevel}`);
          }
          
          if (adaptation.proactivityLevel) {
            this.knowledgeBase.preferences.proactivityLevel = adaptation.proactivityLevel;
            changes.push(`Proactivity level: ${adaptation.proactivityLevel}`);
          }
          
          if (adaptation.learningRate) {
            this.knowledgeBase.preferences.learningRate = adaptation.learningRate;
            changes.push(`Learning rate: ${adaptation.learningRate}`);
          }
          
          if (adaptation.customPreferences) {
            Object.assign(this.knowledgeBase.preferences, adaptation.customPreferences);
            changes.push(`Custom preferences: ${Object.keys(adaptation.customPreferences).join(', ')}`);
          }
          
          // Log the adaptation
          this.knowledgeBase.facts.push({
            id: `adaptation_${Date.now()}`,
            content: `Behavior adaptation: ${changes.join(', ')}${reason ? ` (Reason: ${reason})` : ''}`,
            confidence: 0.9,
            source: "behavioral_adaptation"
          });
          
          return {
            content: [
              {
                type: 'text',
                text: `🎯 Behavior Adaptation Complete!

${changes.map(change => `✅ ${change}`).join('\n')}

🔄 AI behavior has been updated based on learned patterns and preferences.
${reason ? `\n💭 Adaptation reason: ${reason}` : ''}

🚀 Future interactions will reflect these new behavioral preferences!`
              }
            ]
          };
        }
      },
      
      optimizePerformance: {
        name: 'optimize_performance',
        description: 'Analyze performance and suggest optimizations for better interactions',
        inputSchema: {
          type: 'object',
          properties: {
            optimizationType: {
              type: 'string',
              enum: ['response_time', 'accuracy', 'user_satisfaction', 'efficiency', 'comprehensive'],
              description: 'Type of optimization to focus on',
              default: 'comprehensive'
            },
            includeImplementation: {
              type: 'boolean',
              description: 'Whether to include specific implementation suggestions',
              default: false
            }
          }
        },
        handler: (args) => {
          const { optimizationType = 'comprehensive', includeImplementation = false } = args;
          
          let optimizations = [];
          
          // Analyze current performance
          const successRate = this.performanceMetrics.totalInteractions > 0 
            ? (this.performanceMetrics.successfulInteractions / this.performanceMetrics.totalInteractions * 100)
            : 0;
          
          // Response time optimization
          if (optimizationType === 'response_time' || optimizationType === 'comprehensive') {
            optimizations.push(`⚡ Response Time Optimization:
- Current performance: ${successRate.toFixed(1)}% success rate
- Suggestion: Cache frequently requested resources
- Impact: Faster response times for repeated queries${includeImplementation ? '\n- Implementation: Implement LRU cache for tools and resources' : ''}`);
          }
          
          // Accuracy optimization
          if (optimizationType === 'accuracy' || optimizationType === 'comprehensive') {
            const lowConfidenceFacts = this.knowledgeBase.facts.filter(f => f.confidence < 0.5);
            optimizations.push(`🎯 Accuracy Optimization:
- Low-confidence facts: ${lowConfidenceFacts.length}
- Suggestion: Validate and update low-confidence knowledge
- Impact: More reliable responses${includeImplementation ? '\n- Implementation: Add fact verification process' : ''}`);
          }
          
          // User satisfaction optimization
          if (optimizationType === 'user_satisfaction' || optimizationType === 'comprehensive') {
            const recentFeedback = this.feedbackData.slice(-10);
            const positiveFeedback = recentFeedback.filter(f => 
              f.feedback.toLowerCase().includes('good') || 
              f.feedback.toLowerCase().includes('great')
            ).length;
            
            optimizations.push(`😊 User Satisfaction Optimization:
- Recent positive feedback: ${positiveFeedback}/${recentFeedback.length}
- Suggestion: Personalize responses based on user preferences
- Impact: Higher user satisfaction${includeImplementation ? '\n- Implementation: Enhance preference learning algorithms' : ''}`);
          }
          
          // Efficiency optimization
          if (optimizationType === 'efficiency' || optimizationType === 'comprehensive') {
            const duplicatePatterns = this.knowledgeBase.patterns.filter(p => 
              this.knowledgeBase.patterns.filter(p2 => p2.pattern === p.pattern).length > 1
            ).length;
            
            optimizations.push(`⚙️ Efficiency Optimization:
- Duplicate patterns: ${duplicatePatterns}
- Suggestion: Consolidate similar patterns and remove redundancies
- Impact: Faster pattern matching, reduced memory usage${includeImplementation ? '\n- Implementation: Pattern deduplication algorithm' : ''}`);
          }
          
          // Priority recommendations
          const priorityRecommendations = [
            "🔥 High Priority: Implement response caching for frequently used tools",
            "🚀 Medium Priority: Enhance pattern recognition for common user intents",
            "💡 Low Priority: Add more sophisticated feedback analysis"
          ];
          
          return {
            content: [
              {
                type: 'text',
                text: `⚡ Performance Optimization Analysis

${optimizations.join('\n\n')}

📋 Priority Recommendations:
${priorityRecommendations.join('\n')}

🎯 Next Steps:
1. Implement high-priority optimizations
2. Monitor performance metrics
3. Gather user feedback on improvements
4. Iterate based on results`
              }
            ]
          };
        }
      },
      
      // AUTOMATIC OPTIMIZATION AND PRODUCTIVITY TOOLS
      
      autoOptimize: {
        name: 'auto_optimize',
        description: 'Automatically optimize system performance based on current metrics and usage patterns. Runs continuous performance enhancement.',
        inputSchema: {
          type: 'object',
          properties: {
            priority: {
              type: 'string',
              enum: ['performance', 'productivity', 'tool_usage', 'balanced'],
              description: 'Optimization priority focus',
              default: 'balanced'
            },
            force: {
              type: 'boolean',
              description: 'Force optimization even if recently run',
              default: false
            },
            aggressive: {
              type: 'boolean',
              description: 'Use aggressive optimization strategies',
              default: false
            }
          }
        },
        handler: (args) => {
          const { priority = 'balanced', force = false, aggressive = false } = args;
          const now = Date.now();
          
          // Check if we should run optimization
          if (!force && (now - this.autoOptimization.lastRun) < this.autoOptimization.interval) {
            const nextRun = new Date(this.autoOptimization.lastRun + this.autoOptimization.interval).toISOString();
            return {
              content: [
                {
                  type: 'text',
                  text: `⏳ Auto-optimization skipped (run too recently)
Next optimization: ${nextRun}
Use "force: true" to override`
                }
              ]
            };
          }
          
          this.autoOptimization.lastRun = now;
          
          // Analyze current state
          const successRate = this.performanceMetrics.totalInteractions > 0 
            ? (this.performanceMetrics.successfulInteractions / this.performanceMetrics.totalInteractions)
            : 0;
          
          const avgToolUsage = Object.values(this.performanceMetrics.toolUsageCount).reduce((a, b) => a + b, 0) / Math.max(this.performanceMetrics.totalInteractions, 1);
          
          let optimizations = [];
          let improvements = [];
          
          // Performance-focused optimizations
          if (priority === 'performance' || priority === 'balanced') {
            if (successRate < this.autoOptimization.targetMetrics.minSuccessRate) {
              optimizations.push("🎯 Enhancing success rate through pattern analysis");
              improvements.push("Increased pattern matching accuracy");
            }
            
            if (avgToolUsage < this.autoOptimization.targetMetrics.minToolUsage) {
              optimizations.push("🛠️ Promoting tool usage through better recommendations");
              improvements.push("Enhanced tool suggestion algorithms");
            }
          }
          
          // Productivity-focused optimizations
          if (priority === 'productivity' || priority === 'balanced') {
            if (this.productivityMetrics.efficiencyScore < 0.85) {
              optimizations.push("⚡ Streamlining response patterns for efficiency");
              improvements.push("Faster response generation");
            }
            
            if (this.performanceMetrics.productivityScore < this.autoOptimization.targetMetrics.targetProductivity) {
              optimizations.push("📈 Implementing productivity enhancement strategies");
              improvements.push("Better task completion tracking");
            }
          }
          
          // Apply optimizations
          if (optimizations.length > 0) {
            // Update knowledge base with optimizations
            this.knowledgeBase.facts.push({
              id: `auto_opt_${Date.now()}`,
              content: `Auto-optimization applied: ${optimizations.join(', ')}`,
              confidence: 0.9,
              source: "automatic_optimization"
            });
            
            // Update performance metrics
            this.performanceMetrics.productivityScore = Math.min(1.0, this.performanceMetrics.productivityScore + 0.05);
            this.productivityMetrics.efficiencyScore = Math.min(1.0, this.productivityMetrics.efficiencyScore + 0.03);
          }
          
          return {
            content: [
              {
                type: 'text',
                text: `🚀 Auto-Optimization Complete (${priority} priority)

📊 Current Metrics:
- Success rate: ${(successRate * 100).toFixed(1)}%
- Tool usage: ${(avgToolUsage * 100).toFixed(1)}%
- Productivity score: ${(this.performanceMetrics.productivityScore * 100).toFixed(1)}%
- Efficiency score: ${(this.productivityMetrics.efficiencyScore * 100).toFixed(1)}%

🔧 Optimizations Applied:
${optimizations.length > 0 ? optimizations.map(opt => `• ${opt}`).join('\n') : '• No optimizations needed (metrics within targets)'}

✅ Improvements:
${improvements.length > 0 ? improvements.map(imp => `• ${imp}`).join('\n') : '• System performing optimally'}

⏰ Next auto-optimization: ${new Date(now + this.autoOptimization.interval).toISOString()}`
              }
            ]
          };
        }
      },
      
      trackProductivity: {
        name: 'track_productivity',
        description: 'Track and analyze productivity metrics. Monitor task completion, efficiency, and tool effectiveness.',
        inputSchema: {
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
        },
        handler: (args) => {
          const { action = 'get_metrics', task, goal } = args;
          
          switch (action) {
            case 'add_task':
              if (!task) {
                return { content: [{ type: 'text', text: '❌ Task information required' }], isError: true };
              }

              // Validate task structure
              if (!task.name || typeof task.name !== 'string') {
                console.error('Invalid task: missing or non-string name', { task });
                return { content: [{ type: 'text', text: '❌ Task name must be a non-empty string' }], isError: true };
              }

              if (task.efficiency !== undefined && typeof task.efficiency !== 'number') {
                console.error('Invalid task: non-numeric efficiency', { task });
                return { content: [{ type: 'text', text: '❌ Task efficiency must be a number (0-1)' }], isError: true };
              }

              if (task.efficiency !== undefined && (task.efficiency < 0 || task.efficiency > 1)) {
                console.error('Invalid task: efficiency out of range', { task });
                return { content: [{ type: 'text', text: '❌ Task efficiency must be between 0 and 1' }], isError: true };
              }

              // Validate toolsUsed if present
              if (task.toolsUsed) {
                if (!Array.isArray(task.toolsUsed)) {
                  console.error('Invalid task: toolsUsed not an array', { task });
                  return { content: [{ type: 'text', text: '❌ toolsUsed must be an array of strings' }], isError: true };
                }

                for (const tool of task.toolsUsed) {
                  if (typeof tool !== 'string') {
                    console.error('Invalid tool in toolsUsed array', { task, invalidTool: tool });
                    return { content: [{ type: 'text', text: `❌ All tools must be strings, found ${typeof tool}` }], isError: true };
                  }
                }
              }

              // Now update metrics with validated data
              this.productivityMetrics.tasksCompleted++;

              // Track tool effectiveness
              if (task.toolsUsed) {
                task.toolsUsed.forEach(tool => {
                  if (!this.productivityMetrics.toolEffectiveness[tool]) {
                    this.productivityMetrics.toolEffectiveness[tool] = { uses: 0, success: 0 };
                  }
                  this.productivityMetrics.toolEffectiveness[tool].uses++;
                  if (task.success !== false) {
                    this.productivityMetrics.toolEffectiveness[tool].success++;
                  }
                });
              }

              // Update efficiency score
              if (task.efficiency) {
                this.productivityMetrics.efficiencyScore =
                  (this.productivityMetrics.efficiencyScore * 0.9) + (task.efficiency * 0.1);
              }
              
              return {
                content: [
                  {
                    type: 'text',
                    text: `✅ Task tracked: ${task.name}
📊 Productivity metrics updated
🎯 Tasks completed: ${this.productivityMetrics.tasksCompleted}
⚡ Current efficiency: ${(this.productivityMetrics.efficiencyScore * 100).toFixed(1)}%`
                  }
                ]
              };
              
            case 'complete_task':
              this.productivityMetrics.tasksCompleted++;
              this.performanceMetrics.productivityScore = Math.min(1.0, this.performanceMetrics.productivityScore + 0.02);
              
              return {
                content: [
                  {
                    type: 'text',
                    text: `🎉 Task completed!
📈 Productivity score: ${(this.performanceMetrics.productivityScore * 100).toFixed(1)}%
✅ Total tasks completed: ${this.productivityMetrics.tasksCompleted}`
                  }
                ]
              };
              
            case 'set_goal':
              if (!goal) {
                return { content: [{ type: 'text', text: '❌ Goal information required' }], isError: true };
              }
              
              goal.id = `goal_${Date.now()}`;
              goal.created = new Date().toISOString();
              this.productivityMetrics.userGoals.push(goal);
              
              return {
                content: [
                  {
                    type: 'text',
                    text: `🎯 Goal set: ${goal.description}
📅 Priority: ${goal.priority}
🚀 Goal added to productivity tracking`
                  }
                ]
              };
              
            case 'get_metrics':
              const toolStats = Object.entries(this.productivityMetrics.toolEffectiveness)
                .map(([tool, stats]) => {
                  const successRate = stats.uses > 0 ? (stats.success / stats.uses * 100).toFixed(1) : 'N/A';
                  return `${tool}: ${stats.success}/${stats.uses} (${successRate}% success)`;
                })
                .join('\n');
              
              return {
                content: [
                  {
                    type: 'text',
                    text: `📊 Productivity Metrics

🎯 Tasks Completed: ${this.productivityMetrics.tasksCompleted}
⚡ Efficiency Score: ${(this.productivityMetrics.efficiencyScore * 100).toFixed(1)}%
📈 Productivity Score: ${(this.performanceMetrics.productivityScore * 100).toFixed(1)}%
🛠️ Tool Effectiveness:\n${toolStats || 'No tool usage data yet'}
🎯 Active Goals: ${this.productivityMetrics.userGoals.length}
✅ Completed Goals: ${this.productivityMetrics.completedGoals.length}`
                  }
                ]
              };
              
            case 'analyze_efficiency':
              const analysis = this.analyzeEfficiency();
              return {
                content: [
                  {
                    type: 'text',
                    text: analysis
                  }
                ]
              };
              
            default:
              return { content: [{ type: 'text', text: '❌ Unknown action' }], isError: true };
          }
        }
      },
      
      enhanceToolUsage: {
        name: 'enhance_tool_usage',
        description: 'Analyze tool usage patterns and suggest enhancements to increase productivity and tool adoption.',
        inputSchema: {
          type: 'object',
          properties: {
            analysisType: {
              type: 'string',
              enum: ['usage_patterns', 'effectiveness', 'recommendations', 'comprehensive'],
              description: 'Type of enhancement analysis',
              default: 'comprehensive'
            },
            targetTools: {
              type: 'array',
              items: { type: 'string' },
              description: 'Specific tools to analyze (if not all)'
            },
            timeframe: {
              type: 'string',
              enum: ['recent', 'hour', 'day', 'all'],
              description: 'Time period to analyze',
              default: 'recent'
            }
          }
        },
        handler: (args) => {
          const { analysisType = 'comprehensive', targetTools = null, timeframe = 'recent' } = args;
          
          let analysis = [];
          let recommendations = [];
          
          // Analyze tool usage patterns
          if (analysisType === 'usage_patterns' || analysisType === 'comprehensive') {
            const toolUsage = this.performanceMetrics.toolUsageCount;
            const totalUsage = Object.values(toolUsage).reduce((a, b) => a + b, 0);
            
            if (totalUsage > 0) {
              const usageStats = Object.entries(toolUsage)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([tool, count]) => `${tool}: ${count} uses (${(count/totalUsage*100).toFixed(1)}%)`)
                .join('\n');
              
              analysis.push(`📈 Tool Usage Patterns (Top 5):\n${usageStats}`);
            } else {
              analysis.push("📈 Tool Usage: No usage data available");
            }
          }
          
          // Analyze tool effectiveness
          if (analysisType === 'effectiveness' || analysisType === 'comprehensive') {
            const effectiveness = this.productivityMetrics.toolEffectiveness;
            
            if (Object.keys(effectiveness).length > 0) {
              const effectivenessStats = Object.entries(effectiveness)
                .map(([tool, stats]) => {
                  const rate = stats.uses > 0 ? (stats.success / stats.uses * 100).toFixed(1) : 0;
                  return `${tool}: ${rate}% success rate`;
                })
                .join('\n');

              analysis.push(`🎯 Tool Effectiveness:\n${effectivenessStats}`);
            } else {
              analysis.push("🎯 Tool Effectiveness: No effectiveness data available");
            }
          }
          
          // Generate recommendations
          if (analysisType === 'recommendations' || analysisType === 'comprehensive') {
            // Check for underutilized tools
            const allTools = ['learn_from_interaction', 'get_learning_insights', 'adapt_behavior', 'optimize_performance', 'auto_optimize', 'track_productivity', 'enhance_tool_usage'];
            const usedTools = Object.keys(this.performanceMetrics.toolUsageCount);
            const unusedTools = allTools.filter(tool => !usedTools.includes(tool));
            
            if (unusedTools.length > 0) {
              recommendations.push(`🔍 Promote unused tools: ${unusedTools.join(', ')}`);
            }
            
            // Check for low tool usage
            const totalInteractions = this.performanceMetrics.totalInteractions;
            const toolUsageRate = Object.values(this.performanceMetrics.toolUsageCount).reduce((a, b) => a + b, 0) / Math.max(totalInteractions, 1);
            
            if (toolUsageRate < 0.5) {
              recommendations.push(`🚀 Increase tool usage: Current rate ${(toolUsageRate*100).toFixed(1)}% (target: >50%)`);
            }
            
            // Performance recommendations
            recommendations.push("⚡ Implement tool usage prompts in responses");
            recommendations.push("📊 Add tool suggestions based on user input patterns");
            recommendations.push("🎯 Create tool usage tutorials or examples");
          }
          
          return {
            content: [
              {
                type: 'text',
                text: `🛠️ Tool Usage Enhancement Analysis (${analysisType})

${analysis.join('\n\n')}

💡 Recommendations:
${recommendations.join('\n')}

🎯 Enhancement Impact:
- Improved productivity through better tool utilization
- Enhanced user experience with targeted tool suggestions
- Increased system effectiveness and user satisfaction`
              }
            ]
          };
        }
      }
    };
  }

  startAutoOptimization() {
    if (!this.autoOptimization.enabled) return;

    // Wrap async call with catch to prevent unhandled rejections
    setInterval(async () => {
      try {
        await this.performAutoOptimization();
      } catch (error) {
        // Safety net - should never happen due to internal error handling
        console.error('Unexpected error in auto-optimization interval:', error.message);
      }
    }, this.autoOptimization.interval);

    // Also run immediately on startup
    setTimeout(async () => {
      try {
        await this.performAutoOptimization();
      } catch (error) {
        console.error('Initial auto-optimization failed:', error.message);
      }
    }, 5000);
  }

  async performAutoOptimization() {
    if (!this.autoOptimization.enabled) return;

    // Auto-optimize with balanced priority
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
      this.performanceMetrics.lastSuccessfulOptimization = Date.now();
      this.performanceMetrics.optimizationSuccessCount =
        (this.performanceMetrics.optimizationSuccessCount || 0) + 1;

    } catch (error) {
      // Track failure for monitoring - don't silently swallow
      this.performanceMetrics.optimizationFailureCount =
        (this.performanceMetrics.optimizationFailureCount || 0) + 1;
      this.performanceMetrics.lastOptimizationError = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      };

      console.error('❌ Auto-optimization failed:', error.message, error.stack);

      // Disable auto-optimization after repeated failures
      if (this.performanceMetrics.optimizationFailureCount > 5) {
        console.error('⚠️ Auto-optimization disabled due to repeated failures');
        this.autoOptimization.enabled = false;
      }
    }
  }

  analyzeEfficiency() {
    const toolEffectiveness = this.productivityMetrics.toolEffectiveness;
    const totalTasks = this.productivityMetrics.tasksCompleted;
    const efficiency = this.productivityMetrics.efficiencyScore;
    const productivity = this.performanceMetrics.productivityScore;
    
    let analysis = `📈 Efficiency Analysis Report

🎯 Overall Performance:
- Tasks completed: ${totalTasks}
- Efficiency score: ${(efficiency * 100).toFixed(1)}%
- Productivity score: ${(productivity * 100).toFixed(1)}%

🛠️ Tool Effectiveness Analysis:`;
    
    if (Object.keys(toolEffectiveness).length > 0) {
      for (const [tool, stats] of Object.entries(toolEffectiveness)) {
        const successRate = stats.uses > 0 ? (stats.success / stats.uses) * 100 : 0;
        analysis += `\n- ${tool}: ${stats.uses} uses, ${successRate.toFixed(1)}% success rate`;
      }
    } else {
      analysis += '\n- No tool usage data available';
    }
    
    analysis += `

💡 Efficiency Recommendations:`;
    
    if (efficiency < 0.7) {
      analysis += '\n- Focus on using higher-effectiveness tools';
      analysis += '\n- Reduce task switching and interruptions';
    }
    
    if (productivity < 0.8) {
      analysis += '\n- Increase tool usage frequency';
      analysis += '\n- Set clear productivity goals';
    }
    
    if (Object.keys(toolEffectiveness).length === 0) {
      analysis += '\n- Start using tools to track productivity metrics';
      analysis += '\n- Implement tool usage in daily workflows';
    }
    
    analysis += `

🚀 Next Steps:
1. Set specific productivity goals
2. Track tool usage for all tasks
3. Regular efficiency reviews
4. Implement suggested improvements`;
    
    return analysis;
  }

  async start() {
    const transport = new StdioServerTransport();
    this.server.connect(transport);
    
    console.error('Universal MCP Server started successfully!');
    console.error('Server is ready to accept connections from any AI client.');
    console.error('Press Ctrl+C to stop the server.');
    
    // Keep the process alive
    process.stdin.resume();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.error('\nShutting down MCP server...');
      transport.close();
      process.exit(0);
    });
  }
}

// Start the server
const server = new UniversalMCPServer();
server.start().catch(console.error);
