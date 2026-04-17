# Exploration: backend-requirements-analyzer

## Current State
- CHANGE 1 (supabase-mcp-integration) COMPLETE: SupabaseMCPClient ready
  - Can create projects, get URLs, apply migrations
  - Located at: `src/services/supabase/MCPClient.ts`
- AIOrchestrator generates React/Vite apps via Gemini API
- CodeParser transforms AI responses into `ProjectFile[]` structures

## Affected Areas
- `src/services/ai/AIOrchestrator.ts` — Entry point for code generation
- `src/services/ai/codeParser.ts` — Parses AI output, could be extended
- `src/services/supabase/MCPClient.ts` — Applies detected migrations

## Approaches

### 1. Regex/Pattern-based Detection
Simple pattern matching for common code structures.
- Pros: Fast, no dependencies, predictable
- Cons: False positives, misses context, fragile
- Effort: Low

**Patterns to detect:**
```typescript
// Forms → Likely database entity
const.*Form|onSubmit.*=|handleSubmit

// User references → Auth needed
user\.|currentUser|login|register|auth

// File uploads → Storage needed
File|Blob|upload|multipart

// API calls → External services
fetch\(|axios\.|API\.|\.get\(|\.post\(
```

### 2. AST-based with TypeScript Compiler API
Deep code analysis using @typescript/compiler
- Pros: Accurate, understands code structure, type-aware
- Cons: Complex setup, performance overhead, heavy dependency
- Effort: High

**Detection targets:**
- Interface/Type definitions → Database entities
- useState/useEffect patterns → State management needs
- Context providers → Global state/auth
- onSubmit handlers → CRUD operations

### 3. AI-based Analysis (Gemini)
Use existing Gemini API to analyze generated code
- Pros: Understands context, semantic awareness, handles edge cases
- Cons: API costs, latency, non-deterministic
- Effort: Low

**Prompt structure:**
```
Analyze this React codebase and identify:
1. Data entities (types/interfaces)
2. Authentication needs
3. CRUD operations
4. Storage requirements
5. Real-time features
```

### 4. Hybrid Approach (Recommended)
Combine pattern matching for obvious cases + AI for ambiguous ones
- Pros: Fast for common patterns, flexible for edge cases
- Cons: More complex implementation
- Effort: Medium

**Strategy:**
1. Quick scan: Regex patterns for obvious needs (forms, uploads)
2. Deep scan: AI for semantic analysis when needed
3. Output: Structured requirements + SQL migration ready

## Common Backend Patterns in Generated Apps

| Pattern | Flag | Backend Need |
|---------|------|--------------|
| `interface User` | entity detected | auth.users table |
| `<form onSubmit=` | data entry | CRUD endpoint |
| `useState<User[]>` | list display | read endpoint |
| `login\|register` | auth form | auth tables |
| `handleFileUpload` | file handling | storage bucket |
| `[].map(item =>` | list rendering | read endpoint |
| `onClick={delete` | delete operation | delete endpoint |

## Recommendation

**Use Hybrid Approach:** Pattern matching + AI fallback

### Rationale:
1. Most generated apps follow predictable patterns (forms, lists, auth)
2. Pattern matching handles 80% of cases fast
3. AI handles edge cases without over-engineering
4. Reuses existing Gemini API infrastructure

### Implementation Path:
1. Create `src/services/ai/requirementsDetector.ts`
2. Export `detectRequirements(files: ProjectFile[]): Requirement[]`
3. Return structured output:
```typescript
interface BackendRequirement {
  type: 'entity' | 'auth' | 'storage' | 'realtime';
  name: string;
  fields?: Field[];
  sql?: string;
}
```

### Output Format:
```json
{
  "requirements": [
    { "type": "entity", "name": "User", "fields": [...] },
    { "type": "auth", "name": "auth" },
    { "type": "storage", "name": "avatars" }
  ],
  "migrations": [
    "CREATE TABLE auth.users (...)",
    "CREATE TABLE public.user_profiles (...)"
  ]
}
```

## Risks
- **False positives:** User mentions in comments trigger auth requirement
- **Over-generation:** Creating tables for every interface
- **API costs:** AI fallback increases Gemini usage

### Mitigations:
- Whitelist patterns (only detect specific code patterns, not comments)
- Confidence threshold (require 2+ patterns before declaring entity)
- Cache results (don't re-analyze same project)
- Budget limit (max AI calls per generation)

## Ready for Proposal

**Yes** — Proceed to propose phase with:
- Hybrid approach (pattern matching + AI)
- Output: structured backend requirements
- Integration: Auto-apply migrations via MCPClient

**Next Steps:**
1. Define Requirement interface
2. Create pattern rules engine
3. Implement AI fallback handler
4. Integrate with MCPClient.applyMigration()