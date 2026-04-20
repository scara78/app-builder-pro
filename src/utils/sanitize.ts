/**
 * SEC-03: Input Sanitization Utility
 * Sanitizes user input to prevent XSS attacks and other malicious content
 */

import DOMPurify from 'dompurify';

/**
 * Maximum allowed input length
 */
const MAX_INPUT_LENGTH = 10000;

/**
 * DOMPurify configuration for sanitizing user input
 */
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [], // Strip all HTML tags
  ALLOWED_ATTR: [] as string[], // Strip all attributes
  ALLOW_DATA_ATTR: false,
  FORCE_BODY: false,
};

/**
 * Sanitizes user input to remove potentially malicious content
 * Uses DOMPurify to remove XSS vectors while preserving safe text
 * @param input - Raw user input
 * @returns Sanitized string safe for display/storage
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // First, clean up whitespace
  let cleaned = input.trim();

  // Remove null bytes to prevent encoding issues
  cleaned = cleaned.replace(/\0/g, '');

  // Truncate to max length first to avoid DoS
  if (cleaned.length > MAX_INPUT_LENGTH) {
    cleaned = cleaned.slice(0, MAX_INPUT_LENGTH);
  }

  // Use DOMPurify to sanitize HTML
  return DOMPurify.sanitize(cleaned, PURIFY_CONFIG) as unknown as string;
}

/**
 * Validates that input is within acceptable length limits
 * @param input - Raw user input
 * @param maxLength - Maximum allowed length (default: 10000)
 * @returns True if input length is acceptable
 */
export function validateInputLength(input: string, maxLength: number = MAX_INPUT_LENGTH): boolean {
  return typeof input === 'string' && input.length <= maxLength;
}
