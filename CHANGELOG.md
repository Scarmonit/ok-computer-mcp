# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-12-27

### Added
- **TypeScript Foundation** - Gradual TypeScript migration begins
- Core type definitions in `src/types/index.ts`
- Utility modules converted to TypeScript:
  - `src/utils/sanitize.ts` - Deep sanitization with type guards
  - `src/utils/validation.ts` - Type-safe input validation
  - `src/utils/index.ts` - Barrel export

### Types
New TypeScript interfaces and types:
- **MCP Protocol Types**: `TextContent`, `ToolResult`, `MCPTool`, `MCPPrompt`, `MCPResource`
- **Metrics Types**: `PerformanceMetrics`, `ProductivityMetrics`, `ErrorRecord`
- **Knowledge Types**: `KnowledgeBase`, `Fact`, `Pattern`, `Preferences`
- **Input Types**: `LearnFromInteractionInput`, `AdaptBehaviorInput`, `OptimizePerformanceInput`
- **Validation Types**: `ValidationResult<T>` with type-safe validators

### CI/CD
- Added TypeScript type checking to CI pipeline
- New `typecheck` job runs `tsc --noEmit`
- Builds verified across Node.js 18, 20, 22

### Developer Experience
- `npm run build` - Compile TypeScript to JavaScript
- `npm run typecheck` - Type check without emitting
- `allowJs: true` enables gradual migration

---

## [1.0.1] - 2024-12-27

### Added
- Comprehensive test suite expansion from 39 to 91 tests
- New `test-coverage-gaps.js` with 52 additional tests

### Tests
Coverage increased from ~70% to ~85%:

- **get_learning_insights** - 12 tests for detail levels and focus areas
- **adapt_behavior** - 16 tests for preference persistence
- **optimize_performance** - 7 tests for optimization types
- **auto_optimize** - 7 tests for timing and force logic
- **enhance_tool_usage** - 6 tests for analysis types
- **track_productivity** - 4 tests for goal management

### CI/CD
- Added coverage gap tests to GitHub Actions workflow
- All 91 tests run on Node.js 18, 20, and 22

---

## [1.0.0] - 2024-12-27

### Added
- Initial release of OK Computer MCP Server
- 9 self-improving tools for AI assistants
- Comprehensive test suite (39 tests)

### Security
- **CRITICAL**: Fixed `process.env` exposure in `system_info` tool
  - Now only exposes `NODE_ENV` and `TZ` environment variables
  - All sensitive data (API keys, tokens, passwords) protected

- **CRITICAL**: Fixed async/await pattern in `performAutoOptimization`
  - Proper `await` on handler calls
  - Result structure validation before access
  - Circuit breaker pattern (disables after 5 failures)
  - Detailed error logging with stack traces

- **HIGH**: Added input validation to `learn_from_interaction`
  - Validates `interaction` object exists
  - Validates `userInput` is a string
  - Validates `aiResponse` is a string
  - Validates `success` is a boolean if provided

- **HIGH**: Added input validation to `track_productivity`
  - Validates `task.name` is a non-empty string
  - Validates `task.efficiency` is a number between 0-1
  - Validates `task.toolsUsed` is an array of strings

- **MEDIUM**: Implemented `deepSanitize()` for prototype pollution prevention
  - Recursively removes `__proto__`, `constructor`, `prototype` properties
  - Limits nesting depth to 10 levels
  - Logs blocked dangerous properties

- **MEDIUM**: Added division by zero guards
  - Protected calculations in `get_metrics`
  - Protected calculations in `enhance_tool_usage`

### Fixed
- Tool lookup now correctly matches by `name` property instead of object key
- Prompt lookup now correctly matches by `name` property instead of object key

### Tools
- `echo` - Echo back messages for testing
- `system_info` - Get system information (security hardened)
- `learn_from_interaction` - Record interactions for learning
- `get_learning_insights` - Retrieve learning insights
- `adapt_behavior` - Adapt AI behavior dynamically
- `optimize_performance` - Analyze and suggest optimizations
- `auto_optimize` - Automatic performance optimization
- `track_productivity` - Track productivity metrics
- `enhance_tool_usage` - Analyze and enhance tool usage

### Tests
- `test-lookup-fix.js` - 17 tests for tool/prompt lookup fixes
- `test-security-fixes.js` - 22 tests for security hardening
