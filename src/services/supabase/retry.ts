/**
 * Retry logic with exponential backoff and jitter
 */

import { MCPError, MCPNetworkError, MCPAuthError, MCPValidationError } from './errors';
import { DEFAULT_MAX_RETRIES, DEFAULT_RETRY_DELAY_BASE, MAX_JITTER_MS } from './constants';

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Calculate exponential backoff delay
 * @param attempt - Current retry attempt (0-indexed)
 * @param maxDelay - Maximum delay cap in milliseconds
 * @returns Delay in milliseconds
 */
export function calculateBackoff(attempt: number, maxDelay: number = 30000): number {
  const delay = DEFAULT_RETRY_DELAY_BASE * Math.pow(2, attempt);
  return Math.min(delay, maxDelay);
}

/**
 * Add random jitter to delay
 * @param baseDelay - Base delay in milliseconds
 * @returns Delay with jitter added
 */
export function addJitter(baseDelay: number): number {
  const jitter = Math.floor(Math.random() * MAX_JITTER_MS);
  return baseDelay + jitter;
}

/**
 * Check if an error is retryable
 * @param error - The error to check
 * @returns true if the operation should be retried
 */
export function isRetryable(error: Error): boolean {
  // If it's a 409 conflict (ValidationError with field='name'), never retry
  // The caller handles conflict resolution
  if (error instanceof MCPValidationError) {
    return false;
  }

  // If it's an MCP error, use its isRetryable method
  if (error instanceof MCPError) {
    return error.isRetryable();
  }

  // Network errors and unknown errors are retryable by default
  if (error instanceof MCPNetworkError) {
    return error.isRetryable();
  }

  // Auth and validation errors are never retryable
  if (error instanceof MCPAuthError) {
    return false;
  }

  // For unknown errors, assume they might be transient
  return true;
}

/**
 * Retry a function with exponential backoff and jitter
 * @param fn - Async function to retry
 * @param options - Retry configuration options
 * @returns Result of the function
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = DEFAULT_MAX_RETRIES,
    baseDelay = DEFAULT_RETRY_DELAY_BASE,
    onRetry
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (attempt < maxRetries && isRetryable(lastError)) {
        if (onRetry) {
          onRetry(attempt + 1, lastError);
        }

        // Calculate delay with exponential backoff and jitter
        const delay = addJitter(calculateBackoff(attempt));

        // Wait for the delay
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // No more retries or error is not retryable
        throw lastError;
      }
    }
  }

  // This should never be reached, but TypeScript needs a return
  throw lastError!;
}

/**
 * Create a retryable version of a function
 * @param fn - Function to make retryable
 * @param options - Retry options
 * @returns Retryable function
 */
export function withRetry_<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): () => Promise<T> {
  return async () => {
    return withRetry(fn, options);
  };
}