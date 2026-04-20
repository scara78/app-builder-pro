import { describe, it, expect } from 'vitest';
import { SYSTEM_PROMPT } from '../services/ai/prompts';

describe('prompts', () => {
  it('should contain Tailwind in system prompt (since Tailwind is installed)', () => {
    expect(SYSTEM_PROMPT).toContain('Tailwind');
  });
});
