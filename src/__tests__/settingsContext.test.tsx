import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { SettingsProvider, useSettings } from '../contexts/SettingsContext';
import React from 'react';

const TestComponent = () => {
  const { apiKey } = useSettings();
  return <div data-testid="api-key">{apiKey}</div>;
};

describe('SettingsContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  // SEC-01: Memory-only state for API key (updated test)
  it('should use memory-only state for API key (no sessionStorage)', async () => {
    sessionStorage.setItem('app-builder-api-key', 'old-session-key');
    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );
    // Verify sessionStorage.getItem is NOT called for api-key
    // Note: modelId may use sessionStorage, but API key must NOT
    expect(sessionStorage.getItem).not.toHaveBeenCalledWith('app-builder-api-key');
  });
});
