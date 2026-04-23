import { describe, it, expect, vi } from 'vitest';
import { sanitizeStackTrace, logWarnSafe, logInfoSafe } from '../utils/logger';

describe('sanitizeStackTrace', () => {
  it('should strip URL query parameters from stack traces', () => {
    const input = 'Error at http://api.example.com?token=secret123 (line 5)';
    const result = sanitizeStackTrace(input);
    expect(result).not.toContain('?token=secret123');
    expect(result).not.toContain('secret123');
  });

  it('should truncate long file paths to last 3 segments', () => {
    const longPath =
      '/very/long/nested/directory/structure/that/goes/on/and/on/and/on/src/components/App.tsx';
    const input = `Error at (${longPath}:1:1)`;
    const result = sanitizeStackTrace(input);
    // Should contain only last 3 segments (without leading slash)
    expect(result).toContain('src/components/App.tsx');
    // Should NOT contain the early segments
    expect(result).not.toContain('/very/long/nested/directory/structure');
  });

  it('should leave short paths unchanged', () => {
    const shortPath = '/src/App.tsx';
    const input = `Error at (${shortPath}:1:1)`;
    const result = sanitizeStackTrace(input);
    expect(result).toContain(shortPath);
  });
});

describe('logWarnSafe', () => {
  it('should redact credentials and include context prefix', () => {
    const consoleWarnMock = vi.spyOn(console, 'warn').mockImplementation(() => {});

    logWarnSafe('TestContext', 'API key AIzaSyB1234567890abcdefghijklmnopqrstuv leaked');

    const logContent = consoleWarnMock.mock.calls.map((c: any) => c.join(' ')).join(' ');
    expect(logContent).toContain('[REDACTED_API_KEY]');
    expect(logContent).toContain('[TestContext]');
    expect(logContent).not.toContain('AIzaSyB1234567890abcdefghijklmnopqrstuv');

    consoleWarnMock.mockRestore();
  });
});

describe('logInfoSafe', () => {
  it('should log info messages in dev mode with context prefix', () => {
    const consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => {});

    // In test environment, import.meta.env.PROD is false (dev mode)
    logInfoSafe('TestContext', 'Some debug info');

    const logContent = consoleLogMock.mock.calls.map((c: any) => c.join(' ')).join(' ');
    expect(logContent).toContain('[TestContext]');
    expect(logContent).toContain('Some debug info');

    consoleLogMock.mockRestore();
  });

  it('should redact credentials in info messages', () => {
    const consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => {});

    logInfoSafe('TestContext', 'API key AIzaSyB1234567890abcdefghijklmnopqrstuv in debug');

    const logContent = consoleLogMock.mock.calls.map((c: any) => c.join(' ')).join(' ');
    expect(logContent).toContain('[REDACTED_API_KEY]');
    expect(logContent).not.toContain('AIzaSyB1234567890abcdefghijklmnopqrstuv');

    consoleLogMock.mockRestore();
  });
});
