/**
 * OAuth Hook Types
 * Type definitions for Supabase OAuth authentication
 */

/**
 * OAuth authentication status
 */
export type OAuthStatus = 
  | 'idle'           // No OAuth flow initiated
  | 'authenticating' // OAuth flow in progress
  | 'authenticated' // Successfully authenticated
  | 'error';        // Authentication failed

/**
 * Configuration for Supabase OAuth flow
 */
export interface SupabaseOAuthConfig {
  /** OAuth client ID */
  clientId: string;
  /** Redirect URI after OAuth completion */
  redirectUri: string;
  /** OAuth scopes to request */
  scopes: string;
}

/**
 * OAuth token data
 */
export interface OAuthToken {
  /** Access token for API requests */
  accessToken: string;
  /** Token expiration timestamp */
  expiresAt: number;
  /** Token type (typically 'Bearer') */
  tokenType: string;
}