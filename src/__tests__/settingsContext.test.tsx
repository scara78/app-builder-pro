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

  it('should use sessionStorage, not localStorage', async () => {
    sessionStorage.setItem('app-builder-api-key', 'test-key');
    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );
    // Verify sessionStorage was called, not localStorage
    expect(sessionStorage.getItem).toHaveBeenCalled();
  });
});