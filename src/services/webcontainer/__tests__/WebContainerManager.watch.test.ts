import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebContainerManager } from '../WebContainerManager';

// ============================================
// MOCK SETUP — vi.hoisted for mock references
// ============================================

const { mockContainer, mockBoot } = vi.hoisted(() => {
  const mockWatcher = { close: vi.fn() };

  const container = {
    mount: vi.fn().mockResolvedValue(undefined),
    spawn: vi.fn().mockResolvedValue({
      output: { pipeTo: vi.fn() },
      exit: Promise.resolve(0) as Promise<number>,
    }),
    fs: {
      readFile: vi.fn().mockResolvedValue(new TextEncoder().encode('file contents')),
      writeFile: vi.fn().mockResolvedValue(undefined),
      mkdir: vi.fn().mockResolvedValue(undefined),
      readdir: vi.fn().mockResolvedValue([]),
      watch: vi.fn().mockReturnValue(mockWatcher),
    },
    on: vi.fn(),
  };

  return {
    mockContainer: container,
    mockBoot: vi.fn().mockResolvedValue(container),
  };
});

vi.mock('@webcontainer/api', () => ({
  WebContainer: {
    boot: mockBoot,
  },
}));

vi.mock('../readDirRecursive', () => ({
  readDirRecursive: vi.fn().mockResolvedValue([]),
}));

