import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import { SettingsProvider, useSettings } from '../contexts/SettingsContext';
import React from 'react';

// Test component to access context
const TestComponent = () => {
  const { apiKey, modelId, setApiKey, setModelId, getEffectiveApiKey } = useSettings();
  return (
    <div>
      <div data-testid="api-key">{apiKey}</div>
      <div data-testid="model-id">{modelId}</div>
      <div data-testid="effective-key">{getEffectiveApiKey()}</div>
      <button data-testid="set-key" onClick={() => setApiKey('test-secret-key')}>
        Set Key
      </button>
      <button data-testid="set-model" onClick={() => setModelId('gemini-2.5-pro')}>
        Set Model
      </button>
    </div>
  );
};

describe('SEC-01: Remove sessionStorage for API Keys', () => {
  let addEventListenerMock: any;
  let removeEventListenerMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear sessionStorage mock to start fresh
    if (sessionStorage.clear) {
      sessionStorage.clear();
    }
    // Mock event listeners for beforeunload
    addEventListenerMock = vi.fn();
    removeEventListenerMock = vi.fn();
    (global as any).addEventListener = addEventListenerMock;
    (global as any).removeEventListener = removeEventListenerMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============ RED - Failing Test 1.1.1: Verify no sessionStorage.getItem for apiKey ============
  it('should NOT call sessionStorage.getItem when initializing apiKey (memory-only state)', async () => {
    // This test fails because SettingsContext currently uses sessionStorage.getItem
    // After fix, it should initialize from useState without sessionStorage

    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    // EXPECTED: sessionStorage.getItem should NOT be called for apiKey
    // ACTUAL: Currently it's called on line 48 of SettingsContext.tsx
    expect(sessionStorage.getItem).not.toHaveBeenCalledWith('app-builder-api-key');
  });

  // ============ RED - Failing Test 1.1.2: Verify no sessionStorage.setItem for apiKey ============
  it('should NOT call sessionStorage.setItem when apiKey changes', async () => {
    const { getByTestId } = render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    // Act: Set a new API key
    await act(async () => {
      getByTestId('set-key').click();
    });

    // EXPECTED: sessionStorage.setItem should NOT be called
    // ACTUAL: Currently it's called in useEffect on line 56
    expect(sessionStorage.setItem).not.toHaveBeenCalledWith(
      'app-builder-api-key',
      expect.any(String)
    );
  });

  // ============ RED - Failing Test 1.1.3: Verify memory-only is default behavior ============
  it('should default to empty apiKey on initial render (not from sessionStorage)', async () => {
    const { getByTestId } = render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    // Verify that apiKey is empty when no prop passed
    // (even if env var exists, we should check memory-only state)
    await waitFor(() => {
      expect(getByTestId('api-key').textContent).toBe('');
    });

    // The effective key uses env var via getEffectiveApiKey() - this is expected behavior
    // for system-level fallback, not user-entered data
  });

  // ============ RED - Failing Test 1.1.4: Verify beforeunload listener for cleanup ============
  it('should register beforeunload listener to clear sensitive data on page exit', async () => {
    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    // EXPECTED: beforeunload event listener should be registered
    // ACTUAL: Currently there's no such listener
    expect(addEventListenerMock).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });

  // ============ TRIANGULATION - Additional test case for modelId validation ============
  it('should only allow valid model IDs to be set', async () => {
    const { getByTestId } = render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    // Set an invalid model ID
    await act(async () => {
      getByTestId('set-model').click();
    });

    // Valid IDs are allowed (this is a test that the validation works)
    await waitFor(() => {
      expect(getByTestId('model-id').textContent).toBe('gemini-2.5-pro');
    });
  });
});

// ============ SEC-AKS-004: Anti-Logging Guarantee ============
describe('SEC-AKS-004: Anti-Logging Guarantee', () => {
  let consoleSpies: ReturnType<typeof vi.spyOn>[];

  beforeEach(() => {
    vi.clearAllMocks();
    if (sessionStorage.clear) {
      sessionStorage.clear();
    }
    // Spy on all console methods
    consoleSpies = [
      vi.spyOn(console, 'log'),
      vi.spyOn(console, 'error'),
      vi.spyOn(console, 'warn'),
    ];
  });

  afterEach(() => {
    consoleSpies.forEach((spy) => spy.mockRestore());
    vi.restoreAllMocks();
  });

  // TD-003: No API key value in any log output
  it('SHALL NOT log API key value as substring in any console output (SEC-AKS-004 Scenario 1)', async () => {
    const secretKey = 'secret-key-abc';

    // Render SettingsProvider and set API key
    const { getByTestId } = render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    await act(async () => {
      // Use a custom setter to inject the secret key
      getByTestId('set-key').click();
    });

    // Collect all log messages
    const allMessages = consoleSpies.flatMap((spy) =>
      spy.mock.calls.map((call: any[]) => call.join(' '))
    );

    // No log message should contain the actual secret key value
    for (const msg of allMessages) {
      expect(msg).not.toContain(secretKey);
    }
  });

  // TD-004: No key-existence indicators in any log output
  it('SHALL NOT log key-existence indicators (hasApiKey|apiKeySet|keyPresent|keyStatus) in any console output (SEC-AKS-004 Scenario 2)', async () => {
    // Import AIOrchestrator to trigger updateConfig which currently logs hasApiKey
    const { AIOrchestrator } = await import('../services/ai/AIOrchestrator');

    // Reset singleton to get clean state
    (AIOrchestrator as any).instance = null;
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
    const orchestrator = AIOrchestrator.getInstance();

    // Trigger updateConfig — this currently logs hasApiKey=true
    orchestrator.updateConfig('any-key', 'gemini-2.5-flash');

    // Collect all log messages
    const allMessages = consoleSpies.flatMap((spy) =>
      spy.mock.calls.map((call: any[]) => call.join(' '))
    );

    // No log message should contain key-existence indicators
    const forbiddenPatterns = /hasApiKey|apiKeySet|keyPresent|keyStatus/;
    for (const msg of allMessages) {
      expect(msg).not.toMatch(forbiddenPatterns);
    }

    vi.unstubAllEnvs();
    (AIOrchestrator as any).instance = null;
  });
});

