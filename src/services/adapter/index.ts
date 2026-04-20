/**
 * Supabase Frontend Adapter - Public API
 * CHANGE 6 - Supabase Frontend Adapter
 *
 * This module exports the SupabaseFrontendAdapter and related types
 * for transforming generated React projects to work with Supabase.
 *
 * @example
 * ```ts
 * import { adaptProject, type AdapterConfig } from './services/adapter';
 *
 * const result = adaptProject({
 *   files: generatedFiles,
 *   backendResult,
 *   requirements,
 * });
 * ```
 */

export { SupabaseFrontendAdapter } from './SupabaseFrontendAdapter';

export type {
  AdapterConfig,
  AdaptedProject,
  TransformContext,
  EntityDefinition,
  EntityFieldDefinition,
} from './types';

// Template exports (for testing)
export { supabaseClientTemplate } from './templates/supabaseClient';
export { useAuthTemplate } from './templates/useAuth';

// Factory function for convenience
import { SupabaseFrontendAdapter } from './SupabaseFrontendAdapter';
import type { AdapterConfig, AdaptedProject } from './types';

/**
 * Factory function to adapt a project with Supabase integration.
 * Convenience wrapper that creates an adapter instance and calls adapt().
 *
 * @param config - Configuration with files, backendResult, and requirements
 * @returns Adapted project with injected Supabase files and transformed imports
 *
 * @example
 * ```ts
 * const result = adaptProject({
 *   files: generatedFiles,
 *   backendResult,
 *   requirements,
 * });
 *
 * if (!result.skipped) {
 *   console.log('Injected files:', result.injectedFiles);
 * }
 * ```
 */
export function adaptProject(config: AdapterConfig): AdaptedProject {
  const adapter = new SupabaseFrontendAdapter();
  return adapter.adapt(config);
}
