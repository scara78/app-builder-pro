/**
 * Supabase MCP Client
 *
 * HTTP client for interacting with Supabase MCP (Model Context Protocol) server.
 * Provides project management operations including creation, configuration,
 * and SQL migration execution.
 *
 * @example
 * ```typescript
 * import { createMCPClient, SupabaseMCPClient } from './services/supabase';
 *
 * const client = createMCPClient({
 *   accessToken: 'your-oauth-token',
 *   baseUrl: 'https://api.supabase.com/mcp'
 * });
 *
 * const project = await client.createProject('my-app', 'us-east-1');
 * await client.applyMigration(project.ref, 'CREATE TABLE users (id INT);', 'init');
 * ```
 */

// Core client
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
  mapHttpError
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
  MCPErrorResponse
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
  ERROR_CODES
} from './constants';
