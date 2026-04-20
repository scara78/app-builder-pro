/**
 * Pipeline Hook Types
 *
 * Type definitions for the backend creation pipeline.
 * These types are shared between useBackendCreation hook and related components.
 *
 * @module hooks/backend/pipeline/types
 */

/**
 * Pipeline stage states.
 *
 * Represents the progression of the backend creation pipeline.
 * Use these stages to display progress and handle state transitions.
 *
 * @example
 * ```tsx
 * switch (stage) {
 *   case PipelineStage.ANALYZING:
 *     return <AnalyzingIndicator />;
 *   case PipelineStage.GENERATING:
 *     return <GeneratingIndicator />;
 *   // ...
 * }
 * ```
 */
export enum PipelineStage {
  /** No operation in progress */
  IDLE = 'idle',
  /** Analyzing requirements */
  ANALYZING = 'analyzing',
  /** Generating SQL/migration */
  GENERATING = 'generating',
  /** Creating Supabase project */
  CREATING_PROJECT = 'creating_project',
  /** Applying migration */
  APPLYING_MIGRATION = 'applying_migration',
  /** Pipeline completed successfully */
  COMPLETE = 'complete',
  /** Pipeline failed with error */
  ERROR = 'error',
}

/**
 * Complete state snapshot for the backend creation pipeline.
 * Used for state management and debugging.
 */
export interface BackendCreationState {
  /** Current pipeline stage */
  stage: PipelineStage;
  /** Progress percentage (0-100) */
  progress: number;
  /** Error message if stage is ERROR */
  error: string | null;
  /** Result data if stage is COMPLETE */
  result: BackendCreationResult | null;
}

/**
 * Result data after successful backend creation.
 *
 * Contains all information needed to connect to the newly created Supabase project.
 * This data should be displayed to users via CredentialsModal.
 *
 * @example
 * ```tsx
 * // Display credentials after completion
 * if (result) {
 *   console.log(`Project URL: ${result.projectUrl}`);
 *   console.log(`Anon Key: ${result.anonKey}`);
 * }
 * ```
 */
export interface BackendCreationResult {
  /** URL of the created Supabase project */
  projectUrl: string;
  /** Anonymous key for the project */
  anonKey: string;
  /** Name of the created project */
  projectName: string;
  /** Name of the applied migration */
  migrationName: string;
}

/**
 * Options for backend creation pipeline.
 *
 * @example
 * ```tsx
 * const options: BackendCreationOptions = {
 *   projectName: 'my-awesome-app',
 *   region: 'us-east-1',
 *   enableRLS: true // Enable Row Level Security by default
 * };
 *
 * await createBackend(code, options);
 * ```
 */
export interface BackendCreationOptions {
  /** Name for the new project (optional, auto-generated if not provided) */
  projectName?: string;
  /** Supabase region for the project */
  region?: string;
  /** Enable Row Level Security (default: true) */
  enableRLS?: boolean;
}