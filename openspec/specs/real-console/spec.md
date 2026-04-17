# Real Console Specification

## Purpose
Connect ConsolePanel to WebContainer log streams instead of displaying hardcoded mock logs, providing users with actual runtime output from their generated applications.

## Requirements

### Requirement: ConsolePanel MUST display real WebContainer logs
The system SHALL show actual logs from WebContainer process including stdout, stderr, npm install output, and Vite server messages.

#### Scenario: Console shows npm install output
- GIVEN npm install is running in WebContainer
- WHEN install completes
- THEN ConsolePanel displays install progress and results

#### Scenario: Console shows Vite server output
- GIVEN Vite dev server is running in WebContainer
- WHEN server starts or recompiles
- THEN ConsolePanel displays server messages

#### Scenario: Console shows runtime errors
- GIVEN generated app throws runtime error
- WHEN error occurs
- THEN ConsolePanel displays error in red/warning style

### Requirement: ConsolePanel MUST stream logs in real-time
The system SHALL update the console display as logs arrive from WebContainer, not just after process completes.

#### Scenario: Logs stream during install
- GIVEN npm install is running
- WHEN each package installs
- THEN ConsolePanel updates in real-time

#### Scenario: Console handles rapid log output
- GIVEN WebContainer produces many logs quickly
- WHEN logs arrive
- THEN ConsolePanel updates without freezing UI

### Requirement: ConsolePanel MUST have clear and actions
The system SHALL provide clear button to remove all logs and close button to minimize the console panel.

#### Scenario: Clear button removes all logs
- GIVEN ConsolePanel has logs displayed
- WHEN user clicks clear button
- THEN all logs are removed

#### Scenario: Close button minimizes console
- GIVEN ConsolePanel is visible
- WHEN user clicks close button
- THEN console panel is hidden or minimized
