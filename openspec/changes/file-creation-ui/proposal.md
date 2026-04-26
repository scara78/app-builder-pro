# Proposal: File Creation UI & File Selection

## Intent
FileExplorer is read-only — dead "New File" button, no folder creation, no file selection, no context menu. Users cannot create files/folders or click to open files in CodeEditor. This change makes FileExplorer a fully interactive IDE component.

## Scope

### In Scope
- Wire up "New File" (Plus) button → inline input at root level
- Add "New Folder" button (FolderPlus icon) in explorer header
- Inline editing UX: auto-focused text input in tree, Enter confirms, Escape cancels
- Right-click context menu on folders: "New File" / "New Folder" options
- `WCM.mkdir(path, { recursive })` with `_isWriting` flag for circular protection
- `useFileTree.createFile(parentPath, name)` and `useFileTree.createFolder(parentPath, name)` methods
- File name validation (reject empty, `/`, duplicates in same folder)
- `onFileSelect(path)` callback prop on FileExplorer
- `selectedPath` prop for visual highlight of active file
- Wire BuilderPage: FileExplorer click → setActiveFile → CodeEditor shows content
- File item click handler (currently only folders have onClick for expand/collapse)
- Selected file CSS highlight style

### Out of Scope
- File/folder deletion (`rm`) — separate change
- File/folder rename — separate change
- Drag-and-drop file reordering
- File move operations
- Multi-file selection

## Capabilities

### New Capabilities
- `file-creation-ui`: Inline file/folder creation from FileExplorer header and context menu, with validation and WebContainer mkdir+writeFile integration

### Modified Capabilities
- `integrated-file-explorer`: Adding file selection (onFileSelect), selectedPath highlight, file item click handler, and creation callbacks — requirements change from read-only to interactive

## Approach
VS Code-like inline editing pattern:
1. Header buttons (New File / New Folder) → inject inline `<input>` at root tree level, auto-focused
2. Right-click folder → context menu → "New File"/"New Folder" → inline input inside that folder
3. On confirm: `useFileTree.createFile(parentPath, name)` → `WCM.mkdir(parentPath, { recursive: true })` then `WCM.writeFile(fullPath, '')` → watcher triggers refresh → new item appears
4. Creation state survives watcher refresh via `creatingPath` ref in useFileTree — if tree refreshes mid-creation, inline input persists
5. File selection: click file item → `onFileSelect(path)` → BuilderPage sets `activeFile` by finding file in `currentFiles` or reading from WCM → CodeEditor loads content
6. `WCM.mkdir()` wraps `_isWriting` flag same as `writeFile()` to prevent watcher circular refresh

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/components/editor/FileExplorer.tsx` | Modified | Add onFileSelect/selectedPath props, inline input, context menu, file click, new folder button |
| `src/components/editor/FileExplorer.css` | Modified | Selected item highlight, inline input, context menu styles |
| `src/hooks/useFileTree.ts` | Modified | Add createFile/createFolder methods, creatingPath ref |
| `src/services/webcontainer/WebContainerManager.ts` | Modified | Add mkdir() with _isWriting flag |
| `src/pages/BuilderPage.tsx` | Modified | Wire onFileSelect to setActiveFile, pass selectedPath to FileExplorer |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Watcher refresh destroys inline input mid-creation | Med | `creatingPath` state in useFileTree — FileExplorer re-renders inline input even after tree refresh |
| mkdir triggers watcher causing double refresh | Med | Reuse `_isWriting` flag pattern from writeFile — watcher skips refresh when flag is true |
| Context menu conflict with browser right-click | Low | `e.preventDefault()` on contextmenu event + portal-rendered menu |
| Race: user creates file while AI is generating | Low | Disable creation buttons during `builderState === 'generating'` |

## Rollback Plan
All changes are additive (new props, new methods). Rollback = remove new props from BuilderPage, remove new methods from useFileTree/WCM. FileExplorer gracefully ignores missing callbacks — no breaking changes to existing functionality.

## Dependencies
- WebContainer API `fs.mkdir(path, { recursive: true })` — available in current API
- Existing `_isWriting` / `isWriting` pattern in WebContainerManager

## Success Criteria
- [ ] Clicking "New File" button shows inline input at root, Enter creates file in WebContainer
- [ ] Clicking "New Folder" button shows inline input at root, Enter creates folder in WebContainer
- [ ] Right-click folder → context menu → "New File"/"New Folder" → inline input inside that folder
- [ ] Escape cancels inline input, no file created
- [ ] Empty names, names with `/`, duplicate names are rejected with user feedback
- [ ] Clicking a file in FileExplorer opens it in CodeEditor
- [ ] Selected file is visually highlighted in FileExplorer
- [ ] Watcher refresh does not destroy inline input during creation
