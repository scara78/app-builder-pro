# Proposal: backend-integration-wire-up

## Intent

Wire up the existing SupabaseFrontendAdapter into the UI so users can apply backend credentials to generated code. Currently, backend creation works but the adapter is never called, credentials modal isn't rendered, and there's no "Apply Backend" flow. This change bridges the last gap between CHANGE 4 (backend pipeline) and CHANGE 6 (adapter) to complete the MVP backend integration.

## Scope

### In Scope
- Expose `requirements` from `useBackendCreation` hook
- Render `CredentialsModal` when backend creation completes
- Implement "Apply Backend" button that calls `adaptProject()` and remounts WebContainer
- Handle edge cases: multiple clicks, adaptation failure, empty requirements

### Out of Scope
- New backend features (additional auth providers, storage buckets)
- UI redesign of CredentialsModal
- Performance optimizations beyond basic debounce
- Caching of adapted files

## Capabilities

### New Capabilities
- `backend-application`: User-initiated flow to apply Supabase credentials to generated React code

### Modified Capabilities
- None (this is purely UI wiring, no spec-level changes to existing capabilities)

## Approach

**Recommended: Minimal Changes (Approach 1 from exploration)**

1. **Expose `requirements`** in `useBackendCreation.ts`:
   - Add `requirements` state (line ~95)
   - Store result from stage 1 analysis (line ~185)
   - Return `requirements` in hook output (line ~330)

2. **Wire CredentialsModal** in `BuilderPage.tsx`:
   - Add `showCredentialsModal` state
   - Import and render `CredentialsModal` conditionally
   - Close BackendCreationModal when COMPLETE, open CredentialsModal

3. **Add "Apply to Project" button** to `CredentialsModal.tsx`:
   - New `onApply` prop
   - Button triggers adaptation flow

4. **Implement `handleApplyBackend`** in `BuilderPage.tsx`:
   - Call `adaptProject({ files, backendResult, requirements })`
   - Check `skipped` flag, show toast if skipped
   - Set adapted files, remount WebContainer
   - Add `isApplying` state to prevent double-clicks

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/hooks/backend/pipeline/useBackendCreation.ts` | Modified | Expose `requirements` state |
| `src/pages/BuilderPage.tsx` | Modified | Add modal state, apply handler, import adapter |
| `src/components/backend/CredentialsModal.tsx` | Modified | Add `onApply` prop and button |
| `src/components/backend/BackendCreationModal.tsx` | Modified | Change "View Credentials" to trigger modal transition |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| State desync (result exists, requirements null) | Medium | Set both atomically, reset together |
| WebContainer remount race condition | Low | `isApplying` state guards against double-click |
| Adaptation fails mid-remount | Low | Try/catch with error toast, preserve original files |
| User generates new code after backend created | Medium | Clear result/requirements on new generation |

## Rollback Plan

1. Revert `useBackendCreation.ts` to not expose `requirements`
2. Remove CredentialsModal rendering from `BuilderPage.tsx`
3. Remove `onApply` prop from `CredentialsModal.tsx`
4. All changes are additive - removal has no side effects

## Dependencies

- CHANGE 4 (backend-pipeline-integration): `useBackendCreation` hook exists
- CHANGE 6 (supabase-frontend-adapter): `adaptProject()` factory exists
- `useWebContainer` hook: `mount()`, `install()`, `runDev()` methods

## Success Criteria

- [ ] User creates backend, sees CredentialsModal with credentials
- [ ] User clicks "Apply to Project", sees adapted files in preview
- [ ] Preview shows working app with Supabase connected
- [ ] Multiple clicks on Apply are prevented with loading state
- [ ] If code doesn't need backend, user sees informative toast
- [ ] Tests: unit for hook changes, integration for full flow

---

**Status**: PROPOSAL_CREATED
**Created**: 2026-04-19
**Next**: sdd-spec or sdd-design phase
