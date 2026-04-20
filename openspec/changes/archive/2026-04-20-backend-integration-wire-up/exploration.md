# Exploration: backend-integration-wire-up

## Summary

Wire up the existing SupabaseFrontendAdapter into the UI so that when a user creates a backend, the generated React code receives the Supabase credentials automatically.

---

## Current State

### Backend Creation Flow (Working)

1. **User triggers backend creation**: TopBar `btn-create-backend` → `BuilderPage.handleOpenBackendModal`
2. **Modal opens**: `BackendCreationModal` shows pipeline progress
3. **Pipeline executes**: `useBackendCreation.createBackend()` runs 4 stages (ANALYZING → GENERATING → CREATING_PROJECT → APPLYING_MIGRATION)
4. **Result available**: `result` contains `{ projectUrl, anonKey, projectName, migrationName }`

### What's Missing (The Gaps)

| Gap | Evidence | Impact |
|-----|----------|--------|
| **GAP 1**: `SupabaseFrontendAdapter` NEVER called | `BuilderPage.tsx` imports 0 adapter-related modules. No call to `adaptProject()` anywhere | Credentials exist but aren't injected into code |
| **GAP 2**: `useBackendCreation` doesn't expose `requirements` | Hook line 95: `const [result, setResult]` but no `requirements` in return object (line 324-336) | Can't call adapter without detected requirements |
| **GAP 3**: `CredentialsModal` never rendered | `BuilderPage.tsx` imports `BackendCreationModal` but NOT `CredentialsModal`. No state to show it. | User can't see/apply credentials after creation |
| **GAP 4**: No "Apply Backend" flow | `BackendCreationModal` has "View Credentials" button (line 202-204) but it calls `onClose` - no follow-up action | No way to remount WebContainer with adapted files |

---

## Affected Areas

### Primary Files (Must Change)

| File | Why Affected |
|------|--------------|
| `src/pages/BuilderPage.tsx` | Main orchestrator - needs to import adapter, manage requirements state, render CredentialsModal, handle "Apply Backend" |
| `src/hooks/backend/pipeline/useBackendCreation.ts` | Must expose `requirements` alongside `result` for adapter integration |
| `src/components/backend/BackendCreationModal.tsx` | "View Credentials" button needs different handler for COMPLETE stage |

### Secondary Files (May Change)

| File | Why Affected |
|------|--------------|
| `src/components/backend/CredentialsModal.tsx` | May need "Apply to Project" button if not already present |
| `src/hooks/useWebContainer.ts` | May need a way to remount with new files (already has `mount()`) |

### Integration Points (No Changes Expected)

| File | Role |
|------|------|
| `src/services/adapter/index.ts` | Public API with `adaptProject()` factory - ready to use |
| `src/services/adapter/SupabaseFrontendAdapter.ts` | Core logic - already implemented |
| `src/services/analyzer/BackendRequirementsAnalyzer.ts` | Returns `BackendRequirements` - already used in pipeline |

---

## Integration Points Identified

### 1. Where should `adaptProject()` be called?

**Option A**: In `CredentialsModal` when user clicks "Apply"
- Pro: User has explicit control
- Con: Modal needs access to `currentFiles`, `requirements`

**Option B**: In `BuilderPage` after backend creation completes
- Pro: Centralized state management
- Con: May happen before user is ready

**Option C**: In `BuilderPage` on explicit "Apply Backend" button click
- Pro: Clear user intent, proper error handling
- Con: Additional UI state

**Recommended**: Option C - Add "Apply Backend" button in `CredentialsModal` that triggers adaptation in `BuilderPage`.

### 2. Data Flow Required

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. useBackendCreation.createBackend(code)                          │
│    └─► stores requirements (INTERNAL - needs exposure)              │
│    └─► returns result { projectUrl, anonKey, ... }                  │
├─────────────────────────────────────────────────────────────────────┤
│ 2. BuilderPage.handleApplyBackend()                                 │
│    └─► adaptProject({                                              │
│          files: currentFiles,                                       │
│          backendResult: result,                                     │
│          requirements: requirements ←── MISSING! Must expose        │
│        })                                                           │
│    └─► setCurrentFiles(adaptedFiles)                               │
│    └─► mount(filesToTree(adaptedFiles)) ←── REMOUNT WebContainer    │
└─────────────────────────────────────────────────────────────────────┘
```

### 3. State Management Needed

In `BuilderPage.tsx`:
```tsx
// New state
const [backendRequirements, setBackendRequirements] = useState<BackendRequirements | null>(null);
const [showCredentialsModal, setShowCredentialsModal] = useState(false);

// From useBackendCreation (extended)
const { stage, result, requirements, ... } = useBackendCreation();

