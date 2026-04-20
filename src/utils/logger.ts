/**
 * SEC-04: Centralized Logger Utility
 * Provides generic error messages for production safety
 */

/**
 * Error message mapping for user-facing errors
 * Maps technical errors to generic messages that don't leak details
 */
export const ERROR_MESSAGES: Record<string, string> = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  AUTH_ERROR: 'Authentication failed. Please refresh and try again.',
  API_ERROR: 'Service unavailable. Please try again later.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
};

/**
 * Maps technical error to generic user message
 * @param error - Technical error or error message
 * @returns Generic user-safe error message
 */
export function getGenericErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    if (message.includes('timeout') || message.includes('timed out')) {
      return ERROR_MESSAGES.TIMEOUT_ERROR;
    }
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('401')) {
      return ERROR_MESSAGES.AUTH_ERROR;
    }
    if (message.includes('500') || message.includes('server')) {
      return ERROR_MESSAGES.API_ERROR;
    }
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Logs error with generic message only
 * @param context - Where the error occurred
 * @param error - The technical error
 */
export function logError(context: string, error: unknown): void {
  const genericMessage = getGenericErrorMessage(error);
  console.error(`[${context}] ${genericMessage}`);
}
