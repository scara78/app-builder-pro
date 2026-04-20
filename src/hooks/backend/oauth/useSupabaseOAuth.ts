/**
 * useSupabaseOAuth Hook
 *
 * OAuth authentication hook for Supabase integration.
 * Manages the complete OAuth flow including token lifecycle, storage, and expiration.
 *
 * ## Features
 *
 * - **OAuth Flow**: Initiates and handles Supabase OAuth callback
 * - **Token Storage**: Securely stores tokens in sessionStorage
 * - **Expiration Handling**: Automatic token expiration checking with 30s buffer
 * - **JWT Decoding**: Extracts payload from JWT for expiration checks
 *
 * @module hooks/backend/oauth
 *
 * @example
 * ```tsx
 * import { useSupabaseOAuth } from '@/hooks/backend/oauth';
 *
 * function LoginButton() {
 *   const { login, logout, isAuthenticated, status, error } = useSupabaseOAuth();
 *
 *   if (isAuthenticated) {
 *     return <button onClick={logout}>Logout</button>;
 *   }
 *
 *   return (
 *     <button onClick={login} disabled={status === 'authenticating'}>
 *       Login with Supabase
 *     </button>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { supabaseOAuthConfig } from '../../../config/supabase';
import type { OAuthStatus } from './types';

/**
 * Session storage key for OAuth token
 */
const SESSION_STORAGE_KEY = 'sb-access-token';

/**
 * JWT Token payload interface
 */
interface JWTPayload {
  sub: string;
  exp: number;
  iat: number;
  [key: string]: unknown;
}

/**
 * Decodes a JWT token and extracts the payload.
 *
 * @param token - The JWT token to decode
 * @returns The decoded payload or null if invalid
 */
function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const payload = parts[1];
    // Add padding if needed
    const paddedPayload = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const decoded = atob(paddedPayload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Checks if a JWT token is expired.
 * Uses a 30-second buffer to handle clock skew.
 *
 * @param token - The JWT token to check
 * @returns true if the token is expired or invalid
 */
function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return true;
  }
  // Check if expiration time has passed (with 30 second buffer)
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp <= currentTime + 30;
}

/**
 * Extracts the access token from the URL hash.
 * Used after OAuth redirect to capture the token.
 *
 * @returns The access token or null if not present
 */
function extractTokenFromUrl(): string | null {
  const hash = window.location.hash;
  if (!hash) {
    return null;
  }

  const params = new URLSearchParams(hash.substring(1)); // Remove # prefix
  return params.get('access_token');
}

/**
 * Supabase OAuth hook for managing authentication.
 *
 * @returns An object containing:
 *   - `login` - Initiates the OAuth flow
 *   - `logout` - Clears the token and redirects
 *   - `getToken` - Retrieves the current valid token
 *   - `isAuthenticated` - Whether user is authenticated
 *   - `status` - Current OAuth status
 *   - `error` - Error object if authentication failed
 */
export function useSupabaseOAuth() {
  const [status, setStatus] = useState<OAuthStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  
  /**
   * Check if user is authenticated - must be reactive state
   */
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

/**
	 * Retrieves the current valid token from sessionStorage.
	 * Automatically handles expired tokens by removing them.
	 *
	 * @returns The valid token or null if not authenticated
	 */
	const getToken = useCallback((): string | null => {
    const token = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) {
      return null;
    }
    // Check expiration
    if (isTokenExpired(token)) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      setStatus('idle');
      setIsAuthenticated(false);
      return null;
    }
    return token;
  }, []);

/**
	 * Stores the token in sessionStorage and updates auth state.
	 *
	 * @param token - The access token to store
	 */
	const storeToken = useCallback((token: string) => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, token);
    setStatus('authenticated');
    setIsAuthenticated(true);
    setError(null);
  }, []);

/**
	 * Clears the token from sessionStorage and resets auth state.
	 */
	const clearToken = useCallback(() => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setStatus('idle');
    setIsAuthenticated(false);
    setError(null);
  }, []);

/**
	 * Initiates the OAuth flow by redirecting to Supabase.
	 * Will redirect the browser to the Supabase OAuth page.
	 */
	const login = useCallback(async () => {
    try {
      setStatus('authenticating');
      setError(null);

      // Build OAuth URL
      const { clientId, redirectUri, scopes } = supabaseOAuthConfig;
      
      if (!clientId) {
        throw new Error('OAuth client ID not configured');
      }

      // Build the authorization URL
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: scopes,
        response_type: 'token',
        // Add state for security
        state: crypto.randomUUID(),
      });

      const supabaseAuthUrl = `https://supabase.com/dashboard/oauth/authorize?${params.toString()}`;
      
      // Redirect to Supabase OAuth
      window.location.href = supabaseAuthUrl;
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err : new Error('OAuth login failed'));
    }
  }, []);

/**
	 * Logs out by clearing the token and redirecting to home.
	 */
	const logout = useCallback(async () => {
    clearToken();
    // Optionally redirect to home or login page
    window.location.href = window.location.origin;
  }, [clearToken]);

  /**
   * Check for token in URL on mount (OAuth callback)
   */
  useEffect(() => {
    const token = extractTokenFromUrl();
    if (token) {
      storeToken(token);
      // Clear the hash from URL for security
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [storeToken]);

  /**
   * Initialize - check for existing valid token
   */
  useEffect(() => {
    const existingToken = getToken();
    if (existingToken) {
      setStatus('authenticated');
      setIsAuthenticated(true);
    }
  }, [getToken]);

  return {
    login,
    logout,
    getToken,
    isAuthenticated,
    status,
    error,
  };
}

export default useSupabaseOAuth;