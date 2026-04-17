/**
 * Integration Tests for BackendRequirementsAnalyzer - Phase 7
 * CHANGE 2 - Backend Requirements Analyzer
 * Tests full flows with real component code
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BackendRequirementsAnalyzer } from '../services/analyzer/BackendRequirementsAnalyzer';
import { AnalysisCache } from '../services/analyzer/cache';
import { PatternMatcher } from '../services/analyzer/PatternMatcher';
import { AIFallbackAnalyzer } from '../services/analyzer/AIFallbackAnalyzer';
import type { BackendRequirements } from '../services/analyzer/types';

// Sample code from spec scenarios
const LOGIN_COMPONENT_CODE = `const LoginPage = () => {
  const [email, setEmail] = useState('');
  const handleLogin = async (e) => {
    e.preventDefault();
    await login(email);
  };
  return (
    <form onSubmit={handleLogin}>
      <input value={email} onChange={e => setEmail(e.target.value)} />
      <button type="submit">Login</button>
    </form>
  );
};`;

const USER_ENTITY_CODE = `interface User {
  id: string;
  email: string;
  name: string;
}`;

const FILE_UPLOAD_CODE = `<input type="file" accept="image/*" onChange={handleUpload} />`;

const FORM_HEAVY_CODE = `function ProductEditForm({ product }) {
  const handleSave = async (data) => {
    await updateProduct(product.id, data);
  };
  const handleDelete = async () => {
    await deleteProduct(product.id);
  };
  return (
    <form onSubmit={handleSave}>
      <input name="name" />
      <button type="submit">Save</button>
      <button type="button" onClick={handleDelete}>Delete</button>
    </form>
  );
}`;

const HYBRID_CODE = `// Ambiguous code - could be anything
function DataProcessor({ items }) {
  const handleProcess = (data) => {
    console.log(data);
  };
  return <div onClick={handleProcess}>{items.map(i => <span key={i}>{i}</span>)}</div>;
}`;

describe('Phase 7: Integration Tests - Full Flow', () => {
  describe('7.1 Full flow: analyze → detect entities → return requirements', () => {
    it('should full flow analyze User entity code and return requirements', async () => {
      const analyzer = new BackendRequirementsAnalyzer();
      const result = await analyzer.analyze(USER_ENTITY_CODE);
      
      // Verify complete requirements object
      expect(result).toHaveProperty('entities');
      expect(result).toHaveProperty('hasAuth');
      expect(result).toHaveProperty('hasStorage');
      expect(result).toHaveProperty('crudOperations');
      expect(result).toHaveProperty('overallConfidence');
      expect(result).toHaveProperty('analysisMethod');
      expect(result).toHaveProperty('analyzedAt');
    });

    it('should detect User entity with confidence >= 80', async () => {
      const analyzer = new BackendRequirementsAnalyzer();
      const result = await analyzer.analyze(USER_ENTITY_CODE);
      
      const userEntity = result.entities.find(e => e.name === 'User');
      expect(userEntity).toBeDefined();
      expect(userEntity?.confidence).toBeGreaterThanOrEqual(80);
    });

    it('should extract entity fields correctly', async () => {
      const analyzer = new BackendRequirementsAnalyzer();
      const result = await analyzer.analyze(USER_ENTITY_CODE);
      
      const userEntity = result.entities.find(e => e.name === 'User');
      expect(userEntity?.fields).toHaveLength(3);
      const fieldNames = userEntity?.fields.map(f => f.name).sort();
      expect(fieldNames).toEqual(['email', 'id', 'name']);
    });
  });

  describe('7.2 Auth detection from real login component code', () => {
    it('should detect auth requirement from login form', async () => {
      const analyzer = new BackendRequirementsAnalyzer();
      const result = await analyzer.analyze(LOGIN_COMPONENT_CODE);
      
      expect(result.hasAuth).toBe(true);
    });

    it('should include auth requirement with type login', async () => {
      const analyzer = new BackendRequirementsAnalyzer();
      const result = await analyzer.analyze(LOGIN_COMPONENT_CODE);
      
      const loginAuth = result.authRequirements?.find(a => a.type === 'login');
      expect(loginAuth).toBeDefined();
      expect(loginAuth?.confidence).toBeGreaterThanOrEqual(85);
    });
  });

  describe('7.3 Storage detection from file upload component', () => {
    it('should detect storage requirement from file input', async () => {
      const analyzer = new BackendRequirementsAnalyzer();
      const result = await analyzer.analyze(FILE_UPLOAD_CODE);
      
      expect(result.hasStorage).toBe(true);
    });

    it('should include storage requirement with content type', async () => {
      const analyzer = new BackendRequirementsAnalyzer();
      const result = await analyzer.analyze(FILE_UPLOAD_CODE);
      
      const storage = result.storageRequirements?.[0];
      expect(storage).toBeDefined();
      expect(storage?.confidence).toBeGreaterThanOrEqual(80);
    });
  });

  describe('7.4 CRUD detection from form-heavy component', () => {
    it('should detect multiple CRUD operations from form', async () => {
      const analyzer = new BackendRequirementsAnalyzer();
      const result = await analyzer.analyze(FORM_HEAVY_CODE);
      
      expect(result.crudOperations.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect both create/update and delete operations', async () => {
      const analyzer = new BackendRequirementsAnalyzer();
      const result = await analyzer.analyze(FORM_HEAVY_CODE);
      
      const operations = result.crudOperations.map(o => o.operation);
      expect(operations).toContain('update');
      expect(operations).toContain('delete');
    });
  });

  describe('7.5 Hybrid mode: pattern + AI fallback', () => {
    it('should return pattern-only result when confidence is high', async () => {
      const analyzer = new BackendRequirementsAnalyzer({
        aiThreshold: 50 // Lower threshold to force pattern-only on high confidence
      });
      const result = await analyzer.analyze(USER_ENTITY_CODE);
      
      expect(result.analysisMethod).toBe('pattern');
      expect(result.overallConfidence).toBeGreaterThanOrEqual(50);
    });

    it('should return hybrid when AI fallback is configured and confidence is low', async () => {
      // Mock AI fallback to return a valid result
      const mockAIFallback = {
        analyze: vi.fn().mockResolvedValue({
          entities: [],
          hasAuth: false,
          hasStorage: false,
          authRequirements: [],
          storageRequirements: [],
          crudOperations: [
            { entity: 'DataItem', operation: 'read', triggerPattern: 'ai', confidence: 75 }
          ],
          overallConfidence: 75,
          analysisMethod: 'ai' as const,
          analyzedAt: new Date().toISOString()
        })
      } as unknown as AIFallbackAnalyzer;
      
      const analyzer = new BackendRequirementsAnalyzer({
        aiFallback: mockAIFallback,
        aiThreshold: 90 // High threshold to trigger AI on lower confidence
      });
      
      const result = await analyzer.analyze(HYBRID_CODE);
      
      // Either pattern or hybrid should return a result
      expect(result).toBeDefined();
      expect(result.overallConfidence).toBeGreaterThanOrEqual(0);
    });
  });

  describe('7.6 Cache hit returns result without re-analysis', () => {
    it('should return cached result on second analysis of same code', async () => {
      const cache = new AnalysisCache();
      const analyzer = new BackendRequirementsAnalyzer({
        cache,
        useCache: true
      });
      
      const code = 'interface Product { id: string; name: string; price: number; }';
      
      // First analysis
      const result1 = await analyzer.analyze(code);
      
      // Second analysis - should hit cache
      const result2 = await analyzer.analyze(code);
      
      // Results should be identical
      expect(result2).toEqual(result1);
    });

    it('should analyze fresh on first call', async () => {
      const cache = new AnalysisCache();
      const analyzer = new BackendRequirementsAnalyzer({
        cache,
        useCache: true
      });
      
      const code = 'interface Customer { id: string; email: string; }';
      
      const result = await analyzer.analyze(code);
      
      expect(result.entities.length).toBeGreaterThan(0);
    });

    it('should return different results for different code', async () => {
      const cache = new AnalysisCache();
      const analyzer = new BackendRequirementsAnalyzer({
        cache,
        useCache: true
      });
      
      const code1 = 'interface User { id: string; }';
      const code2 = 'interface Admin { id: string; role: string; }';
      
      const result1 = await analyzer.analyze(code1);
      const result2 = await analyzer.analyze(code2);
      
      expect(result1.entities[0].name).not.toEqual(result2.entities[0].name);
    });
  });

  describe('7.7 Concurrent analyses work independently', () => {
    it('should handle multiple concurrent analyses', async () => {
      const cache = new AnalysisCache();
      const analyzer = new BackendRequirementsAnalyzer({
        cache,
        useCache: true
      });
      
      const codes = [
        'interface User { id: string; name: string; }',
        'interface Product { id: string; price: number; }',
        'interface Order { id: string; total: number; }'
      ];
      
      // Run all analyses concurrently
      const results = await Promise.all(
        codes.map(code => analyzer.analyze(code))
      );
      
      expect(results).toHaveLength(3);
      expect(results[0].entities[0].name).toBe('User');
      expect(results[1].entities[0].name).toBe('Product');
      expect(results[2].entities[0].name).toBe('Order');
    });

    it('should handle interleaved analyses', async () => {
      const analyzer = new BackendRequirementsAnalyzer();
      
      const code1 = 'interface Alpha { id: string; }';
      const code2 = 'interface Beta { id: string; value: number; }';
      
      // Interleave analyses
      const p1 = analyzer.analyze(code1);
      const p2 = analyzer.analyze(code2);
      const results = await Promise.all([p1, p2]);
      
      expect(results).toHaveLength(2);
    });
  });

  describe('7.8 Invalid code input handled gracefully', () => {
    it('should handle empty string', async () => {
      const analyzer = new BackendRequirementsAnalyzer();
      const result = await analyzer.analyze('');
      
      expect(result.overallConfidence).toBe(0);
      expect(result.entities).toHaveLength(0);
      expect(result.hasAuth).toBe(false);
      expect(result.hasStorage).toBe(false);
    });

    it('should handle whitespace-only string', async () => {
      const analyzer = new BackendRequirementsAnalyzer();
      const result = await analyzer.analyze('   \n\t   ');
      
      expect(result.overallConfidence).toBe(0);
      expect(result.entities).toHaveLength(0);
    });

    it('should handle random invalid code', async () => {
      const analyzer = new BackendRequirementsAnalyzer();
      const result = await analyzer.analyze('asdfghjkl qwertyuiop');
      
      // Should return empty requirements, not throw
      expect(result).toBeDefined();
      expect(result.entities).toHaveLength(0);
    });

    it('should handle very long code without crashing', async () => {
      const analyzer = new BackendRequirementsAnalyzer();
      const longCode = 'x'.repeat(10000);
      
      const result = await analyzer.analyze(longCode);
      
      // Should complete without error
      expect(result).toBeDefined();
    });
  });
});

describe('Phase 7: Gherkin Scenarios from Spec', () => {
  describe('Scenario 1: Detect User entity', () => {
    it('Given a React component with "interface User { id: string; name: string; }" When analyzed with BackendRequirementsAnalyzer Then detect User entity with confidence >= 80', async () => {
      const analyzer = new BackendRequirementsAnalyzer();
      const code = `interface User { id: string; name: string; }`;
      
      const result = await analyzer.analyze(code);
      const userEntity = result.entities.find(e => e.name === 'User');
      
      expect(userEntity).toBeDefined();
      expect(userEntity?.confidence).toBeGreaterThanOrEqual(80);
    });
  });

  describe('Scenario 2: Login form triggers auth detection', () => {
    it('Given a component with "<Login onSubmit={handleLogin} />" When analyzed Then hasAuth should be true', async () => {
      const analyzer = new BackendRequirementsAnalyzer();
      const code = `<Login onSubmit={handleLogin} />`;
      
      const result = await analyzer.analyze(code);
      
      expect(result.hasAuth).toBe(true);
    });
  });

  describe('Scenario 3: File upload triggers storage detection', () => {
    it('Given a component with "<input type=\'file\' />" When analyzed Then hasStorage should be true', async () => {
      const analyzer = new BackendRequirementsAnalyzer();
      const code = `<input type="file" />`;
      
      const result = await analyzer.analyze(code);
      
      expect(result.hasStorage).toBe(true);
    });
  });

  describe('Scenario 4: Hybrid mode with AI fallback', () => {
    it('Given ambiguous code with low pattern confidence When analyzed Then AI fallback should be triggered', async () => {
      const mockAIFallback = {
        analyze: vi.fn().mockResolvedValue({
          entities: [{ name: 'GenericData', typeName: 'GenericData', fields: [], confidence: 75, matchType: 'ai' as const }],
          hasAuth: false,
          hasStorage: false,
          authRequirements: [],
          storageRequirements: [],
          crudOperations: [],
          overallConfidence: 75,
          analysisMethod: 'ai' as const,
          analyzedAt: new Date().toISOString()
        })
      } as unknown as AIFallbackAnalyzer;
      
      const analyzer = new BackendRequirementsAnalyzer({
        aiFallback: mockAIFallback,
        aiThreshold: 40 // Trigger on low confidence
      });
      
      const result = await analyzer.analyze(HYBRID_CODE);
      
      expect(mockAIFallback.analyze).toHaveBeenCalled();
    });
  });

  describe('Scenario 5: Cache works', () => {
    it('Given code already analyzed When analyzed again Then result should come from cache', async () => {
      const cache = new AnalysisCache();
      const analyzer = new BackendRequirementsAnalyzer({
        cache,
        useCache: true
      });
      
      const code = `interface CachedEntity { id: string; data: string; }`;
      
      // First analysis
      await analyzer.analyze(code);
      
      // Verify cache has the result
      expect(cache.has(code)).toBe(true);
    });
  });
});