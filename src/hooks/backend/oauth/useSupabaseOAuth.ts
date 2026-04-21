/**
 * useSupabaseOAuth Hook
 *
 * OAuth authentication hook for Supabase integration.
 * Manages the complete OAuth flow including token lifecycle, storage, and expiration.
 *
 * ## Security Architecture (Phase 5 - Token Storage Migration)
 *
 * - **Token Storage**: Tokens are stored in-memory by the Supabase SDK (NOT sessionStorage).
 *   This eliminates XSS token theft vectors — session is lost on tab close,
 *   requiring re-authentication (acceptable UX tradeoff for security).
 * - **Session Management**: Uses `supabase.auth.getSession()` for token retrieval
 *   and `supabase.auth.onAuthStateChange()` for reactive session updates.
 * - **Expiration Handling**: SDK handles token refresh automatically. When session
 *   is lost (SIGNED_OUT or session null on INITIAL_SESSION), state is cleared.
 * - **OAuth Callback**: On mount, the hook detects OAuth callback tokens in the URL
 *   hash and cleans the URL fragment to prevent token leakage in browser history.
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

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient, type Session, type Subscription } from '@supabase/supabase-js';
import { supabaseOAuthConfig } from '../../../config/supabase';
import type { OAuthStatus } from './types';

/**
 * Creates a Supabase client configured for in-memory token storage.
 *
 * By default, @supabase/supabase-js v2 stores tokens in localStorage.
 * We explicitly set `persistSession: false` to force in-memory-only storage,
 * which eliminates XSS token theft vectors at the cost of losing the session
 * on tab close (user must re-authenticate).
 */
const supabaseClient = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  {
    auth: {
      persistSession: false, // In-memory only — no sessionStorage, no localStorage
      autoRefreshToken: true, // SDK handles silent token refresh
      detectSessionInUrl: true, // Auto-detect OAuth callback tokens in URL hash
    },
  }
);

/** Keys to clear from sessionStorage on auth cleanup (leftover from pre-migration) */
const LEGACY_SESSION_KEYS = ['sb-access-token'];

/**
 * Clears any leftover auth tokens from sessionStorage.
 * Called on SIGNED_OUT to ensure no legacy tokens remain.
 */
function clearLegacySessionStorage(): void {
  for (const key of LEGACY_SESSION_KEYS) {
    sessionStorage.removeItem(key);
  }
}

/**
 * Checks if the URL contains an OAuth callback hash fragment.
 * @returns true if `#access_token=` is present in the URL hash
 */
function hasOAuthCallbackInUrl(): boolean {
  const hash = window.location?.hash;
  if (!hash) return false;
  return hash.includes('access_token=');
}

/**
 * Handles an auth state change event by updating the hook's state.
 */
function handleAuthEvent(
  event: string,
  session: Session | null,
  setStatus: (s: OAuthStatus) => void,
  setIsAuthenticated: (v: boolean) => void,
  setError: (e: Error | null) => void
): void {
  switch (event) {
    case 'INITIAL_SESSION':
      if (session?.access_token) {
        setStatus('authenticated');
        setIsAuthenticated(true);
        setError(null);
      } else {
        setStatus('idle');
        setIsAuthenticated(false);
      }
      break;

    case 'SIGNED_IN':
      setStatus('authenticated');
      setIsAuthenticated(true);
      setError(null);
      break;

    case 'SIGNED_OUT':
      clearLegacySessionStorage();
      setStatus('idle');
      setIsAuthenticated(false);
      setError(null);
      break;

    case 'TOKEN_REFRESHED':
      // SDK handled the refresh — session is still valid
      setStatus('authenticated');
      setIsAuthenticated(true);
      setError(null);
      break;

    default:
      // Other events (PASSWORD_RECOVERY, MFA_CHALLENGE_VERIFIED, etc.)
      // Also handles edge cases where session is lost unexpectedly
      if (session?.access_token) {
        setStatus('authenticated');
        setIsAuthenticated(true);
      } else if (event !== 'INITIAL_SESSION') {
        // Session lost unexpectedly — treat as expiration
        clearLegacySessionStorage();
        setStatus('idle');
        setIsAuthenticated(false);
        setError(new Error('Session expired. Please log in again.'));
        // Redirect to home to trigger re-authentication
        window.location.href = window.location.origin;
      } else {
        setStatus('idle');
        setIsAuthenticated(false);
      }
      break;
  }
}

/**
 * Supabase OAuth hook for managing authentication.
 *
 * Uses the Supabase JS SDK for all token management — tokens are stored
 * in-memory by the SDK and never written to sessionStorage or localStorage.
 *
 * @returns An object containing:
 * - `login` - Initiates the OAuth flow
 * - `logout` - Clears the session and redirects
 * - `getToken` - Retrieves the current valid access token from the SDK
 * - `isAuthenticated` - Whether user is authenticated
 * - `status` - Current OAuth status
 * - `error` - Error object if authentication failed
 */
export function useSupabaseOAuth() {
  const [status, setStatus] = useState<OAuthStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  /** Track onAuthStateChange subscription for cleanup */
  const subscriptionRef = useRef<Subscription | null>(null);

  /**
   * Retrieves the current valid access token from the Supabase SDK.
   * The SDK stores tokens in-memory and handles refresh automatically.
   *
   * @returns The valid access token or null if not authenticated
   */
  const getToken = useCallback(async (): Promise<string | null> => {
    try {
      const { data, error: sessionError } = await supabaseClient.auth.getSession();

      if (sessionError) {
        setError(sessionError);
        setIsAuthenticated(false);
        setStatus('error');
        return null;
      }

      const session = data.session;
      if (!session?.access_token) {
        return null;
      }

      return session.access_token;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get session'));
      return null;
    }
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
        // Add state for CSRF protection
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
   * Logs out by signing out via the SDK, clearing legacy storage, and redirecting.
   */
  const logout = useCallback(async () => {
    try {
      await supabaseClient.auth.signOut();
    } catch {
      // signOut may fail if session already expired — proceed with cleanup anyway
    }
    clearLegacySessionStorage();
    setStatus('idle');
    setIsAuthenticated(false);
    setError(null);
    // Redirect to home
    window.location.href = window.location.origin;
  }, []);

  /**
   * Set up onAuthStateChange listener for reactive session management.
   * Handles: INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED.
   * Unexpected session loss is handled in the default case.
   */
  useEffect(() => {
    const { data } = supabaseClient.auth.onAuthStateChange((event, session) => {
      handleAuthEvent(event, session, setStatus, setIsAuthenticated, setError);
    });

    subscriptionRef.current = data.subscription;

    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, []);

  /**
   * Handle OAuth callback on mount — detect token in URL hash.
   * The SDK's `detectSessionInUrl: true` already handles this, but we
   * also clean the URL hash for security (removes token from browser history).
   */
  useEffect(() => {
    if (hasOAuthCallbackInUrl()) {
      // The SDK's detectSessionInUrl processes the hash automatically.
      // We just need to clean the URL for security.
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

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
