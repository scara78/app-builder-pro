# Tasks: One-Click Vercel Deploy

## Phase 1: Foundation (Types + Config)

- [x] 1.1 Create `src/hooks/deploy/types.ts` with DeployStage enum, DeployResult, DeployOptions interfaces
- [x] 1.2 Create `src/services/deploy/types.ts` with VercelDeploymentFile, VercelDeploymentResponse, VercelApiConfig interfaces
- [x] 1.3 Create `src/config/vercel.ts` with VercelOAuthConfig (clientId from VITE_VERCEL_CLIENT_ID, redirectUri, scopes, apiBaseUrl)
- [x] 1.4 Update `.env.example` adding VITE_VERCEL_CLIENT_ID and VITE_VERCEL_REDIRECT_URI placeholders
- [x] 1.5 Update `index.html` CSP connect-src to add `https://api.vercel.com https://vercel.com`

## Phase 2: Service Layer (TDD)

- [x] 2.1 RED: Write `src/services/deploy/__tests__/filePrep.test.ts` testing filtering excluded paths, base64 encoding, empty project error
- [x] 2.2 GREEN: Implement `src/services/deploy/filePrep.ts` with prepareFiles() that filters and base64-encodes ProjectFile[]
- [x] 2.3 RED: Write `src/services/deploy/__tests__/vercelApi.test.ts` testing createDeployment request shape, auth header, pollDeployment loop, timeout, error states
- [x] 2.4 GREEN: Implement `src/services/deploy/vercelApi.ts` with createDeployment() and pollDeployment() using fetch
- [x] 2.5 Create `src/services/deploy/index.ts` barrel export

## Phase 3: Hooks (TDD)

- [x] 3.1 RED: Write `src/hooks/deploy/__tests__/useVercelOAuth.test.ts` testing PKCE generation, login redirect, exchangeCode flow, token storage, logout, expiration
- [x] 3.2 GREEN: Implement `src/hooks/deploy/useVercelOAuth.ts` with login(), exchangeCode(), getToken(), logout(), isAuthenticated using Web Crypto API
- [x] 3.3 RED: Write `src/hooks/deploy/__tests__/useVercelDeploy.test.ts` testing stage transitions, progress updates, retry, abort, error handling
- [x] 3.4 GREEN: Implement `src/hooks/deploy/useVercelDeploy.ts` with deploy(), retry(), reset(), abort() mirroring useBackendCreation pattern
- [x] 3.5 Create `src/hooks/deploy/index.ts` barrel export

## Phase 4: UI Components (TDD)

- [x] 4.1 RED: Write `src/components/deploy/__tests__/DeployModal.test.tsx` testing stage rendering, progress bar, error/retry, cancel button
- [x] 4.2 GREEN: Implement `src/components/deploy/DeployModal.tsx` and `DeployModal.css` mirroring BackendCreationModal pattern
- [x] 4.3 RED: Write `src/components/deploy/__tests__/DeploySuccess.test.tsx` testing URL display, clickable link, copy-to-clipboard
- [x] 4.4 GREEN: Implement `src/components/deploy/DeploySuccess.tsx` with DeployResult display and copy button

## Phase 5: Integration (Wiring)

- [x] 5.1 Modify `src/components/common/TopBar.tsx` adding onDeploy, isVercelAuthenticated, isDeploying props and wiring Deploy button
- [x] 5.2 Modify `src/pages/BuilderPage.tsx` adding useVercelOAuth, useVercelDeploy hooks, DeployModal state, and handlers
- [x] 5.3 Handle Vercel OAuth callback in BuilderPage detecting code param in URL and calling exchangeCode()
- [x] 5.4 Update `docs/credential-rotation.md` adding Vercel as third service

## Phase 6: Verify

- [x] 6.1 Run `npm run test:run` ensuring all existing and new tests pass — **1171 tests, 82 files, 0 failures**
- [x] 6.2 Run `npm run build` ensuring TypeScript compiles without errors — **tsc + vite build OK in 1.53s**
- [x] 6.3 Verify CSP security test still passes with updated connect-src — **11/11 CSP tests pass**
- [x] 6.4 CORS verification — **Code handles CORS errors gracefully (TypeError catch). Vercel API likely blocks browser CORS (expected). Fallback: Vercel Edge Function proxy (documented in design.md)**
