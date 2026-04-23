# TDD Workflow

## Overview
This document describes the Test-Driven Development workflow for the app-builder-pro project.

## Pre-commit Hooks

The project uses Husky to enforce pre-commit checks. Before any commit, the following validations run automatically:

1. **TypeScript Type Check** - `npm run typecheck`
   - Runs `tsc --noEmit` to verify type safety
   - Fails if any TypeScript errors exist

2. **Unit Tests** - `npm run test:run -- --bail`
   - Runs all vitest tests in non-interactive mode
   - `--bail` flag stops on first failure for fast feedback

## Hook Configuration

The pre-commit hook is located at `.husky/pre-commit`:

```bash
npm run typecheck
npm run test:run -- --bail
```

### Skipping Hooks (Emergency Only)

If you MUST bypass hooks (emergency hotfix):

```bash
git commit --no-verify -m "hotfix: critical bug"
```

> ⚠️ **Warning**: Use `--no-verify` sparingly. It exists for emergencies only.

## Available Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `typecheck` | `tsc --noEmit` | Type checking |
| `test` | `vitest` | Watch mode tests |
| `test:run` | `vitest run` | CI-mode tests |
| `lint` | `eslint .` | Lint all files |
| `lint:fix` | `eslint . --fix` | Lint and auto-fix |
| `format` | `prettier --write "src/**/*.{ts,tsx,css}"` | Format source files |
| `format:check` | `prettier --check "src/**/*.{ts,tsx,css}"` | Check formatting |
| `dev` | `vite` | Development server |
| `build` | `tsc && vite build` | Production build |

## Running Tests Locally

```bash
# Watch mode (recommended during development)
npm test

# CI mode (same as pre-commit)
npm run test:run

# With coverage
npm run test:run -- --coverage
```

## Notes

- ESLint IS configured — run `npm run lint` to check, `npm run lint:fix` to auto-fix
- Prettier IS configured — run `npm run format` to format, `npm run format:check` to verify
- `@testing-library/user-event` is available for user interaction simulation (prefer over `fireEvent`)
- Coverage thresholds are enforced in `vitest.config.ts`: 80% statements, 70% branches, 70% functions
- CI runs tests with coverage on both push and pull requests to main
- DOMPurify types were added to fix TypeScript errors
- All tests must pass before committing