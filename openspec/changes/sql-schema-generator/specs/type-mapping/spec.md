# Specification: type-mapping

## Purpose

Provides TypeScript to PostgreSQL type conversion constants with predictable fallbacks for the SQL schema generator.

## Requirements

### Core Type Mappings

| ID | Requirement | Priority |
|-----|-------------|----------|
| TM-001 | A type mapping object MUST define conversion from TypeScript types to PostgreSQL types | MUST |
| TM-002 | `string` type MUST map to PostgreSQL `TEXT` | MUST |
| TM-003 | `number` type MUST map to PostgreSQL `INTEGER` | MUST |
| TM-004 | `boolean` type MUST map to PostgreSQL `BOOLEAN` | MUST |
| TM-005 | `date` or `Date` types MUST map to PostgreSQL `TIMESTAMPTZ` | MUST |
| TM-006 | `json` type MUST map to PostgreSQL `JSONB` | MUST |
| TM-007 | Arrays of primitive types SHOULD map to PostgreSQL arrays (e.g., `string[]` → `TEXT[]`) | SHOULD |

### Fallback Behavior

| ID | Requirement | Priority |
|-----|-------------|----------|
| TM-008 | Unknown TypeScript types MUST default to `TEXT` | MUST |
| TM-009 | The mapper MUST emit a warning when defaulting to TEXT | MUST |
| TM-010 | The mapping function MUST accept an optional logger for warnings | MAY |

### Export Requirements

| ID | Requirement | Priority |
|-----|-------------|----------|
| TM-011 | The module MUST export a `typeMap` constant object | MUST |
| TM-012 | The module MUST export a `getPostgresType()` function | MUST |
| TM-013 | The module MUST export a `TS_TYPE` enum/constants | MUST |
| TM-014 | The module MUST export a `PG_TYPE` enum/constants | MUST |

### Null Handling

| ID | Requirement | Priority |
|-----|-------------|----------|
| TM-015 | The mapper MUST handle nullable fields (marked with `?` in TypeScript) | MUST |
| TM-016 | Nullable columns MUST allow NULL in PostgreSQL definition | MUST |

## Scenarios

### Happy Path Scenarios

| ID | Scenario | Given | When | Then |
|-----|----------|-------|------|------|
| TM-H001 | String type mapping | Input type is `string` | getPostgresType is called | Returns `TEXT` |
| TM-H002 | Number type mapping | Input type is `number` | getPostgresType is called | Returns `INTEGER` |
| TM-H003 | Boolean type mapping | Input type is `boolean` | getPostgresType is called | Returns `BOOLEAN` |
| TM-H004 | Date type mapping | Input type is `Date` | getPostgresType is called | Returns `TIMESTAMPTZ` |
| TM-H005 | JSON type mapping | Input type is `json` | getPostgresType is called | Returns `JSONB` |
| TM-H006 | Nullable field handling | Field definition includes `?` (optional) | Mapping is applied | Column allows NULL |

### Edge Case Scenarios

| ID | Scenario | Given | When | Then |
|-----|----------|-------|------|------|
| TM-E001 | Unknown type default | Input type is `CustomType` | getPostgresType is called | Returns `TEXT` and logs warning |
| TM-E002 | Array type mapping | Input type is `string[]` | getPostgresType is called | Returns `TEXT[]` |
| TM-E003 | Case insensitive input | Input type is `String` (capitalized) | getPostgresType is called | Returns `TEXT` |
| TM-E004 | Partial date types | Input type is `timestamp` | getPostgresType is called | Maps to TIMESTAMPTZ |

### Error State Scenarios

| ID | Scenario | Given | When | Then |
|-----|----------|-------|------|------|
| TM-ERR001 | Null input | getPostgresType receives null | Function is called | Throws TypeError |
| TM-ERR002 | Undefined input | getPostgresType receives undefined | Function is called | Throws TypeError |

## Acceptance Criteria

- [ ] `getPostgresType('string')` → `TEXT`
- [ ] `getPostgresType('number')` → `INTEGER`
- [ ] `getPostgresType('boolean')` → `BOOLEAN`
- [ ] `getPostgresType('date')` → `TIMESTAMPTZ`
- [ ] `getPostgresType('json')` → `JSONB`
- [ ] Unknown type → `TEXT` with warning
- [ ] Nullable fields → Column definition includes `NULL`