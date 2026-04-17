# Exploration: sql-schema-generator

### Current State

The pipeline has two completed changes:
- **CHANGE 1** (supabase-mcp-integration): `SupabaseMCPClient.applyMigration(projectRef, sql, name)` - applies raw SQL to Supabase
- **CHANGE 2** (backend-requirements-analyzer): Outputs `BackendRequirements` with entities, authRequirements, storageRequirements, crudOperations

**Gap**: No component converts `BackendRequirements` → SQL DDL for migration.

### Affected Areas

- `src/services/analyzer/types.ts` — Provides `Entity`, `EntityField`, `AuthRequirement`, `StorageRequirement`, `CRUDSOperation`
- `src/services/supabase/MCPClient.ts` — `applyMigration(sql: string)` expects raw SQL
- New component needed: Accepts BackendRequirements → outputs SQL string

### Approaches

| Approach | Pros | Cons | Effort |
|----------|------|------|--------|
| **1. Template-based** | Simple, fast, no dependencies, easy to debug | Manual mapping for complex types | Low |
| **2. AST-based SQL builder** | Type-safe, handles edge cases | Extra dependency, abstraction overhead | Medium |
| **3. AI-assisted generation** | Handles complex relationships | Non-deterministic, requires LLM calls | High |
| **4. Hybrid (templates + AI)** | Best of both worlds | Complex, multiple code paths | High |

### Recommendation

**Template-based approach** is recommended for this change.

**Rationale**:
1. Mapping TypeScript types (`string`, `number`, `boolean`) to PostgreSQL types (`TEXT`, `INTEGER`, `BOOLEAN`) follows predictable patterns
2. No complex AST manipulation needed — we need string interpolation, not AST building
3. Easier to test, debug, and maintain
4. MCPClient expects plain SQL string — no structured format needed

### Type Mapping Strategy

```typescript
const TYPE_MAPPING: Record<string, string> = {
  'string': 'TEXT',
  'number': 'INTEGER',
  'boolean': 'BOOLEAN',
  'Date': 'TIMESTAMPTZ',
  'DateTime': 'TIMESTAMPTZ',
  'UUID': 'UUID',
  // fallback: use TEXT
};
```

### Supabase-Specific Patterns Identified

1. **UUID primary keys**: `id UUID DEFAULT uuid_generate_v4() PRIMARY KEY`
2. **Extensions**: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
3. **RLS policies**: 
   - Per-table enable: `ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;`
   - User isolation: `CREATE POLICY "..." ON {table} FOR SELECT USING (auth.uid() = user_id);`
4. **Timestamps**: `created_at TIMESTAMPTZ DEFAULT NOW()`
5. **Storage buckets**: `INSERT INTO storage.buckets (id, name) VALUES (...)`

### Migration File Structure

Single migration file per analysis run:

```sql
-- migration: auto_generated_{timestamp}
-- purpose: Generate schema from detected requirements

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Entity: User
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);

-- Entity: Product (example)
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Storage buckets (if detected)
INSERT INTO storage.buckets (id, name) VALUES ('avatars', 'avatars') ON CONFLICT (id) DO NOTHING;
```

### Risks and Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Type mapping edge cases | Medium | Default to TEXT with warning |
| Composite keys not detected | Low | Support in v2, document limitation |
| Relations between entities not inferred | Medium | Use naming conventions (userId → foreign key) |
| RLS policy conflicts | Medium | Default to authenticated-only, allow override |
| Migration idempotency | Low | Use `IF NOT EXISTS`, `ON CONFLICT` clauses |

### Ready for Proposal

**Yes**. The exploration identifies:
- Template-based SQL generation as the recommended approach
- Type mapping strategy from TypeScript to PostgreSQL
- Supabase-specific patterns (RLS, UUID, timestamps, storage)
- Migration structure with idempotency
- Clear risks and mitigations

**Next step**: Orchestrator should launch sdd-propose to create the change proposal with scope and approach.