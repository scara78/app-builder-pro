# E2E Integration Test Specification

## Overview

This specification defines the end-to-end integration tests that validate the complete pipeline from React code analysis to SQL generation, ensuring that CHANGE 1 (MCPClient), CHANGE 2 (BackendRequirementsAnalyzer), and CHANGE 3 (SQLGenerator) work together correctly.

## Requirements (RFC 2119)

### E2E-001 (MUST)

System SHALL validate complete flow from React code to SQL generation.

**Rationale**: Integration bugs between components are undetected until a real E2E flow runs. Each change is tested in isolation with mocks, so the full pipeline must be validated.

### E2E-002 (MUST)

System SHALL use real Analyzer and SQLGenerator (no mocks for these components).

**Rationale**: The goal is to detect integration issues between the actual components, not to test them in isolation. MCPClient may be mocked since it was already tested in CHANGE 1.

### E2E-003 (MUST)

System SHALL validate SQL syntax is valid PostgreSQL.

**Rationale**: Generated SQL must be syntactically correct PostgreSQL. While we won't execute against a real database, we must validate the syntax.

### E2E-004 (MUST)

System SHALL test minimum 3 realistic scenarios (simple entity, auth + entity, full requirements).

**Rationale**: The proposal specifies 3-5 scenarios. We will test 5 to cover edge cases as well.

### E2E-005 (SHOULD)

System SHOULD validate naming conventions match between Analyzer output and SQLGenerator input.

**Rationale**: The Analyzer produces entity names and field names that must be correctly consumed by the SQLGenerator. Mismatches would cause runtime errors.

## Scenarios

### Scenario 1: Simple User Entity

**GIVEN** React code with useState for user data

**WHEN** analyzed and SQL generated

**THEN** SQL creates users table with id, name, email

**AND** SQL is valid PostgreSQL syntax

**Test Data**:
```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

const UserProfile = () => {
  const [user, setUser] = useState<User | null>(null);
  // ...
};
```

**Expected Output**: Valid PostgreSQL CREATE TABLE statement with UUID primary key, timestamps, and TEXT columns.

---

### Scenario 2: Auth + Posts (Relationships)

**GIVEN** React code with auth detection and posts CRUD

**WHEN** analyzed and SQL generated

**THEN** SQL creates auth.users integration

**AND** SQL creates posts table with user_id FK

**AND** RLS policies exist for owner isolation

**Test Data**:
```typescript
interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
}

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  // auth detection
};

const PostList = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const handleCreate = (post: Post) => { /* create */ };
  // CRUD operations
};
```

**Expected Output**: Two tables (users and posts) with foreign key relationship, RLS policies for user-owned posts.

---

### Scenario 3: Full Requirements (Storage + Auth + CRUD)

**GIVEN** React code with image uploads and user profiles

**WHEN** analyzed and SQL generated

**THEN** SQL includes storage buckets

**AND** SQL includes user profiles table

**AND** RLS policies cover both tables

**Test Data**:
```typescript
interface Profile {
  id: string;
  username: string;
  bio: string;
  avatarUrl: string;
}

const ProfilePage = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const handleUpload = (file: File) => { /* upload to storage */ };
  // storage detection
};

<Login />
<Register />
```

**Expected Output**: Profile table with RLS, storage bucket INSERTs for avatars, auth integration.

---

### Scenario 4: Edge Case - Empty Code

**GIVEN** empty or minimal React code

**WHEN** analyzed and SQL generated

**THEN** migration is minimal or empty

**AND** no errors thrown

**Test Data**:
```typescript
const EmptyComponent = () => {
  return <div>Hello</div>;
};
```

**Expected Output**: Minimal SQL (just uuid-ossp extension), no tables, no errors.

---

### Scenario 5: Edge Case - Complex Relations

**GIVEN** React code with many-to-many relationships

**WHEN** analyzed and SQL generated

**THEN** junction tables are created

**AND** FK constraints are valid

**Test Data**:
```typescript
interface User {
  id: string;
  name: string;
}

interface Group {
  id: string;
  name: string;
}

interface UserGroup {
  userId: string;
  groupId: string;
  role: string;
}

const GroupManagement = () => {
  // M:N relationship via UserGroup
};
```

**Expected Output**: Three tables (users, groups, user_groups) with proper FK relationships.

---

## Acceptance Criteria

| ID | Criteria | Validation Method |
|----|----------|-------------------|
| AC-1 | All 5 scenarios pass | Run `npm test src/__tests__/e2e/` |
| AC-2 | SQL syntax validation passes | Use regex-based validator |
| AC-3 | Integration points validated | Verify output from each component feeds into next |
| AC-4 | Test suite runs in <5 seconds | Measure execution time |
| AC-5 | No errors thrown on edge cases | Assertion on error count = 0 |

## Implementation Notes

- Use real PatternMatcher and SQLGenerator (no mocks)
- Mock MCPClient for speed (already tested in CHANGE 1)
- Use regex-based SQL validation (sufficient for scope)
- Use vitest as the test framework (existing in project)
- Test fixtures should be valid React/TypeScript code