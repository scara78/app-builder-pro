import { describe, it, expect } from 'vitest';
import { PatternMatcher } from '../services/analyzer/PatternMatcher';
import type {
  AuthRequirementType,
  StorageContentType,
  CRUDOperationType,
} from '../services/analyzer/types';

describe('Phase 2: Pattern Engine Core', () => {
  describe('2.1 PatternMatcher class exists', () => {
    it('should be instantiable', () => {
      const matcher = new PatternMatcher();
      expect(matcher).toBeDefined();
    });

    it('should accept custom patterns', () => {
      const customPatterns = {
        entity: [{ id: 'custom', regex: /interface\s+(\w+)/g, baseConfidence: 80 }],
      };
      const matcher = new PatternMatcher(customPatterns);
      expect(matcher).toBeDefined();
    });
  });

  describe('2.3 Detect User entity', () => {
    it('should detect User entity from interface declaration', () => {
      const matcher = new PatternMatcher();
      const code = `interface User { id: string; name: string; }`;

      const entities = matcher.detectEntities(code);

      expect(entities).toHaveLength(1);
      expect(entities[0].name).toBe('User');
      expect(entities[0].typeName).toBe('User');
      expect(entities[0].confidence).toBeGreaterThanOrEqual(80);
    });

    it('should extract fields from entity', () => {
      const matcher = new PatternMatcher();
      const code = `interface User { id: string; name: string; email: string; }`;

      const entities = matcher.detectEntities(code);

      expect(entities[0].fields).toHaveLength(3);
      expect(entities[0].fields[0].name).toBe('id');
      expect(entities[0].fields[0].type).toBe('string');
    });

    it('should detect exported interface', () => {
      const matcher = new PatternMatcher();
      const code = `export interface Product { id: string; title: string; }`;

      const entities = matcher.detectEntities(code);

      expect(entities).toHaveLength(1);
      expect(entities[0].name).toBe('Product');
      expect(entities[0].confidence).toBeGreaterThanOrEqual(85);
    });

    it('should detect type alias as entity', () => {
      const matcher = new PatternMatcher();
      const code = `type Order = { id: string; total: number; };`;

      const entities = matcher.detectEntities(code);

      expect(entities).toHaveLength(1);
      expect(entities[0].name).toBe('Order');
      expect(entities[0].typeName).toBe('Order');
    });
  });

  describe('2.5 Detect Auth', () => {
    it('should detect login pattern', () => {
      const matcher = new PatternMatcher();
      const code = `<Login onSubmit={handleLogin} />`;

      const auth = matcher.detectAuth(code);

      expect(auth).toHaveLength(1);
      expect(auth[0].type).toBe('login');
      expect(auth[0].confidence).toBeGreaterThanOrEqual(85);
    });

    it('should detect register pattern', () => {
      const matcher = new PatternMatcher();
      const code = `<Register />`;

      const auth = matcher.detectAuth(code);

      expect(auth).toHaveLength(1);
      expect(auth[0].type).toBe('register');
    });

    it('should detect useAuth hook', () => {
      const matcher = new PatternMatcher();
      const code = `const { user } = useAuth();`;

      const auth = matcher.detectAuth(code);

      expect(auth).toHaveLength(1);
      expect(auth[0].type).toBe('login');
      expect(auth[0].confidence).toBe(95);
    });

    it('should detect AuthContext', () => {
      const matcher = new PatternMatcher();
      const code = `<AuthProvider><App /></AuthProvider>`;

      const auth = matcher.detectAuth(code);

      expect(auth).toHaveLength(1);
    });
  });

  describe('2.7 Detect Storage', () => {
    it('should detect file input', () => {
      const matcher = new PatternMatcher();
      const code = `<input type="file" />`;

      const storage = matcher.detectStorage(code);

      expect(storage).toHaveLength(1);
      expect(storage[0].confidence).toBeGreaterThanOrEqual(80);
    });

    it('should detect file upload handler', () => {
      const matcher = new PatternMatcher();
      const code = `const handleUpload = async (file) => { ... }`;

      const storage = matcher.detectStorage(code);

      expect(storage).toHaveLength(1);
      expect(storage[0].contentType).toBe('any');
    });

    it('should detect uploadFile function', () => {
      const matcher = new PatternMatcher();
      const code = `async function uploadFile(file: File) { ... }`;

      const storage = matcher.detectStorage(code);

      expect(storage).toHaveLength(1);
    });
  });

  describe('2.9 Detect CRUD', () => {
    it('should detect form with onSubmit', () => {
      const matcher = new PatternMatcher();
      const code = `<form onSubmit={handleCreate}>...</form>`;

      const crud = matcher.detectCRUD(code);

      expect(crud).toHaveLength(1);
      expect(crud[0].operation).toBe('create');
    });

    it('should detect handleDelete', () => {
      const matcher = new PatternMatcher();
      const code = `const handleDelete = (id) => { ... }`;

      const crud = matcher.detectCRUD(code);

      expect(crud).toHaveLength(1);
      expect(crud[0].operation).toBe('delete');
    });

    it('should detect handleUpdate', () => {
      const matcher = new PatternMatcher();
      const code = `function onUpdate(data) { ... }`;

      const crud = matcher.detectCRUD(code);

      expect(crud).toHaveLength(1);
      expect(crud[0].operation).toBe('update');
    });

    it('should detect fetch/read', () => {
      const matcher = new PatternMatcher();
      const code = `useEffect(() => { fetch('/api/users') }, [])`;

      const crud = matcher.detectCRUD(code);

      expect(crud).toHaveLength(1);
      expect(crud[0].operation).toBe('read');
    });
  });

  describe('2.11 Multiple entities', () => {
    it('should detect multiple entities in same file', () => {
      const matcher = new PatternMatcher();
      const code = `
        interface User { id: string; name: string; }
        interface Post { id: string; title: string; content: string; }
      `;

      const entities = matcher.detectEntities(code);

      expect(entities).toHaveLength(2);
      const names = entities.map((e) => e.name).sort();
      expect(names).toEqual(['Post', 'User']);
    });

    it('should handle analyze() for full detection', () => {
      const matcher = new PatternMatcher();
      const code = `
        interface User { id: string; name: string; }
        <Login />
        <form onSubmit={handleCreate} />
      `;

      const analysis = matcher.analyze(code);

      expect(analysis.entities).toHaveLength(1);
      expect(analysis.authRequirements).toHaveLength(1);
      expect(analysis.crudOperations).toHaveLength(1);
      expect(analysis.overallConfidence).toBeGreaterThan(0);
    });
  });
});
