# Test Infrastructure Specification

## Purpose
Enable Test-Driven Development (TDD) for App Builder Pro by providing a complete testing setup with Vitest, Testing Library, and defined test patterns per module.

## Requirements

### Requirement: Test Runner MUST be Vitest
The system SHALL run all unit and integration tests using Vitest as the test runner, ensuring compatibility with Vite 8.

#### Scenario: Vitest runs successfully
- GIVEN a React component with a simple function
- WHEN `npm test` is executed
- THEN Vitest runs and reports pass/fail status

#### Scenario: Vitest runs with coverage
- GIVEN package.json with @vitest/coverage-v8 installed
- WHEN `npm test -- --coverage` is executed
- THEN coverage report is generated with at least 80% coverage target

### Requirement: Testing Patterns MUST be defined per module
The system SHALL define specific testing patterns for each module: codeParser (pure function), AIOrchestrator (mocked GoogleGenerativeAI), WebContainerManager (mocked WebContainer API), SettingsContext (integration with renderHook), and UI components (component tests with @testing-library/react).

#### Scenario: codeParser tested as pure function
- GIVEN parseAIResponse function with sample AI response text
- WHEN test calls parseAIResponse(input)
- THEN it returns message and files array without any mocks

#### Scenario: AIOrchestrator tested with mocked Gemini SDK
- GIVEN AIOrchestrator.getInstance() with mocked @google/generative-ai
- WHEN generateApp is called
- THEN it returns mocked response without calling real API

#### Scenario: WebContainerManager tested with mocked WebContainer API
- GIVEN WebContainerManager with mocked @webcontainer/api
- WHEN mount and install are called
- THEN WebContainer API methods are called but no real container is spawned

#### Scenario: SettingsContext tested with renderHook
- GIVEN SettingsProvider wrapping a test component
- WHEN renderHook is used to test useSettings hook
- THEN the hook provides apiKey, modelId, setApiKey, setModelId

#### Scenario: ChatPanel tested with @testing-library/react
- GIVEN ChatPanel component with mock props
- WHEN rendered and user clicks send button
- THEN onSendMessage is called with input content

### Requirement: TDD Flow MUST be enabled
The system SHALL allow developers to write tests before code (RED), implement minimum code to pass (GREEN), and refactor while keeping tests green.

#### Scenario: TDD cycle completes
- GIVEN a failing test for a new feature
- WHEN minimum code is written to pass the test
- THEN test passes and can be refactored without breaking
