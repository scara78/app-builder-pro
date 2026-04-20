import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIOrchestrator } from '../services/ai/AIOrchestrator';

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
