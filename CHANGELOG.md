# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0] - 2024-12-28

### Added
- **npm Package Publishing** - Package now available on npmjs.com
  - Install globally: `npm install -g ok-computer-mcp`
  - Use as CLI: `npx ok-computer-mcp`
  - Add to MCP config for Claude Desktop

### Changed
- **Package Structure** - Optimized for npm distribution
  - `main` points to compiled `dist/index.js`
  - `types` points to TypeScript declarations
  - `bin` enables CLI usage via npx
  - `files` field limits published files to dist/, README.md, LICENSE

### CI/CD
- **npm Publish Workflow** - Automated publishing on GitHub release
  - Triggers on release publication
  - Builds, tests, then publishes with provenance
  - Requires NPM_TOKEN secret in repository settings

### Installation

```bash
# Global install
npm install -g ok-computer-mcp

# Or use directly with npx
npx ok-computer-mcp

# Or add to project
npm install ok-computer-mcp
```

---

## [1.4.0] - 2024-12-27

### Changed
- **FULL STRICT MODE** - TypeScript strict mode now enabled
  - `strict: true` in tsconfig.json
  - `noImplicitReturns: true` - Ensures all code paths return a value
  - `noFallthroughCasesInSwitch: true` - Prevents accidental switch fallthrough

### Verified
- **Zero strict mode errors** - Codebase was already strict-mode compatible
- **Zero `any` types** - Full type safety across all modules
- **All 91 tests passing** - No regressions from strict mode

### TypeScript Migration Complete 🎉
This release marks the completion of the TypeScript migration roadmap:
- v1.1.0: TypeScript foundation, core types, utilities
- v1.2.0: Full TypeScript tool handlers with factory pattern
- v1.3.0: ServerStateManager class, shared utilities, type safety fixes
- v1.4.0: Full strict mode enabled (this release)

The codebase now has complete type safety with strict null checks, strict property initialization, and all other strict mode features enabled.

---

## [1.3.0] - 2024-12-27

### Added
- **ServerStateManager Class** - Centralized state management with encapsulation
  - Private state storage with controlled access
  - Validated mutations to prevent state corruption
  - Bounded collections to prevent memory leaks (configurable limits)
  - Helper methods for common calculations
- **Shared Metrics Utilities** - `src/utils/metrics.ts`
  - `calculateSuccessRate()` - Calculate success rate from totals
  - `formatPercentage()` - Format decimals as percentages
  - `formatToolStats()` - Format tool effectiveness statistics

### Changed
- Main server uses `ServerStateManager` instead of plain `ServerState` interface
- Removed duplicate `analyzeEfficiency()` method - now uses state manager
- Removed unsafe type casts (`as unknown as`) in tool definitions
- Input validation added to `adapt-behavior.ts`

### Fixed
- **Type Safety** - Removed `as unknown as` casts, using proper `InputSchema` type
- **Input Validation** - Added validation for `adaptation` object in adapt-behavior handler
- **Code Duplication** - Extracted shared metrics calculations to utility module

### Architecture
New state management:
- `src/state/ServerStateManager.ts` - Full state manager class with methods
- `src/state/index.ts` - State module barrel export

### Tests
- All 91 tests passing with new state manager
- Backward compatible with existing tool factory pattern

---

## [1.2.0] - 2024-12-27

### Added
- **Full TypeScript Tool Handlers** - All 9 tool handlers converted to TypeScript
- Modular tool architecture in `src/tools/` directory
- Factory pattern for stateful handlers with dependency injection

### Changed
- Tool handlers extracted from monolithic `src/index.js` to individual files
- Stateful handlers use factory pattern for cleaner state management
- Main server (`src/index.ts`) now uses TypeScript tool handlers

### Types
New and improved TypeScript types:
- **ServerState** - Centralized state interface for all metrics and knowledge
- **Tool Handler Types** - Specific input types for each tool handler
- **MCP SDK Compatibility** - Added index signatures for SDK type compatibility
- **Discriminated Union** - `ValidationResult<T>` with `ValidationSuccess<T>` and `ValidationFailure`
- **Type Guards** - `isFactSource()`, `isCommunicationStyle()`, `isValidConfidence()`, `isGoalPriority()`

### Architecture
Tool handler organization:
- `src/tools/state.ts` - ServerState interface and initial state factory
- `src/tools/echo.ts` - Echo handler (stateless)
- `src/tools/system-info.ts` - System info handler (stateless)
- `src/tools/learn-from-interaction.ts` - Learning handler (stateful)
- `src/tools/get-learning-insights.ts` - Insights handler (stateful)
- `src/tools/adapt-behavior.ts` - Behavior adaptation handler (stateful)
- `src/tools/optimize-performance.ts` - Performance optimization (stateful)
- `src/tools/auto-optimize.ts` - Auto-optimization handler (stateful)
- `src/tools/track-productivity.ts` - Productivity tracking (stateful)
- `src/tools/enhance-tool-usage.ts` - Tool usage analysis (stateful)
- `src/tools/index.ts` - Barrel export for all handlers

### Tests
- All 91 tests passing with TypeScript handlers
- No changes required to existing test suite

---

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
