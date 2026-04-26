import { describe, it, expect } from 'vitest';
import { SYSTEM_PROMPT } from '../services/ai/prompts';
import fs from 'fs';
import path from 'path';

describe('prompts', () => {
  it('should contain Tailwind in system prompt (since Tailwind is installed)', () => {
    expect(SYSTEM_PROMPT).toContain('Tailwind');
  });
});

describe('SEC-TW: Tailwind Support Verification', () => {
  it('SEC-TW-001: SYSTEM_PROMPT references Tailwind CSS for generated app styling', () => {
    expect(SYSTEM_PROMPT).toContain('Tailwind CSS');
  });

  it('SEC-TW-002: index.css imports tailwindcss', () => {
    const indexCssPath = path.resolve(__dirname, '../index.css');
    const indexCss = fs.readFileSync(indexCssPath, 'utf-8');
    expect(indexCss).toContain("@import 'tailwindcss'");
  });
});
