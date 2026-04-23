import { describe, it, expect } from 'vitest';
import { parseAIResponse } from '../services/ai/codeParser';

describe('codeParser', () => {
  it('should return warnings when no file markers found', () => {
    const result = parseAIResponse('some random text without file markers');
    expect(result.warnings).toBeDefined();
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should detect unclosed code blocks', () => {
    const result = parseAIResponse('File: test.ts\n```ts\nconst x = 1\n');
    expect(result.warnings).toContain('Unclosed code block detected');
  });

  it('should detect empty file content', () => {
    const result = parseAIResponse('File: empty.ts\n```\n \n```');
    expect(result.warnings).toContain('Empty file content for: empty.ts');
  });
});
