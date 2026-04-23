import React, { useEffect } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { QuotaStatus } from '../components/common/QuotaStatus';

// Control flag for mocking useSettings return value
let mockEffectiveApiKey = '';

// Mock useSettings — must be at top level for hoisting
vi.mock('../contexts/SettingsContext', () => ({
  useSettings: () => ({
    apiKey: '',
    modelId: 'gemini-2.5-flash',
    setApiKey: vi.fn(),
    setModelId: vi.fn(),
    getEffectiveApiKey: () => mockEffectiveApiKey,
  }),
  SettingsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock quotaManager — singleton with internal timer state
vi.mock('../services/ai/AIQuotaManager', () => ({
  quotaManager: {
    getStats: vi.fn(),
  },
}));

// Import mocked modules after vi.mock
import { quotaManager } from '../services/ai/AIQuotaManager';

// Mock timers to control the interval in QuotaStatus
vi.useFakeTimers();

const mockStats = {
  requestCount: 0,
  errorCount: 0,
  circuitOpen: false,
  requestsRemaining: 15,
  timeUntilReset: 60000,
};

describe('QuotaStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    (quotaManager.getStats as ReturnType<typeof vi.fn>).mockReturnValue({ ...mockStats });
    mockEffectiveApiKey = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('no API key state', () => {
    it('should render nothing when getEffectiveApiKey returns empty', () => {
      mockEffectiveApiKey = '';

      const { container } = render(<QuotaStatus />);

      act(() => {
        vi.advanceTimersByTime(0);
      });

      // No quota-status element rendered when no effective API key
      expect(container.querySelector('[data-testid="quota-status"]')).toBeNull();
    });
  });

  describe('ok state (green)', () => {
    it('should render ok state when request count is low', () => {
      mockEffectiveApiKey = 'test-api-key';
      (quotaManager.getStats as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockStats,
        requestCount: 3,
        requestsRemaining: 12,
      });

      const { container } = render(<QuotaStatus />);

      act(() => {
        vi.advanceTimersByTime(0);
      });

      const okStatus = container.querySelector('[data-testid="quota-status"][data-level="ok"]');
      expect(okStatus).not.toBeNull();
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('should display request count in title attribute', () => {
      mockEffectiveApiKey = 'test-api-key';
      (quotaManager.getStats as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockStats,
        requestCount: 2,
        requestsRemaining: 13,
      });

      const { container } = render(<QuotaStatus />);

      act(() => {
        vi.advanceTimersByTime(0);
      });

      const statusElement = container.querySelector(
        '[data-testid="quota-status"][data-level="ok"]'
      );
      expect(statusElement?.getAttribute('title')).toBe('2/15 requests used');
    });

    it('should show requests remaining count in ok state', () => {
      mockEffectiveApiKey = 'test-api-key';
      (quotaManager.getStats as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockStats,
        requestCount: 5,
        requestsRemaining: 10,
      });

      render(<QuotaStatus />);

      act(() => {
        vi.advanceTimersByTime(0);
      });

      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  describe('warning state (yellow)', () => {
    it('should render warning state when request count exceeds 10', () => {
      mockEffectiveApiKey = 'test-api-key';
      (quotaManager.getStats as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockStats,
        requestCount: 11,
        requestsRemaining: 4,
      });

      const { container } = render(<QuotaStatus />);

      act(() => {
        vi.advanceTimersByTime(0);
      });

      const warningStatus = container.querySelector(
        '[data-testid="quota-status"][data-level="warning"]'
      );
      expect(warningStatus).not.toBeNull();
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('should display request count in title for warning state', () => {
      mockEffectiveApiKey = 'test-api-key';
      (quotaManager.getStats as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockStats,
        requestCount: 12,
        requestsRemaining: 3,
      });

      const { container } = render(<QuotaStatus />);

      act(() => {
        vi.advanceTimersByTime(0);
      });

      const statusElement = container.querySelector(
        '[data-testid="quota-status"][data-level="warning"]'
      );
      expect(statusElement?.getAttribute('title')).toBe('12/15 requests used');
    });
  });

  describe('circuit-open state (red)', () => {
    it('should render error state when circuit breaker is open', () => {
      mockEffectiveApiKey = 'test-api-key';
      (quotaManager.getStats as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockStats,
        requestCount: 5,
        errorCount: 7,
        circuitOpen: true,
      });

      const { container } = render(<QuotaStatus />);

      act(() => {
        vi.advanceTimersByTime(0);
      });

      const errorStatus = container.querySelector(
        '[data-testid="quota-status"][data-level="error"]'
      );
      expect(errorStatus).not.toBeNull();
      expect(screen.getByText('Circuit Break')).toBeInTheDocument();
    });

    it('should display error count in title for circuit breaker', () => {
      mockEffectiveApiKey = 'test-api-key';
      (quotaManager.getStats as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockStats,
        requestCount: 8,
        errorCount: 5,
        circuitOpen: true,
      });

      const { container } = render(<QuotaStatus />);

      act(() => {
        vi.advanceTimersByTime(0);
      });

      const statusElement = container.querySelector(
        '[data-testid="quota-status"][data-level="error"]'
      );
      expect(statusElement?.getAttribute('title')).toContain('5 errors');
    });

    it('should prioritize circuit breaker over warning state', () => {
      mockEffectiveApiKey = 'test-api-key';
      (quotaManager.getStats as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockStats,
        requestCount: 12,
        errorCount: 6,
        circuitOpen: true,
        requestsRemaining: 3,
      });

      const { container } = render(<QuotaStatus />);

      act(() => {
        vi.advanceTimersByTime(0);
      });

      // Circuit breaker takes priority over warning
      const errorStatus = container.querySelector(
        '[data-testid="quota-status"][data-level="error"]'
      );
      expect(errorStatus).not.toBeNull();
      const warningStatus = container.querySelector(
        '[data-testid="quota-status"][data-level="warning"]'
      );
      expect(warningStatus).toBeNull();
    });
  });

  describe('periodic updates', () => {
    it('should call getStats on mount', () => {
      mockEffectiveApiKey = 'test-key';
      (quotaManager.getStats as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockStats,
        requestCount: 1,
        requestsRemaining: 14,
      });

      render(<QuotaStatus />);

      act(() => {
        vi.advanceTimersByTime(0);
      });

      // getStats should have been called at least once (initial)
      expect(quotaManager.getStats).toHaveBeenCalled();
    });

    it('should clean up interval on unmount', () => {
      mockEffectiveApiKey = 'test-key';
      (quotaManager.getStats as ReturnType<typeof vi.fn>).mockReturnValue({
        ...mockStats,
        requestCount: 1,
        requestsRemaining: 14,
      });

      const { unmount } = render(<QuotaStatus />);

      act(() => {
        vi.advanceTimersByTime(0);
      });

      const callCountBefore = (quotaManager.getStats as ReturnType<typeof vi.fn>).mock.calls.length;

      unmount();

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // No additional calls after unmount (interval cleaned up)
      const callCountAfter = (quotaManager.getStats as ReturnType<typeof vi.fn>).mock.calls.length;
      expect(callCountAfter).toBe(callCountBefore);
    });
  });
});