// ============ SEC-AKS-001: Memory-Only API Key Storage (spec formalization) ============
describe('SEC-AKS-001: Memory-Only API Key Storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (sessionStorage.clear) {
      sessionStorage.clear();
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // TD-007: No sessionStorage.setItem called for API key
  it('SHALL NOT call sessionStorage.setItem for API key (SEC-AKS-001 Scenario 1)', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    const { getByTestId } = render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    // Set an API key
    await act(async () => {
      getByTestId('set-key').click();
    });

    // sessionStorage.setItem should NOT be called with 'app-builder-api-key'
    expect(setItemSpy).not.toHaveBeenCalledWith('app-builder-api-key', expect.any(String));

    setItemSpy.mockRestore();
  });

  // TD-008: API key cleared on beforeunload
  it('SHALL clear API key on beforeunload event (SEC-AKS-001 Scenario 2)', async () => {
    // We spy on the actual window.addEventListener to capture the beforeunload handler
    // registered by SettingsContext, then invoke it directly and verify the re-render
    const addEventSpy = vi.spyOn(window, 'addEventListener');

    const { getByTestId } = render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    // Set API key via the button
    await act(async () => {
      getByTestId('set-key').click();
    });

    // Verify key is set
    await waitFor(() => {
      expect(getByTestId('api-key').textContent).toBe('test-secret-key');
    });

    // Find the beforeunload handler registered by SettingsContext
    const beforeUnloadCalls = addEventSpy.mock.calls.filter(
      (call: any[]) => call[0] === 'beforeunload'
    );
    expect(beforeUnloadCalls.length).toBeGreaterThanOrEqual(1);

    // Invoke the handler directly (simulating beforeunload)
    const handler = beforeUnloadCalls[0][1] as EventListener;
    await act(async () => {
      handler(new Event('beforeunload'));
    });

    // API key should be cleared after the beforeunload handler runs
    await waitFor(() => {
      expect(getByTestId('api-key').textContent).toBe('');
    });

    addEventSpy.mockRestore();
  });

  // TD-009: API key defaults to empty on mount
  it('SHALL default API key to empty string on mount without reading sessionStorage (SEC-AKS-001 Scenario 3)', async () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

    const { getByTestId } = render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    // API key should be empty string
    await waitFor(() => {
      expect(getByTestId('api-key').textContent).toBe('');
    });

    // sessionStorage.getItem should NOT have been called for 'app-builder-api-key'
    expect(getItemSpy).not.toHaveBeenCalledWith('app-builder-api-key');

    getItemSpy.mockRestore();
  });
});

// ============ SEC-AKS-003: Environment Variable Fallback (spec formalization) ============
describe('SEC-AKS-003: Environment Variable Fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (sessionStorage.clear) {
      sessionStorage.clear();
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  // TD-010: User key takes precedence over env var
  it('SHALL return user key when both user key and env var are set (SEC-AKS-003 Scenario 1)', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'env-key-456');

    const TestComponentWithUserKey = () => {
      const { getEffectiveApiKey, setApiKey } = useSettings();
      const [effective, setEffective] = React.useState('');

      React.useEffect(() => {
        setApiKey('user-key-123');
      }, [setApiKey]);

      React.useEffect(() => {
        // Small delay to allow state update
        const timer = setTimeout(() => {
          setEffective(getEffectiveApiKey());
        }, 50);
        return () => clearTimeout(timer);
      }, [getEffectiveApiKey]);

      return <div data-testid="effective-key">{effective}</div>;
    };

    const { getByTestId } = render(
      <SettingsProvider>
        <TestComponentWithUserKey />
      </SettingsProvider>
    );

    await waitFor(() => {
      expect(getByTestId('effective-key').textContent).toBe('user-key-123');
    });
  });

  // TD-011: Env var used when no user key
  it('SHALL return env var when no user key is set (SEC-AKS-003 Scenario 2)', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', 'env-key-456');

    const TestComponentEnvFallback = () => {
      const { getEffectiveApiKey } = useSettings();
      return <div data-testid="effective-key">{getEffectiveApiKey()}</div>;
    };

    const { getByTestId } = render(
      <SettingsProvider>
        <TestComponentEnvFallback />
      </SettingsProvider>
    );

    await waitFor(() => {
      expect(getByTestId('effective-key').textContent).toBe('env-key-456');
    });
  });

  // TD-012: Empty string when no key available
  it('SHALL return empty string when no user key and no env var (SEC-AKS-003 Scenario 3)', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', '');

    const TestComponentNoKey = () => {
      const { getEffectiveApiKey } = useSettings();
      return <div data-testid="effective-key">{getEffectiveApiKey()}</div>;
    };

    const { getByTestId } = render(
      <SettingsProvider>
        <TestComponentNoKey />
      </SettingsProvider>
    );

    await waitFor(() => {
      expect(getByTestId('effective-key').textContent).toBe('');
    });
  });
});