// Handler for "Apply Backend"
const handleApplyBackend = useCallback(async () => {
  if (!result || !requirements) return;
  
  const adapted = adaptProject({
    files: currentFiles,
    backendResult: result,
    requirements,
  });
  
  if (!adapted.skipped) {
    setCurrentFiles(adapted.files);
    await mount(filesToTree(adapted.files));
    await install();
    await runDev(undefined, (url) => setPreviewUrl(url));
  }
}, [currentFiles, result, requirements, mount, install, runDev]);
```

---

## Edge Cases to Handle

| Edge Case | Current Behavior | Required Handling |
|-----------|------------------|-------------------|
| User clicks "Apply Backend" multiple times | Would remount each time | Add `isApplying` state, disable button during operation |
| Backend creation fails | Shows error in modal, retry available | Don't enable "Apply" button, keep error state |
| Generated code doesn't need backend (no entities/auth) | N/A | `adaptProject()` returns `skipped: true` with reason - show toast |
| Adaptation fails (file system error) | N/A | Try/catch around `adaptProject()`, show error toast |
| WebContainer already running | Running state | Stop current dev server before remount? Or just mount over? |
| User generates new code after backend creation | Old backend result persists | Clear `result` and `requirements` when new code generated |

---

## Existing Patterns

### useWebContainer Pattern
```tsx
// Already supports remounting
const { mount, install, runDev } = useWebContainer();

// Usage in handleNewMessage:
await mount(tree);
await install();
await runDev(undefined, (url) => setPreviewUrl(url));
```

### useBackendCreation Pattern
```tsx
// Returns state and actions
const {
  stage,
  progress,
  isCreating,
  error,
  result,        // ← BackendCreationResult
  // requirements, ← NOT EXPOSED (gap)
  createBackend,
  retry,
  reset,
} = useBackendCreation();
```

### Modal Pattern
```tsx
// SettingsModal - conditionally rendered
{isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}

// BackendCreationModal - conditionally rendered
{isBackendModalOpen && <BackendCreationModal ... />}
```

---

## Approaches

### Approach 1: Minimal Changes (Recommended)

**Description**: Extend `useBackendCreation` to expose `requirements`, add `CredentialsModal` rendering, implement "Apply Backend" handler in `BuilderPage`.

**Changes**:
1. `useBackendCreation.ts`: Add `requirements` to return object (store from stage 1)
2. `BuilderPage.tsx`: Import `CredentialsModal`, add `showCredentialsModal` state, render modal when `stage === COMPLETE`
3. `BuilderPage.tsx`: Add `handleApplyBackend()` that calls `adaptProject()` and remounts
4. `CredentialsModal.tsx`: Add "Apply to Project" button (or handle from parent)

**Pros**:
- Minimal surface area changes
- Follows existing patterns
- Easy to test incrementally

**Cons**:
- Multiple files touched
- State management gets more complex

**Effort**: Low

---

### Approach 2: New Hook for Apply Flow

**Description**: Create `useApplyBackend()` hook that encapsulates the adaptation and remounting logic.

**Changes**:
1. Create `src/hooks/backend/useApplyBackend.ts`
2. `useBackendCreation.ts`: Expose `requirements`
3. `BuilderPage.tsx`: Use new hook, render `CredentialsModal`
4. `CredentialsModal.tsx`: Wire up apply button

**Pros**:
- Clean separation of concerns
- Reusable logic
- Easier to test in isolation

**Cons**:
- More files to create
- May be over-engineering for current scope

**Effort**: Medium

---

### Approach 3: Unified Backend Creation + Apply Hook

**Description**: Extend `useBackendCreation` to include apply functionality, returning `applyBackend()` action.

**Changes**:
1. `useBackendCreation.ts`: Add `requirements` state, add `applyBackend(files, mount)` action
2. `BuilderPage.tsx`: Use extended hook, render `CredentialsModal`
3. `CredentialsModal.tsx`: Call `applyBackend()` from parent

**Pros**:
- Single hook for entire backend flow
- State colocation (result + requirements)

**Cons**:
- Hook becomes larger
- Tight coupling with WebContainer mount logic

**Effort**: Medium

---

## Recommendation

**Approach 1: Minimal Changes** - Best balance of effort and correctness.

**Reasoning**:
- Follows existing patterns (modal state management, handler pattern)
- Doesn't require new abstractions
- Can evolve to Approach 2 if complexity grows
- Clear testing path: expose requirements → render modal → wire apply button

---

## Risks

1. **State synchronization**: `requirements` must stay in sync with `result` - if one is set, both should be set
2. **WebContainer remount race**: If user clicks apply while previous mount is in progress, could cause issues
3. **Error during remount**: Need to handle failures gracefully and provide user feedback
4. **Memory leak**: If component unmounts during async apply operation, need to abort

---

## Ready for Proposal

**Yes** - Exploration complete, clear integration points identified.

**Next Steps for Orchestrator**:
1. Ask user to confirm Approach 1
2. Proceed to `sdd-propose` phase
