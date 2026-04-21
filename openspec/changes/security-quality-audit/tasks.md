# Tasks: security-quality-audit

## Overview

Implementation task breakdown for the Comprehensive Security & Quality Audit. Each task is atomic, completable in a single commit, and references the spec requirement it addresses.

**Total Phases**: 5
**Estimated Duration**: 5 days
**Rollback Strategy**: Git tags before/after each phase

---

## Phase 1: Credential Cleanup

**Duration**: Day 1 (Morning)
**Tag Start**: `audit-phase-1-start`
**Tag End**: `audit-phase-1-complete`

### Tasks

- [x] **1.1** Replace `.env` credentials with placeholder values
  - **Spec**: credential-management/req-1/scenario-1
  - **What**: Remove hardcoded Gemini API key and Supabase anon key from `.env`, replace with descriptive placeholders
  - **Acceptance**: `.env` contains only placeholder values like `your-gemini-api-key-here`
  - **Files**: `.env` (modified)

- [x] **1.2** Update `.env.example` with descriptive placeholders
  - **Spec**: credential-management/req-2/scenario-1, scenario-3
  - **What**: Ensure `.env.example` has clear, descriptive placeholders for all required variables
  - **Acceptance**: Each variable has a comment explaining its purpose and a clear placeholder format
  - **Files**: `.env.example` (modified)

- [x] **1.3** Fix `scripts/setup-database.ts` to fail without env vars
  - **Spec**: credential-management/req-3/scenario-1, scenario-2, scenario-3
  - **What**: Remove hardcoded fallback values for `supabaseUrl` and `supabaseKey`, add validation that throws clear error message
  - **Acceptance**: Script exits with clear error message when `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` are not set
  - **Files**: `scripts/setup-database.ts` (modified)

- [x] **1.4** Create `docs/credential-rotation.md`
  - **Spec**: credential-management/req-4/scenario-1, scenario-2, scenario-3
  - **What**: Document step-by-step credential rotation process for Gemini API and Supabase
  - **Acceptance**: Document includes: (1) how to generate new credentials, (2) updating local `.env`, (3) updating CI/CD secrets, (4) verification steps, (5) list of affected services
  - **Files**: `docs/credential-rotation.md` (new)

- [x] **1.5** Write test for credential exposure detection
  - **Spec**: security-testing/req-1/scenario-1, scenario-2, scenario-3
  - **What**: Create `src/__tests__/security-credentials.test.ts` with tests that scan for hardcoded credentials
  - **Acceptance**: Tests detect common secret patterns (API keys, JWTs, passwords) and pass when no real credentials found
  - **Files**: `src/__tests__/security-credentials.test.ts` (new)

- [x] **1.6** Run tests to verify Phase 1 changes
  - **Spec**: security-testing/req-4/scenario-1
  - **What**: Execute all tests including new credential tests, fix any failures
  - **Acceptance**: All tests pass, credential exposure tests verify no hardcoded secrets
  - **Files**: None (verification)

### Files Affected

| File | Action | Spec Ref |
|------|--------|----------|
| `.env` | Modified | credential-management/req-1 |
| `.env.example` | Modified | credential-management/req-2 |
| `scripts/setup-database.ts` | Modified | credential-management/req-3 |
| `docs/credential-rotation.md` | Created | credential-management/req-4 |
| `src/__tests__/security-credentials.test.ts` | Created | security-testing/req-1 |

### Rollback

```bash
git revert audit-phase-1-complete
# Restore .env from backup if needed
```

---

## Phase 2: CSP & Sourcemaps

**Duration**: Day 1 (Afternoon)
**Tag Start**: `audit-phase-2-start`
**Tag End**: `audit-phase-2-complete`

### Tasks

- [x] **2.1** Add CSP-Report-Only meta tag to `index.html`
  - **Spec**: security-hardening/req-1/scenario-1, req-4/scenario-1, scenario-2, scenario-3
  - **What**: Add Content-Security-Policy-Report-Only meta tag with required directives
  - **Acceptance**: CSP meta tag present with `default-src 'self'`, `script-src 'self'`, `style-src 'self' 'unsafe-inline'`, `connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com`, `img-src 'self' data: https:`, `font-src 'self' https://fonts.gstatic.com`
  - **Files**: `index.html` (modified)

