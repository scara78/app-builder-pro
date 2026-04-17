# Proposal: SQL Schema Generator

## Intent

Convert `BackendRequirements` (detected by CHANGE 2) into valid PostgreSQL DDL for Supabase migrations. This fills the gap between requirement detection and migration execution—CHANGE 1 provides `MCPClient.applyMigration(sql)`, CHANGE 2 detects requirements, and this change generates the SQL that CHANGE 1 executes.

## Scope

### In Scope
- Convert Entity[] to CREATE TABLE statements with UUID primary keys
- Convert EntityField[] to column definitions with TypeScript→PostgreSQL type mapping
- Generate RLS policies for authenticated access
- Generate storage bucket inserts for StorageRequirement[]
- Generate auth extension setup (uuid-ossp)
- Idempotent migration output (IF NOT EXISTS, ON CONFLICT)

### Out of Scope
- AI-assisted SQL generation (defer to v2)
- Complex relationship inference (many-to-many, join tables)
- Composite key support
- Migration file versioning/rollback logic

## Capabilities

### New Capabilities
- `sql-schema-generator`: Generate PostgreSQL DDL from BackendRequirements interface
- `type-mapping`: TypeScript to PostgreSQL type conversion with fallback
- `rls-policy-generator`: Row-level security policy generation
- `storage-bucket-generator`: Storage bucket SQL generation

### Modified Capabilities
- None (this is a new capability, not modification)

## Approach

**Template-based string interpolation** per exploration recommendation.

1. **Type Mapping**: `string`→`TEXT`, `number`→`INTEGER`, `boolean`→`BOOLEAN`, `Date`→`TIMESTAMPTZ`, unknown→`TEXT`
2. **Entity Generation**: For each Entity, generate CREATE TABLE with UUID id, fields, timestamps
3. **RLS**: Enable RLS per table, generate USING policy for owner isolation
4. **Storage**: Generate INSERT INTO storage.buckets with ON CONFLICT DO NOTHING
5. **Extensions**: Include CREATE EXTENSION IF NOT EXISTS "uuid-ossp"

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/services/analyzer/SQLSchemaGenerator.ts` | New | Core generator class |
| `src/services/analyzer/typeMapping.ts` | New | Type mapping constants |
| `src/services/analyzer/rlsPolicies.ts` | New | RLS policy templates |
| `src/services/analyzer/storageBuckets.ts` | New | Storage bucket SQL |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Unknown TypeScript types | Medium | Default to TEXT with console warning |
| Relationship inference | Medium | Use naming convention (userId→FK), document limitation |
| RLS policy conflicts | Low | Default to auth.uid() = owner_id |
| Migration not idempotent | Low | Use IF NOT EXISTS, ON CONFLICT clauses |

## Rollback Plan

- Run `DROP TABLE IF EXISTS {table} CASCADE` for each created table
- Run `DROP POLICY IF EXISTS {policy} ON {table}` for each policy
- Storage: `DELETE FROM storage.buckets WHERE name = {bucket}`

## Dependencies

- CHANGE 1 (supabase-mcp-integration): MCPClient.applyMigration()
- CHANGE 2 (backend-requirements-analyzer): BackendRequirements interface

## Success Criteria

- [ ] BackendRequirements with 1 entity → valid CREATE TABLE with 4+ columns
- [ ] Output includes UUID extension and RLS enable statements
- [ ] StorageRequirement[] → storage.buckets INSERT statements
- [ ] Migration runs without error on fresh Supabase project
- [ ] Second run is idempotent (no errors on duplicate execution)
- [ ] Unit test coverage > 80%