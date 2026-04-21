# Design: Comprehensive Security & Quality Audit

## Technical Approach

Implement security remediation in five phases: (1) credential cleanup, (2) CSP & sourcemaps, (3) TypeScript strict mode, (4) privacy controls, and (5) token storage migration. Each phase is atomic with git tags for rollback. Privacy components follow existing component patterns (Toast, ErrorBoundary) with CSS isolation.

## Architecture Decisions

### Decision: Token Storage Migration Strategy

**Choice**: In-memory only with silent refresh (Supabase SDK managed)

**Alternatives considered**:
| Option | Tradeoff | Decision |
|--------|----------|----------|
| HttpOnly cookies | Requires backend proxy, breaks SPA flow | Rejected - no backend |
| sessionStorage (current) | XSS vulnerable | Rejected - insecure |
| In-memory + refresh | Session lost on tab close, but secure | **Chosen** |
| IndexedDB + encryption | Complex, key management issues | Rejected - over-engineered |

**Rationale**: Supabase JS SDK already handles token refresh internally. Migrating from manual sessionStorage to SDK-managed in-memory storage eliminates XSS exposure while preserving auth flow. User must re-auth on tab close (acceptable UX tradeoff for security).

### Decision: CSP Implementation Approach

**Choice**: Report-Only first, then enforce after 7-day monitoring

**Alternatives considered**:
| Option | Tradeoff | Decision |
|--------|----------|----------|
| Direct enforcement | Risk of breaking app | Rejected - too risky |
| Report-Only → enforce | Safe iteration | **Chosen** |
| No CSP | Security hole | Rejected |

**Rationale**: CSP-Report-Only allows collecting violation reports without breaking functionality. After confirming no legitimate scripts blocked, switch to enforcement. Required directives:
- `default-src 'self'`
- `script-src 'self'`
- `style-src 'self' 'unsafe-inline'` (Tailwind requires inline)
- `connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com`
- `img-src 'self' data: https:`
- `font-src 'self' https://fonts.gstatic.com`

### Decision: Privacy Controls Architecture

**Choice**: React components with localStorage persistence

**Alternatives considered**:
| Option | Tradeoff | Decision |
|--------|----------|----------|
| Third-party consent manager | External dependency, overkill | Rejected |
| Custom React components | Full control, matches codebase | **Chosen** |
| Server-side consent | Requires backend | Rejected |

**Rationale**: Consent state (user preference, not sensitive) stored in localStorage. CookieConsentBanner follows Toast/Modal patterns. PrivacyPolicyModal reuses existing modal patterns.

## Data Flow

```
App.tsx
├── CookieConsentBanner (checks localStorage)
│   ├── onAccept() → saveConsent({ analytics: true, timestamp: now })
│   └── onReject() → saveConsent({ analytics: false, timestamp: now })
│
└── useSupabaseOAuth (replaced)
    ├── Old: sessionStorage.setItem('sb-access-token', token) [XSS vulnerable]
    └── New: supabase.auth.getSession() [SDK-managed, in-memory]
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `.env` | Modify | Replace real credentials with placeholders |
| `.env.example` | Create | Template with placeholder values |
| `scripts/setup-database.ts` | Modify | Remove hardcoded fallbacks, add validation |
| `vite.config.ts` | Modify | `sourcemap: false` for production |
| `tsconfig.json` | Modify | Add `strict: true` |
| `index.html` | Modify | Add CSP meta tag (Report-Only first) |
| `src/components/privacy/CookieConsentBanner.tsx` | Create | Consent UI component |
| `src/components/privacy/CookieConsentBanner.css` | Create | Fixed bottom styling |
| `src/components/privacy/PrivacyPolicyModal.tsx` | Create | Privacy policy modal |
| `src/components/privacy/PrivacyPolicyModal.css` | Create | Modal styling |
| `src/hooks/useCookieConsent.ts` | Create | Consent state hook |
| `src/utils/consentStorage.ts` | Create | localStorage abstraction |
| `src/hooks/backend/oauth/useSupabaseOAuth.ts` | Modify | Remove manual sessionStorage, use Supabase SDK |
| `src/__tests__/security-credentials.test.ts` | Create | Credential exposure tests |
| `src/__tests__/security-csp.test.ts` | Create | CSP validation tests |
| `src/__tests__/security-token-storage.test.ts` | Create | Token storage tests |
| `docs/credential-rotation.md` | Create | Rotation documentation |

## Interfaces / Contracts

```typescript
// src/utils/consentStorage.ts
interface ConsentState {
  analytics: boolean;
  essential: true; // always true
  timestamp: number;
  version: 1;
}

