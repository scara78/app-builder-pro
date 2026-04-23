import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConsoleLogs } from '../useConsoleLogs';

describe('useConsoleLogs', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('buffer accumulation and 100ms flush', () => {
    it('starts with empty logs', () => {
      const { result } = renderHook(() => useConsoleLogs());
      expect(result.current.logs).toEqual([]);
    });

    it('does NOT add logs immediately on addLog — waits for flush', () => {
      const { result } = renderHook(() => useConsoleLogs());
      act(() => {
        result.current.addLog('npm warn deprecated foo');
      });
      // Before flush, logs should still be empty
      expect(result.current.logs).toEqual([]);
    });

    it('flushes buffered logs after 100ms', () => {
      const { result } = renderHook(() => useConsoleLogs());
      act(() => {
        result.current.addLog('npm warn deprecated foo');
        result.current.addLog('added 42 packages');
      });
      // Before flush
      expect(result.current.logs).toEqual([]);
      // Advance 100ms to trigger flush
      act(() => {
        vi.advanceTimersByTime(100);
      });
      // After flush, both logs should appear classified
      expect(result.current.logs).toHaveLength(2);
      expect(result.current.logs[0].type).toBe('warn');
      expect(result.current.logs[0].text).toBe('npm warn deprecated foo');
      expect(result.current.logs[1].type).toBe('success');
      expect(result.current.logs[1].text).toBe('added 42 packages');
    });

    it('includes timestamp in HH:MM:SS format for each log', () => {
      const { result } = renderHook(() => useConsoleLogs());
      act(() => {
        result.current.addLog('some text');
        vi.advanceTimersByTime(100);
      });
      expect(result.current.logs[0].timestamp).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    it('handles rapid output — 50 logs in 100ms flushed as single batch', () => {
      const { result } = renderHook(() => useConsoleLogs());
      act(() => {
        for (let i = 0; i < 50; i++) {
          result.current.addLog(`log line ${i}`);
        }
      });
      expect(result.current.logs).toHaveLength(0);
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(result.current.logs).toHaveLength(50);
    });
  });

  describe('clearLogs resets buffer and logs', () => {
    it('clears existing logs and buffered entries', () => {
      const { result } = renderHook(() => useConsoleLogs());
      act(() => {
        result.current.addLog('added 5 packages');
        vi.advanceTimersByTime(100);
      });
      expect(result.current.logs).toHaveLength(1);

      act(() => {
        result.current.addLog('npm warn something');
        result.current.clearLogs();
      });
      expect(result.current.logs).toEqual([]);
      // The buffered entry should also be gone
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(result.current.logs).toEqual([]);
    });
  });

  describe('cleanup on unmount', () => {
    it('clears flush timer on unmount', () => {
      const { result, unmount } = renderHook(() => useConsoleLogs());
      act(() => {
        result.current.addLog('some text');
      });
      unmount();
      // If timer wasn't cleared, advancing time would throw or cause side effects
      act(() => {
        vi.advanceTimersByTime(200);
      });
      // No error means cleanup worked
    });
  });
});
