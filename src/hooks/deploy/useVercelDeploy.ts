/**
 * useVercelDeploy Hook
 *
 * Main orchestration hook for the Vercel deployment pipeline.
 * Mirrors the useBackendCreation pattern for consistency.
 *
 * ## Pipeline Stages
 *
 * 1. **PREPARING** (25%): Read and encode files from WebContainer
 * 2. **DEPLOYING** (50%): Create deployment via POST /v13/deployments
 * 3. **WAITING** (75%): Poll deployment status until READY
 * 4. **COMPLETE** (100%): Deployment URL available
 *
 * @module hooks/deploy/useVercelDeploy
 */

import { useState, useCallback, useRef } from 'react';
import { prepareFiles } from '../../services/deploy/filePrep';
import { createDeployment, pollDeployment } from '../../services/deploy/vercelApi';
import { useVercelOAuth } from './useVercelOAuth';
import { DeployStage } from './types';
import type { DeployResult, DeployOptions } from './types';
import type { ProjectFile } from '../../types';

/**
 * Deploy pipeline hook.
 *
 * @returns An object containing:
 * - `stage` - Current pipeline stage
 * - `progress` - Progress percentage (0-100)
 * - `isDeploying` - Whether pipeline is actively running
 * - `error` - Error message if stage is ERROR
 * - `result` - Result data if stage is COMPLETE
 * - `deploy` - Start the pipeline with project files and options
 * - `retry` - Retry from beginning (only valid in ERROR stage)
 * - `reset` - Reset all state to initial values
 * - `abort` - Cancel current pipeline execution
 */
export function useVercelDeploy() {
  const [stage, setStage] = useState<DeployStage>(DeployStage.IDLE);
  const [progress, setProgress] = useState<number>(0);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DeployResult | null>(null);

  // Store last files and options for retry
  const lastFilesRef = useRef<ProjectFile[]>([]);
  const lastOptionsRef = useRef<DeployOptions>({});

  // AbortController ref for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  // OAuth for getting access token
  const { getToken, isAuthenticated } = useVercelOAuth();

  /** Updates both stage and progress atomically */
  const updateStage = useCallback((newStage: DeployStage, newProgress: number) => {
    setStage(newStage);
    setProgress(newProgress);
  }, []);

  /**
   * Executes the full Vercel deployment pipeline.
   *
   * @param files - Project files from WebContainer
   * @param options - Deploy options (projectName, target)
   */
  const deploy = useCallback(
    async (files: ProjectFile[], options: DeployOptions = {}) => {
      // Abort any previous pipeline execution
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // Store for retry
      lastFilesRef.current = files;
      lastOptionsRef.current = options;

      // Set deploying state BEFORE any async work
      setIsDeploying(true);
      setError(null);
      updateStage(DeployStage.PREPARING, 25);

      // Check authentication
      if (!isAuthenticated) {
        setStage(DeployStage.ERROR);
        setError('Authentication required. Please log in with Vercel OAuth.');
        setIsDeploying(false);
        return;
      }

      const token = getToken();
      if (!token) {
        setStage(DeployStage.ERROR);
        setError('Authentication required. Please log in with Vercel OAuth.');
        setIsDeploying(false);
        return;
      }

      const projectName = options.projectName || `app-${Date.now()}`;

      try {
        // ====== STAGE 1: PREPARING (25%) ======
        let preparedFiles;
        try {
          if (signal.aborted) throw new Error('Pipeline aborted');
          preparedFiles = prepareFiles(files);
          if (signal.aborted) throw new Error('Pipeline aborted');
        } catch (err) {
          if (signal.aborted) throw new Error('Pipeline aborted', { cause: err });
          throw new Error(
            `File preparation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
            { cause: err }
          );
        }

        // ====== STAGE 2: DEPLOYING (50%) ======
        updateStage(DeployStage.DEPLOYING, 50);
        let deployment;
        try {
          if (signal.aborted) throw new Error('Pipeline aborted');
          deployment = await createDeployment(token, preparedFiles, projectName);
          if (signal.aborted) throw new Error('Pipeline aborted');
        } catch (err) {
          if (signal.aborted) throw new Error('Pipeline aborted', { cause: err });
          throw new Error(
            `Deployment creation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
            { cause: err }
          );
        }

        // ====== STAGE 3: WAITING (75%) ======
        updateStage(DeployStage.WAITING, 75);
        let finalDeployment;
        try {
          if (signal.aborted) throw new Error('Pipeline aborted');
          finalDeployment = await pollDeployment(deployment.id, token);
          if (signal.aborted) throw new Error('Pipeline aborted');
        } catch (err) {
          if (signal.aborted) throw new Error('Pipeline aborted', { cause: err });
          throw new Error(
            `Deployment polling failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
            { cause: err }
          );
        }

        // ====== STAGE 4: COMPLETE (100%) ======
        setResult({
          url: finalDeployment.url,
          deploymentId: finalDeployment.id,
          projectName,
        });
        updateStage(DeployStage.COMPLETE, 100);
        setIsDeploying(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        setStage(DeployStage.ERROR);
        setIsDeploying(false);
      }
    },
    [getToken, isAuthenticated, updateStage]
  );

  /**
   * Retries the pipeline from the beginning using stored files and options.
   * Only works when the current stage is ERROR.
   */
  const retry = useCallback((): boolean => {
    if (stage !== DeployStage.ERROR) {
      return false;
    }

    if (lastFilesRef.current.length > 0) {
      deploy(lastFilesRef.current, lastOptionsRef.current);
      return true;
    }

    return false;
  }, [stage, deploy]);

  /**
   * Resets all pipeline state to initial values.
   */
  const reset = useCallback(() => {
    setStage(DeployStage.IDLE);
    setProgress(0);
    setIsDeploying(false);
    setError(null);
    setResult(null);
    lastFilesRef.current = [];
    lastOptionsRef.current = {};
  }, []);

  /**
   * Aborts the current pipeline execution.
   */
  const abort = useCallback((): boolean => {
    if (abortControllerRef.current && isDeploying) {
      abortControllerRef.current.abort();
      setStage(DeployStage.IDLE);
      setError('Pipeline aborted by user');
      setIsDeploying(false);
      return true;
    }
    return false;
  }, [isDeploying]);

  return {
    stage,
    progress,
    isDeploying,
    error,
    result,
    deploy,
    retry,
    reset,
    abort,
  };
}

export default useVercelDeploy;
