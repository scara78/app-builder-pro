# Backend Application Specification

## Purpose

User-initiated flow to apply Supabase credentials to generated React code. This capability bridges the gap between backend creation (CHANGE 4) and the frontend adapter (CHANGE 6), allowing users to see their generated app working with real Supabase backend.

---

## Requirements

### Requirement: RA-001 — Expose Requirements from Backend Creation Hook

The system **MUST** expose the detected `BackendRequirements` from the `useBackendCreation` hook so that the adapter can determine what transformations to apply.

- **GIVEN** the backend creation pipeline completes the ANALYZING stage (25%)
- **WHEN** the requirements are detected from the generated code
- **THEN** the hook **SHALL** store the `requirements` object in state
- **AND** the hook **SHALL** return `requirements` in its output object alongside `result`

#### Scenario: Requirements Available After Analysis

- **GIVEN** a user has generated code with entities (e.g., Todo, User)
- **WHEN** the backend creation pipeline runs and completes ANALYZING stage
- **THEN** the `requirements` object **MUST** be available in the hook's return value
- **AND** `requirements.entities` **MUST** contain the detected entity definitions

#### Scenario: Requirements Null When No Backend Needed

- **GIVEN** generated code contains no database patterns (no entities, no auth, no storage)
- **WHEN** the backend creation pipeline runs ANALYZING stage
- **THEN** `requirements` **MAY** be `null` or have empty arrays
- **AND** the adapter **SHALL** return `skipped: true` with appropriate reason

---

### Requirement: RA-002 — Render Credentials Modal on Backend Creation Complete

The system **MUST** display the `CredentialsModal` component when backend creation reaches the COMPLETE stage, allowing users to view and apply their credentials.

- **GIVEN** the backend creation pipeline reaches the COMPLETE stage
- **WHEN** the `result` object is populated with `{ projectUrl, anonKey, projectName, migrationName }`
- **THEN** the system **SHALL** close the `BackendCreationModal`
- **AND** the system **SHALL** open the `CredentialsModal` with the `result` data

#### Scenario: Modal Transition on Complete

- **GIVEN** user is viewing `BackendCreationModal` with pipeline progress
- **WHEN** pipeline reaches COMPLETE stage
- **THEN** `BackendCreationModal` **MUST** close
- **AND** `CredentialsModal` **MUST** open with `result` prop populated

#### Scenario: Credentials Displayed Correctly

- **GIVEN** `CredentialsModal` is rendered with a valid `result`
- **WHEN** the modal renders
- **THEN** the Project URL, Anon Key, Project Name, and Migration Name **MUST** be displayed
- **AND** the Anon Key **MUST** be masked by default with toggle visibility

---

### Requirement: RA-003 — Apply to Project Button Action

The system **MUST** provide an "Apply to Project" button in the CredentialsModal that triggers the backend adaptation flow when clicked.

- **GIVEN** the CredentialsModal is open with valid credentials
- **WHEN** the user clicks "Apply to Project" button
- **THEN** the system **SHALL** call `adaptProject()` with `{ files, backendResult, requirements }`
- **AND** the system **SHALL** set `isApplying` state to `true` during the operation

#### Scenario: Successful Apply Flow

- **GIVEN** user has generated code with backend requirements
- **WHEN** user clicks "Apply to Project" button
- **THEN** the adapter **MUST** transform the files by injecting Supabase client
- **AND** the WebContainer **MUST** remount with the adapted files
- **AND** the preview **MUST** show the working application

#### Scenario: Apply Button Disabled During Operation

- **GIVEN** the apply operation is in progress (`isApplying === true`)
- **WHEN** the user attempts to click the button again
- **THEN** the button **MUST** be disabled
- **AND** no additional apply operations **SHALL** be triggered

---

### Requirement: RA-004 — Handle Adaptation Skip Scenarios

The system **MUST** handle cases where the generated code doesn't need backend adaptation gracefully with user feedback.

- **GIVEN** the adapter returns `{ skipped: true, reason: string }`
- **WHEN** the user clicks "Apply to Project"
- **THEN** the system **SHALL** display an informative toast notification
- **AND** the system **SHALL NOT** remount the WebContainer
- **AND** the original files **MUST** remain unchanged

#### Scenario: No Backend Requirements Detected

- **GIVEN** generated code has no entities, auth patterns, or storage usage
- **WHEN** user clicks "Apply to Project"
- **THEN** a toast **MUST** display: "No backend integration needed for this project"
- **AND** the modal **MAY** remain open for user to copy credentials

#### Scenario: Skip Adaptation Flag Set

- **GIVEN** `skipAdaptation: true` is passed to the adapter config
- **WHEN** `adaptProject()` is called
- **THEN** the adapter **MUST** return the original files unchanged
- **AND** `skipped: true` with reason **MUST** be returned

---

