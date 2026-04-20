/**
 * Tests for SQL Validator Helper
 */

import { describe, it, expect } from 'vitest';
import {
  validateSQLSyntax,
  containsTable,
  containsRLS,
  containsForeignKey,
} from '../helpers/sqlValidator';

describe('SQL Validator', () => {
  describe('validateSQLSyntax', () => {
    it('should accept valid CREATE TABLE statement', () => {
      const sql = 'CREATE TABLE users (id UUID PRIMARY KEY, name TEXT);';
      const result = validateSQLSyntax(sql);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept valid multiple statements', () => {
      const sql = `
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        CREATE TABLE users (id UUID PRIMARY KEY);
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
      `;
      const result = validateSQLSyntax(sql);
      expect(result.valid).toBe(true);
    });

    it('should reject unbalanced parentheses', () => {
      const sql = 'CREATE TABLE users (id UUID PRIMARY KEY;';
      const result = validateSQLSyntax(sql);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Unbalanced parentheses');
    });

    it('should accept empty SQL', () => {
      const result = validateSQLSyntax('');
      expect(result.valid).toBe(true);
    });

    it('should accept extension-only SQL', () => {
      const sql = 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";';
      const result = validateSQLSyntax(sql);
      expect(result.valid).toBe(true);
    });

    it('should accept storage bucket INSERT', () => {
      const sql = `
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', false);
      `;
      const result = validateSQLSyntax(sql);
      expect(result.valid).toBe(true);
    });

    it('should reject unbalanced single quotes', () => {
      const sql = 'CREATE TABLE users (name TEXT NOT NULL;';
      const result = validateSQLSyntax(sql);
      expect(result.valid).toBe(false);
    });
  });

  describe('containsTable', () => {
    it('should detect table creation', () => {
      const sql = 'CREATE TABLE IF NOT EXISTS users (id UUID);';
      expect(containsTable(sql, 'users')).toBe(true);
    });

    it('should return false for non-existent table', () => {
      const sql = 'CREATE TABLE IF NOT EXISTS users (id UUID);';
      expect(containsTable(sql, 'posts')).toBe(false);
    });
  });

  describe('containsRLS', () => {
    it('should detect RLS enablement', () => {
      const sql = 'ALTER TABLE users ENABLE ROW LEVEL SECURITY;';
      expect(containsRLS(sql)).toBe(true);
    });

    it('should return false when RLS not present', () => {
      const sql = 'CREATE TABLE users (id UUID);';
      expect(containsRLS(sql)).toBe(false);
    });
  });

  describe('containsForeignKey', () => {
    it('should detect foreign key relationship', () => {
      const sql = 'ALTER TABLE posts ADD FOREIGN KEY (user_id) REFERENCES users(id);';
      expect(containsForeignKey(sql, 'posts', 'users')).toBe(true);
    });

    it('should return false for non-existent FK', () => {
      const sql = 'CREATE TABLE users (id UUID);';
      expect(containsForeignKey(sql, 'posts', 'users')).toBe(false);
    });
  });
});
