# TypeScript Migration Plan

This document outlines the phased approach for migrating the OK Computer MCP Server from JavaScript to TypeScript.

## Goals

1. **Type Safety**: Catch errors at compile time rather than runtime
2. **Better IDE Support**: Improved autocomplete, refactoring, and documentation
3. **API Stability**: Enforce contracts between tools and handlers
4. **Maintainability**: Clearer code structure and self-documenting types

## Current State

- **Language**: JavaScript (ES Modules)
- **Runtime**: Node.js 18+
- **Dependencies**: @modelcontextprotocol/sdk ^0.5.0
- **Test Coverage**: ~85% (91 tests)

## Migration Phases

### Phase 1: Setup and Infrastructure (v1.1.0)

**Timeline**: 1 session

1. Install TypeScript and dependencies
   ```bash
   npm install -D typescript @types/node ts-node
   ```

2. Create `tsconfig.json` with strict settings
3. Add build scripts to `package.json`
4. Create type definition files for core structures

**Deliverables**:
- `tsconfig.json` configured
- `src/types/` directory with core interfaces
- Build script producing `dist/` output

### Phase 2: Core Types (v1.1.0)

**Timeline**: 1 session

Define interfaces for:

```typescript
// Tool result types
interface TextContent {
  readonly type: 'text';
  readonly text: string;
}

interface ToolResult {
  readonly content: readonly TextContent[];
  readonly isError?: boolean;
}

// Metrics types
interface PerformanceMetrics {
  totalInteractions: number;
  successfulInteractions: number;
  averageResponseTime: number;
  toolUsageCount: Record<string, number>;
  productivityScore: number;
  errorCount: number;
  lastError: ErrorRecord | null;
}

interface ProductivityMetrics {
  tasksCompleted: number;
  efficiencyScore: number;
  toolEffectiveness: Record<string, ToolStats>;
  userGoals: ProductivityGoal[];
  completedGoals: ProductivityGoal[];
}

// Knowledge base types
interface Fact {
  readonly id: string;
  readonly content: string;
  readonly confidence: number;
  readonly source: FactSource;
  readonly timestamp: string;
}

interface Pattern {
  readonly pattern: string;
  readonly response_type: string;
  readonly effectiveness: number;
}

interface KnowledgeBase {
  facts: Fact[];
  patterns: Pattern[];
  preferences: Preferences;
}
```

**Deliverables**:
- `src/types/metrics.ts`
- `src/types/knowledge.ts`
- `src/types/tools.ts`

### Phase 3: Tool Handler Migration (v1.2.0)

**Timeline**: 2 sessions

Convert each tool handler to TypeScript:

| Priority | Tool | Complexity | Dependencies |
|----------|------|------------|--------------|
| 1 | `echo` | Low | None |
| 2 | `system_info` | Low | None |
| 3 | `learn_from_interaction` | Medium | Interaction types |
| 4 | `get_learning_insights` | Medium | Metrics types |
| 5 | `adapt_behavior` | Medium | Preferences types |
| 6 | `track_productivity` | High | All metrics types |
| 7 | `optimize_performance` | High | All metrics types |
| 8 | `auto_optimize` | High | All types |
| 9 | `enhance_tool_usage` | Medium | Tool stats types |

**Approach**:
1. Start with `echo` (simplest) to establish patterns
2. Create shared input validation utilities
3. Use branded types for bounded values (0-1 ranges)
4. Migrate one tool at a time, running tests after each

**Deliverables**:
- All tools converted to TypeScript
- Input validation using type guards
- Tests still passing

### Phase 4: Class Refactoring (v1.3.0)

**Timeline**: 1 session

Refactor stateful objects to classes with encapsulation:

```typescript
class PerformanceTracker {
  private metrics: PerformanceMetrics;

  constructor() {
    this.metrics = this.createInitialMetrics();
  }

  recordInteraction(success: boolean): void {
    this.metrics.totalInteractions++;
    if (success) this.metrics.successfulInteractions++;
  }

  getSuccessRate(): number {
    if (this.metrics.totalInteractions === 0) return 0;
    return this.metrics.successfulInteractions / this.metrics.totalInteractions;
  }
}
```

**Deliverables**:
- `PerformanceTracker` class
- `ProductivityTracker` class
- `KnowledgeManager` class
- Invariants enforced through methods

### Phase 5: Strict Mode and Cleanup (v1.4.0)

**Timeline**: 1 session

1. Enable all strict TypeScript options
2. Remove `any` types
3. Add JSDoc comments for public APIs
4. Generate type declarations for consumers

**tsconfig.json strict options**:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Deliverables**:
- Zero `any` types
- Full strict mode compliance
- Generated `.d.ts` files

## File Structure After Migration

```
ok-computer-mcp/
├── src/
│   ├── index.ts              # Main entry point
│   ├── server.ts             # UniversalMCPServer class
│   ├── types/
│   │   ├── index.ts          # Re-exports
│   │   ├── metrics.ts        # Metric interfaces
│   │   ├── knowledge.ts      # Knowledge base types
│   │   ├── tools.ts          # Tool input/output types
│   │   └── preferences.ts    # User preference types
│   ├── tools/
│   │   ├── echo.ts
│   │   ├── system-info.ts
│   │   ├── learn-from-interaction.ts
│   │   ├── get-learning-insights.ts
│   │   ├── adapt-behavior.ts
│   │   ├── track-productivity.ts
│   │   ├── optimize-performance.ts
│   │   ├── auto-optimize.ts
│   │   └── enhance-tool-usage.ts
│   ├── trackers/
│   │   ├── performance.ts
│   │   ├── productivity.ts
│   │   └── knowledge.ts
│   └── utils/
│       ├── sanitize.ts       # deepSanitize function
│       ├── validation.ts     # Input validators
│       └── result.ts         # Result factory functions
├── dist/                     # Compiled JavaScript
├── tests/
│   ├── lookup.test.ts
│   ├── security.test.ts
│   └── coverage.test.ts
├── tsconfig.json
├── package.json
└── MIGRATION.md
```

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking changes | Keep JavaScript entry point during transition |
| Test failures | Migrate tests to TypeScript alongside code |
| SDK type mismatches | Create type adapters if needed |
| Build complexity | Use simple tsc, avoid complex bundlers |

## Success Criteria

- [ ] All code compiles with strict TypeScript
- [ ] Zero `any` types in codebase
- [ ] All 91 tests pass after migration
- [ ] Type declarations generated for consumers
- [ ] IDE autocomplete works for all tool inputs

## Not In Scope

- Test framework migration (keep current Node.js test runner)
- Bundling or minification
- Source maps (not needed for server-side)
- Breaking API changes

## Version Roadmap

| Version | Milestone |
|---------|-----------|
| v1.1.0 | TypeScript setup + core types |
| v1.2.0 | All tools migrated |
| v1.3.0 | Class refactoring |
| v1.4.0 | Strict mode + cleanup |

## Getting Started

To begin migration after this plan is approved:

```bash
# Install TypeScript dependencies
npm install -D typescript @types/node

# Initialize TypeScript config
npx tsc --init

# Rename first file
mv src/index.js src/index.ts

# Start fixing type errors
npx tsc --noEmit
```
