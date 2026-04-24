import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFileTree } from '../useFileTree';

// Mock WebContainerManager — hoisted for vi.mock usage
const { mockWebContainerManager, mockWatcher, mockGetInstance } = vi.hoisted(() => {
  const watcher = { close: vi.fn() };
  const manager = {
    readDir: vi.fn().mockResolvedValue([]),
    watch: vi.fn().mockReturnValue(watcher),
    isWriting: false,
  };
  return {
    mockWebContainerManager: manager,
    mockWatcher: watcher,
    mockGetInstance: vi.fn().mockResolvedValue(manager),
  };
});

vi.mock('../../services/webcontainer/WebContainerManager', () => ({
  WebContainerManager: {
    getInstance: mockGetInstance,
  },
}));

// Re-import after mock setup
import { WebContainerManager } from '../../services/webcontainer/WebContainerManager';

describe('useFileTree — watcher subscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // Default: WCM returns the mock manager
    mockGetInstance.mockResolvedValue(mockWebContainerManager);
    // Reset readDir completely to clear any residual mockResolvedValueOnce queues
    mockWebContainerManager.readDir.mockReset();
    mockWebContainerManager.readDir.mockResolvedValue([]);
    mockWebContainerManager.watch.mockReturnValue(mockWatcher);
    mockWebContainerManager.isWriting = false;
    mockWatcher.close.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -------------------------------------------------------
  // Task 3.1 — RED: useFileTree calls WCM.watch() after initial load
  // Spec: FSW-004 — watcher created after readDir completes
  // -------------------------------------------------------
  it('calls WCM.watch() after initial load completes', async () => {
    // Given
    const { result } = renderHook(() => useFileTree());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Then — watch was called after loadFiles completed
    expect(mockWebContainerManager.watch).toHaveBeenCalledTimes(1);
    expect(mockWebContainerManager.watch).toHaveBeenCalledWith(expect.any(Function));
  });

  // -------------------------------------------------------
  // Task 3.2 — RED: debounce coalesces rapid events
  // Spec: FSW-002 — 50 events within 300ms → single loadFiles call
  // -------------------------------------------------------
  it('debounces rapid watcher events — 50 events → 1 loadFiles call', async () => {
    // Given — resolve initial load
    const projectFiles = [{ path: 'src/App.tsx', content: '' }];
    mockWebContainerManager.readDir
      .mockResolvedValueOnce(projectFiles) // initial load
      .mockResolvedValueOnce([{ path: 'src/App.tsx', content: 'updated' }]); // after watcher debounce

    const { result } = renderHook(() => useFileTree());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Clear the initial loadFiles call count
    mockWebContainerManager.readDir.mockClear();

    // When — fire 50 watcher events rapidly
    const watchCallback = mockWebContainerManager.watch.mock.calls[0][0] as (
      event: 'rename' | 'change',
      filename: string
    ) => void;

    act(() => {
      for (let i = 0; i < 50; i++) {
        watchCallback('change', `src/file${i}.ts`);
      }
    });

    // Advance past debounce (300ms) + allow async loadFiles to resolve
    await act(async () => {
      vi.advanceTimersByTime(350);
      // Allow microtask queue to flush (loadFiles is async)
      await new Promise((r) => setTimeout(r, 10));
    });

    // Then — readDir called at least once (debounced, not 50 times)
    expect(mockWebContainerManager.readDir).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------
  // Task 3.3 — RED: watcher skips refresh when _isWriting is true
  // Spec: FSW-003 — circular protection: no refresh during write
  // -------------------------------------------------------
  it('skips refresh when WCM.isWriting is true', async () => {
    // Given — resolve initial load
    mockWebContainerManager.readDir.mockResolvedValue([{ path: 'src/App.tsx', content: '' }]);
    const { result } = renderHook(() => useFileTree());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockWebContainerManager.readDir.mockClear();

    // Set isWriting = true (simulating a writeFile in progress)
    mockWebContainerManager.isWriting = true;

    // When — fire watcher event and advance debounce
    const watchCallback = mockWebContainerManager.watch.mock.calls[0][0] as (
      event: 'rename' | 'change',
      filename: string
    ) => void;
    watchCallback('change', 'src/App.tsx');

    act(() => {
      vi.advanceTimersByTime(350);
    });

    // Then — loadFiles was NOT called (circular protection)
    expect(mockWebContainerManager.readDir).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------
  // Task 3.4 — RED: IFSWatcher.close() called on unmount
  // Spec: FSW-004 — watcher cleanup on unmount
  // -------------------------------------------------------
  it('calls watcher.close() on unmount', async () => {
    // Given
    mockWebContainerManager.readDir.mockResolvedValue([]);
    const { result, unmount } = renderHook(() => useFileTree());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Watcher was created
    expect(mockWebContainerManager.watch).toHaveBeenCalled();

    // When — unmount
    unmount();

    // Then — watcher.close() was called
    expect(mockWatcher.close).toHaveBeenCalled();
  });

  // -------------------------------------------------------
  // Task 3.5 — RED: debounce timer cleared on unmount
  // Spec: FSW-004 — debounce timer cleanup prevents stale updates
  // -------------------------------------------------------
  it('clears debounce timer on unmount — no stale loadFiles calls', async () => {
    // Given
    mockWebContainerManager.readDir
      .mockResolvedValueOnce([{ path: 'src/App.tsx', content: '' }])
      .mockResolvedValueOnce([{ path: 'src/App.tsx', content: 'updated' }]);

    const { result, unmount } = renderHook(() => useFileTree());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockWebContainerManager.readDir.mockClear();

    // When — fire watcher event then immediately unmount (before debounce fires)
    const watchCallback = mockWebContainerManager.watch.mock.calls[0][0] as (
      event: 'rename' | 'change',
      filename: string
    ) => void;
    watchCallback('change', 'src/App.tsx');

    // Unmount before debounce timer fires
    unmount();

    // Advance past debounce — should NOT trigger loadFiles
    act(() => {
      vi.advanceTimersByTime(350);
    });

    // Then — no loadFiles call after unmount
    expect(mockWebContainerManager.readDir).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------
  // Task 3.6 — RED: graceful degradation when watch returns null
  // Spec: FSW-004 — if watch fails, hook works with manual refresh only
  // -------------------------------------------------------
  it('degrades gracefully when watch returns null — manual refresh still works', async () => {
    // Given — watch returns null (unsupported or pre-boot)
    mockWebContainerManager.watch.mockReturnValue(null);
    // Reset readDir mock completely to avoid residual Once queues from other tests
    mockWebContainerManager.readDir.mockReset();
    mockWebContainerManager.readDir
      .mockResolvedValueOnce([{ path: 'src/App.tsx', content: '' }]) // initial load
      .mockResolvedValueOnce([{ path: 'src/App.tsx', content: 'v2' }]); // after refresh

    const { result } = renderHook(() => useFileTree());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Then — files loaded, no crash
    expect(result.current.files).toEqual([{ path: 'src/App.tsx', content: '' }]);

    // And — manual refresh still works
    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.files).toEqual([{ path: 'src/App.tsx', content: 'v2' }]);
  });
});
