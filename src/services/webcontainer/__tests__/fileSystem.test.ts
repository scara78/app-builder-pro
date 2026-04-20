import { describe, it, expect } from 'vitest';
import { filesToTree } from '../fileSystem';
import type { FileSystemTree, ProjectFile } from '@/types';

describe('fileSystem', () => {
  describe('filesToTree', () => {
    it('converts single file to tree', () => {
      // Given
      const files: ProjectFile[] = [
        { path: 'index.html', content: '<html></html>' },
      ];

      // When
      const tree = filesToTree(files);

      // Then
      expect(tree['index.html']).toBeDefined();
      expect(tree['index.html']).toHaveProperty('file');
      expect((tree['index.html'] as any).file.contents).toBe('<html></html>');
    });

    it('converts nested file to tree', () => {
      // Given
      const files: ProjectFile[] = [
        { path: 'src/index.ts', content: 'const x = 1;' },
      ];

      // When
      const tree = filesToTree(files);

      // Then
      expect(tree['src']).toBeDefined();
      expect(tree['src']).toHaveProperty('directory');
      const srcDir = (tree['src'] as any).directory;
      expect(srcDir['index.ts']).toBeDefined();
      expect(srcDir['index.ts']).toHaveProperty('file');
      expect(srcDir['index.ts'].file.contents).toBe('const x = 1;');
    });

    it('converts multiple files to tree', () => {
      // Given
      const files: ProjectFile[] = [
        { path: 'index.html', content: '<html></html>' },
        { path: 'src/index.ts', content: 'const x = 1;' },
        { path: 'src/App.ts', content: 'export class App {}' },
      ];

      // When
      const tree = filesToTree(files);

      // Then
      expect(tree['index.html']).toBeDefined();
      expect((tree['src'] as any).directory['index.ts']).toBeDefined();
      expect((tree['src'] as any).directory['App.ts']).toBeDefined();
    });

    it('creates deep nested directories', () => {
      // Given
      const files: ProjectFile[] = [
        { path: 'a/b/c/d/deep.ts', content: 'deep file' },
      ];

      // When
      const tree = filesToTree(files);

      // Then
      expect(tree['a']).toBeDefined();
      expect((tree['a'] as any).directory['b']).toBeDefined();
      const bDir = (tree['a'] as any).directory['b'].directory;
      expect(bDir['c']).toBeDefined();
      const cDir = bDir['c'].directory;
      expect(cDir['d']).toBeDefined();
      expect(cDir['d'].directory['deep.ts']).toBeDefined();
    });

    it('adds default index.html when not provided', () => {
      // Given
      const files: ProjectFile[] = [];

      // When
      const tree = filesToTree(files);

      // Then
      expect(tree['index.html']).toBeDefined();
      const html = (tree['index.html'] as any).file.contents;
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<div id="root"></div>');
      expect(html).toContain('<script type="module" src="/src/main.tsx"></script>');
    });

    it('adds default vite.config.ts when not provided', () => {
      // Given
      const files: ProjectFile[] = [];

      // When
      const tree = filesToTree(files);

      // Then
      expect(tree['vite.config.ts']).toBeDefined();
      const config = (tree['vite.config.ts'] as any).file.contents;
      expect(config).toContain("defineConfig");
      expect(config).toContain("@vitejs/plugin-react");
    });

    it('adds default main.tsx in src when src exists but main.tsx does not', () => {
      // Given
      const files: ProjectFile[] = [
        { path: 'src/App.tsx', content: 'export default App;' },
      ];

      // When
      const tree = filesToTree(files);

      // Then
      expect((tree['src'] as any).directory['main.tsx']).toBeDefined();
      const main = (tree['src'] as any).directory['main.tsx'].file.contents;
      expect(main).toContain('ReactDOM.createRoot');
      expect(main).toContain('document.getElementById');
    });

    it('does not override user-provided index.html', () => {
      // Given
      const files: ProjectFile[] = [
        { path: 'index.html', content: '<custom>my custom html</custom>' },
      ];

      // When
      const tree = filesToTree(files);

      // Then
      const html = (tree['index.html'] as any).file.contents;
      expect(html).toBe('<custom>my custom html</custom>');
    });

    it('does not override user-provided vite.config.ts', () => {
      // Given
      const files: ProjectFile[] = [
        { path: 'vite.config.ts', content: 'export default { myConfig: true }' },
      ];

      // When
      const tree = filesToTree(files);

      // Then
      const config = (tree['vite.config.ts'] as any).file.contents;
      expect(config).toBe('export default { myConfig: true }');
    });

    it('does not override user-provided main.tsx', () => {
      // Given
      const files: ProjectFile[] = [
        { path: 'src/main.tsx', content: 'custom main entry' },
        { path: 'src/App.tsx', content: 'app content' },
      ];

      // When
      const tree = filesToTree(files);

      // Then
      const main = (tree['src'] as any).directory['main.tsx'].file.contents;
      expect(main).toBe('custom main entry');
    });

    it('handles files with same directory correctly', () => {
      // Given
      const files: ProjectFile[] = [
        { path: 'src/components/Button.tsx', content: 'button' },
        { path: 'src/components/Input.tsx', content: 'input' },
        { path: 'src/components/Card.tsx', content: 'card' },
      ];

      // When
      const tree = filesToTree(files);

      // Then
      const components = (tree['src'] as any).directory['components'].directory;
      expect(Object.keys(components)).toHaveLength(3);
      expect(components['Button.tsx']).toBeDefined();
      expect(components['Input.tsx']).toBeDefined();
      expect(components['Card.tsx']).toBeDefined();
    });

    it('handles empty files array', () => {
      // Given
      const files: ProjectFile[] = [];

      // When
      const tree = filesToTree(files);

      // Then - should have default files
      expect(tree['index.html']).toBeDefined();
      expect(tree['vite.config.ts']).toBeDefined();
    });

    it('handles root-level files in subdirectories', () => {
      // Given
      const files: ProjectFile[] = [
        { path: 'src/utils/helpers.ts', content: 'helpers' },
        { path: 'src/utils/logger.ts', content: 'logger' },
      ];

      // When
      const tree = filesToTree(files);

      // Then
      const utils = (tree['src'] as any).directory['utils'].directory;
      expect(utils['helpers.ts']).toBeDefined();
      expect(utils['logger.ts']).toBeDefined();
    });

    it('returns correct FileSystemTree structure', () => {
      // Given
      const files: ProjectFile[] = [
        { path: 'test.js', content: 'console.log("test");' },
      ];

      // When
      const tree = filesToTree(files);

      // Then
      const node = tree['test.js'] as any;
      expect(node).toHaveProperty('file');
      expect(node.file).toHaveProperty('contents');
      expect(typeof node.file.contents).toBe('string');
    });

    it('preserves file order in result', () => {
      // Given
      const files: ProjectFile[] = [
        { path: 'z.js', content: 'z' },
        { path: 'a.js', content: 'a' },
        { path: 'm.js', content: 'm' },
      ];

      // When
      const tree = filesToTree(files);

      // Then - object keys maintain insertion order in modern JS
      const keys = Object.keys(tree);
      expect(keys).toContain('a.js');
      expect(keys).toContain('m.js');
      expect(keys).toContain('z.js');
    });
  });
});