import { describe, it, expect } from 'vitest';
import { parseAIResponse } from '../services/ai/codeParser';

describe('codeParser', () => {
  describe('basic parsing', () => {
    it('should return warnings when no file markers found', () => {
      const result = parseAIResponse('some random text without file markers');
      expect(result.warnings).toBeDefined();
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should parse a single file with content', () => {
      const result = parseAIResponse(
        'Here is the code:\nFile: src/App.tsx\n```tsx\nexport default function App() { return <div>Hello</div> }\n```'
      );

      expect(result.files).toHaveLength(1);
      expect(result.files[0].path).toBe('src/App.tsx');
      expect(result.files[0].content).toContain('export default function App()');
    });

    it('should extract message text outside of file blocks', () => {
      const result = parseAIResponse(
        'This is an explanation of the code changes.\nFile: index.html\n```html\n<html></html>\n```'
      );

      expect(result.message).toContain('This is an explanation of the code changes');
    });
  });

  describe('multi-file parsing', () => {
    it('should parse multiple files from a single response', () => {
      const result = parseAIResponse(
        'File: src/index.ts\n```ts\nconsole.log("index")\n```\n\nFile: src/utils.ts\n```ts\nexport const foo = 1\n```'
      );

      expect(result.files).toHaveLength(2);
      expect(result.files[0].path).toBe('src/index.ts');
      expect(result.files[1].path).toBe('src/utils.ts');
      expect(result.files[0].content).toContain('console.log("index")');
      expect(result.files[1].content).toContain('export const foo = 1');
    });

    it('should handle three files correctly', () => {
      const result = parseAIResponse(
        'File: a.ts\n```ts\nconst a = 1\n```\nFile: b.ts\n```ts\nconst b = 2\n```\nFile: c.ts\n```ts\nconst c = 3\n```'
      );

      expect(result.files).toHaveLength(3);
      expect(result.files.map((f) => f.path)).toEqual(['a.ts', 'b.ts', 'c.ts']);
    });
  });

  describe('edge cases', () => {
    it('should detect unclosed code blocks', () => {
      const result = parseAIResponse('File: test.ts\n```ts\nconst x = 1\n');
      expect(result.warnings).toContain('Unclosed code block detected');
    });

    it('should detect empty file content', () => {
      const result = parseAIResponse('File: empty.ts\n```\n \n```');
      expect(result.warnings).toContain('Empty file content for: empty.ts');
    });

    it('should detect short/invalid paths', () => {
      const result = parseAIResponse('File: abc\n```ts\nconst x = 1\n```');
      // Path "abc" is less than 5 characters — should trigger short path warning
      expect(
        result.warnings.some((w) => w.includes('path inválido') || w.includes('muy corto'))
      ).toBe(true);
    });

    it('should handle empty message input', () => {
      const result = parseAIResponse('');

      expect(result.files).toHaveLength(0);
      expect(result.warnings.length).toBeGreaterThan(0);
      // Should warn about no files detected
      expect(
        result.warnings.some((w) => w.includes('archivos') || w.includes('No se detectaron'))
      ).toBe(true);
    });

    it('should handle message with only whitespace', () => {
      const result = parseAIResponse('   \n\n   \n   ');

      expect(result.files).toHaveLength(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should warn about short explanation message', () => {
      const result = parseAIResponse('File: src/app.tsx\n```tsx\nconst x = 1\n```');

      // The message text (outside file blocks) is likely empty or very short
      expect(
        result.warnings.some(
          (w) => w.includes('mensaje') || w.includes('vacío') || w.includes('corto')
        )
      ).toBe(true);
    });

    it('should handle mixed valid and invalid code blocks', () => {
      const result = parseAIResponse(
        'File: src/valid.ts\n```ts\nconst valid = true\n```\n\nFile: bad\n```ts\nconst bad = true\n```'
      );

      // Should have 2 files
      expect(result.files).toHaveLength(2);
      // But one has a short path
      expect(
        result.warnings.some((w) => w.includes('path inválido') || w.includes('muy corto'))
      ).toBe(true);
    });

    it('should handle file marker with no code block following it', () => {
      const result = parseAIResponse('File: orphan.ts\n\nSome text without code fences');

      // File marker found but no code block — content ends up empty
      expect(result.files).toHaveLength(0);
    });

    it('should handle code block language specifiers', () => {
      const result = parseAIResponse('File: app.tsx\n```typescript\nconst x: number = 1\n```');

      expect(result.files).toHaveLength(1);
      expect(result.files[0].content).toContain('const x: number = 1');
    });
  });

  describe('return structure', () => {
    it('should always return message, files, and warnings', () => {
      const result = parseAIResponse('Hello world');

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('files');
      expect(result).toHaveProperty('warnings');
      expect(Array.isArray(result.files)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(typeof result.message).toBe('string');
    });

    it('should return empty files array when no files detected', () => {
      const result = parseAIResponse('Just some plain text without any code');

      expect(result.files).toEqual([]);
    });
  });
});
