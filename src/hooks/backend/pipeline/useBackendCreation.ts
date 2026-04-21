/**
 * useBackendCreation Hook
 *
 * Main orchestration hook for the backend creation pipeline. This hook manages
 * the complete lifecycle of creating a Supabase backend from generated code,
 * including analysis, SQL generation, project creation, and migration application.
 *
 * ## Pipeline Stages
 *
 * 1. **ANALYZING** (25%): Detects backend requirements from code using pattern matching
 * 2. **GENERATING** (50%): Generates SQL migration from detected requirements
 * 3. **CREATING_PROJECT** (75%): Creates a new Supabase project via MCP
 * 4. **APPLYING_MIGRATION** (100%): Applies the generated SQL migration
 *
 * ## Features
 *
 * - **Abort Support**: Cancel in-progress pipeline execution
 * - **Retry**: Automatically retry from the beginning on failure
 * - **Progress Tracking**: Real-time progress updates (0-100%)
 * - **Error Recovery**: Detailed error messages with retry capability
 *
 * @module hooks/backend/pipeline
 * @example
 * ```tsx
 * import { useBackendCreation, PipelineStage } from '@/hooks/backend/pipeline';
 *
 * function MyComponent() {
 *   const {
 *     stage,
 *     progress,
 *     isCreating,
 *     error,
 *     result,
 *     createBackend,
 *     retry,
 *     reset,
 *     abort
 *   } = useBackendCreation();
 *
 *   const handleCreate = async () => {
 *     const code = '...generated react code...';
 *     await createBackend(code, {
 *       projectName: 'my-app',
 *       region: 'us-east-1',
 *       enableRLS: true
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       {isCreating && <ProgressBar value={progress} />}
 *       {stage === PipelineStage.COMPLETE && (
 *         <div>Backend created: {result?.projectUrl}</div>
 *       )}
 *       {stage === PipelineStage.ERROR && (
 *         <button onClick={retry}>Retry</button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useCallback, useRef } from 'react';
import { BackendRequirementsAnalyzer } from '../../../services/analyzer/BackendRequirementsAnalyzer';
import { SQLGenerator } from '../../../services/sql/SQLGenerator';
import { SupabaseMCPClient } from '../../../services/supabase/MCPClient';
import { useSupabaseOAuth } from '../oauth/useSupabaseOAuth';
import { PipelineStage } from './types';
import type { BackendCreationOptions, BackendCreationResult } from './types';
import type { BackendRequirements } from '../../../services/analyzer/types';
import type { MigrationResult } from '../../../services/sql/types';
import type { Region } from '../../../services/supabase/types';

/**
 * Main hook for orchestrating the backend creation pipeline.
 *
 * @returns An object containing:
 * - `stage` - Current pipeline stage
 * - `progress` - Progress percentage (0-100)
 * - `isCreating` - Whether pipeline is actively running
 * - `error` - Error message if stage is ERROR
 * - `result` - Result data if stage is COMPLETE
 * - `requirements` - Backend requirements detected during ANALYZING stage
 * - `createBackend` - Start the pipeline with code and options
 * - `retry` - Retry from beginning (only valid in ERROR stage)
 * - `reset` - Reset all state to initial values
 * - `abort` - Cancel current pipeline execution
 */