### Requirement: RA-005 — Prevent Multiple Apply Clicks

The system **MUST** guard against race conditions when users click "Apply to Project" multiple times.

- **GIVEN** the apply operation is in progress
- **WHEN** the user clicks the button multiple times
- **THEN** only the first click **SHALL** trigger the operation
- **AND** subsequent clicks **MUST** be ignored

#### Scenario: Rapid Click Protection

- **GIVEN** user clicks "Apply to Project" button
- **WHEN** the operation is still in progress
- **THEN** `isApplying` state **MUST** be `true`
- **AND** the button **MUST** show a loading indicator
- **AND** the button **MUST** be disabled

---

### Requirement: RA-006 — Handle WebContainer Remount Failure

The system **MUST** handle failures during WebContainer remount after adaptation and provide user feedback.

- **GIVEN** the adapter successfully transforms files
- **WHEN** WebContainer remount fails (mount, install, or runDev error)
- **THEN** the system **SHALL** catch the error
- **AND** the system **SHALL** display an error toast with the failure reason
- **AND** the original (pre-adaptation) files **SHOULD** be preserved for recovery

#### Scenario: Mount Failure Recovery

- **GIVEN** adapted files are ready for remount
- **WHEN** `mount()` throws an error
- **THEN** an error toast **MUST** display the error message
- **AND** `isApplying` **MUST** be set to `false`
- **AND** the user **MAY** retry the apply operation

---

### Requirement: RA-007 — Clear State on New Code Generation

The system **MUST** clear backend-related state when the user generates new code to prevent stale data issues.

- **GIVEN** user has previously created a backend and applied credentials
- **WHEN** user generates new code via chat
- **THEN** the system **SHALL** clear `result` and `requirements` from `useBackendCreation`
- **AND** the CredentialsModal **MUST** close if open

#### Scenario: New Generation Resets State

- **GIVEN** backend creation result exists from previous operation
- **WHEN** user sends a new message to generate different code
- **THEN** `result` **MUST** be reset to `null`
- **AND** `requirements` **MUST** be reset to `null`
- **AND** any open modals **MUST** close

---

## Non-Functional Requirements

### NFR-001: Performance

- The "Apply to Project" operation **SHOULD** complete within 5 seconds for typical projects (< 50 files)
- WebContainer remount **SHOULD** show progress feedback during installation

### NFR-002: Error Handling

- All async operations in the apply flow **MUST** be wrapped in try/catch
- Error messages **MUST** be user-friendly (no raw stack traces)
- Errors **MUST** be logged to console for debugging

### NFR-003: Accessibility

- The "Apply to Project" button **MUST** have appropriate `aria-label`
- Loading state **MUST** announce changes to screen readers (`aria-busy`)
- Focus **MUST** be managed appropriately when modals open/close

---

## Edge Cases

| Edge Case | Expected Behavior |
|-----------|-------------------|
| Multiple rapid clicks on "Apply" | First click triggers, subsequent ignored while `isApplying === true` |
| Backend creation fails before apply | "Apply" button not rendered, error state shown |
| Adapter returns `skipped: true` | Toast notification shown, no remount, original files preserved |
| User generates new code after backend created | `result` and `requirements` cleared, modals closed |
| WebContainer remount fails | Error toast shown, `isApplying` reset, user can retry |
| `requirements` null but `result` exists | Apply button disabled or shows warning |
| User closes modal during apply operation | Operation continues in background, result still applied |

---

## Test Scenarios (MUST BE TESTED)

### Happy Path Tests

1. **Create Backend → Apply → Preview Works**
   - Generate code with entities
   - Create backend (complete all stages)
   - See CredentialsModal with credentials
   - Click "Apply to Project"
   - Verify preview shows adapted code with Supabase connected

2. **Credentials Modal Displays All Fields**
   - Verify Project URL, Anon Key (masked), Project Name, Migration Name visible
   - Verify Anon Key toggle works

### Error Path Tests

3. **Backend Creation Fails Before Apply**
   - Force error in CREATING_PROJECT stage
   - Verify "Apply" button not available
   - Verify error message displayed

4. **WebContainer Remount Failure**
   - Mock `mount()` to throw error
   - Verify error toast appears
   - Verify `isApplying` reset

5. **Adapter Returns Skipped**
   - Generate code without backend patterns
   - Create backend
   - Apply → verify toast "No backend integration needed"

### Edge Case Tests

6. **Multiple Rapid Clicks**
   - Simulate 5 rapid clicks on "Apply"
   - Verify only one operation executes
   - Verify button disabled during operation

7. **New Generation Clears State**
   - Create backend → Apply
   - Generate new code
   - Verify previous backend state cleared
   - Verify can create new backend

8. **Requirements Null Handling**
   - Force `requirements` to be null
   - Verify Apply button handles gracefully (disabled or warning)
