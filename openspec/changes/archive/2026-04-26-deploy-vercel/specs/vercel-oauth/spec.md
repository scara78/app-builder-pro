# Vercel OAuth Specification

## Purpose
Authentication with Vercel via OAuth 2.0 PKCE flow, enabling the app to obtain short-lived access tokens for deployment API calls. Tokens stored in-memory only.

## Requirements

### Requirement: PKCE OAuth Flow Initiation
The system SHALL initiate Vercel OAuth using PKCE (Proof Key for Code Exchange). The authorization URL MUST be `https://vercel.com/oauth/authorize` with `code_challenge` derived from a cryptographically random `code_verifier`.

#### Scenario: User initiates Vercel login
- GIVEN user is not authenticated with Vercel
- WHEN user clicks "Deploy" button
- THEN browser redirects to `https://vercel.com/oauth/authorize` with `client_id`, `redirect_uri`, `code_challenge`, `code_challenge_method=S256`, `response_type=code`, and `scope`

#### Scenario: PKCE verifier stored temporarily
- GIVEN OAuth flow is initiated
- WHEN `code_verifier` is generated
- THEN it MUST be stored in `sessionStorage` under a scoped key ONLY for the duration of the redirect
- AND it MUST be cleared immediately after token exchange

### Requirement: OAuth Token Exchange
The system SHALL exchange the authorization code for an access token via `POST https://vercel.com/oauth/token` with `grant_type=authorization_code`, `code`, `code_verifier`, `client_id`, and `client_secret`.

#### Scenario: Successful token exchange
- GIVEN OAuth callback returns authorization code in URL params
- WHEN system exchanges code for token
- THEN access token is stored in-memory
- AND `code_verifier` is cleared from sessionStorage
- AND URL params are cleaned (no token leakage in browser history)

#### Scenario: Token exchange fails
- GIVEN OAuth callback returns an error or invalid code
- WHEN system attempts token exchange
- THEN error state is set with descriptive message
- AND `code_verifier` is cleared from sessionStorage

### Requirement: In-Memory Token Storage
The system SHALL store Vercel access tokens in-memory only. Tokens MUST NOT be written to `localStorage` or `sessionStorage` (except the temporary PKCE verifier during redirect).

#### Scenario: Token persists during session
- GIVEN user has authenticated with Vercel
- WHEN component re-renders or navigates
- THEN token remains accessible via `getToken()`

#### Scenario: Token cleared on logout or session end
- GIVEN user logs out or closes the tab
- WHEN session ends
- THEN token is no longer accessible
- AND user MUST re-authenticate

### Requirement: Token Expiration Handling
The system SHOULD handle token expiration gracefully. If the Vercel API returns 401, the system MUST clear the stored token and set status to `idle`, prompting re-authentication.

#### Scenario: Expired token detected
- GIVEN stored Vercel token has expired
- WHEN a deploy API call returns 401 Unauthorized
- THEN in-memory token is cleared
- AND OAuth status is set to `idle`
- AND user sees prompt to re-authenticate
