/**
 * SEC-04: Centralized Logger Utility
 * Provides generic error messages for production safety
 * Includes credential redaction to prevent token/key leakage in logs
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
 * Patterns that match common credential formats.
 * Used by redactCredentials() to strip secrets from error messages.
 *
 * Order matters: more specific patterns first to avoid partial matches.
 */
const CREDENTIAL_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  // Google/Gemini API keys (AIza...)
  { pattern: /AIza[0-9A-Za-z_-]{35}/g, label: '[REDACTED_API_KEY]' },

  // Supabase anon keys / JWTs (eyJ...eyJ...)
  {
    pattern: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
    label: '[REDACTED_JWT]',
  },

  // Generic Bearer tokens
  { pattern: /Bearer\s+[A-Za-z0-9_-]{20,}/gi, label: 'Bearer [REDACTED_TOKEN]' },

  // Access token values in JSON or URL params
  { pattern: /access_token[=:]\s*["']?[A-Za-z0-9_-]{20,}/gi, label: 'access_token=[REDACTED]' },

  // Refresh token values
  { pattern: /refresh_token[=:]\s*["']?[A-Za-z0-9_-]{20,}/gi, label: 'refresh_token=[REDACTED]' },

  // Generic API key assignments (KEY=xxx or key: xxx)
  {
    pattern:
      /(?:api[_-]?key|apikey|secret|token|password)["']?\s*[:=]\s*["']?[A-Za-z0-9_\-+/=]{20,}/gi,
    label: '[REDACTED_CREDENTIAL]',
  },

  // Supabase project URLs (contain project ref which is semi-secret)
  { pattern: /https:\/\/[a-z0-9]+\.supabase\.co/g, label: 'https://[REDACTED].supabase.co' },

  // Authorization headers
  {
    pattern: /Authorization:\s*Bearer\s+[A-Za-z0-9_-]{20,}/gi,
    label: 'Authorization: Bearer [REDACTED]',
  },
];

/**
 * Redacts credentials from a string (error message, log, etc.)
 *
 * Replaces known credential patterns with [REDACTED_*] labels
 * to prevent secrets from leaking into logs and error outputs.
 *
 * @param message - The string to redact
 * @returns The string with all credential patterns replaced
 *
 * @example
 * redactCredentials('Error: API key AIzaSyB... invalid')
 * // => 'Error: API key [REDACTED_API_KEY] invalid'
 *
 * redactCredentials('Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.signature')
 * // => '[REDACTED_JWT]'
 */
export function redactCredentials(message: string): string {
  let result = message;

  for (const { pattern, label } of CREDENTIAL_PATTERNS) {
    // Reset regex lastIndex for global patterns
    pattern.lastIndex = 0;
    result = result.replace(pattern, label);
  }

  return result;
}

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
 * Logs error with generic message only (no credentials leaked)
 * @param context - Where the error occurred
 * @param error - The technical error
 */
export function logError(context: string, error: unknown): void {
  const genericMessage = getGenericErrorMessage(error);
  console.error(`[${context}] ${genericMessage}`);
}

/**
 * Logs error with redacted technical details for debugging.
 * Use this instead of console.error(error.message) in catch blocks.
 * Redacts any credentials that might appear in the error message.
 *
 * @param context - Where the error occurred (e.g. 'Gemini API', 'MCP Client')
 * @param error - The technical error
 *
 * @example
 * // Instead of: console.error('API Error:', error.message)
 * // Use: logErrorSafe('API Error', error)
 */
export function logErrorSafe(context: string, error: unknown): void {
  if (error instanceof Error) {
    console.error(`[${context}] ${redactCredentials(error.message)}`);
  } else {
    console.error(`[${context}] Unknown error`);
  }
}
