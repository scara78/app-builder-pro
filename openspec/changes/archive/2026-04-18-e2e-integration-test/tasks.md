# E2E Integration Test Tasks

## Overview

This document outlines the implementation tasks for the E2E integration tests that validate the complete pipeline from React code to SQL generation.

## Task Summary

| Phase | Tasks | Status |
|-------|-------|--------|
| Phase 1: Setup | 1 task | ✅ COMPLETE |
| Phase 2: Fixtures | 4 tasks | ✅ COMPLETE |
| Phase 3: Helpers | 1 task | ✅ COMPLETE |
| Phase 4: Tests | 1 task | ✅ COMPLETE |
| Phase 5: Verification | 1 task | ✅ COMPLETE |
| **Total** | **8 tasks** | ✅ COMPLETE |

---

## Phase 1: Setup

### Task 1.1: Create Directory Structure

**Description**: Create the directory structure for E2E tests.

**Location**: `src/__tests__/e2e/`

**Steps**:
1. Create `src/__tests__/` directory if not exists
2. Create `src/__tests__/e2e/` directory
3. Create `src/__tests__/e2e/helpers/` directory
4. Create `src/__tests__/e2e/fixtures/` directory

**Dependencies**: None

**Verification**: Directory structure exists with all subdirectories

**Status**: ✅ COMPLETE

---

## Phase 2: Fixtures

### Task 2.1: Create simple-user.tsx Fixture

**Description**: Create test fixture for Scenario 1 - Simple User Entity.

**Location**: `src/__tests__/e2e/fixtures/simple-user.tsx`

**Content**: React component with User interface containing id, name, email fields.

**Export**: String constant containing the React/TypeScript code.

**Expected Output**:
- Interface: `User { id: string; name: string; email: string; }`
- Component using useState with User type

**Dependencies**: Task 1.1

**Status**: ✅ COMPLETE

---

### Task 2.2: Create auth-posts.tsx Fixture

**Description**: Create test fixture for Scenario 2 - Auth + Posts with relationships.

**Location**: `src/__tests__/e2e/fixtures/auth-posts.tsx`

**Content**: React components with auth detection (Login/Register), Post interface with authorId, and CRUD operations.

**Export**: String constant containing the React/TypeScript code.

**Expected Output**:
- Interface: `Post { id: string; title: string; content: string; authorId: string; }`
- AuthProvider component with auth patterns
- PostList component with create/read operations

**Dependencies**: Task 1.1

**Status**: ✅ COMPLETE

---

### Task 2.3: Create full-app.tsx Fixture

**Description**: Create test fixture for Scenario 3 - Full Requirements (Storage + Auth + CRUD).

**Location**: `src/__tests__/e2e/fixtures/full-app.tsx`

**Content**: React components with Login, Register, Profile with avatar upload.

**Export**: String constant containing the React/TypeScript code.

**Expected Output**:
- Interface: `Profile { id: string; username: string; bio: string; avatarUrl: string; }`
- Login and Register components
- ProfilePage with file upload handler

**Dependencies**: Task 1.1

**Status**: ✅ COMPLETE

---

### Task 2.4: Create minimal.tsx Fixture

**Description**: Create test fixture for Scenario 4 - Edge Case (Empty/Minimal Code).

**Location**: `src/__tests__/e2e/fixtures/minimal.tsx`

**Content**: Minimal React component with no entities, no auth, no storage.

**Export**: String constant containing minimal React code.

**Expected Output**:
- Simple component returning a div
- No interface declarations

**Dependencies**: Task 1.1

**Status**: ✅ COMPLETE

---

## Phase 3: Helpers

### Task 3.1: Create SQL Validation Helper

**Description**: Create utility for validating PostgreSQL syntax.

**Location**: `src/__tests__/e2e/helpers/sqlValidator.ts`

**Functionality**:
- Validate balanced parentheses
- Check for CREATE TABLE keyword
- Verify valid PostgreSQL keywords present
- Return validation result with errors

**API**:
```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validateSQLSyntax(sql: string): ValidationResult
```

**Dependencies**: Task 1.1

**Status**: ✅ COMPLETE

---

## Phase 4: Tests

### Task 4.1: Create e2e-integration.test.ts

**Description**: Create the main E2E integration test file with all 5 scenarios.

**Location**: `src/__tests__/e2e/e2e-integration.test.ts`

**Test Cases**:
1. **Simple User Entity**: Validate users table with id, name, email
2. **Auth + Posts**: Validate users + posts tables with FK and RLS
3. **Full Requirements**: Validate profiles table + storage buckets + RLS
4. **Empty Code**: Validate minimal SQL with no errors
5. **Complex Relations**: Validate 3 tables with M:N relationship

**Implementation**:
- Import real PatternMatcher and SQLGenerator
- Import fixtures
- Import sqlValidator
- Run each scenario end-to-end
- Assert SQL syntax validity
- Assert table creation
- Assert RLS policies (where applicable)

**Dependencies**: Tasks 2.1, 2.2, 2.3, 2.4, 3.1

**Status**: ✅ COMPLETE

---

## Phase 5: Verification

### Task 5.1: Run Tests and Verify Coverage

**Description**: Execute the test suite and verify all scenarios pass.

**Command**: `npm test src/__tests__/e2e/`

**Verification Criteria**:
- All 5 scenarios pass
- SQL syntax validation passes for all outputs
- No errors thrown on edge cases
- Test suite runs in <5 seconds

**Success Indicators**:
```
 PASS  src/__tests__/e2e/e2e-integration.test.ts
   ✓ Scenario 1: Simple User Entity
   ✓ Scenario 2: Auth + Posts
   ✓ Scenario 3: Full Requirements
   ✓ Scenario 4: Empty Code
   ✓ Scenario 5: Complex Relations

 Test Suites: 1 passed, 5 tests passed
```

**Dependencies**: Task 4.1

**Status**: ✅ COMPLETE

---

## Implementation Order

Recommended implementation order:

1. **Task 1.1** - Setup directory structure
2. **Task 2.1** - Simple user fixture
3. **Task 2.2** - Auth-posts fixture
4. **Task 2.3** - Full-app fixture
5. **Task 2.4** - Minimal fixture
6. **Task 3.1** - SQL validator helper
7. **Task 4.1** - Main test file
8. **Task 5.1** - Run and verify

## Notes

- All fixtures should export string constants (not React components)
- Tests use real PatternMatcher and SQLGenerator (no mocks)
- MCPClient is not needed for these tests since we validate analyzer → generator flow
- SQL validation uses regex-based approach (sufficient for scope)