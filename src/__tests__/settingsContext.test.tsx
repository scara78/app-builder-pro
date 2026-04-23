import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { SettingsProvider, useSettings } from '../contexts/SettingsContext';

// Mock import.meta.env for consistent test results
const originalEnv = import.meta.env;

describe('SettingsContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // SEC-01: Memory-only state for API key (updated test)
  it('should use memory-only state for API key (no sessionStorage)', () => {
    sessionStorage.setItem('app-builder-api-key', 'old-session-key');
    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    });
    // Verify sessionStorage.getItem is NOT called for api-key
    // Note: modelId may use sessionStorage, but API key must NOT
    expect(sessionStorage.getItem).not.toHaveBeenCalledWith('app-builder-api-key');
    // API key starts empty (memory-only, ignores sessionStorage)
    expect(result.current.apiKey).toBe('');
  });

  it('should provide setApiKey to update API key', () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    });

    expect(result.current.apiKey).toBe('');

    act(() => {
      result.current.setApiKey('test-api-key-123');
    });

    expect(result.current.apiKey).toBe('test-api-key-123');
  });

  it('should provide setModelId to update model ID', () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    });

    expect(result.current.modelId).toBe('gemini-2.5-flash');

    act(() => {
      result.current.setModelId('gemini-2.5-pro');
    });

    expect(result.current.modelId).toBe('gemini-2.5-pro');
  });

  it('should ignore invalid model IDs', () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    });

    const initialModel = result.current.modelId;

    act(() => {
      result.current.setModelId('invalid-model-id');
    });

    // Should not change to invalid model
    expect(result.current.modelId).toBe(initialModel);
  });

  it('should return effective API key from state or env fallback', () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    });

    // When no API key is set in state, getEffectiveApiKey falls back to env or ''
    // The actual value depends on whether VITE_GEMINI_API_KEY is set
    const effectiveKey = result.current.getEffectiveApiKey();
    expect(typeof effectiveKey).toBe('string');

    // After explicitly setting a key, it should be returned
    act(() => {
      result.current.setApiKey('my-explicit-key');
    });

    expect(result.current.getEffectiveApiKey()).toBe('my-explicit-key');
  });

  it('should throw error when useSettings is used outside provider', () => {
    // Suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useSettings());
    }).toThrow('useSettings must be used within a SettingsProvider');

    spy.mockRestore();
  });
});
