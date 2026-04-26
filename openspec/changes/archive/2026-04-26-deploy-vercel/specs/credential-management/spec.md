# Delta for Credential Management

## ADDED Requirements

### Requirement: Vercel OAuth Token in Credential Lifecycle
The system SHALL include Vercel OAuth access tokens in the in-memory credential lifecycle. When user logs out from Vercel, the token MUST be cleared from memory. The `.env.example` file MUST include `VITE_VERCEL_CLIENT_ID` and `VITE_VERCEL_REDIRECT_URI` placeholder entries.

#### Scenario: Vercel env vars in .env.example
- GIVEN `.env.example` file
- WHEN reviewed
- THEN it contains `VITE_VERCEL_CLIENT_ID=your-vercel-client-id-here` and `VITE_VERCEL_REDIRECT_URI=http://localhost:5173/oauth/vercel/callback`

#### Scenario: Vercel token cleared on logout
- GIVEN user has Vercel OAuth token in memory
- WHEN user logs out from Vercel
- THEN token is removed from in-memory storage
- AND subsequent API calls return unauthenticated status

## MODIFIED Requirements

### Requirement: Credential Rotation Documentation
The system SHALL provide documentation for credential rotation process including steps to generate, update, and verify new credentials.

(Previously: Only listed Gemini API and Supabase as services requiring rotation)

#### Scenario: Rotation guide exists
- GIVEN project documentation
- WHEN developer needs to rotate credentials
- THEN a `docs/credential-rotation.md` file exists with step-by-step instructions

#### Scenario: Rotation steps are documented
- GIVEN credential rotation documentation
- WHEN reviewed
- THEN it includes steps for: (1) generating new credentials in provider dashboard, (2) updating local `.env`, (3) updating CI/CD secrets, (4) verifying new credentials work

#### Scenario: Affected services are listed
- GIVEN credential rotation documentation
- WHEN reviewed
- THEN it lists all services requiring credentials (Gemini API, Supabase, Vercel) with their respective rotation procedures
