# Design: SQL Schema Generator

## Technical Approach

Template-based string interpolation to convert `BackendRequirements` (CHANGE 2 output) into PostgreSQL DDL compatible with Supabase migrations. The generator produces idempotent SQL that `MCPClient.applyMigration()` (CHANGE 1) can execute directly.

The approach maps 1:1 to the proposal: 4 sub-generators (type-mapping, rls-policy-generator, storage-bucket-generator, core SQL generator) composed by a MigrationBuilder.

## Architecture Decisions

### Decision: File Location

**Choice**: `src/services/sql/` (new directory alongside `analyzer/` and `supabase/`)
**Alternatives considered**: Add to existing `analyzer/` service
**Rationale**: Separation of concerns—SQL generation is distinct from code analysis. Keeps services loosely coupled.

### Decision: Idempotency Strategy

**Choice**: Use `CREATE TABLE IF NOT EXISTS`, `CREATE EXTENSION IF NOT EXISTS`, `ON CONFLICT DO NOTHING`, `CREATE POLICY IF NOT EXISTS`
**Alternatives considered**: Separate migration version tracking, "CREATE OR REPLACE"
**Rationale**: Simpler for v1. Supabase migrations already handle idempotency at the migration runner level, but we add it per-spec for safety.

### Decision: Warning System

**Choice**: Collect warnings in `MigrationResult.warnings[]`, don't fail on unknown types
**Alternatives considered**: Throw on unknown type, use console.warn
**Rationale**: Spec requirement SG-012/SHOULD. Best UX—user can see what might need attention without blocking generation.

### Decision: Type Mapping Fallback

**Choice**: Unknown TypeScript types default to `TEXT` with warning
**Alternatives considered**: Throw error, use JSONB
**Rationale**: Matches spec TM-008/MUST. TEXT is safest default—most compatible across use cases.

## Data Flow

```
BackendRequirements (from analyzer)
         │
         ▼
   SQLGenerator.generate()
         │
    ┌────┴────┬──────────┬────────────┐
    ▼         ▼          ▼            ▼
TypeMapping RLSPolicy  StorageBucket  MigrationBuilder
            Generator Generator    (compose)
    └────┬────┴──────────┬────────────┘
         ▼                ▼
  sql: string    MigrationResult
         │
         ▼
  MCPClient.applyMigration(projectRef, sql, name)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/services/sql/types.ts` | Create | Shared types (MigrationResult, SQLGeneratorConfig) |
| `src/services/sql/TypeMapping.ts` | Create | Type map constants, getPostgresType() |
| `src/services/sql/RLSPolicyGenerator.ts` | Create | RLS policy templates per table |
| `src/services/sql/StorageBucketGenerator.ts` | Create | storage.buckets INSERT generation |
| `src/services/sql/MigrationBuilder.ts` | Create | Composes all SQL fragments |
| `src/services/sql/SQLGenerator.ts` | Create | Main entry point |
| `src/services/sql/index.ts` | Create | Public API exports |
| `src/services/sql/__tests__/SQLGenerator.test.ts` | Create | Unit tests |
| `src/services/sql/__tests__/TypeMapping.test.ts` | Create | Type mapping tests |
| `src/services/sql/__tests__/RLSPolicyGenerator.test.ts` | Create | RLS policy tests |
| `src/services/sql/__tests__/StorageBucketGenerator.test.ts` | Create | Storage tests |
| `src/services/sql/__tests__/integration.test.ts` | Create | End-to-end tests |

## Interfaces / Contracts

```typescript
// Input from CHANGE 2 (already defined in src/services/analyzer/types.ts)
import type { BackendRequirements, Entity, StorageRequirement } from '../analyzer/types';

// Output to CHANGE 1
interface MigrationResult {
  sql: string;
  tables: string[];
  warnings: string[];
}

// Main generator interface
interface SQLGenerator {
  generate(requirements: BackendRequirements): MigrationResult;
}

// Configuration
interface SQLGeneratorConfig {
  enableRLS?: boolean;        // Default: true
  defaultFileSizeMB?: number;  // Default: 50
  logger?: (warning: string) => void;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit - TypeMapping | getPostgresType() for all 5 types + unknown | Jest.mock console.warn, assert calls |
| Unit - RLSPolicy | Generated policy content per operation | Snapshot or string match |
| Unit - StorageBucket | Bucket INSERT with slug sanitization | Fixture → SQL string match |
| Unit - MigrationBuilder | SQL composition order | Snapshot |
| Integration | BackendRequirements → MigrationResult | Fixtures from analyzer tests |

## Migration / Rollback

No migration required—this generates new schema, not modifying existing data.

Rollback is manual per proposal:
- `DROP TABLE IF EXISTS {table} CASCADE`
- `DROP POLICY IF EXISTS {policy} ON {table}`
- `DELETE FROM storage.buckets WHERE name = {bucket}`

## Open Questions

- [ ] Should we support custom primary key names? (Spec says UUID `id`, but what if user wants `userId`?)
- [ ] How to handle entities with existing Supabase tables? (Skip or ALTER?)
- [ ] Do we need to handle enum types? (Not in spec, but common Supabase pattern)

## Next Step

Ready for **sdd-tasks** to break down implementation into actionable tasks.