const STORAGE_KEY = 'app-consent-state';

export function getConsent(): ConsentState | null;
export function setConsent(state: Omit<ConsentState, 'essential' | 'version'>): void;
export function clearConsent(): void;
```

```typescript
// src/components/privacy/CookieConsentBanner.tsx
interface CookieConsentBannerProps {
  onAccept?: () => void;
  onReject?: () => void;
  onCustomize?: () => void;
}
```

```typescript
// src/components/privacy/PrivacyPolicyModal.tsx
interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Consent state CRUD | Vitest + localStorage mock |
| Unit | CSP meta tag presence | Vitest + JSDOM |
| Unit | Credential pattern detection | Vitest + regex scanning |
| Integration | Token not in sessionStorage | Vitest + render hook |
| Integration | Consent blocks analytics | Vitest + mock analytics |
| E2E | Banner appears, dismisses | Playwright (future) |

### Test Files Structure

```
src/__tests__/
├── security-credentials.test.ts  ← Credential patterns
├── security-csp.test.ts          ← CSP directive validation
├── security-token-storage.test.ts ← Token storage security
├── security-error-handling.test.ts ← (existing)
└── security-prompt-logging.test.ts ← (existing)
```

## Migration / Rollout

### Phase 1: Credential Cleanup (Day 1)
1. Tag: `audit-phase-1-start`
2. Replace `.env` values with placeholders
3. Create `.env.example` with descriptive placeholders
4. Fix `scripts/setup-database.ts` to fail without env vars
5. Create `docs/credential-rotation.md`
6. Tag: `audit-phase-1-complete`

### Phase 2: CSP & Sourcemaps (Day 1)
1. Tag: `audit-phase-2-start`
2. Add CSP-Report-Only meta tag to `index.html`
3. Set `sourcemap: process.env.NODE_ENV === 'development'` in `vite.config.ts`
4. Test all app flows
5. Tag: `audit-phase-2-complete`

### Phase 3: TypeScript Strict Mode (Day 2-3)
1. Tag: `audit-phase-3-start`
2. Add `strict: true` to `tsconfig.json`
3. Fix errors priority order: services/ → hooks/ → components/
4. Run tests after each module
5. Tag: `audit-phase-3-complete`

### Phase 4: Privacy Controls (Day 3-4)
1. Tag: `audit-phase-4-start`
2. Implement `useCookieConsent` hook
3. Implement `CookieConsentBanner` component
4. Implement `PrivacyPolicyModal` component
5. Add privacy link to footer
6. Tag: `audit-phase-4-complete`

### Phase 5: Token Storage Migration (Day 4-5)
1. Tag: `audit-phase-5-start`
2. Audit all sessionStorage usage
3. Migrate OAuth to Supabase SDK managed auth
4. Add token storage security tests
5. E2E test authentication flow
6. Tag: `audit-phase-5-complete`

### CSP Enforcement (Day 12)
After 7 days of Report-Only monitoring, switch CSP to enforcing mode.

## Rollback Plan

| Phase | Rollback Command |
|-------|-----------------|
| Phase 1 | `git revert audit-phase-1-complete` → restore `.env` from backup |
| Phase 2 | `git revert audit-phase-2-complete` |
| Phase 3 | `git revert audit-phase-3-complete` → remove `strict: true` |
| Phase 4 | `git revert audit-phase-4-complete` |
| Phase 5 | `git revert audit-phase-5-complete` |

**Credential Rotation**: If `.env` was committed to remote:
1. Immediately rotate Gemini API key in Google AI Studio
2. Regenerate Supabase anon key in dashboard
3. Update CI/CD secrets if applicable

## Open Questions

- [ ] Legal review needed for privacy policy text (placeholder content for now)
- [ ] Should CSP-Report-Only endpoint be configured? (currently logs to console)
- [ ] Confirmation: Supabase SDK version supports in-memory token management?
