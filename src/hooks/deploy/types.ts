/**
 * Deploy Hook Types
 *
 * Type definitions for the Vercel deploy pipeline.
 * Mirrors the PipelineStage pattern from backend creation.
 *
 * @module hooks/deploy/types
 */

/**
 * Deploy pipeline stage states.
 *
 * Represents the progression of the Vercel deployment pipeline.
 * Use these stages to display progress and handle state transitions.
 */
export enum DeployStage {
  /** No operation in progress */
  IDLE = 'idle',
  /** Vercel OAuth authentication in progress */
  AUTHENTICATING = 'authenticating',
  /** Reading and encoding files from WebContainer */
  PREPARING = 'preparing',
  /** POST /v13/deployments in progress */
  DEPLOYING = 'deploying',
  /** Polling deployment status until ready */
  WAITING = 'waiting',
  /** Pipeline completed successfully */
  COMPLETE = 'complete',
  /** Pipeline failed with error */
  ERROR = 'error',
}

/**
 * Result data after successful Vercel deployment.
 *
 * Contains the deployment URL and metadata needed to display
 * to users via DeploySuccess component.
 */
export interface DeployResult {
  /** Live deployment URL */
  url: string;
  /** Vercel deployment ID */
  deploymentId: string;
  /** Project name used for the deployment */
  projectName: string;
}

/**
 * Options for Vercel deployment pipeline.
 */
export interface DeployOptions {
  /** Name for the Vercel project (auto-generated if not provided) */
  projectName?: string;
  /** Deployment target — defaults to 'production' */
  target?: 'production' | 'staging';
}

/**
 * Vercel OAuth status — mirrors OAuthStatus from Supabase.
 */
export type VercelOAuthStatus =
  | 'idle' // No OAuth flow initiated
  | 'authenticating' // OAuth flow in progress
  | 'authenticated' // Successfully authenticated
  | 'error'; // Authentication failed

/**
 * Vercel OAuth configuration — mirrors SupabaseOAuthConfig.
 */
export interface VercelOAuthConfig {
  /** OAuth client ID from Vercel App registration */
  clientId: string;
  /** Redirect URI after OAuth completion */
  redirectUri: string;
  /** OAuth scopes to request */
  scopes: string;
  /** Vercel API base URL */
  apiBaseUrl: string;
}
