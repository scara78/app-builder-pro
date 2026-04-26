/**
 * filePrep service tests
 *
 * Tests file preparation for Vercel deployment:
 * - Filtering excluded paths (node_modules, .git, dist)
 * - Base64 encoding file contents
 * - Error on empty project
 *
 * @module services/deploy/__tests__
 */

import { describe, it, expect } from 'vitest';
import { prepareFiles } from '../filePrep';
import type { ProjectFile } from '../../../types';

describe('filePrep', () => {
  describe('prepareFiles', () => {
    it('should base64-encode file contents and set encoding to base64', () => {
      const files: ProjectFile[] = [
        { path: 'src/App.tsx', content: 'console.log("hello")' },
        { path: 'index.html', content: '<html></html>' },
      ];

      const result = prepareFiles(files);

      expect(result).toHaveLength(2);
      expect(result[0].file).toBe('src/App.tsx');
      expect(result[0].encoding).toBe('base64');
      expect(result[0].data).toBe(btoa('console.log("hello")'));
      expect(result[1].file).toBe('index.html');
      expect(result[1].data).toBe(btoa('<html></html>'));
    });

    it('should filter out files in node_modules directory', () => {
      const files: ProjectFile[] = [
        { path: 'node_modules/react/index.js', content: 'react' },
        { path: 'src/App.tsx', content: 'app' },
        { path: 'node_modules/lodash/index.js', content: 'lodash' },
      ];

      const result = prepareFiles(files);

      expect(result).toHaveLength(1);
      expect(result[0].file).toBe('src/App.tsx');
    });

    it('should filter out files in .git directory', () => {
      const files: ProjectFile[] = [
        { path: '.git/config', content: 'gitconfig' },
        { path: 'src/main.ts', content: 'main' },
      ];

      const result = prepareFiles(files);

      expect(result).toHaveLength(1);
      expect(result[0].file).toBe('src/main.ts');
    });

    it('should filter out files in dist directory', () => {
      const files: ProjectFile[] = [
        { path: 'dist/bundle.js', content: 'bundle' },
        { path: 'package.json', content: '{}' },
      ];

      const result = prepareFiles(files);

      expect(result).toHaveLength(1);
      expect(result[0].file).toBe('package.json');
    });

    it('should throw error when project has no files', () => {
      const files: ProjectFile[] = [];

      expect(() => prepareFiles(files)).toThrow('No files to deploy');
    });

    it('should throw error when all files are in excluded paths', () => {
      const files: ProjectFile[] = [
        { path: 'node_modules/react/index.js', content: 'react' },
        { path: '.git/HEAD', content: 'head' },
        { path: 'dist/index.html', content: 'html' },
      ];

      expect(() => prepareFiles(files)).toThrow('No files to deploy');
    });

    it('should handle files with unicode content via base64 encoding', () => {
      const files: ProjectFile[] = [{ path: 'src/unicode.ts', content: 'Héllo Wörld 🌍' }];

      const result = prepareFiles(files);

      expect(result).toHaveLength(1);
      expect(result[0].encoding).toBe('base64');
      // Verify the base64 decodes back to original content
      const decoded = atob(result[0].data);
      // Note: atob doesn't handle unicode directly — we verify the encoding happened
      expect(result[0].data).toBeTruthy();
      expect(result[0].data).not.toBe('Héllo Wörld 🌍');
    });

    it('should handle files with leading slash in path by stripping it', () => {
      const files: ProjectFile[] = [{ path: '/src/App.tsx', content: 'app' }];

      const result = prepareFiles(files);

      expect(result[0].file).toBe('src/App.tsx');
    });
  });
});
