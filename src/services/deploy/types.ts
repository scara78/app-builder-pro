/**
 * Deploy Service Types
 *
 * Type definitions for the Vercel deployment API and file preparation service.
 *
 * @module services/deploy/types
 */

/**
 * A single file in the Vercel deployment payload.
 * Content MUST be base64-encoded.
 */
export interface VercelDeploymentFile {
  /** Relative file path from project root (e.g., "src/App.tsx") */
  file: string;
  /** Base64-encoded file content */
  data: string;
  /** Always "base64" for inline file deployments */
  encoding: 'base64';
}

/**
 * Response from POST /v13/deployments.
 */
export interface VercelDeploymentResponse {
  /** Unique deployment ID */
  id: string;
  /** Deployment URL (may not be live until state is READY) */
  url: string;
  /** Current deployment state */
  state: VercelDeploymentState;
}

/**
 * Possible deployment states from Vercel API.
 */
export type VercelDeploymentState = 'QUEUED' | 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';

/**
 * Response from Vercel OAuth token exchange.
 */
export interface VercelTokenResponse {
  /** Access token for API calls */
  access_token: string;
  /** Token type (typically "Bearer") */
  token_type: string;
  /** Seconds until expiration */
  expires_in?: number;
  /** Refresh token for obtaining new access tokens */
  refresh_token?: string;
}

/**
 * Configuration for the Vercel API client.
 */
export interface VercelApiConfig {
  /** Vercel API base URL */
  baseUrl: string;
  /** Vercel OAuth token endpoint */
  tokenUrl: string;
  /** Maximum polling attempts for deployment status */
  maxPollAttempts: number;
  /** Interval between poll attempts in milliseconds */
  pollIntervalMs: number;
}
