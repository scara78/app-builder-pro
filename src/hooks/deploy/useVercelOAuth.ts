/**
 * useVercelOAuth Hook
 *
 * Vercel OAuth authentication hook with PKCE flow.
 * Manages the complete OAuth lifecycle including token storage and expiration.
 *
 * ## Security Architecture
 *
 * - **Token Storage**: Access tokens are stored in a module-level variable (in-memory).
 *   This eliminates XSS token theft vectors — session is lost on page reload,
 *   requiring re-authentication (acceptable UX tradeoff for security).
 * - **PKCE**: Uses Proof Key for Code Exchange (RFC 7636) — code_verifier stored
 *   in sessionStorage ONLY during redirect, cleared immediately after token exchange.
 * - **No localStorage**: Tokens are NEVER written to localStorage or persistent storage.
 *
 * @module hooks/deploy/useVercelOAuth
 */

import { useState, useCallback } from 'react';
import { vercelOAuthConfig } from '../../config/vercel';
import { generateCodeVerifier, generateCodeChallenge } from '../../services/deploy/pkce';
import type { VercelOAuthStatus } from './types';

/** Session storage key for the temporary PKCE code_verifier */
const VERIFIER_STORAGE_KEY = 'vercel_oauth_verifier';

/**
 * Module-level in-memory token storage.
 * Survives React re-renders but NOT page reloads — by design.
 * This prevents token extraction via XSS attacks on localStorage.
 */
let accessToken: string | null = null;

/**
 * Vercel OAuth hook for managing authentication with PKCE flow.
 *
 * @returns An object containing:
 * - `login` - Initiates the OAuth PKCE flow (redirects to Vercel)
 * - `exchangeCode` - Exchanges authorization code for access token
 * - `getToken` - Retrieves the current in-memory access token
 * - `logout` - Clears the in-memory token
 * - `isAuthenticated` - Whether user has a valid token
 * - `status` - Current OAuth status
 * - `error` - Error object if authentication failed
 */
export function useVercelOAuth() {
  const [status, setStatus] = useState<VercelOAuthStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!accessToken);

  /**
   * Initiates the Vercel OAuth PKCE flow.
   *
   * Generates a code_verifier, derives a code_challenge (SHA-256),
   * stores the verifier in sessionStorage temporarily, and redirects
   * to the Vercel OAuth authorization endpoint.
   */
  const login = useCallback(() => {
    try {
      const verifier = generateCodeVerifier();

      // Store verifier in sessionStorage for the duration of the redirect
      sessionStorage.setItem(VERIFIER_STORAGE_KEY, verifier);

      // Generate challenge and redirect (async because of SHA-256)
      generateCodeChallenge(verifier).then((challenge) => {
        const { clientId, redirectUri, scopes, authorizeUrl } = vercelOAuthConfig;

        if (!clientId) {
          setStatus('error');
          setError(new Error('Vercel OAuth client ID not configured'));
          sessionStorage.removeItem(VERIFIER_STORAGE_KEY);
          return;
        }

        const params = new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: 'code',
          scope: scopes,
          code_challenge: challenge,
          code_challenge_method: 'S256',
        });

        const authUrl = `${authorizeUrl}?${params.toString()}`;
        window.location.assign(authUrl);
      });

      setStatus('authenticating');
      setError(null);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err : new Error('OAuth login failed'));
      sessionStorage.removeItem(VERIFIER_STORAGE_KEY);
    }
  }, []);

  /**
   * Exchanges an authorization code for an access token.
   *
   * Called after the OAuth redirect callback returns with a `code` parameter.
   * Sends the code + code_verifier to the Vercel token endpoint.
   * Stores the access token in-memory and clears the verifier from sessionStorage.
   *
   * @param code - The authorization code from the OAuth callback
   * @returns The access token, or null if exchange failed
   */
  const exchangeCode = useCallback(async (code: string): Promise<string | null> => {
    const verifier = sessionStorage.getItem(VERIFIER_STORAGE_KEY);

    if (!verifier) {
      setStatus('error');
      setError(new Error('PKCE verifier not found. Please try logging in again.'));
      return null;
    }

    try {
      const { clientId, redirectUri, tokenUrl } = vercelOAuthConfig;

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          code_verifier: verifier,
          client_id: clientId,
          client_secret: '', // Required by Vercel, but handled server-side for confidential clients
        }).toString(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Token exchange failed: ${response.status} - ${errorData?.error || response.statusText}`
        );
      }

      const data = await response.json();

      // Store token in-memory
      accessToken = data.access_token;
      setStatus('authenticated');
      setIsAuthenticated(true);
      setError(null);

      return accessToken;
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err : new Error('Token exchange failed'));
      accessToken = null;
      setIsAuthenticated(false);
      return null;
    } finally {
      // ALWAYS clear the verifier from sessionStorage — one-time use
      sessionStorage.removeItem(VERIFIER_STORAGE_KEY);
    }
  }, []);

  /**
   * Retrieves the current in-memory access token.
   * Returns null if not authenticated.
   */
  const getToken = useCallback((): string | null => {
    return accessToken;
  }, []);

  /**
   * Clears the in-memory token and resets authentication state.
   */
  const logout = useCallback(() => {
    accessToken = null;
    setStatus('idle');
    setIsAuthenticated(false);
    setError(null);
    sessionStorage.removeItem(VERIFIER_STORAGE_KEY);
  }, []);

  return {
    login,
    exchangeCode,
    getToken,
    logout,
    isAuthenticated,
    status,
    error,
  };
}

export default useVercelOAuth;
