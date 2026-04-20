/**
 * Type definitions for SupabaseFrontendAdapter
 * CHANGE 6 - Supabase Frontend Adapter
 *
 * These types define the interface between the backend creation pipeline
 * and the frontend code transformation system.
 */

import type { ProjectFile } from '../../types';
import type { BackendCreationResult } from '../../hooks/backend/pipeline/types';
import type { BackendRequirements } from '../analyzer/types';

/**
 * Configuration for the frontend adapter.
 *
 * Contains all necessary context to transform a generated React project
 * to work with a newly created Supabase backend.
 *
 * @example
 * ```ts
 * const config: AdapterConfig = {
 *   files: generatedProjectFiles,
 *   backendResult: {
 *     projectUrl: 'https://abc.supabase.co',
 *     anonKey: 'eyJ...',
 *     projectName: 'my-app',
 *     migrationName: 'initial_schema',
 *   },
 *   requirements: {
 *     hasAuth: true,
 *     hasStorage: false,
 *     entities: [...],
 *     // ...
 *   },
 * };
 * ```
 */
export interface AdapterConfig {
  /** Array of project files to be transformed */
  files: ProjectFile[];
  /** Backend creation result (null if no backend was created) */
  backendResult: BackendCreationResult | null;
  /** Backend requirements detected from code analysis (null if no analysis) */
  requirements: BackendRequirements | null;
  /** Skip adaptation if true (default: false) */
  skipAdaptation?: boolean;
}

/**
 * Result of the frontend adaptation process.
 *
 * Contains the transformed file set and metadata about what was changed.
 */
export interface AdaptedProject {
  /** Transformed project files */
  files: ProjectFile[];
  /** List of file paths that were newly injected */
  injectedFiles: string[];
  /** List of file paths that were transformed */
  transformedFiles: string[];
  /** Whether adaptation was skipped */
  skipped: boolean;
  /** Reason for skipping (if skipped) */
  reason?: string;
}

/**
 * Context for file transformation.
 *
 * Contains all information extracted from the backend result that is needed
 * to transform frontend files (credentials, detected features, etc).
 */
export interface TransformContext {
  /** URL of the Supabase project */
  projectUrl: string;
  /** Anonymous key for the project */
  anonKey: string;
  /** Whether authentication was detected */
  hasAuth: boolean;
  /** Whether storage was detected */
  hasStorage: boolean;
  /** Detected entity definitions */
  entities: EntityDefinition[];
}

/**
 * Simplified entity definition for frontend code generation.
 *
 * Derived from BackendRequirements.entities but focused on what the
 * frontend code templates need (type names and field names).
 */
export interface EntityDefinition {
  /** Entity name (e.g., 'User', 'Product') */
  name: string;
  /** Type name (usually same as name) */
  typeName: string;
  /** Field definitions */
  fields: EntityFieldDefinition[];
}

/**
 * Field definition for entity.
 */
export interface EntityFieldDefinition {
  /** Field name */
  name: string;
  /** TypeScript type */
  type: string;
  /** Whether the field is optional */
  isOptional: boolean;
}
