# Tasks: Pre-Production Hardening

## Wave 1: Test Infrastructure

- [x] 1.1 Install vitest, @testing-library/react, @vitest/coverage-v8, jsdom in package.json
- [x] 1.2 Create vitest.config.ts with jsdom environment
- [x] 1.3 Add test script to package.json: "test": "vitest", "test:run": "vitest run"
- [x] 1.4 Create test/setup.ts for mocks (localStorage, sessionStorage, fetch)

## Wave 2: Quick Fixes (1-liners)

- [x] 2.0 Install and configure TailwindCSS v4 with @tailwindcss/vite plugin
- [x] 2.1 Fix SettingsModal.tsx line 84 — remove backslash in template literal className
- [ ] 2.2 Change prompts.ts line 3 — "Tailwind CSS" → "plain CSS"
- [x] 2.3 Add CSP meta tag to index.html

## Wave 3: Core Pipeline Refactor

- [x] 3.1 Create src/components/common/AppErrorBoundary.tsx with retry button
- [x] 3.2 Wrap App in src/main.tsx with AppErrorBoundary
- [x] 3.3 Modify codeParser.ts — return `{ message, files, warnings: string[] }` interface
- [x] 3.4 Extract handleNewMessage to useAIBuilder hook in src/hooks/
- [x] 3.5 Extract WebContainer logic to useWebContainer hook in src/hooks/

## Wave 4: AIOrchestrator Sanitization

- [x] 4.1 Update SettingsContext.tsx — localStorage → sessionStorage
- [x] 4.2 Remove console.log with API keys in SettingsContext.tsx (no había ninguno)
- [x] 4.3 Add input sanitization to AIOrchestrator.ts prompts
- [x] 4.4 Fix types in AIOrchestrator.ts ( correcto tipos de Gemini API)

## Wave 5: Security & Integration

- [x] 5.1 Add rehype-sanitize plugin to ChatPanel.tsx ReactMarkdown
- [x] 5.2 Add sandbox="allow-scripts" to PreviewPanel.tsx iframe
- [x] 5.3 Add error state handling to PreviewPanel.tsx
- [x] 5.4 Pass currentFiles from BuilderPage to FileExplorer.tsx as props
- [x] 5.5 Pass wc instance logs from BuilderPage to ConsolePanel.tsx as props

## Wave 6: WebContainer Hardening

- [x] 6.1 Add null check + boot() in WebContainerManager.ts getInstance()
- [x] 6.2 Add null check + boot() in mount() method (ya estaba)
- [x] 6.3 Add null check + boot() in writeFile() method
- [x] 6.4 Add null check + boot() in readFile() method (nuevo método)

## Wave 7: Testing & Verification

- [x] 7.1 Write unit test: codeParser warnings array with missing markers
- [x] 7.2 Write unit test: verify prompts.ts has no "Tailwind" string
- [x] 7.3 Write unit test: SettingsContext sessionStorage mock validation
- [x] 7.4 Write integration test: AIOrchestrator with mocked Gemini
- [x] 7.5 Write component test: ChatPanel XSS sanitize script tag
- [x] 7.6 Write component test: PreviewPanel sandbox attribute exists
- [x] 7.7 Run vitest run and verify all tests pass