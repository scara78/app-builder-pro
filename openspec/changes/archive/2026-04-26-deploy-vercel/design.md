# Design: One-Click Vercel Deploy

## Technical Approach
Mirror existing backend-creation architecture: separate OAuth hook + pipeline hook + service layer + modal. Files flow from WebContainerManager → base64 encode → Vercel REST API. PKCE OAuth replaces the implicit flow used by Supabase. No SDK — direct REST calls with CORS fallback to Edge Function proxy.

## Architecture Decisions

### Decision: Direct REST API over Vercel SDK
**Choice**: Raw `fetch()` to Vercel REST API
**Alternatives**: `@vercel/sdk` npm package
**Rationale**: SDK is Node.js-first, not browser-compatible. REST calls are simpler, no dependency, easier to mock in tests. If CORS blocks us, one Edge Function fixes it — no SDK change needed.

### Decision: PKCE OAuth over Implicit Flow
**Choice**: OAuth 2.0 PKCE (code_challenge + code_verifier)
**Alternatives**: Implicit flow (token in URL fragment, like Supabase)
**Rationale**: Vercel requires PKCE for confidential clients. More secure — no token in URL, no browser history leakage. `code_verifier` stored in sessionStorage only during redirect (cleared after exchange).

### Decision: Separate Deploy Service Layer
**Choice**: `src/services/deploy/` with `vercelApi.ts` + `filePrep.ts`
**Alternatives**: Inline API calls in hook
**Rationale**: Same pattern as `src/services/analyzer/`, `src/services/sql/`, `src/services/supabase/`. Testable in isolation, hook stays thin (orchestration only), services are mockable.

### Decision: Reuse DeployStage enum pattern
**Choice**: New `DeployStage` enum mirroring `PipelineStage` structure
**Alternatives**: String union type
**Rationale**: Enums give runtime safety + IDE autocomplete. Matches existing PipelineStage pattern exactly — consistency over novelty.

## Data Flow

```
TopBar [Deploy btn]
  │
  ▼
BuilderPage ──→ useVercelDeploy.deploy()
  │                    │
  │                    ▼
  │              DeployStage.PREPARING
  │              filePrep.prepareFiles(wcFiles)
  │              → filters excluded paths
  │              → base64 encodes each file
  │                    │
  │                    ▼
  │              DeployStage.DEPLOYING
  │              vercelApi.createDeployment(token, files, name)
  │              → POST /v13/deployments
  │                    │
  │                    ▼
  │              DeployStage.WAITING
  │              vercelApi.pollDeployment(id)
  │              → GET /v13/deployments/{id} every 2s
  │                    │
  │                    ▼
  │              DeployStage.COMPLETE
  │              → result.url available
  │
  ▼
DeployModal (progress stages)
  └── DeploySuccess (URL + copy button)
```

OAuth flow runs independently via `useVercelOAuth`:
```
TopBar [Deploy btn] ──→ useVercelOAuth.login()
  │                         │
  │                    Redirect to vercel.com/oauth/authorize
  │                    (with PKCE code_challenge)
  │                         │
  │                    Callback: /oauth/vercel/callback
  │                         │
  │                    useVercelOAuth.exchangeCode(code)
  │                    → POST /oauth/token
  │                    → store token in-memory
  │                    → clear code_verifier from sessionStorage
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/config/vercel.ts` | Create | Vercel OAuth config (clientId, redirectUri, scopes, apiBaseUrl) |
| `src/hooks/deploy/types.ts` | Create | DeployStage enum, DeployResult, DeployOptions types |
| `src/hooks/deploy/useVercelOAuth.ts` | Create | PKCE OAuth hook — login, exchangeCode, getToken, logout, isAuthenticated |
| `src/hooks/deploy/useVercelDeploy.ts` | Create | Deploy pipeline hook — mirrors useBackendCreation pattern |
| `src/hooks/deploy/index.ts` | Create | Barrel export |
| `src/services/deploy/vercelApi.ts` | Create | REST client: createDeployment, pollDeployment |
| `src/services/deploy/filePrep.ts` | Create | prepareFiles: read WC files → filter → base64 encode |
| `src/services/deploy/types.ts` | Create | VercelDeploymentFile, VercelDeploymentResponse types |
| `src/services/deploy/index.ts` | Create | Barrel export |
| `src/components/deploy/DeployModal.tsx` | Create | Progress modal — mirrors BackendCreationModal |
| `src/components/deploy/DeploySuccess.tsx` | Create | Success state with URL + copy button |
| `src/components/deploy/DeployModal.css` | Create | Modal styles — mirrors BackendCreationModal.css |
| `src/components/common/TopBar.tsx` | Modify | Wire Deploy button, add deploy props |
| `src/pages/BuilderPage.tsx` | Modify | Add useVercelDeploy + useVercelOAuth hooks, modal state |
| `index.html` | Modify | Add `https://api.vercel.com https://vercel.com` to CSP connect-src |
| `.env.example` | Modify | Add VITE_VERCEL_CLIENT_ID, VITE_VERCEL_REDIRECT_URI |
| `docs/credential-rotation.md` | Modify | Add Vercel to affected services list |

## Interfaces / Contracts

```typescript
// src/hooks/deploy/types.ts
enum DeployStage {
  IDLE = 'idle',
  AUTHENTICATING = 'authenticating',
  PREPARING = 'preparing',
  DEPLOYING = 'deploying',
  WAITING = 'waiting',
  COMPLETE = 'complete',
  ERROR = 'error',
}

interface DeployResult {
  url: string;
  deploymentId: string;
  projectName: string;
}

interface DeployOptions {
  projectName?: string;
  target?: 'production' | 'staging';
}

// src/services/deploy/types.ts
interface VercelDeploymentFile {
  file: string;       // relative path
  data: string;       // base64 content
  encoding: 'base64';
}

interface VercelDeploymentResponse {
  id: string;
  url: string;
  state: 'QUEUED' | 'BUILDING' | 'READY' | 'ERROR';
}

// src/hooks/deploy/useVercelOAuth.ts return type
interface VercelOAuthState {
  login: () => void;
  exchangeCode: (code: string) => Promise<string | null>;
  getToken: () => string | null;
  logout: () => void;
  isAuthenticated: boolean;
  status: 'idle' | 'authenticating' | 'authenticated' | 'error';
  error: Error | null;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `filePrep.prepareFiles()` — filtering, base64 encoding | Mock WebContainerManager, verify output shape |
| Unit | `vercelApi.createDeployment()` — request shape, auth header | Mock fetch, verify POST body and headers |
| Unit | `vercelApi.pollDeployment()` — polling loop, timeout, error states | Mock fetch with sequential responses, fake timers |
| Unit | `useVercelOAuth` — PKCE generation, code exchange, token storage | Mock Web Crypto API, fetch; renderHook |
| Unit | `useVercelDeploy` — stage transitions, progress, retry, abort | Mock service layer; renderHook |
| Unit | `DeployModal` — renders stages, progress bar, error/retry | @testing-library/react |
| Unit | `DeploySuccess` — URL display, copy button | @testing-library/react + userEvent |
| Integration | Full deploy flow from TopBar click → URL display | Mock service layer + OAuth hook |

## Migration / Rollout
No migration required. All new code in new directories. TopBar/BuilderPage changes are additive. Feature works immediately once Vercel App is registered and env vars set.

## Open Questions
- [ ] Vercel App registration: who creates it and manages client_id/secret? (DevOps task, not code)
- [ ] CORS: does Vercel API allow browser-side requests? Test early in apply phase.
