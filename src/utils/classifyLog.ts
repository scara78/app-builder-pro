import type { ConsoleLogType } from '../types';

/**
 * Heuristic log classification for WebContainer stdout.
 *
 * Patterns:
 * - "npm warn" / "npm WARN" → warn
 * - "ERROR" / "Error" / "error" / "ERR!" → error
 * - "added X packages" / "Vite vX.X.X" / "http://" / "https://" → success
 * - Everything else → info (default, conservative)
 */
export function classifyLog(text: string): ConsoleLogType {
  const lower = text.toLowerCase();

  // npm warn (case-insensitive)
  if (lower.startsWith('npm warn')) {
    return 'warn';
  }

  // Error patterns: ERROR, Error, error, ERR!
  if (/error/i.test(text) || text.includes('ERR!')) {
    return 'error';
  }

  // Success patterns: added X packages, Vite vX.X.X, URLs
  if (/^added \d+ packages?/i.test(text)) {
    return 'success';
  }

  if (/vite v\d+\.\d+\.\d+/i.test(text)) {
    return 'success';
  }

  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    return 'success';
  }

  // Also match URLs embedded in text (e.g., "Local: http://localhost:5173/")
  if (/https?:\/\/\S+/i.test(text)) {
    return 'success';
  }

  return 'info';
}
