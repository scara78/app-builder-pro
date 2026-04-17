# Backend Requirements Analyzer

## Overview

The **Backend Requirements Analyzer** is a core component of App Builder Pro that automatically analyzes generated React code to detect backend requirements: database entities, authentication, file storage, and CRUD operations.

## Features

- **Pattern Detection**: Fast regex-based analysis for common patterns (<100ms)
- **AI Fallback**: Semantic analysis with Gemini API for ambiguous cases
- **Confidence Scoring**: 0-100 scoring with configurable thresholds
- **Smart Caching**: SHA256-based cache with 5-minute TTL
- **Hybrid Analysis**: Pattern-first, AI-assisted when needed

## Installation

```typescript
import { BackendRequirementsAnalyzer } from './services/analyzer';
```

## Quick Start

```typescript
import { BackendRequirementsAnalyzer } from './services/analyzer';

const analyzer = new BackendRequirementsAnalyzer({
  apiKey: process.env.GEMINI_API_KEY,
  aiThreshold: 80, // Trigger AI fallback below 80% confidence
  useCache: true
});

const code = `
interface User {
  id: string;
  email: string;
  name: string;
}

const LoginPage = () => {
  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input type="email" />
      <button>Login</button>
    </form>
  );
};
`;

const requirements = await analyzer.analyze(code);

console.log(requirements);
// {
//   entities: [{ name: 'User', fields: [...], confidence: 90 }],
//   hasAuth: true,
//   authRequirements: [{ type: 'login', confidence: 90 }],
//   hasStorage: false,
//   crudOperations: [{ entity: 'User', operation: 'create', confidence: 85 }],
//   overallConfidence: 88,
//   analysisMethod: 'pattern'
// }
```

## API Reference

### BackendRequirementsAnalyzer

Main orchestrator class that coordinates all detection phases.

```typescript
class BackendRequirementsAnalyzer {
  constructor(options?: AnalyzerOptions);
  analyze(code: string): Promise<BackendRequirements>;
}
```

#### AnalyzerOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | - | Gemini API key for AI fallback |
| `aiThreshold` | `number` | 80 | Confidence threshold to trigger AI analysis |
| `useCache` | `boolean` | true | Enable result caching |
| `cacheTTL` | `number` | 300000 | Cache TTL in milliseconds (5 min) |

### PatternMatcher

Detects backend patterns from code using regex.

```typescript
class PatternMatcher {
  detectEntities(code: string): Entity[];
  detectAuth(code: string): AuthRequirement[];
  detectStorage(code: string): StorageRequirement[];
  detectCRUD(code: string): CRUDSOperation[];
}
```

### ConfidenceCalculator

Calculates confidence scores for detections.

```typescript
class ConfidenceCalculator {
  calculateEntityConfidence(entity: Entity): number;
  calculateAggregate(requirements: BackendRequirements): number;
  shouldTriggerAIFallback(confidence: number): boolean;
}
```

### AnalysisCache

Caches analysis results for performance.

```typescript
class AnalysisCache {
  get(code: string): DetectionResult | null;
  set(code: string, result: DetectionResult): void;
  has(code: string): boolean;
  clear(): void;
}
```

## Detection Patterns

### Entities
Detects from:
- `interface User { ... }`
- `type Product = { ... }`
- `export interface Order { ... }`

### Authentication
Detects from:
- `<Login />`, `<Register />` components
- `useAuth()` hook
- `login()`, `register()` functions
- `AuthContext`, `AuthProvider`

### Storage
Detects from:
- `<input type="file" />`
- `onUpload`, `handleUpload` handlers
- `FileUpload` components
- `Dropzone` usage

### CRUD Operations
Detects from:
- `handleCreate`, `onCreate` (Create)
- `fetch()`, `loadData` (Read)
- `handleUpdate`, `onUpdate` (Update)
- `handleDelete`, `onDelete` (Delete)

## Confidence Scoring

### Base Confidence by Pattern

| Pattern Type | Base Confidence |
|--------------|----------------|
| Explicit interface | 90 |
| Type alias | 85 |
| useAuth hook | 95 |
| Login component | 90 |
| File input | 85 |
| Upload handler | 90 |
| Form submit | 80 |

### Modifiers

- Has JSDoc comment: +5
- Explicit types (not `any`): +5
- Multiple field detections: +5 per field

### Thresholds

- **High**: ≥ 80% (no AI fallback)
- **Medium**: 60-79% (optional AI fallback)
- **Low**: < 60% (automatic AI fallback)

## Hybrid Analysis Flow

```
1. Check cache → return if hit
2. Run PatternMatcher
3. Calculate confidence
4. If confidence < threshold → run AI fallback
5. Combine results
6. Cache and return
```

## Performance

- **Pattern matching**: < 100ms
- **With AI fallback**: < 2s
- **Cache hit**: < 10ms
- **Coverage target**: > 85%

## Error Handling

- **Invalid code**: Returns empty requirements with 0 confidence
- **AI timeout**: Falls back to pattern results
- **Malformed AI response**: Returns pattern results
- **API errors**: Logs error, returns fallback

## Testing

```bash
# Run all analyzer tests
npm test -- analyzer

# Run specific test file
npm test -- pattern-matcher
npm test -- confidence
npm test -- analyzer-integration
```

## Integration with App Builder Pro

The analyzer integrates with `AIOrchestrator` to automatically detect backend requirements after code generation:

```typescript
// In AIOrchestrator.ts
const analyzer = new BackendRequirementsAnalyzer({ apiKey });
const requirements = await analyzer.analyze(generatedCode);

// Pass to MCPClient for migration generation
const mcpClient = createMCPClient({ accessToken });
const project = await mcpClient.createProject(name, region);
await mcpClient.applyMigration(project.ref, sql, 'init');
```

## License

MIT
