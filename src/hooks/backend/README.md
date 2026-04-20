# Backend Creation Pipeline

## Overview

The Backend Creation Pipeline automatically creates a Supabase backend from generated React code. It analyzes the code to detect backend requirements, generates SQL migrations, creates a Supabase project, and applies the migrations.

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BACKEND CREATION PIPELINE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐    ┌──────────────┐    ┌─────────────────┐    ┌────────────┐ │
│  │  CODE    │───▶│   ANALYZER   │───▶│  SQL GENERATOR  │───▶│ MCP CLIENT │ │
│  │  INPUT   │    │   (25%)      │    │     (50%)       │    │   (75%)    │ │
│  └──────────┘    └──────────────┘    └─────────────────┘    └────────────┘ │
│                                                                 │            │
│                                                                 ▼            │
│                                                         ┌──────────────┐    │
│                                                         │  MIGRATION   │    │
│                                                         │   (100%)     │    │
│                                                         └──────────────┘    │
│                                                                 │            │
│                                                                 ▼            │
│                                                         ┌──────────────┐    │
│                                                         │   RESULT     │    │
│                                                         │ - projectUrl │    │
│                                                         │ - anonKey    │    │
│                                                         └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Pipeline Stages

### Stage 1: ANALYZING (25%)

The analyzer detects backend requirements from the generated code:

- **Entities**: Interfaces, types that represent data models
- **Authentication**: Login/Register components, useAuth hooks
- **Storage**: File upload components, handlers
- **CRUD Operations**: Create, Read, Update, Delete patterns

```typescript
// Detection patterns:
interface User { ... }      // Entity detection
<Login />                   // Auth detection
<input type="file" />       // Storage detection
handleCreate, fetch()       // CRUD detection
```

### Stage 2: GENERATING (50%)

The SQL generator creates migrations from detected requirements:

- **Tables**: Creates tables for each detected entity
- **RLS Policies**: Generates Row Level Security policies (optional)
- **Indexes**: Creates indexes for foreign keys
- **Triggers**: Sets up auto-updating timestamps

### Stage 3: CREATING_PROJECT (75%)

Creates a new Supabase project via the MCP client:

- Project name (auto-generated or user-specified)
- Region selection (default: us-east-1)
- Access token authentication

### Stage 4: APPLYING_MIGRATION (100%)

Applies the generated SQL migration to the project:

- Creates tables and relationships
- Sets up RLS policies if enabled
- Returns project URL and anon key

## Usage

### Basic Usage

```tsx
import { useBackendCreation, PipelineStage } from '@/hooks/backend/pipeline';
import { BackendCreationModal } from '@/components/backend/BackendCreationModal';
import { CredentialsModal } from '@/components/backend/CredentialsModal';

function MyComponent() {
  const {
    stage,
    progress,
    isCreating,
    error,
    result,
    createBackend,
    retry,
    reset,
    abort,
  } = useBackendCreation();

  const handleCreate = async () => {
    const code = generatedReactCode; // Your generated code
    await createBackend(code, {
      projectName: 'my-app',
      region: 'us-east-1',
      enableRLS: true,
    });
  };

  return (
    <div>
      <button onClick={handleCreate} disabled={isCreating}>
        Create Backend
      </button>

      {isCreating && (
        <BackendCreationModal
          stage={stage}
          progress={progress}
          error={error}
          isCreating={isCreating}
          onRetry={retry}
          onClose={() => reset()}
        />
      )}

      {stage === PipelineStage.COMPLETE && result && (
        <CredentialsModal result={result} onClose={() => reset()} />
      )}
    </div>
  );
}
```

### Abort Functionality

The pipeline supports cancellation at any stage:

```tsx
function MyComponent() {
  const { createBackend, abort, isCreating } = useBackendCreation();

  const handleCreate = async () => {
    await createBackend(code, options);
  };

  const handleCancel = () => {
    if (isCreating) {
      abort(); // Cancels current pipeline execution
    }
  };

  return (
    <div>
      <button onClick={handleCreate} disabled={isCreating}>
        Create Backend
      </button>
      {isCreating && (
        <button onClick={handleCancel}>Cancel</button>
      )}
    </div>
  );
}
```