- [x] **2.2** Set `sourcemap: false` in `vite.config.ts` for production
  - **Spec**: security-hardening/req-5/scenario-1, scenario-2
  - **What**: Change `sourcemap: true` to `sourcemap: process.env.NODE_ENV === 'development'` so sourcemaps only generate in dev
  - **Acceptance**: Running `npm run build` produces no `.map` files in `dist/`
  - **Files**: `vite.config.ts` (modified)

- [x] **2.3** Write CSP validation tests
  - **Spec**: security-testing/req-2/scenario-1, scenario-2, scenario-3, scenario-4
  - **What**: Create `src/__tests__/security-csp.test.ts` with tests that verify CSP directives are properly configured
  - **Acceptance**: Tests verify CSP meta tag exists, has valid syntax, allows necessary sources (Supabase, Gemini), and blocks inline scripts
  - **Files**: `src/__tests__/security-csp.test.ts` (new)

- [x] **2.4** Test all app flows with CSP Report-Only
  - **Spec**: security-hardening/req-4/scenario-4
  - **What**: Manual testing of all application flows to check for CSP violations in console
  - **Acceptance**: No CSP violation errors in console for legitimate application operations
  - **Files**: None (verification)

- [x] **2.5** Run tests to verify Phase 2 changes
  - **Spec**: security-testing/req-4/scenario-1, scenario-2
  - **What**: Execute all tests including new CSP tests
  - **Acceptance**: All tests pass, CSP tests verify proper configuration
  - **Files**: None (verification)

### Files Affected

| File | Action | Spec Ref |
|------|--------|----------|
| `index.html` | Modified | security-hardening/req-1, req-4 |
| `vite.config.ts` | Modified | security-hardening/req-5 |
| `src/__tests__/security-csp.test.ts` | Created | security-testing/req-2 |

### Rollback

```bash
git revert audit-phase-2-complete
```

---

## Phase 3: TypeScript Strict Mode

**Duration**: Day 2-3
**Tag Start**: `audit-phase-3-start`
**Tag End**: `audit-phase-3-complete`

### Tasks

- [x] **3.1** Enable `strict: true` in `tsconfig.json`
  - **Spec**: quality-debt/strict-mode
  - **What**: Add `"strict": true` to `compilerOptions` in `tsconfig.json`
  - **Acceptance**: TypeScript compiler runs in strict mode
  - **Files**: `tsconfig.json` (modified)

- [x] **3.2** Fix strict mode errors in `src/services/`
  - **Spec**: quality-debt/strict-mode
  - **What**: Address all TypeScript strict mode errors in service modules (priority: AI, storage, backend services)
  - **Acceptance**: No TypeScript errors in `src/services/**/*.ts`
  - **Files**: `src/services/**/*.ts` (modified)

- [x] **3.3** Fix strict mode errors in `src/hooks/`
  - **Spec**: quality-debt/strict-mode
  - **What**: Address all TypeScript strict mode errors in hook modules
  - **Acceptance**: No TypeScript errors in `src/hooks/**/*.ts`
  - **Files**: `src/hooks/**/*.ts` (modified)

- [x] **3.4** Fix strict mode errors in `src/components/`
  - **Spec**: quality-debt/strict-mode
  - **What**: Address all TypeScript strict mode errors in component modules
  - **Acceptance**: No TypeScript errors in `src/components/**/*.tsx`
  - **Files**: `src/components/**/*.tsx` (modified)

- [x] **3.5** Fix strict mode errors in remaining `src/` files
  - **Spec**: quality-debt/strict-mode
  - **What**: Address all TypeScript strict mode errors in utils, config, and other remaining files
  - **Acceptance**: `npm run build` succeeds with zero TypeScript errors
  - **Files**: `src/utils/**/*.ts`, `src/config/**/*.ts`, `src/*.ts` (modified)

- [x] **3.6** Run full test suite after strict mode fixes
  - **Spec**: quality-debt/strict-mode
  - **What**: Execute all tests to ensure no regressions from strict mode fixes
  - **Acceptance**: All tests pass, type safety improved
  - **Files**: None (verification)

