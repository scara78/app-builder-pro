/**
 * Supabase Services
 * 
 * Este módulo exporta dos clientes:
 * 
 * 1. SupabaseClient (oficial) - Para operaciones con la base de datos
 2. SupabaseMCPClient - Para gestión de proyectos vía MCP
 * 
 * @example Uso del cliente oficial
 * ```typescript
 * import { supabase } from './services/supabase';
 * 
 * const { data, error } = await supabase
 *   .from('users')
 *   .select('*');
 * ```
 * 
 * @example Uso del cliente MCP
 * ```typescript
 * import { createMCPClient } from './services/supabase';
 * 
 * const client = createMCPClient({
 *   accessToken: 'your-oauth-token'
 * });
 * 
 * const project = await client.createProject('my-app', 'us-east-1');
 * ```
 */


export { SupabaseMCPClient, createMCPClient } from './MCPClient';

// Error classes
export {
  MCPError,
  MCPNetworkError,
  MCPAuthError,
  MCPRateLimitError,
  MCPNotFoundError,
  MCPValidationError,
  MCPTimeoutError,
  mapHttpError,
} from './errors';

// Retry utilities
export { withRetry, calculateBackoff, addJitter, isRetryable } from './retry';

// Type definitions
export type {
  Region,
  MCPClientConfig,
  SupabaseProject,
  CreateProjectRequest,
  MigrationRequest,
  MigrationResult,
  ProjectCredentials,
  MCPRequest,
  MCPResponse,
  MCPErrorResponse,
} from './types';

// Constants
export {
  DEFAULT_MCP_ENDPOINT,
  DEFAULT_TIMEOUT,
  DEFAULT_MAX_RETRIES,
  DEFAULT_RETRY_DELAY_BASE,
  MAX_JITTER_MS,
  REGIONS,
  RETRYABLE_STATUS_CODES,
  NON_RETRYABLE_STATUS_CODES,
  ERROR_CODES,
} from './constants';
