import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFileTree } from '../useFileTree';

// Mock WebContainerManager
vi.mock('../../services/webcontainer/WebContainerManager', () => ({
  WebContainerManager: {
    getInstance: vi.fn(),
  },
}));

import { WebContainerManager } from '../../services/webcontainer/WebContainerManager';

const mockWebContainerManager = {
  readDir: vi.fn(),
  watch: vi.fn().mockReturnValue({ close: vi.fn() }),
  isWriting: false,
};

describe('useFileTree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============ Task 3.1: Hook returns initial loading state ============
  describe('initial loading state', () => {
    it('returns { files: [], isLoading: true, error: null, refresh } before WC ready', () => {
      // Given - WCM.getInstance never resolves (simulates WC not ready)
      (WebContainerManager.getInstance as ReturnType<typeof vi.fn>).mockReturnValue(
        new Promise(() => {}) // never resolves
      );

      // When
      const { result } = renderHook(() => useFileTree());

      // Then
      expect(result.current.files).toEqual([]);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBe(null);
      expect(typeof result.current.refresh).toBe('function');
    });
  });

  // ============ Task 3.2: Hook populates files after WC ready ============
  describe('populates files after WC ready', () => {
    it('sets files from WCM.readDir("/") result and isLoading: false', async () => {
      // Given
      const projectFiles = [{ path: 'src/App.tsx', content: 'export default function App() {}' }];
      mockWebContainerManager.readDir.mockResolvedValue(projectFiles);
      (WebContainerManager.getInstance as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockWebContainerManager
      );

      // When
      const { result } = renderHook(() => useFileTree());

      // Then
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.files).toEqual(projectFiles);
      expect(result.current.error).toBe(null);
    });

    it('handles multiple files from readDir result', async () => {
      // Given
      const projectFiles = [
        { path: 'src/App.tsx', content: 'export default function App() {}' },
        { path: 'src/index.tsx', content: 'import React from "react"' },
        { path: 'package.json', content: '{"name": "test"}' },
      ];
      mockWebContainerManager.readDir.mockResolvedValue(projectFiles);
      (WebContainerManager.getInstance as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockWebContainerManager
      );

      // When
      const { result } = renderHook(() => useFileTree());

      // Then
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.files).toHaveLength(3);
      expect(result.current.files).toEqual(projectFiles);
    });
  });

  // ============ Task 3.3: Hook captures read errors ============
  describe('captures read errors', () => {
    it('sets error and isLoading: false when readDir rejects', async () => {
      // Given
      const readError = new Error('WebContainer is not booted');
      mockWebContainerManager.readDir.mockRejectedValue(readError);
      (WebContainerManager.getInstance as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockWebContainerManager
      );

      // When
      const { result } = renderHook(() => useFileTree());

      // Then
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.error).toBe(readError);
      expect(result.current.files).toEqual([]);
    });
  });

  // ============ Task 3.4: refresh() re-reads filesystem ============
  describe('refresh re-reads filesystem', () => {
    it('triggers new readDir and updates files on refresh()', async () => {
      // Given - initial load
      const initialFiles = [{ path: 'src/App.tsx', content: '' }];
      const refreshedFiles = [
        { path: 'src/App.tsx', content: '' },
        { path: 'src/utils.ts', content: '' },
      ];
      mockWebContainerManager.readDir
        .mockResolvedValueOnce(initialFiles)
        .mockResolvedValueOnce(refreshedFiles);
      (WebContainerManager.getInstance as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockWebContainerManager
      );

      const { result } = renderHook(() => useFileTree());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.files).toEqual(initialFiles);

      // When - call refresh
      await act(async () => {
        await result.current.refresh();
      });

      // Then - files updated
      expect(result.current.files).toEqual(refreshedFiles);
      expect(mockWebContainerManager.readDir).toHaveBeenCalledTimes(2);
    });

    it('clears error after refresh succeeds', async () => {
      // Given - initial load fails
      const readError = new Error('WebContainer is not booted');
      const recoveredFiles = [{ path: 'src/App.tsx', content: '' }];
      mockWebContainerManager.readDir
        .mockRejectedValueOnce(readError)
        .mockResolvedValueOnce(recoveredFiles);
      (WebContainerManager.getInstance as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockWebContainerManager
      );

      const { result } = renderHook(() => useFileTree());

      // Wait for error
      await waitFor(() => {
        expect(result.current.error).toBe(readError);
      });

      // When - refresh succeeds
      await act(async () => {
        await result.current.refresh();
      });

      // Then - error cleared, files populated
      expect(result.current.error).toBe(null);
      expect(result.current.files).toEqual(recoveredFiles);
    });
  });

  // ============ Task 3.5: Unmount cancellation ============
  describe('unmount cancellation', () => {
    it('skips state updates after unmount during async read', async () => {
      // Given - WCM.getInstance resolves slowly
      let resolveInstance!: (value: unknown) => void;
      const slowInstancePromise = new Promise((resolve) => {
        resolveInstance = resolve;
      });
      (WebContainerManager.getInstance as ReturnType<typeof vi.fn>).mockReturnValue(
        slowInstancePromise
      );

      const { result, unmount } = renderHook(() => useFileTree());

      // When - unmount before WC resolves
      unmount();

      // Now resolve the instance (after unmount)
      resolveInstance(mockWebContainerManager);

      // Then - state should remain at initial values (no update after unmount)
      // Wait a tick to let the async code run
      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(result.current.files).toEqual([]);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBe(null);
    });

    it('handles rapid mount/unmount without state leaks', async () => {
      // Given - slow instance promise
      let resolveCount = 0;
      const promises: Array<(value: unknown) => void> = [];
      (WebContainerManager.getInstance as ReturnType<typeof vi.fn>).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveCount++;
            promises.push(resolve);
          })
      );

      // When - mount and immediately unmount
      const { result, unmount } = renderHook(() => useFileTree());
      unmount();

      // Resolve all pending promises
      await act(async () => {
        promises.forEach((r) => r(mockWebContainerManager));
        await new Promise((r) => setTimeout(r, 50));
      });

      // Then - no state update after unmount
      expect(result.current.isLoading).toBe(true);
      expect(result.current.files).toEqual([]);
    });
  });
});
