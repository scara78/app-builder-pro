# Error Handling System Specification

## Purpose
Provide comprehensive error handling through Error Boundaries, user-facing error UI in BuilderPage, and warning reporting from codeParser to ensure the system fails gracefully and provides actionable feedback.

## Requirements

### Requirement: Error Boundary MUST wrap the application
The system SHALL wrap the entire React application in main.tsx with an Error Boundary component to catch render errors at the root level.

#### Scenario: Error Boundary catches render error
- GIVEN an error thrown during component render
- WHEN the Error Boundary wraps the component
- THEN the error is caught and fallback UI is displayed

#### Scenario: Error Boundary displays fallback UI
- GIVEN Error Boundary caught an error
- WHEN render fails
- THEN a user-friendly error message is displayed with retry option

### Requirement: BuilderPage MUST show error UI on failure
The system SHALL display an error state UI in BuilderPage when the build process fails, including the error message and a way to retry.

#### Scenario: BuilderPage shows error state
- GIVEN builderState is set to 'error'
- WHEN BuilderPage renders
- THEN error message from catch block is displayed to user

#### Scenario: User retries after error
- GIVEN error state is displayed
- WHEN user clicks retry button
- THEN builderState resets to 'idle' and user can resend prompt

### Requirement: codeParser MUST report warnings
The system SHALL return a warnings array from parseAIResponse containing details about parsing issues (missing file markers, unclosed code blocks, empty files), instead of silently failing.

#### Scenario: codeParser returns warnings for missing file markers
- GIVEN AI response without "File:" markers
- WHEN parseAIResponse is called
- THEN it returns warnings array with "Missing file markers" message

#### Scenario: codeParser returns warnings for unclosed code blocks
- GIVEN AI response with unclosed triple backticks
- WHEN parseAIResponse is called
- THEN it returns warnings array with "Unclosed code block" message

#### Scenario: codeParser returns warnings for empty files
- GIVEN AI response with File marker but empty content
- WHEN parseAIResponse is called
- THEN it returns warnings array with "Empty file content" message

#### Scenario: codeParser succeeds with valid input
- GIVEN AI response with proper File markers and closed code blocks
- WHEN parseAIResponse is called
- THEN it returns files array and empty warnings array

### Requirement: Error Messages MUST NOT Contain Tokens or Keys
The system SHALL ensure that error messages, logs, and user-facing error UI do not expose authentication tokens, API keys, or other sensitive credentials.

#### Scenario: API errors hide credentials
- GIVEN API request fails with error containing credential
- WHEN error is logged or displayed
- THEN any API key, token, or secret is redacted or masked (e.g., "API key: ****")

#### Scenario: Network errors sanitize URLs with tokens
- GIVEN network error containing URL with query parameter token
- WHEN error is caught and displayed
- THEN URL is sanitized to remove or mask the token parameter

#### Scenario: Error boundary shows safe message
- GIVEN error boundary catches error with sensitive data
- WHEN fallback UI is rendered
- THEN only generic "Something went wrong" message is shown, not the full error details

#### Scenario: Console logs sanitize credentials
- GIVEN code that logs errors for debugging
- WHEN error containing credentials is logged
- THEN credentials are replaced with placeholder text like "[REDACTED]"

#### Scenario: Stack traces sanitized in production
- GIVEN production environment
- WHEN error with stack trace occurs
- THEN stack trace does not include file paths that reveal API keys or tokens in URL parameters
