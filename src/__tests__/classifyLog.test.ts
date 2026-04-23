import { describe, it, expect } from 'vitest';
import { classifyLog } from '../utils/classifyLog';
import type { ConsoleLogType } from '../types';

describe('classifyLog', () => {
  describe('npm warn → warn', () => {
    it('classifies "npm warn deprecated foo@1.0.0" as warn', () => {
      expect(classifyLog('npm warn deprecated foo@1.0.0')).toBe('warn');
    });

    it('classifies "npm WARN config global" as warn (case-insensitive)', () => {
      expect(classifyLog('npm WARN config global')).toBe('warn');
    });
  });

  describe('ERROR / ERR! → error', () => {
    it('classifies "ERROR in ./src/App.tsx" as error', () => {
      expect(classifyLog('ERROR in ./src/App.tsx')).toBe('error');
    });

    it('classifies "Error: Cannot find module" as error (mixed case)', () => {
      expect(classifyLog('Error: Cannot find module')).toBe('error');
    });

    it('classifies "npm ERR! code E404" as error', () => {
      expect(classifyLog('npm ERR! code E404')).toBe('error');
    });

    it('classifies "error: something failed" as error (lowercase)', () => {
      expect(classifyLog('error: something failed')).toBe('error');
    });
  });

  describe('added packages / Vite URL → success', () => {
    it('classifies "added 42 packages" as success', () => {
      expect(classifyLog('added 42 packages')).toBe('success');
    });

    it('classifies "added 1 package in 3s" as success', () => {
      expect(classifyLog('added 1 package in 3s')).toBe('success');
    });

    it('classifies "Vite v5.0.0 ready in 300ms" as success', () => {
      expect(classifyLog('Vite v5.0.0 ready in 300ms')).toBe('success');
    });

    it('classifies "Vite v6.1.0 ready in 150ms" as success', () => {
      expect(classifyLog('Vite v6.1.0 ready in 150ms')).toBe('success');
    });

    it('classifies URL "http://localhost:5173" as success', () => {
      expect(classifyLog('http://localhost:5173')).toBe('success');
    });

    it('classifies URL "https://localhost:5173" as success', () => {
      expect(classifyLog('https://localhost:5173')).toBe('success');
    });

    it('classifies "Local: http://localhost:5173/" as success', () => {
      expect(classifyLog('Local: http://localhost:5173/')).toBe('success');
    });
  });

  describe('default → info', () => {
    it('classifies "some random output" as info', () => {
      expect(classifyLog('some random output')).toBe('info');
    });

    it('classifies empty string as info', () => {
      expect(classifyLog('')).toBe('info');
    });

    it('classifies "watching for file changes..." as info', () => {
      expect(classifyLog('watching for file changes...')).toBe('info');
    });
  });

  describe('return type', () => {
    it('returns a valid ConsoleLogType', () => {
      const result = classifyLog('test');
      const validTypes: ConsoleLogType[] = ['info', 'success', 'warn', 'error'];
      expect(validTypes).toContain(result);
    });
  });
});
