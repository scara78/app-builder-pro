# Design: backend-integration-wire-up

## Technical Approach

Wire existing SupabaseFrontendAdapter into UI by: (1) exposing `requirements` from `useBackendCreation`, (2) rendering `CredentialsModal` when pipeline completes, (3) adding "Apply to Project" button that triggers adaptation and WebContainer remount.

---

## Architecture Decisions

### Decision: Where `requirements` State Lives

| Option | Tradeoff | Decision |
|--------|----------|----------|
| In `useBackendCreation` hook | Single source of truth, coupled with pipeline | **CHOSEN** |
| Separate hook in BuilderPage | More flexible, but risks desync | Rejected |
| Context/Provider | Over-engineering for single consumer | Rejected |

**Rationale**: Requirements detected during ANALYZING stage, naturally coupled with pipeline result. Single source of truth prevents desync between `result` and `requirements`.

---

### Decision: `isApplying` State Location

| Option | Tradeoff | Decision |
|--------|----------|----------|
| In `BuilderPage.tsx` as local state | Page orchestrates multiple concerns | **CHOSEN** |
| In `CredentialsModal` | Modal would need parent callbacks anyway | Rejected |
| In `useBackendCreation` hook | Hook shouldn't know about WebContainer | Rejected |

**Rationale**: Apply flow orchestrates multiple concerns (adapter + WebContainer), belongs in page-level component. Modal should remain presentational.

---

### Decision: Clear State on New Generation

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Call `resetBackend()` in `handleNewMessage` | Explicit, at point of change | **CHOSEN** |
| Effect watching `currentFiles` | Reactive, but fires on every file change | Rejected |
| Separate `clearBackend()` action | More granular, but duplicates reset logic | Rejected |

**Rationale**: Explicit call at point of state change is clearest. Effect would fire on every file change, causing unnecessary resets.

---

### Decision: Modal Transition Flow

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Close BackendCreationModal, open CredentialsModal | Clear separation, follows existing pattern | **CHOSEN** |
| Same modal with different content | Less code, but conflates concerns | Rejected |
| Stack modals | Visual confusion | Rejected |

**Rationale**: Clear visual separation between pipeline progress and credentials review. Follows existing modal pattern in `BuilderPage.tsx`.

---

## Data Flow

