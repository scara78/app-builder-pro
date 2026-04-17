/**
 * MigrationBuilder Tests
 * 
 * Tests for SQL migration composition.
 * Verifies correct ordering of SQL fragments and integration of all components.
 */

import { describe, it, expect, vi } from 'vitest';
import { MigrationBuilder } from '../MigrationBuilder';
import type { BackendRequirements, Entity, StorageRequirement } from '../../analyzer/types';

describe('MigrationBuilder', () => {
  // SG-001: Complete migration
  describe('SG-001: Complete migration with all sections', () => {
    it('should include CREATE EXTENSION statement', () => {
      const backendRequirements: BackendRequirements = {
        entities: [],
        hasAuth: false,
        hasStorage: false,
        storageRequirements: [],
        crudOperations: [],
        overallConfidence: 90,
        analysisMethod: 'pattern',
        analyzedAt: new Date().toISOString(),
      };

      const builder = new MigrationBuilder();
      const result = builder.build(backendRequirements);

      expect(result.sql).toContain('CREATE EXTENSION');
      expect(result.sql).toContain('uuid-ossp');
    });

    it('should include all sections in correct order', () => {
      const backendRequirements: BackendRequirements = {
        entities: [
          {
            name: 'users',
            typeName: 'User',
            fields: [
              { name: 'id', type: 'string', isOptional: false },
              { name: 'owner_id', type: 'string', isOptional: false },
            ],
            confidence: 90,
            matchType: 'pattern',
          },
        ],
        hasAuth: true,
        hasStorage: true,
        storageRequirements: [
          {
            contentType: 'image',
            bucketName: 'avatars',
            triggerPattern: 'pattern',
            confidence: 90,
          },
        ],
        crudOperations: [],
        overallConfidence: 90,
        analysisMethod: 'pattern',
        analyzedAt: new Date().toISOString(),
      };

      const builder = new MigrationBuilder();
      const result = builder.build(backendRequirements);

      const extensionPos = result.sql.indexOf('CREATE EXTENSION');
      const tablePos = result.sql.indexOf('CREATE TABLE');
      const rlsPos = result.sql.indexOf('ALTER TABLE');
      const bucketPos = result.sql.indexOf('INSERT INTO storage.buckets');

      // Order: extensions → tables → RLS → buckets
      expect(extensionPos).toBeLessThan(tablePos);
      expect(tablePos).toBeLessThan(rlsPos);
      expect(rlsPos).toBeLessThan(bucketPos);
    });
  });

  // SG-002: Empty entities
  describe('SG-002: Empty entities', () => {
    it('should return only extension statement for empty entities', () => {
      const backendRequirements: BackendRequirements = {
        entities: [],
        hasAuth: false,
        hasStorage: false,
        storageRequirements: [],
        crudOperations: [],
        overallConfidence: 90,
        analysisMethod: 'pattern',
        analyzedAt: new Date().toISOString(),
      };

      const builder = new MigrationBuilder();
      const result = builder.build(backendRequirements);

      expect(result.sql).toContain('CREATE EXTENSION');
      expect(result.sql).not.toContain('CREATE TABLE');
      expect(result.tables).toEqual([]);
    });
  });

  // SG-003: Entity with timestamps
  describe('SG-003: Entity with timestamps', () => {
    it('should include id, created_at, updated_at columns', () => {
      const backendRequirements: BackendRequirements = {
        entities: [
          {
            name: 'tasks',
            typeName: 'Task',
            fields: [
              { name: 'id', type: 'string', isOptional: false },
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
        overallConfidence: 90,
        analysisMethod: 'pattern',
        analyzedAt: new Date().toISOString(),
      };

      const builder = new MigrationBuilder();
      const result = builder.build(backendRequirements);

      expect(result.sql).toContain('id');
      expect(result.sql).toContain('created_at');
      expect(result.sql).toContain('updated_at');
    });
  });

  // SG-004: Multiple entities
  describe('SG-004: Multiple entities', () => {
    it('should generate CREATE TABLE for each entity', () => {
      const backendRequirements: BackendRequirements = {
        entities: [
          {
            name: 'users',
            typeName: 'User',
            fields: [{ name: 'id', type: 'string', isOptional: false }],
            confidence: 90,
            matchType: 'pattern',
          },
          {
            name: 'posts',
            typeName: 'Post',
            fields: [{ name: 'id', type: 'string', isOptional: false }],
            confidence: 90,
            matchType: 'pattern',
          },
          {
            name: 'comments',
            typeName: 'Comment',
            fields: [{ name: 'id', type: 'string', isOptional: false }],
            confidence: 90,
            matchType: 'pattern',
          },
        ],
        hasAuth: false,
        hasStorage: false,
        storageRequirements: [],
        crudOperations: [],
        overallConfidence: 90,
        analysisMethod: 'pattern',
        analyzedAt: new Date().toISOString(),
      };

      const builder = new MigrationBuilder();
      const result = builder.build(backendRequirements);

      const tableCount = (result.sql.match(/CREATE TABLE/g) || []).length;
      expect(tableCount).toBe(3);
      expect(result.tables).toEqual(['users', 'posts', 'comments']);
    });
  });

  // SG-005: With RLS enabled by default
  describe('SG-005: RLS enabled by default', () => {
    it('should enable RLS for tables', () => {
      const backendRequirements: BackendRequirements = {
        entities: [
          {
            name: 'users',
            typeName: 'User',
            fields: [
              { name: 'id', type: 'string', isOptional: false },
              { name: 'owner_id', type: 'string', isOptional: false },
            ],
            confidence: 90,
            matchType: 'pattern',
          },
        ],
        hasAuth: false,
        hasStorage: false,
        storageRequirements: [],
        crudOperations: [],
        overallConfidence: 90,
        analysisMethod: 'pattern',
        analyzedAt: new Date().toISOString(),
      };

      const builder = new MigrationBuilder();
      const result = builder.build(backendRequirements);

      expect(result.sql).toContain('ALTER TABLE users ENABLE ROW LEVEL SECURITY');
    });
  });

  // SG-006: With storage buckets
  describe('SG-006: With storage buckets', () => {
    it('should include bucket INSERT statements', () => {
      const backendRequirements: BackendRequirements = {
        entities: [],
        hasAuth: false,
        hasStorage: true,
        storageRequirements: [
          {
            contentType: 'image',
            bucketName: 'avatars',
            triggerPattern: 'pattern',
            confidence: 90,
          },
          {
            contentType: 'document',
            bucketName: 'documents',
            triggerPattern: 'pattern',
            confidence: 90,
          },
        ],
        crudOperations: [],
        overallConfidence: 90,
        analysisMethod: 'pattern',
        analyzedAt: new Date().toISOString(),
      };

      const builder = new MigrationBuilder();
      const result = builder.build(backendRequirements);

      expect(result.sql).toContain('INSERT INTO storage.buckets');
      expect(result.sql).toContain('avatars');
      expect(result.sql).toContain('documents');
    });
  });

  // SG-007: Warnings collection
  describe('SG-007: Warnings collection', () => {
    it('should collect warnings from generators', () => {
      const backendRequirements: BackendRequirements = {
        entities: [
          {
            name: 'users',
            typeName: 'User',
            fields: [
              { name: 'id', type: 'string', isOptional: false },
              { name: 'owner_id', type: 'string', isOptional: false },
            ],
            confidence: 90,
            matchType: 'pattern',
          },
        ],
        hasAuth: false,
        hasStorage: false,
        storageRequirements: [],
        crudOperations: [],
        overallConfidence: 90,
        analysisMethod: 'pattern',
        analyzedAt: new Date().toISOString(),
      };

      const builder = new MigrationBuilder();
      const result = builder.build(backendRequirements);

      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  // SG-008: IF NOT EXISTS for tables
  describe('SG-008: Idempotent table creation', () => {
    it('should use CREATE TABLE IF NOT EXISTS', () => {
      const backendRequirements: BackendRequirements = {
        entities: [
          {
            name: 'users',
            typeName: 'User',
            fields: [{ name: 'id', type: 'string', isOptional: false }],
            confidence: 90,
            matchType: 'pattern',
          },
        ],
        hasAuth: false,
        hasStorage: false,
        storageRequirements: [],
        crudOperations: [],
        overallConfidence: 90,
        analysisMethod: 'pattern',
        analyzedAt: new Date().toISOString(),
      };

      const builder = new MigrationBuilder();
      const result = builder.build(backendRequirements);

      expect(result.sql).toContain('CREATE TABLE IF NOT EXISTS');
    });
  });

  // SG-009: Extension before tables
  describe('SG-009: SQL ordering', () => {
    it('should have extension before any tables', () => {
      const backendRequirements: BackendRequirements = {
        entities: [
          {
            name: 'items',
            typeName: 'Item',
            fields: [{ name: 'id', type: 'string', isOptional: false }],
            confidence: 90,
            matchType: 'pattern',
          },
        ],
        hasAuth: false,
        hasStorage: false,
        storageRequirements: [],
        crudOperations: [],
        overallConfidence: 90,
        analysisMethod: 'pattern',
        analyzedAt: new Date().toISOString(),
      };

      const builder = new MigrationBuilder();
      const result = builder.build(backendRequirements);

      const extensionPos = result.sql.indexOf('CREATE EXTENSION');
      const tablePos = result.sql.indexOf('CREATE TABLE');

      expect(extensionPos).toBeGreaterThan(-1);
      expect(tablePos).toBeGreaterThan(extensionPos);
    });
  });

  // SG-010: Return tables array
  describe('SG-010: Return tables array', () => {
    it('should return array of table names in result', () => {
      const backendRequirements: BackendRequirements = {
        entities: [
          {
            name: 'users',
            typeName: 'User',
            fields: [{ name: 'id', type: 'string', isOptional: false }],
            confidence: 90,
            matchType: 'pattern',
          },
          {
            name: 'posts',
            typeName: 'Post',
            fields: [{ name: 'id', type: 'string', isOptional: false }],
            confidence: 90,
            matchType: 'pattern',
          },
        ],
        hasAuth: false,
        hasStorage: false,
        storageRequirements: [],
        crudOperations: [],
        overallConfidence: 90,
        analysisMethod: 'pattern',
        analyzedAt: new Date().toISOString(),
      };

      const builder = new MigrationBuilder();
      const result = builder.build(backendRequirements);

      expect(result.tables).toContain('users');
      expect(result.tables).toContain('posts');
      expect(result.tables).toHaveLength(2);
    });
  });
});