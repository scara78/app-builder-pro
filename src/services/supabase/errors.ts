/**
 * MCP Error Classes
 * Custom error types for Supabase MCP client operations
 */

export abstract class MCPError extends Error {
  public readonly code: string;
  public readonly context?: Record<string, unknown>;

  constructor(code: string, message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Check if this error should trigger a retry
   */
  public isRetryable(): boolean {
    return false;
  }

  /**
   * Get retry delay if applicable
   */
  public getRetryAfter(): number | undefined {
    return this.context?.retryAfter as number | undefined;
  }
}

/**
 * Network-related errors that may be transient
 */
export class MCPNetworkError extends MCPError {
  public readonly retryCount: number;
  public readonly maxRetries: number;

  constructor(
    message: string,
    retryCount: number = 0,
    maxRetries: number = 3,
    context?: Record<string, unknown>
  ) {
    super('NETWORK', message, context);
    this.retryCount = retryCount;
    this.maxRetries = maxRetries;
  }

  public isRetryable(): boolean {
    return this.retryCount < this.maxRetries;
  }
}

/**
 * Authentication errors (401, 403)
 */
export class MCPAuthError extends MCPError {
  constructor(message: string, context?: Record<string, unknown>) {
    super('AUTH', message, context);
  }
}

/**
 * Rate limit errors (429)
 */
export class MCPRateLimitError extends MCPError {
  public readonly retryAfter: number;

  constructor(retryAfter: number, context?: Record<string, unknown>) {
    super('RATE_LIMIT', `Rate limit exceeded. Retry after ${retryAfter} seconds`, context);
    this.retryAfter = retryAfter;
  }

  public getRetryAfter(): number {
    return this.retryAfter;
  }
}

/**
 * Resource not found errors (404)
 */
export class MCPNotFoundError extends MCPError {
  constructor(resource: string, context?: Record<string, unknown>) {
    super('NOT_FOUND', `${resource} not found`, context);
  }
}

/**
 * Validation errors (400)
 */
export class MCPValidationError extends MCPError {
  public readonly field?: string;

  constructor(message: string, field?: string, context?: Record<string, unknown>) {
    super('VALIDATION', message, context);
    this.field = field;
  }
}

/**
 * Timeout errors
 */
export class MCPTimeoutError extends MCPError {
  constructor(timeout: number, context?: Record<string, unknown>) {
    super('TIMEOUT', `Request timed out after ${timeout}ms`, context);
  }
}

/**
 * Map HTTP status codes to MCP error types
 */
export function mapHttpError(
  status: number,
  message: string,
  context?: Record<string, unknown>
): MCPError {
  switch (status) {
    case 401:
    case 403:
      return new MCPAuthError(message, context);
    case 404:
      return new MCPNotFoundError(message, context);
    case 409:
      // Conflict - used for duplicate names
      return new MCPValidationError(message, 'name', context);
    case 429:
      const retryAfter = context?.retryAfter as number | undefined;
      return new MCPRateLimitError(retryAfter ?? 60, context);
    case 400:
      return new MCPValidationError(message, undefined, context);
    case 500:
    case 502:
    case 503:
      return new MCPNetworkError(message, 0, 3, context);
    default:
      // Use MCPNetworkError for unknown errors
      return new MCPNetworkError(message, 0, 0, context);
  }
}
