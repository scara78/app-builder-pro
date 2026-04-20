/**
 * Pipeline Integration Tests - Service Level
 * CHANGE 4 - Phase 6C: Service Integration Tests
 *
 * Tests Analyzer → SQLGenerator integration without mocks (deterministic services)
 */

import { describe, it, expect } from 'vitest';
import { BackendRequirementsAnalyzer } from '../analyzer/BackendRequirementsAnalyzer';
import { SQLGenerator } from '../sql/SQLGenerator';
import { SAMPLE_CODE } from '../../__fixtures__/pipeline/sample-code';
import { EXPECTED_SQL_PATTERNS } from '../../__fixtures__/pipeline/expected-migrations';

describe('Pipeline Service Integration', () => {
  describe('SVC-001: Analyzer to SQLGenerator', () => {
    it('produces valid SQL from analyzer output', async () => {
      // Given: sample code with entities
      const code = SAMPLE_CODE.simpleEntity;
      const analyzer = new BackendRequirementsAnalyzer();
      const generator = new SQLGenerator({ enableRLS: true });

      // When: analyze then generate
      const requirements = await analyzer.analyze(code);
      const migration = generator.generate(requirements);

      // Then: requirements have entities
      expect(requirements.entities.length).toBeGreaterThan(0);
      // SQL contains CREATE TABLE
      expect(migration.sql).toMatch(/CREATE TABLE/i);
      // Tables array contains expected table names (lowercase)
      expect(migration.tables.length).toBeGreaterThan(0);
    });
  });

  describe('SVC-002: Empty requirements', () => {
    it('produces minimal schema from empty code', async () => {
      // Given: empty code
      const code = SAMPLE_CODE.emptyCode;
      const analyzer = new BackendRequirementsAnalyzer();
      const generator = new SQLGenerator();

      // When: analyze then generate
      const requirements = await analyzer.analyze(code);
      const migration = generator.generate(requirements);

      // Then: no entities detected
      expect(requirements.entities).toEqual([]);
      // SQL still contains uuid-ossp extension
      expect(migration.sql).toMatch(/uuid-ossp/i);
      // No tables created
      expect(migration.tables).toEqual([]);
      // No errors thrown (test reaches here successfully)
    });
  });

  describe('SVC-003: Complex entities', () => {
    it('creates tables for multiple related entities', async () => {
      // Given: code with related entities (User, Post, Comment)
      const code = SAMPLE_CODE.complexApp;
      const analyzer = new BackendRequirementsAnalyzer();
      const generator = new SQLGenerator();

      // When: analyze then generate
      const requirements = await analyzer.analyze(code);
      const migration = generator.generate(requirements);

      // Then: multiple entities detected
      expect(requirements.entities.length).toBeGreaterThanOrEqual(3);
      // All entities have tables created
      expect(migration.tables).toContain('User');
      expect(migration.tables).toContain('Post');
      expect(migration.tables).toContain('Comment');
      // Each table has CREATE TABLE statement
      expect(migration.sql).toMatch(/CREATE TABLE IF NOT EXISTS User/i);
      expect(migration.sql).toMatch(/CREATE TABLE IF NOT EXISTS Post/i);
      expect(migration.sql).toMatch(/CREATE TABLE IF NOT EXISTS Comment/i);
      // No warnings for valid entities
      expect(migration.warnings.length).toBe(0);

      // NOTE: Foreign key inference (REFERENCES) is a future feature.
      // Currently, the analyzer detects entities but doesn't infer relationships
      // from field naming conventions (e.g., authorId -> User.author)
    });
  });

  describe('SVC-004: Auth + Storage', () => {
    it('generates RLS policies and storage buckets', async () => {
      // Given: code with auth and storage
      const authCode = SAMPLE_CODE.authComponent;
      const storageCode = SAMPLE_CODE.storageComponent;
      const combinedCode = `${authCode}\n${storageCode}`;
      const analyzer = new BackendRequirementsAnalyzer();
      const generator = new SQLGenerator({ enableRLS: true });

      // When: analyze then generate
      const requirements = await analyzer.analyze(combinedCode);
      const migration = generator.generate(requirements);

      // Then: auth detected
      expect(requirements.hasAuth).toBe(true);
      // Storage detected
      expect(requirements.hasStorage).toBe(true);
      // RLS policies in SQL
      expect(migration.sql).toMatch(EXPECTED_SQL_PATTERNS.rlsEnable);
      // Storage bucket creation in SQL
      expect(migration.sql).toMatch(EXPECTED_SQL_PATTERNS.storageBucket);
    });
  });
});
