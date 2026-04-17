import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIOrchestrator } from '../services/ai/AIOrchestrator';

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: { text: () => 'mocked response' }
      })
    })
  }))
}));

describe('AIOrchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call Gemini API when generating app', async () => {
    const ai = AIOrchestrator.getInstance();
    const result = await ai.generateApp('Create a hello world app');
    expect(result).toBeDefined();
  });
});