### Error Recovery

Handle errors with retry functionality:

```tsx
function MyComponent() {
  const { stage, error, retry, reset } = useBackendCreation();

  if (stage === PipelineStage.ERROR) {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={retry}>Retry</button>
        <button onClick={reset}>Dismiss</button>
      </div>
    );
  }
}
```

## Authentication

The pipeline requires Supabase OAuth authentication:

```tsx
import { useSupabaseOAuth } from '@/hooks/backend/oauth';

function App() {
  const { login, logout, isAuthenticated, status, error } = useSupabaseOAuth();

  if (!isAuthenticated) {
    return (
      <button onClick={login} disabled={status === 'authenticating'}>
        Login with Supabase
      </button>
    );
  }

  return (
    <div>
      <p>Authenticated!</p>
      <button onClick={logout}>Logout</button>
      {/* Backend creation UI here */}
    </div>
  );
}
```

## API Reference

### useBackendCreation

Main hook for orchestrating the pipeline.

```typescript
const {
  stage,        // PipelineStage - current stage
  progress,     // number (0-100) - progress percentage
  isCreating,   // boolean - whether pipeline is running
  error,        // string | null - error message
  result,       // BackendCreationResult | null - result data
  createBackend,// (code: string, options?: BackendCreationOptions) => Promise<void>
  retry,        // () => boolean - retry from error state
  reset,        // () => void - reset all state
  abort,        // () => boolean - cancel current execution
} = useBackendCreation();
```

### useSupabaseOAuth

Authentication hook for Supabase OAuth.

```typescript
const {
  login,           // () => Promise<void> - initiate OAuth flow
  logout,          // () => Promise<void> - clear token and redirect
  getToken,        // () => string | null - get current valid token
  isAuthenticated, // boolean - auth state
  status,          // OAuthStatus - 'idle' | 'authenticating' | 'authenticated' | 'error'
  error,           // Error | null - error object
} = useSupabaseOAuth();
```

### BackendCreationOptions

```typescript
interface BackendCreationOptions {
  projectName?: string;  // Project name (auto-generated if not provided)
  region?: string;       // Supabase region (default: 'us-east-1')
  enableRLS?: boolean;   // Enable Row Level Security (default: true)
}
```

### BackendCreationResult

```typescript
interface BackendCreationResult {
  projectUrl: string;    // URL of the created project
  anonKey: string;       // Anonymous key for API access
  projectName: string;   // Name of the created project
  migrationName: string; // Name of the applied migration
}
```

## Error Handling

The pipeline handles errors at each stage:

| Stage | Error Example | Recovery |
|-------|---------------|----------|
| ANALYZING | "Analysis failed: Invalid code" | Fix code syntax, retry |
| GENERATING | "SQL generation failed: Invalid requirements" | Check detected entities, retry |
| CREATING_PROJECT | "Project creation failed: Rate limit exceeded" | Wait and retry |
| APPLYING_MIGRATION | "Migration failed: Syntax error in SQL" | Debug SQL, retry |

## Testing

```bash
# Run all backend pipeline tests
npm test -- backend/pipeline

# Run integration tests
npm test -- backend-integration

# Run e2e tests
npm test -- backend-e2e
```

## Security Considerations

1. **Token Storage**: Tokens are stored in sessionStorage (cleared on browser close)
2. **Token Expiration**: Tokens are validated with 30-second buffer
3. **RLS Default**: Row Level Security is enabled by default
4. **HTTPS Only**: All API calls use HTTPS

## Performance

| Stage | Typical Duration |
|-------|------------------|
| ANALYZING | < 100ms (pattern matching) |
| GENERATING | < 50ms (SQL generation) |
| CREATING_PROJECT | 2-5 seconds (API call) |
| APPLYING_MIGRATION | 1-3 seconds (API call) |

Total pipeline time: ~3-10 seconds depending on API latency.
