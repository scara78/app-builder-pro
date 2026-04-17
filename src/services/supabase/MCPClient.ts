/**
 * Supabase MCP Client
 * HTTP client for interacting with Supabase MCP server
 */

import type { 
  MCPClientConfig, 
  SupabaseProject, 
  Region,
  MCPResponse 
} from './types';
import { 
  DEFAULT_MCP_ENDPOINT, 
  DEFAULT_TIMEOUT,
  DEFAULT_MAX_RETRIES 
} from './constants';
import { 
  MCPAuthError,
  MCPNotFoundError,
  MCPValidationError,
  mapHttpError 
} from './errors';
import { withRetry } from './retry';

/**
 * Supabase MCP Client for project management operations
 */
export class SupabaseMCPClient {
  private readonly accessToken: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;

  constructor(config: MCPClientConfig) {
    // Validate accessToken - throw MCPAuthError if missing/empty
    if (!config.accessToken || config.accessToken.trim() === '') {
      throw new MCPAuthError('accessToken is required');
    }

    this.accessToken = config.accessToken;
    this.baseUrl = config.baseUrl || DEFAULT_MCP_ENDPOINT;
    this.timeout = config.timeout || DEFAULT_TIMEOUT;
    this.maxRetries = config.maxRetries || DEFAULT_MAX_RETRIES;
  }

  /**
   * Make a retryable HTTP request to the MCP server
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    
    return withRetry(async () => {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message = errorBody.message || errorBody.error || `HTTP ${response.status}`;
        
        throw mapHttpError(response.status, message, { 
          status: response.status,
          ...errorBody 
        });
      }

      const data = await response.json() as MCPResponse<T>;
      
      if (data.error) {
        throw mapHttpError(
          parseInt(data.error.code) || 500,
          data.error.message,
          data.error.data as Record<string, unknown>
        );
      }

      return data.result as T;
    }, {
      maxRetries: this.maxRetries,
      onRetry: (attempt, error) => {
        console.log(`Retry attempt ${attempt}:`, error.message);
      }
    });
  }

  /**
   * Create a new Supabase project
   * Handles 409 conflict by appending a numeric suffix and retrying
   * @param name - Project name
   * @param region - Region for the project
   * @returns Created project details
   */
  async createProject(name: string, region: Region = 'us-east-1'): Promise<SupabaseProject> {
    // Attempt with original name
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts) {
      try {
        const result = await this.request<SupabaseProject>(
          'POST',
          '/api/mcp/create_project',
          { name, region }
        );
        return result;
      } catch (error) {
        // Check if it's a 409 conflict (mapped to MCPValidationError with field='name')
        if (error instanceof MCPValidationError && 
            error.field === 'name' &&
            error.message.includes('exists')) {
          // Append suffix and retry
          attempts++;
          const suffix = attempts;
          name = `${name}-${suffix}`;
        } else {
          // Re-throw other errors
          throw error;
        }
      }
    }
    
    // If we hit max attempts, try one more time (will throw if still failing)
    return this.request<SupabaseProject>(
      'POST',
      '/api/mcp/create_project',
      { name, region }
    );
  }

  /**
   * Get the API URL for a project
   * @param projectRef - Project reference
   * @returns Project API URL
   */
  async getProjectUrl(projectRef: string): Promise<string> {
    const result = await this.request<{ url: string }>(
      'GET',
      `/api/mcp/project/${projectRef}/url`
    );

    return result.url;
  }

  /**
   * Get the anon key for a project
   * @param projectRef - Project reference
   * @returns Project anon key
   */
  async getAnonKey(projectRef: string): Promise<string> {
    const result = await this.request<{ anonKey: string }>(
      'GET',
      `/api/mcp/project/${projectRef}/anon_key`
    );

    return result.anonKey;
  }

  /**
   * Apply a SQL migration to a project
   * @param projectRef - Project reference
   * @param sql - SQL statements
   * @param name - Migration name
   * @returns void on success
   */
  async applyMigration(
    projectRef: string, 
    sql: string, 
    name: string
  ): Promise<void> {
    await this.request<{ success: boolean }>(
      'POST',
      `/api/mcp/project/${projectRef}/migration`,
      { sql, name }
    );
  }

  /**
   * List all projects for the authenticated user
   * @returns Array of projects
   */
  async listProjects(): Promise<SupabaseProject[]> {
    const result = await this.request<{ projects: SupabaseProject[] }>(
      'GET',
      '/api/mcp/projects'
    );

    return result.projects;
  }
}

/**
 * Factory function to create MCP client
 */
export function createMCPClient(config: MCPClientConfig): SupabaseMCPClient {
  return new SupabaseMCPClient(config);
}