export function useBackendCreation() {
  // State management (T3.2)
  const [stage, setStage] = useState<PipelineStage>(PipelineStage.IDLE);
  const [progress, setProgress] = useState<number>(0);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BackendCreationResult | null>(null);

  // Requirements state (RA-001)
  const [requirements, setRequirements] = useState<BackendRequirements | null>(null);

  // Store last code and options for retry
  const [lastCode, setLastCode] = useState<string>('');
  const [lastOptions, setLastOptions] = useState<BackendCreationOptions>({});

  // AbortController ref for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  // OAuth for getting access token
  const { getToken, isAuthenticated } = useSupabaseOAuth();

  /**
   * Updates both stage and progress atomically.
   * @param newStage - The target pipeline stage
   * @param newProgress - The progress percentage (0-100)
   */
  const updateStage = useCallback((newStage: PipelineStage, newProgress: number) => {
    setStage(newStage);
    setProgress(newProgress);
  }, []);

  /**
   * Executes the full backend creation pipeline.
   *
   * The pipeline runs through 4 stages:
   * 1. ANALYZING (25%) - Detect backend requirements from code
   * 2. GENERATING (50%) - Generate SQL migration
   * 3. CREATING_PROJECT (75%) - Create Supabase project
   * 4. APPLYING_MIGRATION (100%) - Apply SQL migration
   *
   * @param code - The generated React code to analyze
   * @param options - Creation options including projectName, region, and enableRLS
   *
   * @example
   * ```tsx
   * await createBackend(code, {
   *   projectName: 'my-app',
   *   region: 'us-east-1',
   *   enableRLS: true
   * });
   * ```
   */
  const createBackend = useCallback(
    async (code: string, options: BackendCreationOptions = {}) => {
      // Abort any previous pipeline execution
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // Store for retry functionality
      setLastCode(code);
      setLastOptions(options);

      // Check authentication first
      if (!isAuthenticated) {
        setStage(PipelineStage.ERROR);
        setError('Authentication required. Please log in with Supabase OAuth.');
        setIsCreating(false);
        return;
      }

      const token = await getToken();
      if (!token) {
        setStage(PipelineStage.ERROR);
        setError('Authentication required. Please log in with Supabase OAuth.');
        setIsCreating(false);
        return;
      }

      // Initialize services
      const analyzer = new BackendRequirementsAnalyzer();
      const generator = new SQLGenerator({ enableRLS: options.enableRLS ?? true });
      const mcpClient = new SupabaseMCPClient({ accessToken: token });

      // Set up project name and region
      const projectName = options.projectName || `backend-${Date.now()}`;
      const region = (options.region as Region) || 'us-east-1';

      try {
        setIsCreating(true);
        setError(null);

        // ====== STAGE 1: Analyze (25%) ======
        updateStage(PipelineStage.ANALYZING, 25);
        let requirements: BackendRequirements;
        try {
          // Check for abort before async operation
          if (signal.aborted) throw new Error('Pipeline aborted');
          requirements = await analyzer.analyze(code);
          if (signal.aborted) throw new Error('Pipeline aborted');

          // Store requirements in state (RA-001)
          setRequirements(requirements);
        } catch (err) {
          if (signal.aborted) throw new Error('Pipeline aborted', { cause: err });
          throw new Error(
            `Analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
            { cause: err }
          );
        }

        // ====== STAGE 2: Generate (50%) ======
        updateStage(PipelineStage.GENERATING, 50);
        let migrationResult: MigrationResult;
        try {
          // Check for abort before sync operation
          if (signal.aborted) throw new Error('Pipeline aborted');
          migrationResult = generator.generate(requirements);
        } catch (err) {
          if (signal.aborted) throw new Error('Pipeline aborted', { cause: err });
          throw new Error(
            `SQL generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
            { cause: err }
          );
        }

        // ====== STAGE 3: Create Project (75%) ======
        updateStage(PipelineStage.CREATING_PROJECT, 75);
        let project;
        try {
          if (signal.aborted) throw new Error('Pipeline aborted');
          project = await mcpClient.createProject(projectName, region);
          if (signal.aborted) throw new Error('Pipeline aborted');
        } catch (err) {
          if (signal.aborted) throw new Error('Pipeline aborted', { cause: err });
          throw new Error(
            `Project creation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
            { cause: err }
          );
        }

        // ====== STAGE 4: Apply Migration (100%) ======
        updateStage(PipelineStage.APPLYING_MIGRATION, 100);
        const migrationName = 'initial_schema';
        try {
          if (signal.aborted) throw new Error('Pipeline aborted');
          await mcpClient.applyMigration(project.ref, migrationResult.sql, migrationName);
          if (signal.aborted) throw new Error('Pipeline aborted');
        } catch (err) {
          if (signal.aborted) throw new Error('Pipeline aborted', { cause: err });
          throw new Error(
            `Migration failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
            { cause: err }
          );
        }

        // Get project URL and anon key
        let projectUrl: string;
        let anonKey: string;
        try {
          if (signal.aborted) throw new Error('Pipeline aborted');
          projectUrl = await mcpClient.getProjectUrl(project.ref);
          anonKey = await mcpClient.getAnonKey(project.ref);
        } catch (err) {
          if (signal.aborted) throw new Error('Pipeline aborted', { cause: err });
          // Fallback URL if unable to fetch
          projectUrl = `https://${project.ref}.supabase.co`;
          anonKey = 'Unable to fetch anon key';
        }

        // Set final result
        setResult({
          projectUrl,
          anonKey,
          projectName: project.name,
          migrationName,
        });

        setStage(PipelineStage.COMPLETE);
        setIsCreating(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        setStage(PipelineStage.ERROR);
        setIsCreating(false);
      }
    },
    [getToken, isAuthenticated, updateStage]
  );

  /**
   * Retries the pipeline from the beginning using the last code and options.
   * Only works when the current stage is ERROR.
   *
   * @returns true if retry was initiated, false if not in error state or no last code
   *
   * @example
   * ```tsx
   * if (stage === PipelineStage.ERROR) {
   *   retry(); // Re-runs pipeline with stored code/options
   * }
   * ```
   */
  const retry = useCallback((): boolean => {
    if (stage !== PipelineStage.ERROR) {
      return false;
    }

    if (lastCode) {
      createBackend(lastCode, lastOptions);
      return true;
    }

    return false;
  }, [stage, lastCode, lastOptions, createBackend]);

  /**
   * Resets all pipeline state to initial values.
   * Clears stage, progress, error, result, and stored code/options.
   * Use this to prepare for a new backend creation session.
   */
  const reset = useCallback(() => {
    setStage(PipelineStage.IDLE);
    setProgress(0);
    setIsCreating(false);
    setError(null);
    setResult(null);
    setRequirements(null); // Clear requirements (RA-001)
    setLastCode('');
    setLastOptions({});
  }, []);

  /**
   * Aborts the current pipeline execution.
   * Cancels any in-progress operations and returns to IDLE state.
   *
   * @returns true if abort was triggered, false if no pipeline is running
   *
   * @example
   * ```tsx
   * // In a modal with cancel button
   * <button onClick={abort}>Cancel</button>
   * ```
   */
  const abort = useCallback((): boolean => {
    if (abortControllerRef.current && isCreating) {
      abortControllerRef.current.abort();
      setStage(PipelineStage.IDLE);
      setError('Pipeline aborted by user');
      setIsCreating(false);
      return true;
    }
    return false;
  }, [isCreating]);

  return {
    // State (T3.2)
    stage,
    progress,
    isCreating,
    error,
    result,
    // Requirements (RA-001)
    requirements,
    // Actions
    createBackend,
    retry,
    reset,
    abort,
  };
}

export default useBackendCreation;
