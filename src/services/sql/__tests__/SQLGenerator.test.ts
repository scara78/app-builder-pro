/**
 * SQLGenerator Test Suite
 * 
 * Tests for the main SQL generator entry point.
 * Following Strict TDD - tests written first.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { BackendRequirements } from '../../analyzer/types';
import type { MigrationResult } from '../types';

// Import the generator - implementation will be created
// This import will fail initially (RED phase)
import { SQLGenerator } from '../SQLGenerator';

describe('SQLGenerator', () => {
  let generator: SQLGenerator;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Create generator with default config
    generator = new SQLGenerator();
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe('generate', () => {
    // SG-H001: Basic entity generation
    it('should generate CREATE TABLE with 4+ columns for single entity', () => {
      const requirements: BackendRequirements = {
        entities: [
          {
            name: 'User',
            typeName: 'User',
            fields: [
              { name: 'email', type: 'string', isOptional: false },
              { name: 'age', type: 'number', isOptional: true },
              { name: 'active', type: 'boolean', isOptional: false },
            ],
            confidence: 90,
            matchType: 'pattern',
          },
        ],
        hasAuth: false,
        hasStorage: false,
        storageRequirements: [],
        crudOperations: [],
        overallConfidence: 85,
        analysisMethod: 'pattern',
        analyzedAt: new Date().toISOString(),
      };

      const result = generator.generate(requirements);

      expect(result.sql).toContain('CREATE TABLE IF NOT EXISTS User');
      expect(result.sql).toContain('id UUID');
      expect(result.sql).toContain('created_at TIMESTAMPTZ');
      expect(result.sql).toContain('updated_at TIMESTAMPTZ');
      expect(result.sql).toContain('email TEXT');
      expect(result.sql).toContain('age INTEGER');
      expect(result.sql).toContain('active BOOLEAN');
      expect(result.tables).toContain('User');
    });

    // SG-H002: Multiple entities
    it('should generate 3 CREATE TABLE statements for 3 entities', () => {
      const requirements: BackendRequirements = {
        entities: [
          {
            name: 'User',
            typeName: 'User',
            fields: [{ name: 'name', type: 'string', isOptional: false }],
            confidence: 90,
            matchType: 'pattern',
          },
          {
            name: 'Product',
            typeName: 'Product',
            fields: [{ name: 'title', type: 'string', isOptional: false }],
            confidence: 90,
            matchType: 'pattern',
          },
          {
            name: 'Order',
            typeName: 'Order',
            fields: [{ name: 'status', type: 'string', isOptional: false }],
            confidence: 90,
            matchType: 'pattern',
          },
        ],
        hasAuth: false,
        hasStorage: false,
        storageRequirements: [],
        crudOperations: [],
        overallConfidence: 85,
        analysisMethod: 'pattern',
        analyzedAt: new Date().toISOString(),
      };

      const result = generator.generate(requirements);

      expect(result.sql).toContain('CREATE TABLE IF NOT EXISTS User');
      expect(result.sql).toContain('CREATE TABLE IF NOT EXISTS Product');
      expect(result.sql).toContain('CREATE TABLE IF NOT EXISTS Order');
      expect(result.tables).toHaveLength(3);
      expect(result.tables).toContain('User');
      expect(result.tables).toContain('Product');
      expect(result.tables).toContain('Order');
    });

    // SG-H003: Idempotent execution
    it('should use IF NOT EXISTS for idempotent execution', () => {
      const requirements: BackendRequirements = {
        entities: [
          {
            name: 'User',
            typeName: 'User',
            fields: [{ name: 'name', type: 'string', isOptional: false }],
            confidence: 90,
            matchType: 'pattern',
          },
        ],
        hasAuth: false,
        hasStorage: false,
        storageRequirements: [],
        crudOperations: [],
        overallConfidence: 85,
        analysisMethod: 'pattern',
        analyzedAt: new Date().toISOString(),
      };

      const result = generator.generate(requirements);

      expect(result.sql).toContain('CREATE TABLE IF NOT EXISTS');
      expect(result.sql).toContain('CREATE EXTENSION IF NOT EXISTS');
    });

    // SG-H004: Foreign key detection
    it('should include REFERENCES clause for foreign key detection', () => {
      const requirements: BackendRequirements = {
        entities: [
          {
            name: 'User',
            typeName: 'User',
            fields: [
              { name: 'id', type: 'string', isOptional: false },
              { name: 'name', type: 'string', isOptional: false },
            ],
            confidence: 90,
            matchType: 'pattern',
          },
          {
            name: 'Post',
            typeName: 'Post',
            fields: [
              { name: 'id', type: 'string', isOptional: false },
              { name: 'userId', type: 'string', isOptional: false },
              { name: 'title', type: 'string', isOptional: false },
            ],
            confidence: 90,
            matchType: 'pattern',
          },
        ],
        hasAuth: false,
        hasStorage: false,
        storageRequirements: [],
        crudOperations: [],
        overallConfidence: 85,
        analysisMethod: 'pattern',
        analyzedAt: new Date().toISOString(),
      };

      const result = generator.generate(requirements);

      // Should contain REFERENCES clause for userId
      expect(result.sql).toContain('userId');
    });

    // SG-E001: Unknown type handling
    it('should default unknown types to TEXT and log warning', () => {
      const customLogger = vi.fn();
      const config = { logger: customLogger };
      const genWithConfig = new SQLGenerator(config);

      const requirements: BackendRequirements = {
        entities: [
          {
            name: 'Product',
            typeName: 'Product',
            fields: [
              { name: 'id', type: 'string', isOptional: false },
              { name: 'metadata', type: 'CustomType', isOptional: true },
            ],
            confidence: 90,
            matchType: 'pattern',
          },
        ],
        hasAuth: false,
        hasStorage: false,
        storageRequirements: [],
        crudOperations: [],
        overallConfidence: 85,
        analysisMethod: 'pattern',
        analyzedAt: new Date().toISOString(),
      };

      const result = genWithConfig.generate(requirements);

      expect(result.sql).toContain('metadata TEXT');
      expect(customLogger).toHaveBeenCalled();
    });

    // SG-E002: Empty entities array
    it('should handle empty entities array without error', () => {
      const requirements: BackendRequirements = {
        entities: [],
        hasAuth: false,
        hasStorage: false,
        storageRequirements: [],
        crudOperations: [],
        overallConfidence: 0,
        analysisMethod: 'pattern',
        analyzedAt: new Date().toISOString(),
      };

      const result = generator.generate(requirements);

      expect(result.sql).toBeDefined();
      expect(result.tables).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    // SG-E003: Entity with no custom fields
    it('should create table with just id and timestamps', () => {
      const requirements: BackendRequirements = {
        entities: [
          {
            name: 'Log',
            typeName: 'Log',
            fields: [], // No custom fields
            confidence: 90,
            matchType: 'pattern',
          },
        ],
        hasAuth: false,
        hasStorage: false,
        storageRequirements: [],
        crudOperations: [],
        overallConfidence: 85,
        analysisMethod: 'pattern',
        analyzedAt: new Date().toISOString(),
      };

      const result = generator.generate(requirements);

      expect(result.sql).toContain('CREATE TABLE IF NOT EXISTS Log');
      expect(result.sql).toContain('id UUID');
      expect(result.sql).toContain('created_at TIMESTAMPTZ');
      expect(result.sql).toContain('updated_at TIMESTAMPTZ');
    });

    // SG-ERR001: Null input
    it('should throw TypeError for null input', () => {
      expect(() => generator.generate(null as unknown as BackendRequirements))
        .toThrow(TypeError);
    });

    // SG-ERR001: Undefined input
    it('should throw TypeError for undefined input', () => {
      expect(() => generator.generate(undefined as unknown as BackendRequirements))
        .toThrow(TypeError);
    });
  });

  describe('with config', () => {
    // Test with custom config
    it('should respect enableRLS config option', () => {
      const config = { enableRLS: false };
      const genWithConfig = new SQLGenerator(config);

      const requirements: BackendRequirements = {
        entities: [
          {
            name: 'User',
            typeName: 'User',
            fields: [{ name: 'name', type: 'string', isOptional: false }],
            confidence: 90,
            matchType: 'pattern',
          },
        ],
        hasAuth: false,
        hasStorage: false,
        storageRequirements: [],
        crudOperations: [],
        overallConfidence: 85,
        analysisMethod: 'pattern',
        analyzedAt: new Date().toISOString(),
      };

      const result = genWithConfig.generate(requirements);

      // When RLS is disabled, no ALTER TABLE ENABLE ROW LEVEL SECURITY
      expect(result.sql).not.toContain('ENABLE ROW LEVEL SECURITY');
    });

    it('should use custom logger', () => {
      const customLogger = vi.fn();
      const config = { logger: customLogger };
      const genWithConfig = new SQLGenerator(config);

      const requirements: BackendRequirements = {
        entities: [
          {
            name: 'Product',
            typeName: 'Product',
            fields: [
              { name: 'data', type: 'UnknownType', isOptional: false },
            ],
            confidence: 90,
            matchType: 'pattern',
          },
        ],
        hasAuth: false,
        hasStorage: false,
        storageRequirements: [],
        crudOperations: [],
        overallConfidence: 85,
        analysisMethod: 'pattern',
        analyzedAt: new Date().toISOString(),
      };

      genWithConfig.generate(requirements);

      expect(customLogger).toHaveBeenCalled();
    });
  });
});