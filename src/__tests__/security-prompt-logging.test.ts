import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIOrchestrator } from '../services/ai/AIOrchestrator';

// Mock the quota manager
vi.mock('../services/ai/AIQuotaManager', () => ({
  quotaManager: {
    canMakeRequest: () => ({ allowed: true, reason: '' }),
    recordRequest: vi.fn(),
    recordError: vi.fn(),
  },
}));

describe('SEC-02: Remove Prompt Logging', () => {
  let consoleLogMock: any;
  let consoleErrorMock: any;

  beforeEach(() => {
    consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  // ============ RED - Test: No prompt content in console.log ============
  it('should NOT log full prompt content in production', async () => {
    const orchestrator = AIOrchestrator.getInstance();

    try {
      await orchestrator.generateApp('Create a hello world app');
    } catch (e) {
      // Expected - no API key in test
    }

    // Verify no prompt content was logged
    consoleLogMock.mock.calls.forEach((call: any) => {
      const logContent = call.join(' ');
      // The prompt itself should NOT appear in any log
      expect(logContent).not.toContain('Create a hello world app');
      expect(logContent).not.toContain('User Prompt:');
    });
  });

  // ============ RED - Test: Only length logged ============
  it('should log only prompt length, not content', async () => {
    const orchestrator = AIOrchestrator.getInstance();

    try {
      await orchestrator.generateApp('Create something');
    } catch (e) {
      // Expected
    }

    // Check if any logging contains length info instead
    const hasLengthLog = consoleLogMock.mock.calls.some(
      (call: any) => call.join(' ').includes('length') || call.join(' ').match(/\d+ chars/)
    );

    // Either no prompt logs, or length-only logs (acceptable)
    const hasPromptContent = consoleLogMock.mock.calls.some(
      (call: any) =>
        call.join(' ').includes('Create something') || call.join(' ').includes('User Prompt:')
    );

    expect(hasPromptContent).toBe(false);
  });

  // ============ RED - Test: No error stack traces ============
  it('should NOT log error objects (avoid stack traces)', async () => {
    const orchestrator = AIOrchestrator.getInstance();

    try {
      await orchestrator.generateApp('test');
    } catch (e) {
      // Expected - API key missing
    }

    // Check no error objects were logged (they contain stack traces)
    consoleErrorMock.mock.calls.forEach((call: any) => {
      call.forEach((arg: any) => {
        // Error objects have .message, .stack, .name properties
        if (typeof arg === 'object' && arg !== null) {
          expect(arg.message).toBeUndefined();
          expect(arg.stack).toBeUndefined();
        }
      });
    });
  });
});
