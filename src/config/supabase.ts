/**
 * Supabase Configuration
 * OAuth and API settings for Supabase integration
 */

import type { SupabaseOAuthConfig } from '../hooks/backend/oauth/types';
import { logWarnSafe } from '../utils/logger';

/**
 * Get OAuth client ID from environment
 * @throws Error if not configured
 */
function getOAuthClientId(): string {
  const clientId = import.meta.env.VITE_SUPABASE_OAUTH_CLIENT_ID;
  if (!clientId) {
    logWarnSafe('SupabaseConfig', 'VITE_SUPABASE_OAUTH_CLIENT_ID not configured. OAuth flow may not work.');
    return '';
  }
  return clientId;
}

/**
 * Get redirect URI from environment
 * @throws Error if not configured
 */
function getRedirectUri(): string {
  const redirectUri = import.meta.env.VITE_SUPABASE_REDIRECT_URI;
  if (!redirectUri) {
    logWarnSafe('SupabaseConfig', 'VITE_SUPABASE_REDIRECT_URI not configured. OAuth callback may fail.');
    return window.location.origin + '/oauth/callback';
  }
  return redirectUri;
}

/**
 * Default OAuth scopes
 */
const DEFAULT_SCOPES = 'projects:read projects:write';

/**
 * Supabase OAuth configuration
 */
export const supabaseOAuthConfig: SupabaseOAuthConfig = {
  clientId: getOAuthClientId(),
  redirectUri: getRedirectUri(),
  scopes: DEFAULT_SCOPES,
};

/**
 * Supabase API Configuration
 */
export const supabaseConfig = {
  /** Default API URL from environment */
  apiUrl: import.meta.env.VITE_SUPABASE_URL || '',
  /** Default anon key from environment */
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  /** OAuth configuration */
  oauth: supabaseOAuthConfig,
};

export default supabaseConfig;