/**
 * Vercel API Client
 *
 * REST client for Vercel deployment endpoints.
 * Uses fetch() for direct browser-side API calls.
 *
 * @module services/deploy/vercelApi
 */

import { vercelApiConfig } from '../../config/vercel';
import type {
  VercelDeploymentFile,
  VercelDeploymentResponse,
  VercelDeploymentState,
} from './types';

/**
 * Creates a new deployment on Vercel.
 *
 * POST /v13/deployments with inline base64-encoded files.
 * Requires a valid Vercel OAuth bearer token.
 *
 * @param token - Vercel OAuth access token
 * @param files - Array of base64-encoded deployment files
 * @param projectName - Optional project name (auto-generated if omitted)
 * @returns Deployment response with id, url, and state
 * @throws Error on API error responses or network failure
 */
export async function createDeployment(
  token: string,
  files: VercelDeploymentFile[],
  projectName?: string
): Promise<VercelDeploymentResponse> {
  const name = projectName || `app-${Date.now()}`;
  const url = `${vercelApiConfig.baseUrl}${vercelApiConfig.deploymentsEndpoint}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        target: 'production',
        files,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message || response.statusText || 'Unknown error';
      throw new Error(
        `Vercel API error: ${response.status} ${response.statusText} - ${errorMessage}`
      );
    }

    return response.json();
  } catch (error) {
    // Distinguish network errors (CORS, offline) from API errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(
        `Network error: Unable to reach Vercel API. This may be a CORS issue. ${error.message}`,
        { cause: error }
      );
    }
    throw error;
  }
}

/**
 * Polls a Vercel deployment until it reaches READY, ERROR, or times out.
 *
 * GET /v13/deployments/{id} at regular intervals.
 *
 * @param deploymentId - The deployment ID returned by createDeployment
 * @param token - Vercel OAuth access token
 * @param options - Poll configuration (maxAttempts, intervalMs)
 * @returns Deployment response with final state and URL
 * @throws Error if deployment fails, times out, or API returns error
 */
export async function pollDeployment(
  deploymentId: string,
  token: string,
  options: { maxAttempts?: number; intervalMs?: number } = {}
): Promise<VercelDeploymentResponse & { state: VercelDeploymentState }> {
  const maxAttempts = options.maxAttempts ?? vercelApiConfig.maxPollAttempts;
  const intervalMs = options.intervalMs ?? vercelApiConfig.pollIntervalMs;
  const url = `${vercelApiConfig.baseUrl}${vercelApiConfig.deploymentsEndpoint}/${deploymentId}`;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message || response.statusText || 'Unknown error';
      throw new Error(
        `Vercel API error: ${response.status} ${response.statusText} - ${errorMessage}`
      );
    }

    const data: VercelDeploymentResponse = await response.json();

    if (data.state === 'READY') {
      return data;
    }

    if (data.state === 'ERROR') {
      throw new Error('Deployment failed: Vercel reported an error state');
    }

    if (data.state === 'CANCELED') {
      throw new Error('Deployment was canceled');
    }

    // Wait before next poll (except on last attempt)
    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error(
    `Deployment timed out after ${maxAttempts} poll attempts (${Math.round((maxAttempts * intervalMs) / 1000)}s)`
  );
}
