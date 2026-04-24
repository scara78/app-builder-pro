import { useState, useEffect, useCallback, useRef } from 'react';
import { WebContainerManager } from '../services/webcontainer/WebContainerManager';
import type { IFSWatcher } from '@webcontainer/api';
import type { ProjectFile } from '../types';

/** Debounce window for watcher events (ms) */
const WATCHER_DEBOUNCE_MS = 300;

export interface UseFileTreeReturn {
  files: ProjectFile[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useFileTree(): UseFileTreeReturn {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const cancelledRef = useRef(false);
  const watcherRef = useRef<IFSWatcher | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wcmRef = useRef<WebContainerManager | null>(null);

  const loadFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const wcm = await WebContainerManager.getInstance();
      wcmRef.current = wcm;
      const result = await wcm.readDir('/');
      if (cancelledRef.current) return;
      setFiles(result);
      setIsLoading(false);
    } catch (err) {
      if (cancelledRef.current) return;
      setError(err as Error);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    loadFiles();

    return () => {
      cancelledRef.current = true;
    };
  }, [loadFiles]);

  // Watcher subscription — subscribe after initial load completes
  useEffect(() => {
    // Only subscribe when initial load is done (isLoading transitions to false)
    if (isLoading) return;

    const wcm = wcmRef.current;
    if (!wcm) return;

    const watcher = wcm.watch((_event, _filename) => {
      // Clear any existing debounce timer
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }

      // Debounce: coalesce rapid events into a single refresh
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        // Circular protection: skip refresh if WCM is currently writing
        if (wcm.isWriting) return;
        if (cancelledRef.current) return;
        loadFiles();
      }, WATCHER_DEBOUNCE_MS);
    });

    watcherRef.current = watcher;

    return () => {
      // Cleanup watcher
      if (watcherRef.current) {
        watcherRef.current.close();
        watcherRef.current = null;
      }
      // Cleanup debounce timer
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [isLoading, loadFiles]);

  const refresh = useCallback(async () => {
    await loadFiles();
  }, [loadFiles]);

  return { files, isLoading, error, refresh };
}