### Files Affected

| File | Action | Spec Ref |
|------|--------|----------|
| `tsconfig.json` | Modified | quality-debt |
| `src/services/**/*.ts` | Modified | quality-debt |
| `src/hooks/**/*.ts` | Modified | quality-debt |
| `src/components/**/*.tsx` | Modified | quality-debt |
| `src/utils/**/*.ts` | Modified | quality-debt |
| `src/config/**/*.ts` | Modified | quality-debt |

### Rollback

```bash
git revert audit-phase-3-complete
# Or remove "strict": true from tsconfig.json
```

---

## Phase 4: Privacy Controls

**Duration**: Day 3-4
**Tag Start**: `audit-phase-4-start`
**Tag End**: `audit-phase-4-complete`

### Tasks

- [x] **4.1** Create `src/utils/consentStorage.ts`
  - **Spec**: privacy-controls/req-4/scenario-1, scenario-5
  - **What**: Implement localStorage abstraction for consent state with `getConsent()`, `setConsent()`, `clearConsent()` functions
  - **Acceptance**: Consent state persisted with analytics preference, essential=true, timestamp, and version fields
  - **Files**: `src/utils/consentStorage.ts` (new)

- [x] **4.2** Create `src/hooks/useCookieConsent.ts`
  - **Spec**: privacy-controls/req-1/scenario-1, scenario-2
  - **What**: Implement React hook for managing cookie consent state with hasConsented, acceptAll, rejectNonEssential, and consentType values
  - **Acceptance**: Hook returns current consent state and action handlers
  - **Files**: `src/hooks/useCookieConsent.ts` (new)

- [x] **4.3** Create `src/components/privacy/CookieConsentBanner.tsx`
  - **Spec**: privacy-controls/req-1/scenario-1, scenario-3, scenario-4, req-3/scenario-1, scenario-2
  - **What**: Implement cookie consent banner component with Accept All, Reject Non-Essential buttons and privacy policy link
  - **Acceptance**: Banner appears on first visit, dismisses on choice, matches Toast component patterns
  - **Files**: `src/components/privacy/CookieConsentBanner.tsx` (new)

- [x] **4.4** Create `src/components/privacy/CookieConsentBanner.css`
  - **Spec**: privacy-controls/req-1/scenario-1
  - **What**: Fixed bottom styling for consent banner, responsive design
  - **Acceptance**: Banner is fixed at bottom of viewport, responsive on mobile
  - **Files**: `src/components/privacy/CookieConsentBanner.css` (new)

- [x] **4.5** Create `src/components/privacy/PrivacyPolicyModal.tsx`
  - **Spec**: privacy-controls/req-2/scenario-2, scenario-3
  - **What**: Implement privacy policy modal component with comprehensive privacy information
  - **Acceptance**: Modal displays data collection, usage, and user rights information; accessible without authentication
  - **Files**: `src/components/privacy/PrivacyPolicyModal.tsx` (new)

- [x] **4.6** Create `src/components/privacy/PrivacyPolicyModal.css`
  - **Spec**: privacy-controls/req-2/scenario-2
  - **What**: Modal styling consistent with existing modal patterns
  - **Acceptance**: Modal is centered, scrollable for long content, has close button
  - **Files**: `src/components/privacy/PrivacyPolicyModal.css` (new)

- [x] **4.7** Add privacy link to footer
  - **Spec**: privacy-controls/req-2/scenario-1
  - **What**: Add "Privacy Policy" link to application footer that opens PrivacyPolicyModal
  - **Acceptance**: Link visible in footer, clickable, opens modal
  - **Files**: `src/pages/LandingPage.tsx` (modified)

- [x] **4.8** Integrate CookieConsentBanner in App.tsx
  - **Spec**: privacy-controls/req-1/scenario-1
  - **What**: Add CookieConsentBanner component to App.tsx, conditionally render based on consent state
  - **Acceptance**: Banner shows on first visit, hidden after consent choice
  - **Files**: `src/App.tsx` (modified)

