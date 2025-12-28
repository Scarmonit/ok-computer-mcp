# Universal MCP Server

A universal Model Control Protocol (MCP) server that any AI assistant can connect to. This server provides a standardized interface for AI systems to access resources, use tools, and leverage prompt templates.

## What is MCP?

Model Control Protocol (MCP) is a standardized protocol that allows AI assistants to communicate with external services, tools, and resources in a consistent way. Think of it as a "USB-C for AI" - a universal connector that any AI can use to extend its capabilities.

## Features

- **Universal Compatibility**: Any AI system that supports MCP can connect
- **Self-Improving AI Tools**: Learn from interactions, adapt behavior, and optimize performance
- **🔥 Automatic Performance Optimization**: Continuously optimizes every 5 minutes without manual intervention
- **📊 Productivity Tracking**: Monitor tasks, efficiency, and tool effectiveness
- **🛠️ Tool Usage Enhancement**: Automatically suggests ways to increase tool adoption and productivity
- **Resource Access**: Read data from various sources
- **Tool Integration**: Execute functions and get results
- **Prompt Templates**: Use predefined prompt structures
- **Simple Setup**: Easy to start and connect to

### Self-Improving Capabilities 🤖🧠

This MCP server includes advanced self-improvement tools that enable AI systems to:

- **Learn from Interactions**: Automatically learn from user feedback and interaction patterns
- **Adapt Behavior**: Dynamically adjust communication style, response detail, and proactivity levels
- **Optimize Performance**: Analyze performance metrics and suggest improvements
- **Build Knowledge Base**: Accumulate facts, patterns, and preferences over time
- **Track Progress**: Monitor learning progress and success rates

The AI becomes smarter and more personalized with each interaction!

### ⚡ Automatic Performance Optimization

The server now includes **automatic, continuous optimization**:

- **Auto-runs every 5 minutes** without manual intervention
- **Monitors key metrics**: success rate, tool usage, productivity scores
- **Self-corrects**: automatically applies improvements when metrics drop below targets
- **Prioritizes performance**: focuses on speed, efficiency, and tool usage
- **Tracks productivity**: monitors tasks, goals, and tool effectiveness
- **Always optimizing**: works 24/7 to enhance system performance

**No manual optimization needed** - the system continuously improves itself!

### 📊 Productivity-First Design

All tools and features are designed to **maximize productivity**:

- **Tool usage tracking** with effectiveness metrics
- **Task completion monitoring** with efficiency scoring
- **Goal setting and tracking** with priority management
- **Automatic suggestions** for improving tool adoption
- **Performance analytics** with actionable insights
- **Continuous learning** from productivity patterns

## Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

1. Clone or download this server
2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

The server will start and listen for connections via stdin/stdout.

## How AI Systems Connect

### Method 1: Direct Process Communication

AI systems can spawn the MCP server as a subprocess and communicate via stdin/stdout:

```javascript
import { spawn } from 'child_process';

const mcpServer = spawn('node', ['path/to/mcp-server/src/index.js']);

// Send requests to MCP server
mcpServer.stdin.write(JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list',
  params: {}
}) + '\n');

// Receive responses
mcpServer.stdout.on('data', (data) => {
  console.log('MCP Response:', data.toString());
});
```

### Method 2: Using MCP Client Libraries

Many AI frameworks have MCP client libraries. Here's a general pattern:

```python
# Python example
import subprocess
import json

class MCPServerConnection:
    def __init__(self, server_path):
        self.process = subprocess.Popen(
            ['node', server_path],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
    
    def send_request(self, method, params):
        request = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": method,
            "params": params
        }
        self.process.stdin.write(json.dumps(request) + '\n')
        self.process.stdin.flush()
        
        response = self.process.stdout.readline()
        return json.loads(response)

# Usage
mcp = MCPServerConnection('./mcp-server/src/index.js')
tools = mcp.send_request('tools/list', {})
```

## Available Resources

Resources are data sources that AI can read from:

| URI | Description | Type |
|-----|-------------|------|
| `info://server` | Server information and status | JSON |
| `time://current` | Current server time | JSON |
| `echo://{message}` | Echoes back any message | Text |

