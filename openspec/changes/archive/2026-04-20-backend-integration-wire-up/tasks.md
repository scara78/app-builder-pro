# Tasks: backend-integration-wire-up

## Phase 1: Hook Modifications (RA-001)

- [ ] 1.1 Add `requirements` state to `useBackendCreation.ts` (line ~95)
- [ ] 1.2 Store `requirements` from ANALYZING stage in `setRequirements()` (line ~185)
- [ ] 1.3 Return `requirements` in hook output object (line ~330)
- [ ] 1.4 Clear `requirements` in `reset()` function (line ~295)
- [ ] 1.5 Add `requirements: BackendRequirements | null` to return type in `types.ts`
- [ ] 1.6 Write unit test: requirements available after ANALYZING stage completes
- [ ] 1.7 Write unit test: requirements cleared on reset()

## Phase 2: Component Wiring (RA-002)

- [ ] 2.1 Import `CredentialsModal` in `BuilderPage.tsx`
- [ ] 2.2 Add `showCredentialsModal` state in `BuilderPage.tsx`
- [ ] 2.3 Destructure `requirements` and `result` from `useBackendCreation` hook
- [ ] 2.4 Add effect to close BackendCreationModal and open CredentialsModal when `backendStage === 'complete'`
- [ ] 2.5 Render `CredentialsModal` conditionally with `result` prop
- [ ] 2.6 Write unit test: modal transition fires on COMPLETE stage

## Phase 3: Apply Action (RA-003, RA-005)

- [ ] 3.1 Add `isApplying` state in `BuilderPage.tsx`
- [ ] 3.2 Import `adaptProject` from `services/adapter` in `BuilderPage.tsx`
- [ ] 3.3 Implement `handleApplyBackend()` handler with guard clause for missing `result`/`requirements`
- [ ] 3.4 Call `adaptProject({ files, backendResult, requirements })` in handler
- [ ] 3.5 Handle successful adaptation: `setCurrentFiles()`, remount WebContainer
- [ ] 3.6 Update CredentialsModal props interface: add `onApply?: () => void`
- [ ] 3.7 Update CredentialsModal props interface: add `isApplying?: boolean`
- [ ] 3.8 Add "Apply to Project" button to CredentialsModal footer
- [ ] 3.9 Disable button and show spinner when `isApplying === true`
- [ ] 3.10 Wire `handleApplyBackend` to CredentialsModal `onApply` prop
- [ ] 3.11 Write unit test: Apply button renders with `onApply` prop
- [ ] 3.12 Write unit test: Apply button disabled when `isApplying === true`

## Phase 4: Edge Cases & Error Handling (RA-004, RA-006)

- [ ] 4.1 Handle `adaptProject()` returning `skipped: true` - show info toast
- [ ] 4.2 Wrap apply handler in try/catch for error recovery
- [ ] 4.3 Display error toast on WebContainer remount failure
- [ ] 4.4 Reset `isApplying` to `false` in finally block
- [ ] 4.5 Add `aria-busy` attribute to Apply button for accessibility
- [ ] 4.6 Write unit test: skipped adaptation shows toast, no remount
- [ ] 4.7 Write unit test: mount failure shows error toast

## Phase 5: State Clearing (RA-007)

- [ ] 5.1 Call `resetBackend()` in `handleNewMessage` before generation starts
- [ ] 5.2 Close CredentialsModal if open when new generation starts
- [ ] 5.3 Write unit test: new generation clears backend state

## Phase 6: Integration Tests

- [ ] 6.1 E2E test: create backend -> see CredentialsModal -> apply -> preview works
- [ ] 6.2 E2E test: error recovery - mount fails, can retry
- [ ] 6.3 E2E test: edge case - requirements null but result exists
- [ ] 6.4 E2E test: multiple rapid clicks on Apply button