- [x] **4.9** Write tests for privacy components
  - **Spec**: privacy-controls (all scenarios)
  - **What**: Create test file `src/components/privacy/__tests__/CookieConsentBanner.test.tsx`
  - **Acceptance**: Tests verify banner display, accept/reject functionality, persistence
  - **Files**: `src/components/privacy/__tests__/CookieConsentBanner.test.tsx` (new)

- [x] **4.10** Run tests to verify Phase 4 changes
  - **Spec**: privacy-controls (all)
  - **What**: Execute all tests including new privacy tests
  - **Acceptance**: All tests pass, privacy controls functional
  - **Files**: None (verification)

### Files Affected

| File | Action | Spec Ref |
|------|--------|----------|
| `src/utils/consentStorage.ts` | Created | privacy-controls/req-4 |
| `src/hooks/useCookieConsent.ts` | Created | privacy-controls/req-1, req-4 |
| `src/components/privacy/CookieConsentBanner.tsx` | Created | privacy-controls/req-1, req-3 |
| `src/components/privacy/CookieConsentBanner.css` | Created | privacy-controls/req-1 |
| `src/components/privacy/PrivacyPolicyModal.tsx` | Created | privacy-controls/req-2 |
| `src/components/privacy/PrivacyPolicyModal.css` | Created | privacy-controls/req-2 |
| `src/App.tsx` | Modified | privacy-controls/req-1 |
| `src/components/common/TopBar.tsx` | Modified | privacy-controls/req-2 |
| `src/components/privacy/__tests__/CookieConsentBanner.test.tsx` | Created | privacy-controls |

### Rollback

```bash
git revert audit-phase-4-complete
```

---

## Phase 5: Token Storage Migration

**Duration**: Day 4-5
**Tag Start**: `audit-phase-5-start`
**Tag End**: `audit-phase-5-complete`

### Tasks

- [ ] **5.1** Audit all sessionStorage usage in codebase
  - **Spec**: security-testing/req-3/scenario-1
  - **What**: Search and document all sessionStorage usage across the codebase
  - **Acceptance**: Document listing all sessionStorage keys and their purposes
  - **Files**: None (investigation)

- [ ] **5.2** Update `useSupabaseOAuth.ts` to use Supabase SDK managed auth
  - **Spec**: security-testing/req-3/scenario-1, scenario-2, scenario-3
  - **What**: Remove manual sessionStorage token management, rely on Supabase SDK's built-in session handling
  - **Acceptance**: Tokens stored in-memory by SDK, no direct sessionStorage access for auth tokens
  - **Files**: `src/hooks/backend/oauth/useSupabaseOAuth.ts` (modified)

- [ ] **5.3** Update token lifecycle handling
  - **Spec**: security-testing/req-3/scenario-4
  - **What**: Ensure proper token expiration handling, refresh, and cleanup with SDK-managed storage
  - **Acceptance**: Expired tokens properly cleared, user redirected to re-authenticate
  - **Files**: `src/hooks/backend/oauth/useSupabaseOAuth.ts` (modified)

- [ ] **5.4** Write token storage security tests
  - **Spec**: security-testing/req-3/scenario-1, scenario-2, scenario-3, scenario-4
  - **What**: Create `src/__tests__/security-token-storage.test.ts` verifying tokens not in sessionStorage, not exposed to JavaScript globals
  - **Acceptance**: Tests verify secure token storage, pass after migration
  - **Files**: `src/__tests__/security-token-storage.test.ts` (new)

- [ ] **5.5** Update existing OAuth tests for new implementation
  - **Spec**: security-testing/req-3
  - **What**: Update `src/hooks/backend/oauth/__tests__/useSupabaseOAuth.test.ts` to test new SDK-managed auth
  - **Acceptance**: All OAuth tests pass with new implementation
  - **Files**: `src/hooks/backend/oauth/__tests__/useSupabaseOAuth.test.ts` (modified)

- [ ] **5.6** Add error message sanitization to error handling
  - **Spec**: error-handling-system/req-4/scenario-1, scenario-2, scenario-3, scenario-4, scenario-5
  - **What**: Add credential redaction to error messages, logs, and console output
  - **Acceptance**: API keys, tokens, and secrets are redacted or masked in all error outputs
  - **Files**: `src/services/ai/AIOrchestrator.ts`, error handling utilities (modified)

