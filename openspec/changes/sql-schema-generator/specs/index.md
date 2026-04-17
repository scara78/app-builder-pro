# SQL Schema Generator - Specification Index

## Overview

Delta specifications for the SQL Schema Generator change (CHANGE 3). These specs define how to convert `BackendRequirements` into PostgreSQL migration scripts compatible with Supabase.

## Specs Created

| Capability | Spec File | Status |
|------------|-----------|--------|
| sql-schema-generator | `sql-schema-generator/spec.md` | ✅ Complete |
| type-mapping | `type-mapping/spec.md` | ✅ Complete |
| rls-policy-generator | `rls-policy-generator/spec.md` | ✅ Complete |
| storage-bucket-generator | `storage-bucket-generator/spec.md` | ✅ Complete |

## Summary Statistics

### Requirements Count

| Spec | MUST | SHOULD | MAY | Total |
|------|------|--------|-----|-------|
| sql-schema-generator | 16 | 2 | 0 | 18 |
| type-mapping | 11 | 2 | 1 | 14 |
| rls-policy-generator | 11 | 2 | 1 | 14 |
| storage-bucket-generator | 11 | 3 | 1 | 15 |
| **Total** | **49** | **9** | **3** | **61** |

### Scenarios Count

| Spec | Happy Path | Edge Cases | Error States | Total |
|------|-----------|------------|--------------|-------|
| sql-schema-generator | 4 | 3 | 2 | 9 |
| type-mapping | 6 | 4 | 2 | 12 |
| rls-policy-generator | 4 | 3 | 2 | 9 |
| storage-bucket-generator | 5 | 4 | 2 | 11 |
| **Total** | **19** | **14** | **8** | **41** |

## Coverage Summary

### Happy Paths (19 total - 46%)
- ✅ Basic entity generation → CREATE TABLE
- ✅ Type mapping for all 5 TypeScript types
- ✅ RLS enable and CRUD policies
- ✅ Storage bucket creation
- ✅ Idempotent execution for all components
- ✅ Foreign key detection

### Edge Cases (14 total - 34%)
- ✅ Unknown types → default to TEXT with warning
- ✅ Empty entities array handling
- ✅ No owner field in RLS
- ✅ Bucket name sanitization (spaces, uppercase)
- ✅ Custom file sizes
- ✅ Different owner field naming conventions

### Error States (8 total - 20%)
- ✅ Null/undefined input handling
- ✅ Invalid entity names
- ✅ Reserved table names
- ✅ Duplicate bucket names
- ✅ Invalid bucket names

## Input Types (from BackendRequirements)

### Entity Field Types Supported
- `string` → `TEXT`
- `number` → `INTEGER`
- `boolean` → `BOOLEAN`
- `date` → `TIMESTAMPTZ`
- `json` → `JSONB`
- Unknown → `TEXT` (with warning)

### Relationship Types
- `oneToMany` → inferred FK
- `manyToOne` → explicit FK
- `manyToMany` → join table (OUT OF SCOPE for v1)

## Output Structure

```
Generated SQL Migration:
├── CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
├── CREATE TABLE IF NOT EXISTS entities
│   ├── id UUID PRIMARY KEY DEFAULT gen_random_uuid()
│   ├── created_at TIMESTAMPTZ DEFAULT now()
│   ├── updated_at TIMESTAMPTZ DEFAULT now()
│   └── ...field columns
├── ALTER TABLE ENABLE ROW LEVEL SECURITY
├── CREATE POLICY {table}_{operation}_policy ...
├── INSERT INTO storage.buckets ...
└── Storage policies ...
```

## Next Step

Proceed to **SDD-TASKS** phase to break down implementation tasks from these specs.

## Files

- `proposal.md` - Original proposal
- `exploration.md` - Exploration findings
- `specs/sql-schema-generator/spec.md` - Core DDL generator
- `specs/type-mapping/spec.md` - Type constants
- `specs/rls-policy-generator/spec.md` - RLS policies
- `specs/storage-bucket-generator/spec.md` - Storage buckets