# Specification: sql-schema-generator

## Purpose

Generates valid PostgreSQL DDL (Data Definition Language) from `BackendRequirements` interface into idempotent migration scripts compatible with Supabase.

## Requirements

### Core Generation

| ID | Requirement | Priority |
|-----|-------------|----------|
| SG-001 | The generator MUST accept a valid `BackendRequirements` interface as input | MUST |
| SG-002 | The generator MUST output valid PostgreSQL DDL statements | MUST |
| SG-003 | The generator MUST generate one `CREATE TABLE` per entity in `entities` array | MUST |
| SG-004 | Each generated table MUST include a UUID primary key column named `id` | MUST |
| SG-005 | Each generated table MUST include `created_at` and `updated_at` columns | MUST |
| SG-006 | The generator MUST use `TIMESTAMPTZ` type for all timestamp columns | MUST |

### Type Mapping

| ID | Requirement | Priority |
|-----|-------------|----------|
| SG-007 | The generator MUST convert TypeScript `string` fields to PostgreSQL `TEXT` | MUST |
| SG-008 | The generator MUST convert TypeScript `number` fields to PostgreSQL `INTEGER` | MUST |
| SG-009 | The generator MUST convert TypeScript `boolean` fields to PostgreSQL `BOOLEAN` | MUST |
| SG-010 | The generator MUST convert TypeScript `Date` fields to PostgreSQL `TIMESTAMPTZ` | MUST |
| SG-011 | The generator MUST convert TypeScript `json` fields to PostgreSQL `JSONB` | MUST |
| SG-012 | The generator MUST default unknown field types to `TEXT` with a warning log | SHOULD |

### Idempotency

| ID | Requirement | Priority |
|-----|-------------|----------|
| SG-013 | Table creation MUST use `CREATE TABLE IF NOT EXISTS` pattern | MUST |
| SG-014 | The generator MUST include `ON CONFLICT DO NOTHING` for extension creation | MUST |
| SG-015 | The generator MUST support running multiple times without errors | MUST |

### Extensions and Setup

| ID | Requirement | Priority |
|-----|-------------|----------|
| SG-016 | The generator MUST include `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"` | MUST |
| SG-017 | The generator MUST output RLS enable statements for each table | MUST |

### Relationships

| ID | Requirement | Priority |
|-----|-------------|----------|
| SG-018 | The generator SHOULD detect foreign key relationships by field naming convention (e.g., `{entity}Id`) | SHOULD |
| SG-019 | The generator MUST generate `REFERENCES` clause for detected foreign keys | MUST |

### Output Format

| ID | Requirement | Priority |
|-----|-------------|----------|
| SG-020 | The generator MUST return a single string containing all DDL statements | MUST |
| SG-021 | The statements MUST be separated by semicolons and newlines | MUST |

## Scenarios

### Happy Path Scenarios

| ID | Scenario | Given | When | Then |
|-----|----------|-------|------|------|
| SG-H001 | Basic entity generation | BackendRequirements with one Entity containing string, number, boolean fields | Generate is called | Returns valid CREATE TABLE with 4+ columns and timestamps |
| SG-H002 | Multiple entities | BackendRequirements with 3 Entity objects | Generate is called | Returns 3 CREATE TABLE statements in sequence |
| SG-H003 | Idempotent execution | Generated SQL is executed twice on same database | Second execution runs | No errors occur (IF NOT EXISTS prevents duplication) |
| SG-H004 | Foreign key detection | Entity has field named `userId` referencing User entity | Generate is called | Includes FOREIGN KEY constraint in column definition |

### Edge Case Scenarios

| ID | Scenario | Given | When | Then |
|-----|----------|-------|------|------|
| SG-E001 | Unknown type handling | Entity field has unrecognized TypeScript type | Generate is called | Maps to TEXT and logs warning |
| SG-E002 | Empty entities array | BackendRequirements with empty entities array | Generate is called | Returns empty DDL string without error |
| SG-E003 | Entity with no fields | Entity with only id and timestamps (no custom fields) | Generate is called | Creates table with just id, created_at, updated_at |

### Error State Scenarios

| ID | Scenario | Given | When | Then |
|-----|----------|-------|------|------|
| SG-ERR001 | Null input | Generator receives null or undefined input | Generate is called | Throws TypeError with descriptive message |
| SG-ERR002 | Invalid entity name | Entity has name with special characters (e.g., `user-profile`) | Generate is called | Escapes or rejects with error message |

## Acceptance Criteria

- [ ] Input: `BackendRequirements` with 1 entity → Output: valid CREATE TABLE with 4 columns (id, created_at, updated_at, +field)
- [ ] Input: Multiple entities → Output: separate CREATE TABLE for each
- [ ] Output includes: CREATE EXTENSION statement
- [ ] Output includes: ALTER TABLE ENABLE ROW LEVEL SECURITY per table
- [ ] Second execution: No errors (idempotent)
- [ ] Unknown type: Gracefully maps to TEXT with warning