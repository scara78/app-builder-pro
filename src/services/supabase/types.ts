/**
 * Type definitions for Supabase MCP Client
 */

/**
 * Available Supabase regions for project creation
 */
export type Region =
  | 'us-east-1'
  | 'us-west-2'
  | 'eu-west-1'
  | 'eu-central-1'
  | 'ap-northeast-1'
  | 'ap-southeast-1'
  | 'ap-south-1';

/**
 * Configuration for MCP Client
 */
export interface MCPClientConfig {
  /** OAuth access token for authentication */
  accessToken: string;
  /** Base URL for MCP server (optional, defaults to Supabase MCP) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Maximum retry attempts for transient errors (default: 3) */
  maxRetries?: number;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Supabase project information
 */
export interface SupabaseProject {
  /** Unique project reference (e.g., 'abc123def') */
  ref: string;
  /** Project name */
  name: string;
  /** Full API URL (e.g., 'https://abc123def.supabase.co') */
  apiUrl: string;
  /** Anonymous key for client-side access */
  anonKey: string;
  /** Project status */
  status: 'ACTIVE' | 'PAUSED' | 'INACTIVE' | 'FAILED';
  /** Creation timestamp */
  createdAt?: string;
}

/**
 * Project creation request
 */
export interface CreateProjectRequest {
  name: string;
  region: Region;
  /** Optional: plan type (default: free) */
  plan?: 'free' | 'pro' | 'team';
}

/**
 * Migration request
 */
export interface MigrationRequest {
  /** SQL statements to execute */
  sql: string;
  /** Migration name for tracking */
  name: string;
}

/**
 * Migration result
 */
export interface MigrationResult {
  success: boolean;
  migrationId: string;
  executedAt: string;
}

/**
 * Project credentials (returned after project creation)
 */
export interface ProjectCredentials {
  ref: string;
  name: string;
  apiUrl: string;
  anonKey: string;
  serviceKey?: string;
}

/**
 * MCP request structure
 */
export interface MCPRequest<T = unknown> {
  method: string;
  params?: T;
  id?: string;
}

/**
 * MCP response structure
 */
export interface MCPResponse<T = unknown> {
  result?: T;
  error?: MCPErrorResponse;
}

/**
 * MCP error response
 */
export interface MCPErrorResponse {
  code: string;
  message: string;
  data?: unknown;
}
