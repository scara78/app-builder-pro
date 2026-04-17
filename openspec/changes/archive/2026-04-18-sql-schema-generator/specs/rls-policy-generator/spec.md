# Specification: rls-policy-generator

## Purpose

Generates Row-Level Security (RLS) policies for PostgreSQL tables to enforce authenticated access controls on Supabase.

## Requirements

### Core RLS Requirements

| ID | Requirement | Priority |
|-----|-------------|----------|
| RLS-001 | The generator MUST output `ALTER TABLE {table} ENABLE ROW LEVEL SECURITY` | MUST |
| RLS-002 | The generator MUST create a policy for SELECT operations | MUST |
| RLS-003 | The generator MUST create a policy for INSERT operations | MUST |
| RLS-004 | The generator MUST create a policy for UPDATE operations | MUST |
| RLS-005 | The generator MUST create a policy for DELETE operations | MUST |

### Owner Isolation

| ID | Requirement | Priority |
|-----|-------------|----------|
| RLS-006 | SELECT policies MUST restrict to `auth.uid() = owner_id` or `auth.uid() = user_id` | MUST |
| RLS-007 | The generator MUST use `auth.uid()` from Supabase auth extension | MUST |
| RLS-008 | The generator SHOULD detect owner field by naming convention (owner_id, user_id) | SHOULD |

### Policy Naming

| ID | Requirement | Priority |
|-----|-------------|----------|
| RLS-009 | Policies MUST follow naming pattern `{table}_{operation}_policy` | MUST |
| RLS-010 | Policy creation MUST use `CREATE POLICY IF NOT EXISTS` | MUST |

### Auth Context

| ID | Requirement | Priority |
|-----|-------------|----------|
| RLS-011 | The generator MUST assume `auth.users` table exists in Supabase | MUST |
| RLS-012 | The generator MUST use `auth.jwt()` for role-based policies | MAY |
| RLS-013 | The generator SHOULD support public read policies for specified tables | SHOULD |

### Output

| ID | Requirement | Priority |
|-----|-------------|----------|
| RLS-014 | The generator MUST return a string with all policy statements | MUST |
| RLS-015 | Statements MUST be separated by semicolons and newlines | MUST |
| RLS-016 | The generator MUST support batch policy generation for all tables | MUST |

## Scenarios

### Happy Path Scenarios

| ID | Scenario | Given | When | Then |
|-----|----------|-------|------|------|
| RLS-H001 | Basic RLS enable | A table named `users` with owner_id field | Generate RLS is called | Returns ALTER TABLE users ENABLE ROW LEVEL SECURITY |
| RLS-H002 | Full CRUD policies | A table with standard CRUD operations | Generate policies is called | Returns 4 policies (select, insert, update, delete) |
| RLS-H003 | Owner isolation in SELECT | Policy for SELECT on users table | Policy is created | Uses auth.uid() = owner_id in USING clause |
| RLS-H004 | Idempotent policy creation | Policy SQL executed twice | Second execution runs | No errors due to IF NOT EXISTS |

### Edge Case Scenarios

| ID | Scenario | Given | When | Then |
|-----|----------|-------|------|------|
| RLS-E001 | No owner field | Table with no owner_id or user_id field | Generate is called | Creates permissive policy or skips with warning |
| RLS-E002 | Different owner field name | Table has `created_by` field instead of `owner_id` | Generate is called | Detects created_by as owner field |
| RLS-E003 | Public table | Entity marked as public (no RLS needed) | Generate is called | Skips RLS for that table |

### Error State Scenarios

| ID | Scenario | Given | When | Then |
|-----|----------|-------|------|------|
| RLS-ERR001 | Reserved table name | Attempting to create policy on auth.users | Generate is called | Skips or outputs warning |
| RLS-ERR002 | Invalid table name | Table name with special characters | Generate is called | Escapes or rejects with error |

## Acceptance Criteria

- [ ] Table `users` → RLS enabled statement present
- [ ] Each table → 4 policies (SELECT, INSERT, UPDATE, DELETE)
- [ ] SELECT policy → Uses `auth.uid()` in USING clause
- [ ] Duplicate execution → No errors (idempotent)
- [ ] Unknown table → Gracefully skips with info log