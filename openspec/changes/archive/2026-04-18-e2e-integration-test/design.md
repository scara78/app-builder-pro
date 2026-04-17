# E2E Integration Test Design

## Architecture Overview

The E2E integration tests validate the complete pipeline from React code to SQL generation by connecting:

1. **PatternMatcher** (from CHANGE 2 - BackendRequirementsAnalyzer)
2. **SQLGenerator** (from CHANGE 3 - SQLSchemaGenerator)

The integration flow is:

```
React Code (string) 
    → PatternMatcher.analyze() → BackendRequirements
                                      ↓
                              SQLGenerator.generate()
                                      ↔
                              MigrationResult (SQL + tables)
                                      ↓
                              validateSQLSyntax(sql)
```

## Directory Structure

```
src/__tests__/e2e/
├── e2e-integration.test.ts    # Main test file with 5 scenarios
├── helpers/
│   └── sqlValidator.ts       # SQL syntax validation utility
└── fixtures/
    ├── simple-user.tsx       # Scenario 1: Simple User Entity
    ├── auth-posts.tsx        # Scenario 2: Auth + Posts (Relationships)
    ├── full-app.tsx          # Scenario 3: Storage + Auth + CRUD
    ├── minimal.tsx           # Scenario 4: Empty/Minimal Code
    └── complex-relations.tsx # Scenario 5: Many-to-Many Relations
```

## Integration Flow

### Step 1: React Code Input
Each fixture exports a string containing React/TypeScript code that represents a realistic component pattern.

### Step 2: Pattern Analysis
```typescript
import { PatternMatcher } from '../../services/analyzer/PatternMatcher';

const matcher = new PatternMatcher();
const analysis = matcher.analyze(code); // Returns PatternAnalysis
```

The PatternMatcher extracts:
- Entities (from interface/type declarations)
- Auth requirements (from Login/Register patterns)
- Storage requirements (from file upload patterns)
- CRUD operations (from form handlers)

### Step 3: Transform to BackendRequirements
The PatternAnalysis output must be transformed to the BackendRequirements interface expected by SQLGenerator:

```typescript
const requirements: BackendRequirements = {
  entities: analysis.entities,
  hasAuth: analysis.authRequirements.length > 0,
  authRequirements: analysis.authRequirements,
  hasStorage: analysis.storageRequirements.length > 0,
  storageRequirements: analysis.storageRequirements,
  crudOperations: analysis.crudOperations,
  overallConfidence: analysis.overallConfidence,
  analysisMethod: 'pattern',
  analyzedAt: new Date().toISOString()
};
```

### Step 4: SQL Generation
```typescript
import { SQLGenerator } from '../../services/sql/SQLGenerator';

const generator = new SQLGenerator();
const result = generator.generate(requirements);
```

Returns MigrationResult:
- `sql`: Complete DDL statements
- `tables`: Array of table names created
- `warnings`: Any warnings generated

### Step 5: SQL Validation
Validate that the generated SQL is syntactically valid PostgreSQL using regex-based validation.

## SQL Validation Approach

The SQL validator uses regex-based validation (sufficient for this scope):

```typescript
function validateSQLSyntax(sql: string): ValidationResult {
  // Check for balanced parentheses
  const openCount = (sql.match(/\(/g) || []).length;
  const closeCount = (sql.match(/\)/g) || []).length;
  if (openCount !== closeCount) {
    return { valid: false, errors: ['Unbalanced parentheses'] };
  }

  // Must contain CREATE TABLE
  if (!sql.includes('CREATE TABLE')) {
    return { valid: false, errors: ['Missing CREATE TABLE'] };
  }

  // Must contain valid PostgreSQL keywords
  const validKeywords = ['CREATE', 'TABLE', 'IF', 'NOT', 'EXISTS', 'UUID', 'TEXT', 'INTEGER', 'BOOLEAN', 'TIMESTAMPTZ'];
  const hasValidKeywords = validKeywords.some(k => sql.includes(k));
  
  return { valid: hasValidKeywords, errors: hasValidKeywords ? [] : ['No valid PostgreSQL keywords found'] };
}
```

## Files to Create

| File | Purpose | Responsibility |
|------|---------|-----------------|
| `e2e-integration.test.ts` | Main test file with 5 scenarios | Test each scenario end-to-end |
| `fixtures/simple-user.tsx` | Scenario 1: User with name, email | Export React code string |
| `fixtures/auth-posts.tsx` | Scenario 2: Auth + Posts with FK | Export React code string with relationships |
| `fixtures/full-app.tsx` | Scenario 3: Storage + Auth + CRUD | Export React code with full requirements |
| `fixtures/minimal.tsx` | Scenario 4: Empty component | Export minimal React code |
| `fixtures/complex-relations.tsx` | Scenario 5: M:N relationships | Export React code with junction table |
| `helpers/sqlValidator.ts` | SQL syntax validation | Validate PostgreSQL syntax |

## Test Scenarios Detail

### Scenario 1: Simple User Entity
- **Input**: React component with User interface (id, name, email)
- **Expected**: Single users table with UUID pk, timestamps, TEXT columns
- **Validation**: Check SQL contains CREATE TABLE users, has id, name, email columns

### Scenario 2: Auth + Posts
- **Input**: AuthProvider + PostList components with relationships
- **Expected**: users + posts tables, FK from posts.user_id to users.id, RLS policies
- **Validation**: Check SQL has both tables, FK constraint, ALTER TABLE ... ENABLE ROW LEVEL SECURITY

### Scenario 3: Full Requirements
- **Input**: Login/Register + Profile with file upload
- **Expected**: profiles table, avatars bucket, RLS on both
- **Validation**: Check storage.buckets INSERT, CREATE TABLE profiles, RLS on both

### Scenario 4: Edge Case - Empty
- **Input**: Empty/minimal React component
- **Expected**: Minimal SQL (just uuid-ossp extension), no tables
- **Validation**: SQL contains extension but no CREATE TABLE, no errors thrown

### Scenario 5: Complex Relations
- **Input**: User, Group, UserGroup (M:N via junction)
- **Expected**: users, groups, user_groups tables with proper FKs
- **Validation**: All 3 tables present, FK constraints valid

## Dependencies

- **PatternMatcher**: `src/services/analyzer/PatternMatcher.ts` (CHANGE 2)
- **SQLGenerator**: `src/services/sql/SQLGenerator.ts` (CHANGE 3)
- **BackendRequirements**: `src/services/analyzer/types.ts`
- **MigrationResult**: `src/services/sql/types.ts`

## Configuration

- Test framework: **vitest** (already in project)
- Test location: `src/__tests__/e2e/`
- Run command: `npm test src/__tests__/e2e/`
- Expected runtime: <5 seconds (no real API calls)

## Mock Strategy

- **Mock MCPClient**: Not needed since the test validates analyzer → generator, not MCPClient
- **Real PatternMatcher**: Yes - to detect integration issues
- **Real SQLGenerator**: Yes - to detect SQL generation issues

This design ensures we validate the real pipeline while keeping tests fast by avoiding actual Supabase API calls.