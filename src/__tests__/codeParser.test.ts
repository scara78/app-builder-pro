import { describe, it, expect } from 'vitest';
import { parseAIResponse } from '../services/ai/codeParser';

describe('codeParser', () => {
  it('should return warnings when no file markers found', () => {
    const result = parseAIResponse('some random text without file markers');
    expect(result.warnings).toBeDefined();
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
