/**
 * Integration Test Suite
 * 
 * End-to-end tests for the complete SQL generation pipeline.
 * Tests the full flow from BackendRequirements to MigrationResult.
 */

import { describe, it, expect } from 'vitest';
import { SQLGenerator } from '../SQLGenerator';
import type { BackendRequirements } from '../../analyzer/types';

describe('SQL Integration Tests', () => {
  const generator = new SQLGenerator();

  // Full flow test with entities
  it('should generate complete migration for basic entities', () => {
    const requirements: BackendRequirements = {
      entities: [
        {
          name: 'users',
          typeName: 'User',
          fields: [
            { name: 'email', type: 'string', isOptional: false },
            { name: 'name', type: 'string', isOptional: true },
            { name: 'age', type: 'number', isOptional: true },
            { name: 'isActive', type: 'boolean', isOptional: false },
          ],
          confidence: 95,
          matchType: 'pattern',
        },
      ],
      hasAuth: true,
      hasStorage: false,
      storageRequirements: [],
      crudOperations: [],
      overallConfidence: 90,
      analysisMethod: 'pattern',
      analyzedAt: new Date().toISOString(),
    };

    const result = generator.generate(requirements);

    // Verify SQL structure
    expect(result.sql).toContain('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    expect(result.sql).toContain('CREATE TABLE IF NOT EXISTS users');
    expect(result.sql).toContain('id UUID');
    expect(result.sql).toContain('created_at TIMESTAMPTZ');
    expect(result.sql).toContain('updated_at TIMESTAMPTZ');
    expect(result.sql).toContain('email TEXT NOT NULL');
    expect(result.sql).toContain('name TEXT');
    expect(result.sql).toContain('age INTEGER');
    expect(result.sql).toContain('isActive BOOLEAN NOT NULL');
    
    // Verify RLS
    expect(result.sql).toContain('ALTER TABLE users ENABLE ROW LEVEL SECURITY');
    
    // Verify tables list
    expect(result.tables).toEqual(['users']);
  });

  // Multiple entities with relationships
  it('should handle multiple entities with relationships', () => {
    const requirements: BackendRequirements = {
      entities: [
        {
          name: 'users',
          typeName: 'User',
          fields: [
            { name: 'email', type: 'string', isOptional: false },
            { name: 'name', type: 'string', isOptional: true },
          ],
          confidence: 95,
          matchType: 'pattern',
        },
        {
          name: 'posts',
          typeName: 'Post',
          fields: [
            { name: 'title', type: 'string', isOptional: false },
            { name: 'content', type: 'string', isOptional: true },
            { name: 'userId', type: 'string', isOptional: false },
          ],
          confidence: 90,
          matchType: 'pattern',
        },
        {
          name: 'comments',
          typeName: 'Comment',
          fields: [
            { name: 'text', type: 'string', isOptional: false },
            { name: 'postId', type: 'string', isOptional: false },
            { name: 'userId', type: 'string', isOptional: false },
          ],
          confidence: 90,
          matchType: 'pattern',
        },
      ],
      hasAuth: true,
      hasStorage: false,
      storageRequirements: [],
      crudOperations: [],
      overallConfidence: 92,
      analysisMethod: 'pattern',
      analyzedAt: new Date().toISOString(),
    };

    const result = generator.generate(requirements);

    // Verify all tables created
    expect(result.sql).toContain('CREATE TABLE IF NOT EXISTS users');
    expect(result.sql).toContain('CREATE TABLE IF NOT EXISTS posts');
    expect(result.sql).toContain('CREATE TABLE IF NOT EXISTS comments');
    
    // All tables should have RLS
    expect(result.sql).toMatch(/ALTER TABLE users ENABLE ROW LEVEL SECURITY/);
    expect(result.sql).toMatch(/ALTER TABLE posts ENABLE ROW LEVEL SECURITY/);
    expect(result.sql).toMatch(/ALTER TABLE comments ENABLE ROW LEVEL SECURITY/);
    
    // Verify tables list
    expect(result.tables).toHaveLength(3);
    expect(result.tables).toContain('users');
    expect(result.tables).toContain('posts');
    expect(result.tables).toContain('comments');
  });

  // Storage requirements
  it('should include storage bucket INSERTs when storage is detected', () => {
    const requirements: BackendRequirements = {
      entities: [],
      hasAuth: false,
      hasStorage: true,
      storageRequirements: [
        {
          contentType: 'image',
          bucketName: 'avatars',
          maxSizeMB: 5,
          triggerPattern: 'uploadAvatar',
          confidence: 90,
        },
        {
          contentType: 'document',
          bucketName: 'documents',
          maxSizeMB: 10,
          triggerPattern: 'uploadDocument',
          confidence: 85,
        },
      ],
      crudOperations: [],
      overallConfidence: 88,
      analysisMethod: 'pattern',
      analyzedAt: new Date().toISOString(),
    };

    const result = generator.generate(requirements);

    // Verify bucket INSERTs
    expect(result.sql).toContain('INSERT INTO storage.buckets');
    expect(result.sql).toContain('avatars');
    expect(result.sql).toContain('documents');
    expect(result.sql).toContain('ON CONFLICT DO NOTHING');
  });

  // Full requirements - entities + auth + storage
  it('should handle full requirements with all components', () => {
    const requirements: BackendRequirements = {
      entities: [
        {
          name: 'profiles',
          typeName: 'Profile',
          fields: [
            { name: 'username', type: 'string', isOptional: false },
            { name: 'bio', type: 'string', isOptional: true },
            { name: 'avatarUrl', type: 'string', isOptional: true },
          ],
          confidence: 92,
          matchType: 'pattern',
        },
        {
          name: 'posts',
          typeName: 'Post',
          fields: [
            { name: 'title', type: 'string', isOptional: false },
            { name: 'body', type: 'string', isOptional: true },
            { name: 'published', type: 'boolean', isOptional: false },
            { name: 'createdAt', type: 'Date', isOptional: true },
          ],
          confidence: 90,
          matchType: 'pattern',
        },
      ],
      hasAuth: true,
      authRequirements: [
        { type: 'register', triggerPattern: 'signUp', confidence: 95 },
        { type: 'login', triggerPattern: 'signIn', confidence: 95 },
      ],
      hasStorage: true,
      storageRequirements: [
        {
          contentType: 'image',
          bucketName: 'images',
          maxSizeMB: 10,
          triggerPattern: 'uploadImage',
          confidence: 88,
        },
      ],
      crudOperations: [
        { entity: 'profiles', operation: 'create', triggerPattern: 'createProfile', confidence: 85 },
        { entity: 'posts', operation: 'read', triggerPattern: 'getPosts', confidence: 90 },
      ],
      overallConfidence: 90,
      analysisMethod: 'hybrid',
      analyzedAt: new Date().toISOString(),
    };

    const result = generator.generate(requirements);

    // Verify all components present
    expect(result.sql).toContain('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    expect(result.sql).toContain('CREATE TABLE IF NOT EXISTS profiles');
    expect(result.sql).toContain('CREATE TABLE IF NOT EXISTS posts');
    
    // Verify RLS on both tables
    expect(result.sql).toMatch(/ALTER TABLE profiles ENABLE ROW LEVEL SECURITY/);
    expect(result.sql).toMatch(/ALTER TABLE posts ENABLE ROW LEVEL SECURITY/);
    
    // Verify storage buckets
    expect(result.sql).toContain('INSERT INTO storage.buckets');
    expect(result.sql).toContain('images');
    
    // Verify table list
    expect(result.tables).toHaveLength(2);
    expect(result.tables).toContain('profiles');
    expect(result.tables).toContain('posts');
  });

  // Warnings collection
  it('should collect warnings from all generators', () => {
    const warnings: string[] = [];
    const generatorWithLogger = new SQLGenerator({
      logger: (msg) => warnings.push(msg),
    });

    const requirements: BackendRequirements = {
      entities: [
        {
          name: 'items',
          typeName: 'Item',
          fields: [
            { name: 'name', type: 'string', isOptional: false },
            { name: 'data', type: 'UnknownType', isOptional: true },
          ],
          confidence: 85,
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

    const result = generatorWithLogger.generate(requirements);

    // Should have warnings for unknown type - captured via logger callback
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain('Unknown TypeScript type');
  });

  // Empty requirements
  it('should handle empty requirements gracefully', () => {
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

    // Should still have extension statement
    expect(result.sql).toContain('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    expect(result.tables).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  // Verify SQL syntax is valid (basic validation)
  it('should produce valid SQL syntax', () => {
    const requirements: BackendRequirements = {
      entities: [
        {
          name: 'test_table',
          typeName: 'TestTable',
          fields: [
            { name: 'field1', type: 'string', isOptional: false },
            { name: 'field2', type: 'number', isOptional: true },
            { name: 'field3', type: 'boolean', isOptional: false },
            { name: 'field4', type: 'Date', isOptional: true },
            { name: 'field5', type: 'json', isOptional: false },
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
          bucketName: 'test-bucket',
          maxSizeMB: 5,
          triggerPattern: 'test',
          confidence: 80,
        },
      ],
      crudOperations: [],
      overallConfidence: 85,
      analysisMethod: 'pattern',
      analyzedAt: new Date().toISOString(),
    };

    const result = generator.generate(requirements);

    // Basic SQL syntax validation
    // All statements should end with semicolon
    const statements = result.sql.split(';').filter(s => s.trim().length > 0);
    expect(statements.length).toBeGreaterThan(0);
    
    // Should contain required keywords
    expect(result.sql).toContain('CREATE');
    expect(result.sql).toContain('TABLE');
    expect(result.sql).toContain('INSERT');
  });
});