describe('WebContainerManager.watch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the singleton
    (WebContainerManager as any).instance = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
    (WebContainerManager as any).instance = null;
  });

  // -------------------------------------------------------
  // Task 1.1 — RED: WCM.watch() returns IFSWatcher when booted
  // Spec: FSW-001 scenario 1 — watch fires callback for file changes
  // -------------------------------------------------------
  it('returns an IFSWatcher when WebContainer is booted', async () => {
    // Given — boot the container
    const manager = await WebContainerManager.getInstance();
    const callback = vi.fn();

    // When — call watch() with a callback
    const watcher = manager.watch(callback);

    // Then — fs.watch was called on root with recursive:true
    expect(mockContainer.fs.watch).toHaveBeenCalledWith(
      '/',
      { recursive: true },
      expect.any(Function)
    );
    // And — the returned watcher has a close method (IFSWatcher contract)
    expect(watcher).not.toBeNull();
    expect(typeof (watcher as any).close).toBe('function');
  });

  // -------------------------------------------------------
  // Task 1.1 — TRIANGULATE: verify callback is invoked on file change
  // Spec: FSW-001 scenario 1 — callback invoked with event type and string filename
  // -------------------------------------------------------
  it('invokes consumer callback when watcher fires a change event', async () => {
    // Given — boot the container
    const manager = await WebContainerManager.getInstance();
    const callback = vi.fn();

    // When — call watch() and simulate a change event from fs.watch
    manager.watch(callback);
    const watchCallback = mockContainer.fs.watch.mock.calls[0][2] as (
      event: 'rename' | 'change',
      filename: string | Uint8Array
    ) => void;
    watchCallback('change', 'src/App.tsx');

    // Then — consumer callback receives the event and decoded filename
    expect(callback).toHaveBeenCalledWith('change', 'src/App.tsx');
  });

  // -------------------------------------------------------
  // Task 1.2 — RED: WCM.watch() returns null before boot
  // Spec: FSW-001 scenario 2 — boot guard returns null before boot
  // -------------------------------------------------------
  it('returns null when WebContainer is not booted', () => {
    // Given — create a fresh WCM without booting
    const manager = new (WebContainerManager as any)();
    const callback = vi.fn();

    // When — call watch() before boot
    const watcher = manager.watch(callback);

    // Then — returns null (graceful, not an error)
    expect(watcher).toBeNull();
  });

  // -------------------------------------------------------
  // Task 1.3 — RED: Excluded paths are filtered
  // Spec: FSW-001 scenario 3 — node_modules/, .git/, dist/ do NOT invoke callback
  // -------------------------------------------------------
  it('does NOT invoke callback for node_modules paths', async () => {
    // Given
    const manager = await WebContainerManager.getInstance();
    const callback = vi.fn();
    manager.watch(callback);
    const watchCallback = mockContainer.fs.watch.mock.calls[0][2] as (
      event: 'rename' | 'change',
      filename: string | Uint8Array
    ) => void;

    // When — fire event with node_modules path
    watchCallback('change', 'node_modules/react/index.js');

    // Then — consumer callback is NOT invoked
    expect(callback).not.toHaveBeenCalled();
  });

  it('does NOT invoke callback for .git paths', async () => {
    // Given
    const manager = await WebContainerManager.getInstance();
    const callback = vi.fn();
    manager.watch(callback);
    const watchCallback = mockContainer.fs.watch.mock.calls[0][2] as (
      event: 'rename' | 'change',
      filename: string | Uint8Array
    ) => void;

    // When — fire event with .git path
    watchCallback('change', '.git/config');

    // Then — consumer callback is NOT invoked
    expect(callback).not.toHaveBeenCalled();
  });

  it('does NOT invoke callback for dist paths', async () => {
    // Given
    const manager = await WebContainerManager.getInstance();
    const callback = vi.fn();
    manager.watch(callback);
    const watchCallback = mockContainer.fs.watch.mock.calls[0][2] as (
      event: 'rename' | 'change',
      filename: string | Uint8Array
    ) => void;

    // When — fire event with dist path
    watchCallback('change', 'dist/bundle.js');

    // Then — consumer callback is NOT invoked
    expect(callback).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------
  // Task 1.3 — TRIANGULATE: non-excluded paths DO invoke callback
  // -------------------------------------------------------
  it('invokes callback for non-excluded paths like src/App.tsx', async () => {
    // Given
    const manager = await WebContainerManager.getInstance();
    const callback = vi.fn();
    manager.watch(callback);
    const watchCallback = mockContainer.fs.watch.mock.calls[0][2] as (
      event: 'rename' | 'change',
      filename: string | Uint8Array
    ) => void;

    // When — fire event with a normal source file
    watchCallback('change', 'src/App.tsx');

    // Then — consumer callback IS invoked
    expect(callback).toHaveBeenCalledWith('change', 'src/App.tsx');
  });

  // -------------------------------------------------------
  // Task 1.4 — RED: Uint8Array filename is decoded to string
  // Spec: FSW-001 scenario 4 — Uint8Array filename decoded via TextDecoder
  // -------------------------------------------------------
  it('decodes Uint8Array filename to string before passing to callback', async () => {
    // Given
    const manager = await WebContainerManager.getInstance();
    const callback = vi.fn();
    manager.watch(callback);
    const watchCallback = mockContainer.fs.watch.mock.calls[0][2] as (
      event: 'rename' | 'change',
      filename: string | Uint8Array
    ) => void;

    // When — fire event with Uint8Array filename (as WC API may send)
    const uint8Filename = new TextEncoder().encode('src/components/Header.tsx');
    watchCallback('change', uint8Filename);

    // Then — consumer callback receives a decoded string, NOT Uint8Array
    expect(callback).toHaveBeenCalledWith('change', 'src/components/Header.tsx');
  });

  // -------------------------------------------------------
  // Task 1.5 — RED: Graceful fallback when fs.watch throws
  // Spec: FSW-001 scenario 5 — warning logged, null returned
  // -------------------------------------------------------
  it('returns null and logs warning when fs.watch throws', async () => {
    // Given — mock fs.watch to throw (simulates unsupported recursive watch)
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockContainer.fs.watch.mockImplementationOnce(() => {
      throw new Error('Recursive watch is not supported');
    });
    const manager = await WebContainerManager.getInstance();
    const callback = vi.fn();

    // When — call watch() and it catches the error
    const watcher = manager.watch(callback);

    // Then — returns null gracefully (no throw)
    expect(watcher).toBeNull();
    // And — a warning was logged via logWarnSafe (single string arg)
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Recursive watch failed'));

    warnSpy.mockRestore();
  });
});
