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

    it('should handle empty message input', () => {
      const result = parseAIResponse('');

      expect(result.files).toHaveLength(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle message with only whitespace', () => {
      const result = parseAIResponse(' \n\n \n ');

      expect(result.files).toHaveLength(0);
      expect(result.warnings.length).toBeGreaterThan(0);
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

  // SEC-CP: Spec-compliant warning tests (code-parsing change)
  describe('SEC-CP: spec-compliant warnings', () => {
    // SEC-CP-001: Missing file markers → "Missing file markers in response"
    it('SEC-CP-001: should return "Missing file markers in response" warning when no File: markers', () => {
      const result = parseAIResponse('some random text without file markers');
      expect(result.warnings).toContain('Missing file markers in response');
    });

    // SEC-CP-002: Unclosed code block → "Unclosed code block detected"
    it('SEC-CP-002: should return "Unclosed code block detected" warning for unclosed code block', () => {
      const result = parseAIResponse('File: src/App.tsx\n```tsx\nconst x = 1\n');
      expect(result.warnings).toContain('Unclosed code block detected');
    });

    // SEC-CP-003: Empty file content → "Empty file content for: {path}"
    it('SEC-CP-003: should return "Empty file content for: {path}" warning for empty file', () => {
      const result = parseAIResponse('File: src/App.tsx\n```\n \n```');
      expect(result.warnings).toContain('Empty file content for: src/App.tsx');
    });

    // SEC-CP-004: Valid input → warnings: []
    it('SEC-CP-004: should return empty warnings array for valid input with proper markers', () => {
      const result = parseAIResponse(
        'Here is the updated code:\nFile: src/App.tsx\n```tsx\nexport default function App() { return <div>Hello</div> }\n```'
      );
      expect(result.warnings).toEqual([]);
    });

    // SEC-CP-005: Warning includes file path (detail requirement)
    it('SEC-CP-005: empty content warning should include the file path', () => {
      const result = parseAIResponse('File: src/components/Button.tsx\n```\n\n```');
      const emptyWarning = result.warnings.find((w) => w.startsWith('Empty file content for:'));
      expect(emptyWarning).toBeDefined();
      expect(emptyWarning!).toContain('src/components/Button.tsx');
    });

    // SEC-CP-006: Warning includes issue type (detail requirement)
    it('SEC-CP-006: warnings should clearly state the type of issue', () => {
      // Missing file markers
      const noMarkers = parseAIResponse('plain text');
      expect(noMarkers.warnings.some((w) => w.includes('Missing file markers'))).toBe(true);

      // Unclosed code block
      const unclosed = parseAIResponse('File: x.tsx\n```tsx\nconst x = 1');
      expect(unclosed.warnings.some((w) => w.includes('Unclosed code block'))).toBe(true);

      // Empty file content
      const empty = parseAIResponse('File: x.tsx\n```\n\n```');
      expect(empty.warnings.some((w) => w.includes('Empty file content'))).toBe(true);
    });

    // SEC-CP-007: Warnings do NOT include short-message warning (removed — not in spec)
    it('SEC-CP-007: should NOT warn about short explanation message (not in spec)', () => {
      const result = parseAIResponse('File: src/app.tsx\n```tsx\nconst x = 1\n```');
      // Valid file marker + closed code block = no warnings
      expect(result.warnings).toEqual([]);
    });

    // SEC-CP-008: Invalid/short file paths include the path in the warning
    it('SEC-CP-008: should warn with file path for invalid/short paths', () => {
      const result = parseAIResponse('File: abc\n```ts\nconst x = 1\n```');
      expect(result.warnings.some((w) => w.includes('abc'))).toBe(true);
    });

    // SEC-CP-009: ParseResult has correct structure
    it('SEC-CP-009: should return { message, files, warnings } structure', () => {
      const result = parseAIResponse('Hello');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('files');
      expect(result).toHaveProperty('warnings');
      expect(typeof result.message).toBe('string');
      expect(Array.isArray(result.files)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });
});
