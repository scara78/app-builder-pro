import { useState, useEffect, useCallback, useRef } from 'react';
import { WebContainerManager } from '../services/webcontainer/WebContainerManager';
import type { ProjectFile } from '../types';

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

  const loadFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const wcm = await WebContainerManager.getInstance();
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

  const refresh = useCallback(async () => {
    await loadFiles();
  }, [loadFiles]);

  return { files, isLoading, error, refresh };
}
