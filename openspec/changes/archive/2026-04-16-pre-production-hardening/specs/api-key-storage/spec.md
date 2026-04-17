# Delta for API Key Storage

## MODIFIED Requirements

### Requirement: API Key MUST be stored in SessionStorage
The system SHALL store the API key in sessionStorage instead of localStorage, reducing the risk of persistent XSS attacks accessing the key.
(Previously: Stored in localStorage, persisting across browser sessions)

#### Scenario: API key stored in sessionStorage
- GIVEN user enters API key in Settings
- WHEN SettingsProvider initializes
- THEN key is stored in sessionStorage.getItem('app-builder-api-key')

#### Scenario: API key not persisted after tab closes
- GIVEN API key was saved in sessionStorage
- WHEN user closes browser tab
- THEN API key is cleared (session storage behavior)

### Requirement: Runtime Environment Fallback MUST be available
The system SHALL fall back to import.meta.env.VITE_GEMINI_API_KEY when no user-provided key exists in sessionStorage.
(Previously: Had this fallback but combined with insecure localStorage)

#### Scenario: Falls back to env variable when no user key
- GIVEN no API key in sessionStorage
- WHEN getEffectiveApiKey() is called
- THEN it returns import.meta.env.VITE_GEMINI_API_KEY

#### Scenario: User key takes precedence over env
- GIVEN both user key in sessionStorage and VITE_GEMINI_API_KEY in env
- WHEN getEffectiveApiKey() is called
- THEN user-provided key is returned

### Requirement: Logging of API Key MUST be eliminated
The system SHALL NOT log the API key or hasApiKey status during normal operation.
(Previously: console.log with hasApiKey and full prompt exposed key status)

#### Scenario: No API key logging
- GIVEN generateApp is called with prompt
- WHEN AIOrchestrator processes request
- THEN no console.log statements contain API key or hasApiKey

#### Scenario: Debug mode may log non-sensitive data
- GIVEN debug mode is enabled
- WHEN requests are made
- THEN only non-sensitive metadata is logged (e.g., model used, request length)
