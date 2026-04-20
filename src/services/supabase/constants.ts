/**
 * Constants for Supabase MCP Client
 */

/**
 * Default MCP server endpoint
 */
export const DEFAULT_MCP_ENDPOINT = 'https://api.supabase.com/mcp';

/**
 * Default request timeout in milliseconds (30 seconds)
 */
export const DEFAULT_TIMEOUT = 30000;

/**
 * Default maximum retry attempts
 */
export const DEFAULT_MAX_RETRIES = 3;

/**
 * Default retry delay base in milliseconds
 */
export const DEFAULT_RETRY_DELAY_BASE = 1000;

/**
 * Maximum jitter added to retry delay (500ms)
 */
export const MAX_JITTER_MS = 500;

/**
 * Supported Supabase regions with display names
 */
export const REGIONS = {
  'us-east-1': 'US East (N. Virginia)',
  'us-west-2': 'US West (Oregon)',
  'eu-west-1': 'EU (Ireland)',
  'eu-central-1': 'EU (Frankfurt)',
  'ap-northeast-1': 'Asia Pacific (Tokyo)',
  'ap-southeast-1': 'Asia Pacific (Singapore)',
  'ap-south-1': 'Asia Pacific (Mumbai)',
} as const;

/**
 * HTTP status codes for retryable errors
 */
export const RETRYABLE_STATUS_CODES = [500, 502, 503, 504];

/**
 * HTTP status codes for non-retryable errors
 */
export const NON_RETRYABLE_STATUS_CODES = [400, 401, 403, 404, 422];

/**
 * Error codes
 */
export const ERROR_CODES = {
  AUTH: 'AUTH',
  NETWORK: 'NETWORK',
  RATE_LIMIT: 'RATE_LIMIT',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION: 'VALIDATION',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN: 'UNKNOWN',
} as const;
