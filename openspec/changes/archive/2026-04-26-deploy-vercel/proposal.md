# Proposal: One-Click Vercel Deploy

## Intent
Users can generate and preview apps but cannot share them publicly. Without deploy, the product has no viral loop — generated apps die in the browser tab. One-click Vercel deploy closes this gap.

## Scope

### In Scope
- Vercel OAuth with PKCE (in-memory token storage, no localStorage)
- Deploy pipeline: prepare files → base64 encode → POST /v13/deployments → poll until ready → return URL
- DeployModal component (mirrors BackendCreationModal pattern)
- DeploySuccess component showing live URL with copy button
- Vercel config module (mirrors src/config/supabase.ts)
- TopBar "Deploy" button wired to deploy flow
- CSP update: add `https://api.vercel.com` and `https://vercel.com` to connect-src
- .env.example update: VITE_VERCEL_CLIENT_ID, VITE_VERCEL_REDIRECT_URI

### Out of Scope
- Custom domain configuration
- Deploy previews per branch
- Environment variable injection into deployed app
- Vercel project linking (subsequent deploys to same project)
- Deployment history UI

## Capabilities

### New Capabilities
- `vercel-oauth`: Vercel OAuth authentication with PKCE flow, token lifecycle management
- `vercel-deploy`: Deploy pipeline — file preparation, API calls, status polling, URL retrieval

### Modified Capabilities
- `credential-management`: Adding Vercel token to in-memory credential lifecycle (clear on logout)

## Approach
Mirror existing patterns: `useVercelOAuth` replicates `useSupabaseOAuth` with PKCE adaptation. `useVercelDeploy` replicates `useBackendCreation` pipeline pattern. `DeployModal` replicates `BackendCreationModal`. New `src/services/deploy/` layer handles file prep and API calls. CORS risk mitigated by testing early — fallback to Vercel Edge Function proxy if blocked.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/hooks/deploy/` | New | Vercel OAuth + deploy pipeline hooks |
| `src/services/deploy/` | New | Vercel API client, file preparation |
| `src/components/deploy/` | New | DeployModal, DeploySuccess |
| `src/config/vercel.ts` | New | Vercel OAuth + API config |
| `src/components/common/TopBar.tsx` | Modified | Wire Deploy button to deploy flow |
| `src/pages/BuilderPage.tsx` | Modified | Add deploy hooks + modal state |
| `index.html` | Modified | CSP connect-src update |
| `.env.example` | Modified | Add Vercel env vars |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Vercel API blocks CORS from browser | Med | Test early. Fallback: 3-line Vercel Edge Function proxy |
| PKCE implementation edge cases | Low | Use Web Crypto API (btoa + SHA256). Well-documented spec |
| Large project files exceed Vercel payload limit | Low | Vercel limit is 50MB per deployment. Typical generated apps are <1MB |
| Token leakage via URL/referrer | Low | PKCE prevents token in URL. Clean URL after callback |

## Rollback Plan
All new code is in new directories (`deploy/`, `hooks/deploy/`, `services/deploy/`). TopBar/BuilderPage changes are additive (new props + handlers). Revert = delete new files + remove added props/handlers from TopBar and BuilderPage. No database migrations, no breaking changes.

## Dependencies
- Vercel App registration (client_id/client_secret) — must be created before OAuth works
- Web Crypto API (available in all modern browsers)

## Success Criteria
- [ ] User can authenticate with Vercel via OAuth PKCE flow
- [ ] Generated app deploys to Vercel with one click from TopBar
- [ ] DeployModal shows real-time progress through all pipeline stages
- [ ] User receives a live URL on successful deploy
- [ ] Tokens stored in-memory only, never in localStorage/sessionStorage (except PKCE verifier during redirect)
- [ ] All new code covered by unit tests (strict TDD)
- [ ] CSP allows Vercel API calls