### Reading Resources

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "resources/read",
  "params": {
    "uri": "info://server"
  }
}
```

## Available Tools

Tools are functions that AI can execute:

### learn_from_interaction
Learn from user interactions to improve future responses. This tool enables the AI to build a knowledge base from user feedback and interaction patterns.

**Input:**
```json
{
  "interaction": {
    "userInput": "How do I improve my productivity?",
    "aiResponse": "Here are some productivity tips...",
    "userFeedback": "Great response! Very helpful.",
    "success": true,
    "context": "User seeking productivity advice"
  }
}
```

**Example:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "learn_from_interaction",
    "arguments": {
      "interaction": {
        "userInput": "How do I improve my productivity?",
        "aiResponse": "Use time blocking and take regular breaks",
        "userFeedback": "Excellent advice! Very helpful.",
        "success": true,
        "context": "Productivity improvement request"
      }
    }
  }
}
```

### get_learning_insights
Get insights about what the AI has learned and performance metrics. Shows how the AI has improved over time.

**Input:**
```json
{
  "detailLevel": "detailed",
  "focusArea": "all"
}
```

**Example:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_learning_insights",
    "arguments": {
      "detailLevel": "detailed",
      "focusArea": "performance"
    }
  }
}
```

### adapt_behavior
Adapt AI behavior based on learned patterns and user preferences. Allows dynamic adjustment of communication style and response characteristics.

**Input:**
```json
{
  "adaptation": {
    "communicationStyle": "friendly",
    "responseDetailLevel": "detailed",
    "proactivityLevel": "proactive"
  },
  "reason": "User prefers friendly, detailed responses"
}
```

**Example:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "adapt_behavior",
    "arguments": {
      "adaptation": {
        "communicationStyle": "professional",
        "responseDetailLevel": "comprehensive",
        "proactivityLevel": "responsive",
        "learningRate": "moderate"
      },
      "reason": "Adapting to user preferences based on feedback"
    }
  }
}
```

### optimize_performance
Analyze performance and suggest optimizations for better interactions. Provides AI-driven recommendations for improvement.

**Input:**
```json
{
  "optimizationType": "comprehensive",
  "includeImplementation": true
}
```

**Example:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "optimize_performance",
    "arguments": {
      "optimizationType": "user_satisfaction",
      "includeImplementation": true
    }
  }
}
```

### auto_optimize
Automatically optimize system performance based on current metrics and usage patterns. Runs continuous performance enhancement every 5 minutes by default.

**Input:**
```json
{
  "priority": "performance",
  "force": true,
  "aggressive": false
}
```

**Example:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "auto_optimize",
    "arguments": {
      "priority": "productivity",
      "force": true,
      "aggressive": false
    }
  }
}
```

### track_productivity
Track and analyze productivity metrics. Monitor task completion, efficiency, and tool effectiveness.

**Input:**
```json
{
  "action": "add_task",
  "task": {
    "name": "Complete user request",
    "type": "interaction",
    "toolsUsed": ["echo", "system_info"],
    "duration": 120,
    "success": true,
    "efficiency": 0.9
  }
}
```

**Example:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "track_productivity",
    "arguments": {
      "action": "complete_task"
    }
  }
}
```

### enhance_tool_usage
Analyze tool usage patterns and suggest enhancements to increase productivity and tool adoption.

**Input:**
```json
{
  "analysisType": "comprehensive",
  "timeframe": "recent"
}
```

**Example:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "enhance_tool_usage",
    "arguments": {
      "analysisType": "recommendations",
      "timeframe": "day"
    }
  }
}
```

### echo
Echo back a message.

**Input:**
```json
{
  "message": "Hello, World!"
}
```

### system_info
Get system information.

**Input:**
```json
{
  "detail": "basic"  // or "full"
}
```

## Available Prompts

Prompts are templates that AI can use to structure conversations:

### assistant
A helpful assistant prompt template.

**Arguments:**
- `task` (required): The task you need help with
- `style` (optional): Communication style (formal, casual, technical)

