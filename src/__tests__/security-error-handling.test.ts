import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIOrchestrator } from '../services/ai/AIOrchestrator';
import { redactCredentials, logErrorSafe } from '../utils/logger';

// Mock quota manager
vi.mock('../services/ai/AIQuotaManager', () => ({
  quotaManager: {
    canMakeRequest: () => ({ allowed: true, reason: '' }),
    recordRequest: vi.fn(),
    recordError: vi.fn(),
  },
}));

describe('SEC-04: Error Handling', () => {
  let consoleErrorMock: any;

  beforeEach(() => {
    consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  // ============ RED - Test: No stack traces in error logs ============

  it('should NOT log stack traces in production errors', async () => {
    const orchestrator = AIOrchestrator.getInstance();

    try {
      await orchestrator.generateApp('test');
    } catch (e) {
      // Expected
    }

    // Verify no stack traces are logged
    consoleErrorMock.mock.calls.forEach((call: any) => {
      const logContent = call.join(' ');
      // Stack traces contain "at " or file paths
      expect(logContent).not.toMatch(/at\s+\w+/);
      expect(logContent).not.toMatch(/\.ts:\d+/);
    });
  });

  // ============ RED - Test: Generic error messages only ============

  it('should log generic error messages, not technical details', async () => {
    const orchestrator = AIOrchestrator.getInstance();

    try {
      await orchestrator.generateApp('test');
    } catch (e) {
      // Expected
    }

    // Check logs contain only safe error info
    consoleErrorMock.mock.calls.forEach((call: any) => {
      const logContent = call.join(' ');
      // Should not contain sensitive tech details
      expect(logContent).not.toMatch(/ApiKey.*[a-zA-Z0-9_-]{20,}/);
      expect(logContent).not.toMatch(/stack/i);
    });
  });
});

// ============ SEC-04b: Credential Redaction ============

describe('SEC-04b: Credential Redaction', () => {
  it('should redact Google API keys (AIza...)', () => {
    const input = 'Error: Invalid API key AIzaSyB1234567890abcdefghijklmnopqrstuv';
    const result = redactCredentials(input);
    expect(result).not.toContain('AIzaSyB1234567890abcdefghijklmnopqrstuv');
    expect(result).toContain('[REDACTED_API_KEY]');
  });

  it('should redact JWT tokens (eyJ...)', () => {
    const input = 'Token: eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.abc123def456ghi789jkl012mno345';
    const result = redactCredentials(input);
    expect(result).not.toContain('eyJhbGciOiJIUzI1NiJ9');
    expect(result).toContain('[REDACTED_JWT]');
  });

  it('should redact Bearer tokens', () => {
    const input = 'Authorization: Bearer abcdefghijklmnopqrstuvwxyz0123456789';
    const result = redactCredentials(input);
    expect(result).not.toContain('abcdefghijklmnopqrstuvwxyz0123456789');
    expect(result).toContain('[REDACTED_TOKEN]');
  });

  it('should redact access_token assignments', () => {
    const input =
      'access_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature';
    const result = redactCredentials(input);
    expect(result).toContain('[REDACTED]');
  });

  it('should redact API key assignments', () => {
    const input = 'Error: api_key=sk-abc123def456ghi789jkl012mno345pqr678';
    const result = redactCredentials(input);
    expect(result).not.toContain('sk-abc123def456ghi789jkl012mno345pqr678');
    expect(result).toContain('[REDACTED_CREDENTIAL]');
  });

  it('should redact Supabase project URLs', () => {
    const input = 'Failed to connect to https://abcdefghij.supabase.co';
    const result = redactCredentials(input);
    expect(result).not.toContain('abcdefghij.supabase.co');
    expect(result).toContain('[REDACTED].supabase.co');
  });

  it('should handle strings without credentials unchanged', () => {
    const input = 'Network error. Please check your connection.';
    const result = redactCredentials(input);
    expect(result).toBe(input);
  });

  it('should handle empty strings', () => {
    expect(redactCredentials('')).toBe('');
  });

  it('should redact multiple credentials in the same message', () => {
    const input =
      'Key AIzaSyB1234567890abcdefghijklmnopqrstuv and token eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.abc123def456ghi789jkl012mno345';
    const result = redactCredentials(input);
    expect(result).toContain('[REDACTED_API_KEY]');
    expect(result).toContain('[REDACTED_JWT]');
    expect(result).not.toContain('AIzaSyB');
    expect(result).not.toContain('eyJhbGci');
  });

  it('logErrorSafe should redact credentials from error messages', () => {
    const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

    const error = new Error('API key AIzaSyB1234567890abcdefghijklmnopqrstuv is invalid');
    logErrorSafe('TestContext', error);

    const logContent = consoleErrorMock.mock.calls.map((c: any) => c.join(' ')).join(' ');
    expect(logContent).not.toContain('AIzaSyB1234567890abcdefghijklmnopqrstuv');
    expect(logContent).toContain('[REDACTED_API_KEY]');
    expect(logContent).toContain('[TestContext]');

    consoleErrorMock.mockRestore();
  });

  it('logErrorSafe should handle non-Error objects', () => {
    const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});

    logErrorSafe('TestContext', 'some string error');

    const logContent = consoleErrorMock.mock.calls.map((c: any) => c.join(' ')).join(' ');
    expect(logContent).toContain('[TestContext]');
    expect(logContent).toContain('Unknown error');

    consoleErrorMock.mockRestore();
  });
});
