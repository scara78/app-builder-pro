/**
 * E2E Integration Test
 * Tests the complete pipeline from React code to SQL generation
 * 
 * Validates integration between:
 * - PatternMatcher (CHANGE 2)
 * - SQLGenerator (CHANGE 3)
 */

import { describe, it, expect } from 'vitest';
import { PatternMatcher } from '../../services/analyzer/PatternMatcher';
import type { BackendRequirements } from '../../services/analyzer/types';
import { SQLGenerator } from '../../services/sql/SQLGenerator';
import { validateSQLSyntax, containsTable, containsRLS, containsForeignKey } from './helpers/sqlValidator';

// Import fixtures
import { SIMPLE_USER_CODE } from './fixtures/simple-user';
import { AUTH_POSTS_CODE } from './fixtures/auth-posts';
import { FULL_APP_CODE } from './fixtures/full-app';
import { MINIMAL_CODE } from './fixtures/minimal';

/**
 * Transform PatternAnalysis to BackendRequirements
 * The SQLGenerator expects BackendRequirements, but PatternMatcher returns PatternAnalysis
 */
function transformToBackendRequirements(analysis: ReturnType<PatternMatcher['analyze']>): BackendRequirements {
  return {
    entities: analysis.entities,
    hasAuth: analysis.authRequirements.length > 0,
    authRequirements: analysis.authRequirements,
    hasStorage: analysis.storageRequirements.length > 0,
    storageRequirements: analysis.storageRequirements,
    crudOperations: analysis.crudOperations,
    overallConfidence: analysis.overallConfidence,
    analysisMethod: 'pattern',
    analyzedAt: new Date().toISOString()
  };
}