- [ ] **5.7** E2E test authentication flow
  - **Spec**: security-testing/req-3
  - **What**: Manual verification that OAuth flow works correctly end-to-end
  - **Acceptance**: Login, authenticated requests, and logout all function correctly
  - **Files**: None (verification)

- [ ] **5.8** Run full test suite after token migration
  - **Spec**: security-testing/req-4/scenario-1, scenario-2, scenario-3, scenario-4
  - **What**: Execute all tests to ensure no regressions from token storage changes
  - **Acceptance**: All tests pass, security tests verify secure token storage
  - **Files**: None (verification)

### Files Affected

| File | Action | Spec Ref |
|------|--------|----------|
| `src/hooks/backend/oauth/useSupabaseOAuth.ts` | Modified | security-testing/req-3 |
| `src/__tests__/security-token-storage.test.ts` | Created | security-testing/req-3 |
| `src/hooks/backend/oauth/__tests__/useSupabaseOAuth.test.ts` | Modified | security-testing/req-3 |
| `src/services/ai/AIOrchestrator.ts` | Modified | error-handling-system/req-4 |

### Rollback

```bash
git revert audit-phase-5-complete
```

---

## Post-Implementation: CSP Enforcement

**Duration**: Day 12 (7 days after Phase 2)
**Trigger**: After 7 days of CSP-Report-Only monitoring

### Tasks

- [ ] **6.1** Review CSP violation reports from Report-Only period
  - **What**: Analyze console logs and any collected violation reports
  - **Acceptance**: No legitimate script/style violations found
  - **Files**: None (analysis)

- [ ] **6.2** Switch CSP from Report-Only to enforcing mode
  - **Spec**: security-hardening/req-4
  - **What**: Change `Content-Security-Policy-Report-Only` to `Content-Security-Policy` in `index.html`
  - **Acceptance**: CSP enforces restrictions, no functionality broken
  - **Files**: `index.html` (modified)

- [ ] **6.3** Test application with enforcing CSP
  - **What**: Full regression test of all application features
  - **Acceptance**: All features work correctly with CSP enforcement
  - **Files**: None (verification)

---

## CI Integration Tasks

**Duration**: After Phase 5 complete

### Tasks

- [ ] **7.1** Add security test step to CI pipeline
  - **Spec**: security-testing/req-4/scenario-1, scenario-3
  - **What**: Configure CI to run security tests as distinct step before deployment
  - **Acceptance**: Security tests run in CI, build fails on security test failure
  - **Files**: `.github/workflows/` or equivalent (modified)

- [ ] **7.2** Add security test coverage reporting
  - **Spec**: security-testing/req-4/scenario-4
  - **What**: Configure coverage report to highlight security test coverage
  - **Acceptance**: Security test coverage reported in CI output
  - **Files**: CI configuration (modified)

---

## Summary

### Total Tasks by Phase

| Phase | Tasks | Priority |
|-------|-------|----------|
| Phase 1: Credential Cleanup | 6 | CRITICAL |
| Phase 2: CSP & Sourcemaps | 5 | CRITICAL |
| Phase 3: TypeScript Strict Mode | 6 | HIGH |
| Phase 4: Privacy Controls | 10 | MEDIUM |
| Phase 5: Token Storage Migration | 8 | HIGH |
| Post-Implementation | 3 | LOW |
| CI Integration | 2 | MEDIUM |

### Success Criteria (from proposal)

- [ ] Zero hardcoded credentials in codebase (verified by secret scanning)
- [ ] CSP meta tag present with valid directives
- [ ] TypeScript strict mode enabled with zero errors
- [ ] `< 5` `any` types remaining in production code
- [ ] Zero console.log in production build
- [ ] OAuth tokens not in sessionStorage (use secure alternative)
- [ ] Privacy consent UI implemented
- [ ] All security tests passing (existing + new)
- [ ] Audit report documenting all findings with severity and remediation

### Dependencies

- Access to Supabase dashboard for credential rotation
- Gemini API key rotation capability
- GDPR legal review for privacy policy text (can use placeholder initially)