**Example:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "prompts/get",
  "params": {
    "name": "assistant",
    "arguments": {
      "task": "Write a Python function",
      "style": "technical"
    }
  }
}
```

### code_review
Prompt template for code review.

**Arguments:**
- `code` (required): The code to review
- `language` (optional): Programming language

## MCP Protocol Overview

The MCP server communicates using JSON-RPC 2.0 over stdin/stdout:

### Request Format
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "method.name",
  "params": {}
}
```

### Response Format
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {},
  "error": null
}
```

### Error Format
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": null,
  "error": {
    "code": -32601,
    "message": "Method not found"
  }
}
```

## Configuration

The server can be configured by modifying the `src/index.js` file:

- Add new resources in `initializeResources()`
- Add new tools in `initializeTools()`
- Add new prompts in `initializePrompts()`

## Examples

### Example 1: Simple Echo Tool
```bash
# Start the server
node src/index.js

# In another terminal, send a request
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"echo","arguments":{"message":"Hello from AI!"}}}' | node src/index.js
```

### Example 2: Using curl (with a wrapper)
```bash
# Create a simple wrapper script that converts HTTP to MCP
node -e "
const { spawn } = require('child_process');
const mcp = spawn('node', ['src/index.js']);
process.stdin.pipe(mcp.stdin);
mcp.stdout.pipe(process.stdout);
"
```

## Error Handling

The server handles errors gracefully and returns standard JSON-RPC error responses:

- `-32601`: Method not found
- `-32602`: Invalid params
- `-32603`: Internal error
- `-32700`: Parse error

## Security Considerations

This server implements comprehensive security hardening:

### Prototype Pollution Prevention
All input arguments are deeply sanitized using `deepSanitize()` which:
- Recursively removes `__proto__`, `constructor`, and `prototype` properties
- Limits nesting depth to 10 levels to prevent stack overflow attacks
- Logs blocked dangerous properties for security monitoring

### Input Validation
- `learn_from_interaction`: Validates required fields (`userInput`, `aiResponse`) and types
- `track_productivity`: Validates task structure, efficiency range (0-1), and array types
- All tools validate inputs before processing

### Environment Protection
- `system_info` only exposes `NODE_ENV` and `TZ` environment variables
- No sensitive data (API keys, tokens, passwords) is ever exposed
- Process environment is whitelisted, not blacklisted

### Error Handling & Circuit Breaker
- Async operations properly awaited with try-catch blocks
- Circuit breaker pattern disables auto-optimization after 5 consecutive failures
- All errors are logged with context and tracked in metrics
- Division by zero guards in all calculation paths

### General Security
- The server runs locally and communicates via stdin/stdout
- No network ports are exposed by default
- Tools are sandboxed to prevent dangerous operations
- File system access is limited to intentional resources

## Testing

```bash
# Run lookup fix tests (17 tests)
node test-lookup-fix.js

# Run security tests (22 tests)
node test-security-fixes.js

# Run simple integration test
node simple-test.js
```

## Extending the Server

### Adding a New Tool
```javascript
// In initializeTools()
return {
  // ... existing tools
  weather: {
    name: 'weather',
    description: 'Get weather information',
    inputSchema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'City name' }
      },
      required: ['city']
    },
    handler: async (args) => {
      // Your weather API call here
      return { content: [{ type: 'text', text: 'Weather data' }] };
    }
  }
};
```

### Adding a New Resource
```javascript
// In initializeResources()
return {
  // ... existing resources
  weather: {
    uri: 'weather://{city}',
    name: 'Weather Data',
    description: 'Get weather for a city',
    mimeType: 'application/json',
    content: {
      uri: 'weather://london',
      mimeType: 'application/json',
      text: JSON.stringify({ temp: '15°C', condition: 'Cloudy' })
    }
  }
};
```

## Troubleshooting

### Server won't start
- Check Node.js version: `node --version` (must be 18+)
- Check dependencies: `npm install`

### Connection issues
- Ensure the server is running
- Check that stdin/stdout communication is working
- Verify JSON-RPC format in requests

### Debugging
Run with debug output:
```bash
DEBUG=1 npm start
```

## License

MIT License - Feel free to use and modify as needed.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the MCP specification
3. Test with the provided examples