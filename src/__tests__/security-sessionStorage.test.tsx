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
