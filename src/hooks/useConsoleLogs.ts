import { useState, useRef, useCallback, useEffect } from 'react';
import { classifyLog } from '../utils/classifyLog';
import type { ConsoleLog } from '../types';

const FLUSH_INTERVAL_MS = 100;

export interface UseConsoleLogsReturn {
  logs: ConsoleLog[];
  addLog: (rawText: string) => void;
  clearLogs: () => void;
}

function getTimestamp(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export function useConsoleLogs(): UseConsoleLogsReturn {
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const bufferRef = useRef<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const flush = useCallback(() => {
    const buffer = bufferRef.current;
    if (buffer.length === 0) return;

    const newLogs: ConsoleLog[] = buffer.map((text) => ({
      type: classifyLog(text),
      text,
      timestamp: getTimestamp(),
    }));

    bufferRef.current = [];
    setLogs((prev) => [...prev, ...newLogs]);
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(flush, FLUSH_INTERVAL_MS);
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [flush]);

  const addLog = useCallback((rawText: string) => {
    bufferRef.current.push(rawText);
  }, []);

  const clearLogs = useCallback(() => {
    bufferRef.current = [];
    setLogs([]);
  }, []);

  return { logs, addLog, clearLogs };
}
