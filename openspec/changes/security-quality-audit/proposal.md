# Proposal: Comprehensive Security & Quality Audit

## Intent

Conduct a full security and quality audit of App Builder Pro to identify and remediate vulnerabilities, enforce TypeScript strict mode, implement GDPR compliance, and establish automated security testing. This addresses CRITICAL hardcoded credentials exposure, missing CSP, and quality debt before production deployment.

## Scope

### In Scope
- Security audit: hardcoded secrets, XSS vectors, token leakage, OAuth storage
- Quality audit: TypeScript strict mode, `any` type elimination, console.log removal
- Governance audit: GDPR controls, privacy policy, cookie consent
- Telemetry audit: verify no unwanted tracking/data collection
- Auto-remediation: fix CRITICAL/HIGH issues automatically
- Security test suite: extend existing tests with BDD scenarios

### Out of Scope
- Feature development or new capabilities
- Performance optimization (separate change)
- Accessibility audit (separate change)
- Third-party dependency audit (use `npm audit` separately)

## Capabilities

### New Capabilities
- `credential-management`: Secure handling of API keys, tokens, and secrets
- `privacy-controls`: GDPR compliance, cookie consent, privacy policy UI
- `security-testing`: Automated security test suite with BDD scenarios

### Modified Capabilities
- `security-hardening`: Add CSP meta tag requirement (spec exists but incomplete)
- `error-handling-system`: Add token leakage prevention in error messages

## Approach

**SDD Phase**: Write specs for each new capability with Gherkin scenarios covering OWASP Top 10 for frontend.

**TDD Phase**: Security tests first. Extend existing test suite (`src/__tests__/security-*.test.ts`) with:
- Credential exposure tests
- Token storage security tests
- CSP validation tests

**BDD Phase**: Gherkin scenarios for audit requirements:
```gherkin
Feature: No hardcoded credentials in codebase
  Scenario: Environment files contain no real secrets
    Given .env file
    When scanning for API keys
    Then no real credentials are found (only placeholders)
```

**Auto-Repair Strategy**:
1. Replace hardcoded credentials with env var references
2. Add CSP meta tag to index.html
3. Disable sourcemaps in production
4. Enable TypeScript strict mode
5. Migrate sessionStorage tokens to httpOnly cookies or secure storage

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `.env` | Modified | Replace real credentials with placeholders |
| `scripts/setup-database.ts` | Modified | Remove hardcoded Supabase URL+key |
| `vite.config.ts` | Modified | `sourcemap: false` for production |
| `tsconfig.json` | Modified | Add `strict: true` |
| `index.html` | Modified | Add CSP meta tag |
| `src/hooks/backend/oauth/*.ts` | Modified | Secure token storage |
| `src/**/*.ts` (production) | Modified | Fix `any` types, remove console.log |
| `src/components/` | New | Privacy consent components |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Breaking changes from strict mode | High | Incremental enablement, fix errors one module at a time |
| OAuth flow changes break auth | Medium | Comprehensive E2E tests before/after |
| CSP too restrictive | Medium | Start with report-only, tighten iteratively |
| Credential rotation needed | High | Document rotation process, use secrets manager |

## Rollback Plan

1. **Git tags before each phase**: `audit-phase-1-credentials`, `audit-phase-2-csp`, etc.
2. **Feature flags**: CSP in report-only mode first
3. **Environment rollback**: Keep old credentials until rotation complete
4. **Revert commits**: Each auto-fix in separate commit for selective revert

## Dependencies

- Access to Supabase dashboard for credential rotation
- Gemini API key rotation capability
- GDPR legal review for privacy policy text

## Success Criteria

- [ ] Zero hardcoded credentials in codebase (verified by secret scanning)
- [ ] CSP meta tag present with valid directives
- [ ] TypeScript strict mode enabled with zero errors
- [ ] `< 5` `any` types remaining in production code
- [ ] Zero console.log in production build
- [ ] OAuth tokens not in sessionStorage (use secure alternative)
- [ ] Privacy consent UI implemented
- [ ] All security tests passing (existing + new)
- [ ] Audit report documenting all findings with severity and remediation
