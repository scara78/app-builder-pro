/**
 * Vercel Configuration
 *
 * OAuth and API settings for Vercel integration.
 * Mirrors the pattern from src/config/supabase.ts.
 *
 * @module config/vercel
 */

import { logWarnSafe } from '../utils/logger';

/**
 * Get OAuth client ID from environment.
 * Returns empty string if not configured (warns via logger).
 */
function getOAuthClientId(): string {
  const clientId = import.meta.env.VITE_VERCEL_CLIENT_ID;
  if (!clientId) {
    logWarnSafe(
      'VercelConfig',
      'VITE_VERCEL_CLIENT_ID not configured. Vercel deploy will not work.'
    );
    return '';
  }
  return clientId;
}

/**
 * Get redirect URI from environment.
 * Falls back to default path if not configured.
 */
function getRedirectUri(): string {
  const redirectUri = import.meta.env.VITE_VERCEL_REDIRECT_URI;
  if (!redirectUri) {
    logWarnSafe(
      'VercelConfig',
      'VITE_VERCEL_REDIRECT_URI not configured. Using default callback path.'
    );
    return window.location.origin + '/oauth/vercel/callback';
  }
  return redirectUri;
}

/**
 * Default OAuth scopes for Vercel.
 * 'openid email profile' for user info, offline_access for refresh token.
 */
const DEFAULT_SCOPES = 'openid email profile offline_access';

/**
 * Vercel OAuth configuration.
 */
export const vercelOAuthConfig = {
  clientId: getOAuthClientId(),
  redirectUri: getRedirectUri(),
  scopes: DEFAULT_SCOPES,
  /** Vercel OAuth authorization endpoint */
  authorizeUrl: 'https://vercel.com/oauth/authorize',
  /** Vercel OAuth token exchange endpoint */
  tokenUrl: 'https://vercel.com/oauth/token',
};

/**
 * Vercel API configuration.
 */
export const vercelApiConfig = {
  /** Vercel API base URL for deployment endpoints */
  baseUrl: 'https://api.vercel.com',
  /** Deployment endpoint (v13) */
  deploymentsEndpoint: '/v13/deployments',
  /** Maximum polling attempts (150 attempts * 2s = 5min) */
  maxPollAttempts: 150,
  /** Interval between poll attempts in milliseconds */
  pollIntervalMs: 2000,
};

/**
 * Combined Vercel configuration.
 */
export const vercelConfig = {
  oauth: vercelOAuthConfig,
  api: vercelApiConfig,
};

export default vercelConfig;
