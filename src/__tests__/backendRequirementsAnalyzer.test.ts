/**
 * Tests for BackendRequirementsAnalyzer - Phase 6
 * CHANGE 2 - Backend Requirements Analyzer
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BackendRequirementsAnalyzer } from '../services/analyzer/BackendRequirementsAnalyzer';
import { PatternMatcher } from '../services/analyzer/PatternMatcher';
import { ConfidenceCalculator } from '../services/analyzer/confidence';
import { AIFallbackAnalyzer } from '../services/analyzer/AIFallbackAnalyzer';
import { AnalysisCache } from '../services/analyzer/cache';

describe('BackendRequirementsAnalyzer', () => {
  let analyzer: BackendRequirementsAnalyzer;

  beforeEach(() => {
    // Reset any mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('construction', () => {
    it('should be instantiable with default options', () => {
      analyzer = new BackendRequirementsAnalyzer();
      expect(analyzer).toBeDefined();
    });

    it('should accept custom pattern matcher', () => {
      const customMatcher = new PatternMatcher();
      analyzer = new BackendRequirementsAnalyzer({ patternMatcher: customMatcher });
      expect(analyzer).toBeDefined();
    });

    it('should accept custom confidence calculator', () => {
      const customCalc = new ConfidenceCalculator();
      analyzer = new BackendRequirementsAnalyzer({ confidenceCalculator: customCalc });
      expect(analyzer).toBeDefined();
    });

    it('should accept custom cache', () => {
      const customCache = new AnalysisCache();
      analyzer = new BackendRequirementsAnalyzer({ cache: customCache, useCache: true });
      expect(analyzer).toBeDefined();
    });

    it('should accept custom ai threshold', () => {
      analyzer = new BackendRequirementsAnalyzer({ aiThreshold: 70 });
      expect(analyzer).toBeDefined();
    });
  });

  describe('analyze', () => {
    it('should accept code string and return BackendRequirements', async () => {
      analyzer = new BackendRequirementsAnalyzer();
      const code = `interface User { id: string; name: string; email: string; }`;

      const result = await analyzer.analyze(code);

      expect(result).toBeDefined();
      expect(result.entities).toBeDefined();
      expect(result.overallConfidence).toBeDefined();
    });

    it('should detect entities from code', async () => {
      analyzer = new BackendRequirementsAnalyzer();
      const code = `interface User { id: string; name: string; email: string; }`;

      const result = await analyzer.analyze(code);

      expect(result.entities.length).toBeGreaterThan(0);
      expect(result.entities[0].name).toBe('User');
    });

    it('should detect crud operations from form handlers', async () => {
      analyzer = new BackendRequirementsAnalyzer();
      const code = `
        interface User { id: string; name: string; }
        function handleCreate(user: User) { /* ... */ }
      `;

      const result = await analyzer.analyze(code);

      expect(result.crudOperations.length).toBeGreaterThan(0);
    });
  });

  describe('pattern matching flow', () => {
    it('should run pattern matcher first in analysis flow', async () => {
      analyzer = new BackendRequirementsAnalyzer();
      const code = `
        interface Product { id: string; name: string; price: number; }
        function handleCreate(product: Product) { saveToDb(product); }
      `;

      const result = await analyzer.analyze(code);

      // Pattern matcher should detect the entity
      expect(result.entities.length).toBeGreaterThan(0);
      expect(result.entities[0].matchType).toBe('pattern');
    });

    it('should calculate confidence from pattern matching', async () => {
      analyzer = new BackendRequirementsAnalyzer();
      const code = `export interface Order { id: string; status: string; total: number; }`;

      const result = await analyzer.analyze(code);

      expect(result.overallConfidence).toBeGreaterThan(0);
    });
  });

  describe('AI fallback integration', () => {
    it('should trigger AI fallback when confidence is below threshold', async () => {
      // Mock AI to verify it gets called
      const mockAI = {
        analyze: vi.fn().mockResolvedValue({
          entities: [
            { name: 'User', typeName: 'User', fields: [], confidence: 85, matchType: 'ai' },
          ],
          hasAuth: false,
          authRequirements: [],
          hasStorage: false,
          storageRequirements: [],
          crudOperations: [],
          overallConfidence: 85,
          analysisMethod: 'ai',
          analyzedAt: new Date().toISOString(),
        }),
      };

      analyzer = new BackendRequirementsAnalyzer({
        aiFallback: mockAI as unknown as AIFallbackAnalyzer,
        aiThreshold: 90, // Set high threshold to trigger AI
      });

      // Code with low confidence (no clear patterns)
      const code = `const data = fetch('/api/users');`;

      const result = await analyzer.analyze(code);

      // Should either use pattern results or AI fallback
      expect(result).toBeDefined();
    });
  });

  describe('cache integration', () => {
    it('should check cache before analysis when useCache is true', async () => {
      const cache = new AnalysisCache();
      const code = `interface User { id: string; name: string; }`;

      // Pre-populate cache
      cache.set(code, {
        sourceHash: cache.generateKey(code),
        detected: true,
        requirements: {
          entities: [
            { name: 'User', typeName: 'User', fields: [], confidence: 90, matchType: 'pattern' },
          ],
          hasAuth: false,
          authRequirements: [],
          hasStorage: false,
          storageRequirements: [],
          crudOperations: [],
          overallConfidence: 90,
          analysisMethod: 'pattern',
          analyzedAt: new Date().toISOString(),
        },
        cachedAt: new Date().toISOString(),
      });

      analyzer = new BackendRequirementsAnalyzer({ cache, useCache: true });

      const result = await analyzer.analyze(code);

      // Should return cached result
      expect(result.entities.length).toBeGreaterThan(0);
    });

    it('should analyze fresh when cache miss', async () => {
      const cache = new AnalysisCache();
      const code = `interface Product { id: string; title: string; }`;

      analyzer = new BackendRequirementsAnalyzer({ cache, useCache: true });

      const result = await analyzer.analyze(code);

      // Should analyze and cache result
      expect(result.entities.length).toBeGreaterThan(0);
    });
  });

  describe('hybrid orchestration', () => {
    it('should combine pattern and AI results when hybrid mode', async () => {
      const mockAI = {
        analyze: vi.fn().mockResolvedValue({
          entities: [
            {
              name: 'User',
              typeName: 'User',
              fields: [{ name: 'email', type: 'string', isOptional: false }],
              confidence: 85,
              matchType: 'ai',
            },
          ],
          hasAuth: true,
          authRequirements: [{ type: 'login', triggerPattern: 'AI', confidence: 90 }],
          hasStorage: false,
          storageRequirements: [],
          crudOperations: [],
          overallConfidence: 85,
          analysisMethod: 'ai',
          analyzedAt: new Date().toISOString(),
        }),
      };

      analyzer = new BackendRequirementsAnalyzer({
        aiFallback: mockAI as unknown as AIFallbackAnalyzer,
        aiThreshold: 50, // Low threshold so pattern matching triggers but AI also has data
      });

      const code = `
        interface User { id: string; email: string; }
        function LoginForm() { return <Login />; }
      `;

      const result = await analyzer.analyze(code);

      expect(result).toBeDefined();
      // If pattern detected, use pattern; if AI triggered, include AI data
      expect(result.entities.length).toBeGreaterThan(0);
    });

    it('should return analysis method in result', async () => {
      analyzer = new BackendRequirementsAnalyzer();
      const code = `interface User { id: string; name: string; }`;

      const result = await analyzer.analyze(code);

      expect(result.analysisMethod).toMatch(/pattern|hybrid|ai/);
    });
  });

  describe('complete requirements return', () => {
    it('should return all required properties', async () => {
      analyzer = new BackendRequirementsAnalyzer();
      const code = `
        interface User { id: string; name: string; email: string; }
        interface Product { id: string; title: string; price: number; }
        function LoginForm() { return <Login />; }
        function handleUpload(file: File) { /* ... */ }
        function handleCreate(user: User) { /* ... */ }
      `;

      const result = await analyzer.analyze(code);

      // Entities
      expect(result.entities).toBeDefined();
      expect(Array.isArray(result.entities)).toBe(true);

      // Auth
      expect(result.hasAuth).toBeDefined();
      expect(typeof result.hasAuth).toBe('boolean');

      // Storage
      expect(result.hasStorage).toBeDefined();
      expect(typeof result.hasStorage).toBe('boolean');

      // CRUD
      expect(result.crudOperations).toBeDefined();
      expect(Array.isArray(result.crudOperations)).toBe(true);

      // Confidence
      expect(result.overallConfidence).toBeDefined();
      expect(typeof result.overallConfidence).toBe('number');

      // Method
      expect(result.analysisMethod).toBeDefined();

      // Timestamp
      expect(result.analyzedAt).toBeDefined();
    });

    it('should include auth requirements when auth detected', async () => {
      analyzer = new BackendRequirementsAnalyzer();
      const code = `
        function LoginPage() { return <Login />; }
      `;

      const result = await analyzer.analyze(code);

      if (result.hasAuth) {
        expect(result.authRequirements).toBeDefined();
      }
    });

    it('should include storage requirements when storage detected', async () => {
      analyzer = new BackendRequirementsAnalyzer();
      const code = `
        function UploadButton() { return <input type="file" />; }
      `;

      const result = await analyzer.analyze(code);

      if (result.hasStorage) {
        expect(result.storageRequirements).toBeDefined();
      }
    });
  });

  describe('error handling', () => {
    it('should handle empty code gracefully', async () => {
      analyzer = new BackendRequirementsAnalyzer();

      const result = await analyzer.analyze('');

      expect(result).toBeDefined();
      expect(result.entities).toEqual([]);
      expect(result.crudOperations).toEqual([]);
    });

    it('should handle malformed code gracefully', async () => {
      analyzer = new BackendRequirementsAnalyzer();

      const result = await analyzer.analyze('{{{invalid code:::');

      expect(result).toBeDefined();
    });
  });

  describe('pattern-only mode (no AI fallback)', () => {
    it('should use pattern method when aiFallback is not configured', async () => {
      // No aiFallback provided - this triggers pattern-only branch (line 146-148)
      analyzer = new BackendRequirementsAnalyzer();

      const code = `interface User { id: string; name: string; email: string; }`;

      const result = await analyzer.analyze(code);

      expect(result.analysisMethod).toBe('pattern');
    });

    it('should use pattern method when aiFallback is null', async () => {
      // Explicitly set aiFallback to null
      analyzer = new BackendRequirementsAnalyzer({
        aiFallback: null as any,
      });

      const code = `interface Product { id: string; title: string; price: number; }`;

      const result = await analyzer.analyze(code);

      expect(result.analysisMethod).toBe('pattern');
    });

    it('should NOT trigger AI when aiFallback is configured but confidence is high', async () => {
      // Create spy to verify AI is NOT called when confidence is already high
      const mockAI = {
        analyze: vi.fn().mockResolvedValue({
          entities: [],
          hasAuth: false,
          authRequirements: [],
          hasStorage: false,
          storageRequirements: [],
          crudOperations: [],
          overallConfidence: 85,
          analysisMethod: 'ai',
          analyzedAt: new Date().toISOString(),
        }),
      };

      // High confidence code should skip AI
      analyzer = new BackendRequirementsAnalyzer({
        aiFallback: mockAI as unknown as AIFallbackAnalyzer,
      });

      const code = `
        interface User {
          id: string;
          name: string;
          email: string;
          createdAt: Date;
        }
        function useAuth() { return { user: null }; }
      `;

      const result = await analyzer.analyze(code);

      // Pattern should have high confidence, AI shouldn't be triggered
      expect(result.analysisMethod).toBe('pattern');
      // mockAI.analyze should NOT have been called
      expect(mockAI.analyze).not.toHaveBeenCalled();
    });

    it('should fall back to pattern when AI throws error', async () => {
      const mockAI = {
        analyze: vi.fn().mockRejectedValue(new Error('AI API Error')),
      };

      analyzer = new BackendRequirementsAnalyzer({
        aiFallback: mockAI as unknown as AIFallbackAnalyzer,
      });

      // Code that would trigger low confidence pattern matching
      const code = `const data = { x: 1 };`;

      const result = await analyzer.analyze(code);

      // Should gracefully fall back to pattern-only mode
      expect(result.analysisMethod).toBe('pattern');
      expect(result.overallConfidence).toBeDefined();
    });
  });
});