```
User clicks "Create Backend"
    │
    ▼
useBackendCreation.createBackend(code)
    │──► ANALYZING: requirements = analyze(code)
    │──► GENERATING: migration = generate(requirements)
    │──► CREATING_PROJECT: project = createProject()
    │──► APPLYING_MIGRATION: applyMigration()
    │
    ▼
stage === COMPLETE
    │──► BackendCreationModal closes
    │──► CredentialsModal opens with result
    │
User clicks "Apply to Project"
    │
    ▼
handleApplyBackend()
    │──► isApplying = true
    │──► adapted = adaptProject({ files, backendResult, requirements })
    │
    ├──► if adapted.skipped: show toast, keep modal open
    │
    └──► else:
        │──► setCurrentFiles(adapted.files)
        │──► await mount(filesToTree(adapted.files))
        │──► await install()
        │──► await runDev()
        │──► isApplying = false
        │──► close CredentialsModal
```

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/backend/pipeline/useBackendCreation.ts` | Modify | Add `requirements` state (line ~95), store from ANALYZING (line ~185), return in output (line ~330) |
| `src/hooks/backend/pipeline/types.ts` | Modify | Add `requirements: BackendRequirements \| null` to return type interface |
| `src/pages/BuilderPage.tsx` | Modify | Add CredentialsModal import, state, handlers. Wire apply flow. Clear state on new generation |
| `src/components/backend/CredentialsModal.tsx` | Modify | Add `onApply` prop, `isApplying` prop, "Apply to Project" button |
| `src/components/backend/BackendCreationModal.tsx` | Modify | "View Credentials" button should trigger modal transition, not just close |
| `src/hooks/backend/pipeline/__tests__/useBackendCreation.test.ts` | Modify | Add tests for `requirements` exposure |
| `src/components/backend/__tests__/CredentialsModal.test.tsx` | Modify | Add tests for new `onApply` button |

---

## Interfaces / Contracts

### useBackendCreation Return Type Extension

```typescript
interface UseBackendCreationReturn {
  stage: PipelineStage;
  progress: number;
  isCreating: boolean;
  error: string | null;
  result: BackendCreationResult | null;
  requirements: BackendRequirements | null;  // NEW
  createBackend: (code: string, options?: BackendCreationOptions) => Promise<void>;
  retry: () => boolean;
  reset: () => void;
  abort: () => boolean;
}
```

### CredentialsModal Props Extension

```typescript
interface CredentialsModalProps {
  result: BackendCreationResult;
  onClose: () => void;
  onApply?: () => void;       // NEW - callback for Apply button
  isApplying?: boolean;       // NEW - disables button during operation
}
```

---

## Component Design

### useBackendCreation.ts Changes

1. **Add requirements state** (line ~95):
   ```typescript
   const [requirements, setRequirements] = useState<BackendRequirements | null>(null);
   ```

2. **Store from ANALYZING stage** (line ~185):
   ```typescript
   requirements = await analyzer.analyze(code);
   if (signal.aborted) throw new Error('Pipeline aborted');
   setRequirements(requirements);  // NEW
   ```

3. **Return in output** (line ~330):
   ```typescript
   return {
     stage,
     progress,
     isCreating,
     error,
     result,
     requirements,  // NEW
     createBackend,
     retry,
     reset,
     abort,
   };
   ```

4. **Clear in reset** (line ~295):
   ```typescript
   setRequirements(null);  // NEW
   ```

### BuilderPage.tsx Changes

1. **Import CredentialsModal**:
   ```typescript
   import CredentialsModal from '../components/backend/CredentialsModal';
   import { adaptProject } from '../services/adapter';
   ```

2. **Add state**:
   ```typescript
   const [showCredentialsModal, setShowCredentialsModal] = useState(false);
   const [isApplying, setIsApplying] = useState(false);
   ```

3. **Destructure requirements from hook**:
   ```typescript
   const { stage, result, requirements, ... } = useBackendCreation();
   ```

4. **Add apply handler**:
   ```typescript
   const handleApplyBackend = useCallback(async () => {
     if (!result || !requirements || isApplying) return;
     
     setIsApplying(true);
     try {
       const adapted = adaptProject({
         files: currentFiles,
         backendResult: result,
         requirements,
       });
       
       if (adapted.skipped) {
         // Show toast - adapter decided no transformation needed
         toast.info(adapted.reason || 'No backend integration needed');
         return;
       }
       
       setCurrentFiles(adapted.files);
       const tree = filesToTree(adapted.files);
       await mount(tree);
       await install();
       await runDev(undefined, (url) => setPreviewUrl(url));
       
       setShowCredentialsModal(false);
     } catch (err) {
       toast.error(`Failed to apply: ${err instanceof Error ? err.message : 'Unknown error'}`);
     } finally {
       setIsApplying(false);
     }
   }, [result, requirements, currentFiles, isApplying, mount, install, runDev]);
   ```

5. **Modal transition effect**:
   ```typescript
   useEffect(() => {
     if (backendStage === 'complete' && !isBackendModalOpen) {
       // Pipeline completed while modal was closed (edge case)
     } else if (backendStage === 'complete' && isBackendModalOpen) {
       setIsBackendModalOpen(false);
       setShowCredentialsModal(true);
     }
   }, [backendStage, isBackendModalOpen]);
   ```

6. **Clear state on new generation** (in `handleNewMessage`):
   ```typescript
   const handleNewMessage = useCallback(async (content: string) => {
     // Clear previous backend state
     resetBackend();  // NEW
     
     // ... existing logic
   }, [resetBackend, ...]);
   ```

7. **Render CredentialsModal**:
   ```tsx
   {showCredentialsModal && result && (
     <CredentialsModal
       result={result}
       onClose={() => setShowCredentialsModal(false)}
       onApply={handleApplyBackend}
       isApplying={isApplying}
     />
   )}
   ```

### CredentialsModal.tsx Changes

1. **Update props interface**:
   ```typescript
   interface CredentialsModalProps {
     result: BackendCreationResult;
     onClose: () => void;
     onApply?: () => void;
     isApplying?: boolean;
   }
   ```

2. **Add Apply button in footer** (after Done button):
   ```tsx
   <div className="modal-footer">
     {onApply && (
       <button
         className="btn-accent"
         onClick={onApply}
         disabled={isApplying}
         data-testid="btn-apply"
         aria-busy={isApplying}
       >
         {isApplying ? (
           <>
             <Loader2 size={16} className="icon-spin" />
             Applying...
           </>
         ) : (
           'Apply to Project'
         )}
       </button>
     )}
     <button className="btn-secondary" onClick={onClose} data-testid="btn-done">
       Done
     </button>
   </div>
   ```

---

## Error Handling Strategy

| Error Case | Handling |
|------------|----------|
| Adaptation failure | `try/catch` in `handleApplyBackend`, toast error message |
| WebContainer remount failure | Same `try/catch`, error toast, `isApplying` reset |
| Missing requirements | Guard clause: `if (!requirements) return` |
| Multiple apply clicks | `isApplying` state prevents re-entry |
| User closes modal during apply | Operation continues, result still applied |

---

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `useBackendCreation` returns `requirements` | Mock analyzer, verify stored and returned |
| Unit | CredentialsModal renders Apply button | Render with `onApply`, verify button exists |
| Unit | Apply button disabled when `isApplying` | Render with `isApplying=true`, check `disabled` |
| Integration | Full apply flow: click → adapt → remount | Mock adapter + WebContainer, verify sequence |
| Integration | Modal transition on COMPLETE | Simulate pipeline completion, verify modals swap |
| Integration | State cleared on new generation | Set backend state, trigger generation, verify cleared |

---

## Migration / Rollout

**No migration required.** All changes are additive.

**Rollback Plan:**
1. Revert `useBackendCreation.ts` - remove `requirements` state and return
2. Revert `BuilderPage.tsx` - remove CredentialsModal rendering and apply handler
3. Revert `CredentialsModal.tsx` - remove `onApply` prop and Apply button
4. All changes are additive - removal has no side effects

---

## Open Questions

- [x] ~~Should we show a toast when adaptation is skipped?~~ **Confirmed**: Yes, per spec RA-004
- [x] ~~What happens if user closes modal during apply operation?~~ **Confirmed**: Operation continues in background, per spec edge cases
- [ ] None remaining

---

**Status**: DESIGN_CREATED
**Created**: 2026-04-19
**Next**: sdd-tasks phase