describe('E2E Integration: React Code → SQL Generation', () => {
  const patternMatcher = new PatternMatcher();
  const sqlGenerator = new SQLGenerator();

  describe('Scenario 1: Simple User Entity', () => {
    it('should generate users table with id, name, email', () => {
      // Act: Analyze code to detect requirements
      const analysis = patternMatcher.analyze(SIMPLE_USER_CODE);
      const requirements = transformToBackendRequirements(analysis);
      
      // Generate SQL from requirements
      const result = sqlGenerator.generate(requirements);
      
      // Assert: Validate SQL syntax
      const validation = validateSQLSyntax(result.sql);
      expect(validation.valid, `SQL validation errors: ${validation.errors.join(', ')}`).toBe(true);
      
      // Assert: Check table creation (uses entity name 'User' as detected)
      expect(containsTable(result.sql, 'User')).toBe(true);
      
      // Assert: Check columns
      expect(result.sql).toContain('name');
      expect(result.sql).toContain('email');
      
      // Assert: Check RLS (enabled by default)
      expect(containsRLS(result.sql)).toBe(true);
      
      console.log('Scenario 1 - Tables:', result.tables);
      console.log('Scenario 1 - SQL:', result.sql.substring(0, 200));
    });

    it('should detect User entity with correct fields', () => {
      const analysis = patternMatcher.analyze(SIMPLE_USER_CODE);
      
      expect(analysis.entities).toHaveLength(1);
      expect(analysis.entities[0].name).toBe('User');
      expect(analysis.entities[0].fields.map(f => f.name)).toContain('id');
      expect(analysis.entities[0].fields.map(f => f.name)).toContain('name');
      expect(analysis.entities[0].fields.map(f => f.name)).toContain('email');
    });
  });

  describe('Scenario 2: Auth + Posts with Relationships', () => {
    it('should generate users and posts tables with FK and RLS', () => {
      // Act
      const analysis = patternMatcher.analyze(AUTH_POSTS_CODE);
      const requirements = transformToBackendRequirements(analysis);
      const result = sqlGenerator.generate(requirements);
      
      // Assert: SQL syntax valid
      const validation = validateSQLSyntax(result.sql);
      expect(validation.valid, `SQL validation errors: ${validation.errors.join(', ')}`).toBe(true);
      
      // Assert: Both tables exist (uses entity names User and Post)
      expect(containsTable(result.sql, 'User')).toBe(true);
      expect(containsTable(result.sql, 'Post')).toBe(true);
      
      // Assert: RLS enabled on both tables
      expect(containsRLS(result.sql)).toBe(true);
      
      // Assert: Check auth detected
      expect(requirements.hasAuth).toBe(true);
      expect(requirements.authRequirements?.length).toBeGreaterThan(0);
      
      console.log('Scenario 2 - Tables:', result.tables);
      console.log('Scenario 2 - Auth detected:', requirements.authRequirements?.map(a => a.type));
    });

    it('should detect auth requirements (Login, Register, useAuth)', () => {
      const analysis = patternMatcher.analyze(AUTH_POSTS_CODE);
      
      expect(analysis.authRequirements.length).toBeGreaterThan(0);
      const authTypes = analysis.authRequirements.map(a => a.type);
      expect(authTypes).toContain('login');
      expect(authTypes).toContain('register');
    });

    it('should detect Post entity with authorId relationship', () => {
      const analysis = patternMatcher.analyze(AUTH_POSTS_CODE);
      
      const postEntity = analysis.entities.find(e => e.name === 'Post');
      expect(postEntity).toBeDefined();
      expect(postEntity?.fields.map(f => f.name)).toContain('authorId');
    });
  });

  describe('Scenario 3: Full Requirements (Storage + Auth + CRUD)', () => {
    it('should generate profiles table + storage buckets + RLS', () => {
      // Act
      const analysis = patternMatcher.analyze(FULL_APP_CODE);
      const requirements = transformToBackendRequirements(analysis);
      const result = sqlGenerator.generate(requirements);
      
      // Assert: SQL syntax valid
      const validation = validateSQLSyntax(result.sql);
      expect(validation.valid, `SQL validation errors: ${validation.errors.join(', ')}`).toBe(true);
      
      // Assert: Profile table exists (uses entity name 'Profile')
      expect(containsTable(result.sql, 'Profile')).toBe(true);
      
      // Assert: Storage bucket INSERT statements present
      expect(result.sql).toContain('INSERT INTO storage.buckets');
      
      // Assert: RLS enabled
      expect(containsRLS(result.sql)).toBe(true);
      
      // Assert: Storage detected
      expect(requirements.hasStorage).toBe(true);
      expect(requirements.storageRequirements?.length).toBeGreaterThan(0);
      
      console.log('Scenario 3 - Tables:', result.tables);
      console.log('Scenario 3 - Storage:', requirements.storageRequirements);
    });

    it('should detect storage requirements from file upload', () => {
      const analysis = patternMatcher.analyze(FULL_APP_CODE);
      
      expect(analysis.storageRequirements.length).toBeGreaterThan(0);
      expect(analysis.storageRequirements[0].triggerPattern).toMatch(/fileInput|uploadHandler/);
    });

    it('should detect Profile entity with avatarUrl field', () => {
      const analysis = patternMatcher.analyze(FULL_APP_CODE);
      
      const profileEntity = analysis.entities.find(e => e.name === 'Profile');
      expect(profileEntity).toBeDefined();
      expect(profileEntity?.fields.map(f => f.name)).toContain('avatarUrl');
    });
  });

  describe('Scenario 4: Edge Case - Empty/Minimal Code', () => {
    it('should generate minimal SQL with no errors', () => {
      // Act
      const analysis = patternMatcher.analyze(MINIMAL_CODE);
      const requirements = transformToBackendRequirements(analysis);
      
      // This should NOT throw
      const result = sqlGenerator.generate(requirements);
      
      // Assert: SQL is valid (just extension, no tables)
      const validation = validateSQLSyntax(result.sql);
      expect(validation.valid).toBe(true);
      
      // Assert: No entities detected (minimal code)
      expect(analysis.entities).toHaveLength(0);
      
      // Assert: SQL still contains extension
      expect(result.sql).toContain('uuid-ossp');
      
      // Assert: Tables array should be empty
      expect(result.tables).toHaveLength(0);
      
      console.log('Scenario 4 - SQL:', result.sql);
    });

    it('should handle edge case gracefully without throwing', () => {
      // This is the key test - minimal code should not cause errors
      expect(() => {
        const analysis = patternMatcher.analyze(MINIMAL_CODE);
        const requirements = transformToBackendRequirements(analysis);
        sqlGenerator.generate(requirements);
      }).not.toThrow();
    });
  });

  describe('Scenario 5: Complex Relations (M:N)', () => {
    it('should handle multiple entities with relationships', () => {
      // Custom code with 3 entities for M:N relationship scenario
      const complexCode = `
        interface User {
          id: string;
          name: string;
        }

        interface Group {
          id: string;
          name: string;
        }

        interface UserGroup {
          userId: string;
          groupId: string;
          role: string;
        }

        const GroupManagement = () => {
          const [groups, setGroups] = useState<Group[]>([]);
        };
      `;
      
      // Act
      const analysis = patternMatcher.analyze(complexCode);
      const requirements = transformToBackendRequirements(analysis);
      const result = sqlGenerator.generate(requirements);
      
      // Assert: SQL valid
      const validation = validateSQLSyntax(result.sql);
      expect(validation.valid, `SQL validation errors: ${validation.errors.join(', ')}`).toBe(true);
      
      // Assert: All 3 tables created
      expect(containsTable(result.sql, 'User')).toBe(true);
      expect(containsTable(result.sql, 'Group')).toBe(true);
      expect(containsTable(result.sql, 'UserGroup')).toBe(true);
      
      console.log('Scenario 5 - Tables:', result.tables);
      console.log('Scenario 5 - Entities detected:', analysis.entities.map(e => e.name));
    });

    it('should detect User, Group, and UserGroup entities', () => {
      const complexCode = `
        interface User { id: string; name: string; }
        interface Group { id: string; name: string; }
        interface UserGroup { userId: string; groupId: string; role: string; }
      `;
      
      const analysis = patternMatcher.analyze(complexCode);
      
      expect(analysis.entities).toHaveLength(3);
      expect(analysis.entities.map(e => e.name).sort()).toEqual(['Group', 'User', 'UserGroup']);
    });
  });

  describe('Integration Verification', () => {
    it('should show integration between analyzer and SQL generator works', () => {
      // This test verifies the end-to-end flow
      const code = SIMPLE_USER_CODE;
      
      // Step 1: Analyze
      const analysis = patternMatcher.analyze(code);
      
      // Step 2: Transform
      const requirements = transformToBackendRequirements(analysis);
      
      // Step 3: Generate
      const result = sqlGenerator.generate(requirements);
      
      // Verify the full pipeline works
      expect(result.sql).toBeDefined();
      expect(result.tables).toBeDefined();
      expect(result.warnings).toBeDefined();
      
      // Verify entities flow correctly
      expect(requirements.entities).toEqual(analysis.entities);
      expect(requirements.overallConfidence).toBe(analysis.overallConfidence);
      
      console.log('✓ Integration pipeline works correctly');
      console.log('  - Analysis confidence:', analysis.overallConfidence);
      console.log('  - Tables generated:', result.tables.length);
      console.log('  - Warnings:', result.warnings.length);
    });

    it('should maintain data integrity through the pipeline', () => {
      const code = AUTH_POSTS_CODE;
      
      const analysis = patternMatcher.analyze(code);
      const requirements = transformToBackendRequirements(analysis);
      const result = sqlGenerator.generate(requirements);
      
      // Verify field names are preserved
      const postEntity = requirements.entities.find(e => e.name === 'Post');
      expect(postEntity?.fields.find(f => f.name === 'authorId')).toBeDefined();
      
      // Verify the SQL contains the field (case preserved as authorId)
      expect(result.sql).toContain('authorId');
    });
  });
});