# Credential Management Specification

## Purpose
Secure handling of API keys, tokens, and secrets by eliminating hardcoded credentials from source files and establishing environment-based credential management with proper documentation.

## Requirements

### Requirement: No Hardcoded Credentials in Source Files
The system SHALL NOT contain any hardcoded API keys, tokens, passwords, or other sensitive credentials in source files committed to version control.

#### Scenario: Environment file contains no real credentials
- GIVEN `.env` file in project root
- WHEN scanning for API keys or secrets
- THEN no real credentials are found (only placeholder values like `your-api-key-here`)

#### Scenario: Setup script uses environment variables
- GIVEN `scripts/setup-database.ts`
- WHEN script is executed
- THEN all credentials are read from `process.env` variables with no hardcoded fallback values

#### Scenario: Source files contain no credential patterns
- GIVEN all `.ts` and `.tsx` files in `src/`
- WHEN scanning for common secret patterns (API keys, JWTs, passwords)
- THEN no patterns matching real credentials are found

### Requirement: Environment Files Use Placeholder Templates
The system SHALL provide `.env.example` with placeholder templates that guide developers on required environment variables without exposing real credentials.

#### Scenario: Env example file exists with placeholders
- GIVEN `.env.example` file
- WHEN opened
- THEN it contains all required environment variable names with placeholder values

#### Scenario: Real credentials are gitignored
- GIVEN `.gitignore` file
- WHEN reviewed
- THEN `.env` and `.env.local` are listed in gitignore to prevent credential commits

#### Scenario: Placeholder values are clearly marked
- GIVEN `.env.example` file
- WHEN reviewed by developer
- THEN each variable has a descriptive placeholder like `your-gemini-api-key-here`

### Requirement: Setup Scripts Read Credentials from Environment
The system SHALL read all sensitive credentials exclusively from environment variables with no hardcoded fallback defaults that expose real values.

#### Scenario: Database script reads from process.env
- GIVEN `scripts/setup-database.ts`
- WHEN `supabaseUrl` and `supabaseKey` are needed
- THEN they are read exclusively from `process.env.VITE_SUPABASE_URL` and `process.env.VITE_SUPABASE_ANON_KEY`

#### Scenario: Script fails gracefully without credentials
- GIVEN setup script executed without environment variables
- WHEN credentials are missing
- THEN script outputs clear error message instructing user to set required environment variables

#### Scenario: No default credential values
- GIVEN any script reading credentials
- WHEN environment variable is undefined
- THEN script does NOT use hardcoded default credential value

### Requirement: Credential Rotation Documentation
The system SHALL provide documentation for credential rotation process including steps to generate, update, and verify new credentials.

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
- THEN it lists all services requiring credentials (Gemini API, Supabase) with their respective rotation procedures
