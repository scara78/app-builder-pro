# BDD Structure (Behavior-Driven Development)

This directory contains BDD tests following the **Given-When-Then (GWT)** pattern.

## Structure

```
features/
├── README.md                    # This file
├── security/                  # Security-related feature files
│   └── api-key-storage.feature
├── generation/                 # App generation features
│   └── app-generation.feature
└── step_definitions/           # Step definitions (for Cucumber.js)
    └── common.steps.ts
```

## GWT Pattern

Each feature file is written in **Gherkin** syntax:

- **Feature**: A business requirement
- **Scenario**: A specific case/example
- **Given**: Initial context/preconditions
- **When**: Action performed
- **Then**: Expected outcome

## Why BDD?

BDD bridges the gap between:
1. Technical tests (unit/integration)
2. Business requirements (features/stories)

## Test Framework

This project uses **vitest** with GWT-style comments. Full Cucumber.js integration is OPTIONAL.

The current approach:
- `describe()` becomes "Feature"
- `test()` or `it()` becomes "Scenario"
- Comments mark Given/When/Then sections inside tests

## Example Migration

See `sanitize.test.ts` for an example of GWT-style comments in vitest.

For full Cucumber.js integration, see `step_definitions/common.steps.ts`.