# Delta for Preview Sandbox

## MODIFIED Requirements

### Requirement: PreviewPanel iframe MUST have sandbox attribute
The system SHALL include sandbox="allow-scripts" attribute on the iframe to enable JavaScript while restricting other potentially dangerous behaviors.
(Previously: iframe had no sandbox attribute)

#### Scenario: Iframe has sandbox with scripts allowed
- GIVEN PreviewPanel renders in 'running' state
- WHEN iframe is created
- THEN iframe has sandbox="allow-scripts" attribute

#### Scenario: Sandbox prevents top-level navigation
- GIVEN sandbox="allow-scripts" (without allow-top-navigation)
- WHEN generated app tries top.location = ...
- THEN navigation is blocked

### Requirement: PreviewPanel MUST handle error state
The system SHALL display error state UI when builderState is 'error', not just show empty or loading states.
(Previously: Did not handle state==='error', only showed empty or loading)

#### Scenario: Error state shows message
- GIVEN builderState is 'error'
- WHEN PreviewPanel renders
- THEN error message is displayed to user

#### Scenario: Error state allows retry
- GIVEN builderState is 'error'
- WHEN user clicks retry button
- THEN builderState resets and user can resubmit

### Requirement: PreviewPanel MUST handle all builder states
The system SHALL explicitly handle each BuilderState: 'idle', 'generating', 'installing', 'running', 'error'.
(Previously: Some states handled implicitly, error not handled)

#### Scenario: Idle state shows empty state
- GIVEN builderState is 'idle'
- WHEN PreviewPanel renders
- THEN "Your app will appear here" message displays

#### Scenario: Generating state shows loading
- GIVEN builderState is 'generating'
- WHEN PreviewPanel renders
- THEN "Writing Code..." message displays

#### Scenario: Installing state shows loading
- GIVEN builderState is 'installing'
- WHEN PreviewPanel renders
- THEN "Installing Dependencies..." message displays

#### Scenario: Running state shows iframe
- GIVEN builderState is 'running' and url exists
- WHEN PreviewPanel renders
- THEN iframe displays with url

## ADDED Requirements

### Requirement: iframe MAY have allow-same-origin for some operations
The system MAY include allow-same-origin if needed for localStorage access in generated apps, but only after security review.
(Previously: No sandbox at all)

#### Scenario: allow-same-origin considered carefully
- GIVEN security review determines need
- WHEN iframe is created
- THEN sandbox includes allow-same-origin only if explicitly approved
