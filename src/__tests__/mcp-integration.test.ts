import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { mcpHandlers } from '../__mocks__/mcp-server';
import { SupabaseMCPClient } from '../services/supabase/MCPClient';
import { MCPNotFoundError, MCPValidationError } from '../services/supabase/errors';

// Setup MSW server (note: this runs after other test files close their servers)
const server = setupServer(...mcpHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterAll(() => server.close());

describe('Phase 7: Integration Tests', () => {
  describe('7.1: Full flow end-to-end', () => {
    it('should create project and apply migration successfully', async () => {
      const client = new SupabaseMCPClient({
        accessToken: 'valid-token',
        baseUrl: 'https://api.supabase.com/mcp'
      });

      // Step 1: Create project
      const project = await client.createProject('integration-test', 'us-east-1');
      expect(project).toHaveProperty('ref');
      expect(project).toHaveProperty('name');
      expect(project).toHaveProperty('apiUrl');
      expect(project).toHaveProperty('anonKey');
      expect(project).toHaveProperty('status', 'ACTIVE');

      // Step 2: Apply migration
      const sql = 'CREATE TABLE users (id SERIAL PRIMARY KEY, name TEXT);';
      await client.applyMigration(project.ref, sql, 'create-users-table');

      // Step 3: Verify listProjects works (returns array)
      const projectList = await client.listProjects();
      expect(Array.isArray(projectList)).toBe(true);
    });

    it('should retrieve project URL and anon key after creation', async () => {
      const client = new SupabaseMCPClient({
        accessToken: 'valid-token',
        baseUrl: 'https://api.supabase.com/mcp'
      });

      // Create project
      const project = await client.createProject('url-test', 'us-west-2');

      // Get URL
      const url = await client.getProjectUrl(project.ref);
      expect(typeof url).toBe('string');
      expect(url).toContain('supabase.co');

      // Get anon key
      const anonKey = await client.getAnonKey(project.ref);
      expect(typeof anonKey).toBe('string');
      expect(anonKey.length).toBeGreaterThan(10);
    });
  });

  describe('7.2: Concurrent operations', () => {
    it('should handle concurrent createProject calls independently', async () => {
      const client = new SupabaseMCPClient({
        accessToken: 'valid-token',
        baseUrl: 'https://api.supabase.com/mcp'
      });

      // Create multiple projects concurrently
      const promises = [
        client.createProject('concurrent-1', 'us-east-1'),
        client.createProject('concurrent-2', 'us-west-2'),
        client.createProject('concurrent-3', 'eu-west-1')
      ];

      const results = await Promise.all(promises);

      // Verify all projects have unique refs
      const refs = results.map(r => r.ref);
      expect(new Set(refs).size).toBe(3); // All unique

      // Verify names are correct
      expect(results[0].name).toBe('concurrent-1');
      expect(results[1].name).toBe('concurrent-2');
      expect(results[2].name).toBe('concurrent-3');
    });
  });

  describe('7.3: Operation isolation', () => {
    it('should not affect project when operations fail on invalid ref', async () => {
      const client = new SupabaseMCPClient({
        accessToken: 'valid-token',
        baseUrl: 'https://api.supabase.com/mcp'
      });

      // Create a valid project
      const project = await client.createProject('isolation-test', 'us-east-1');

      // Try operations on invalid ref (should fail independently)
      await expect(client.getProjectUrl('not-found'))
        .rejects
        .toThrow(MCPNotFoundError);

      await expect(client.getAnonKey('not-found'))
        .rejects
        .toThrow(MCPNotFoundError);

      // Verify valid project still accessible
      const url = await client.getProjectUrl(project.ref);
      expect(url).toBeDefined();
    });

    it('should handle multiple sequential operations on same project', async () => {
      const client = new SupabaseMCPClient({
        accessToken: 'valid-token',
        baseUrl: 'https://api.supabase.com/mcp'
      });

      // Create project
      const project = await client.createProject('sequential-test', 'us-east-1');

      // Apply multiple migrations sequentially
      await client.applyMigration(
        project.ref,
        'CREATE TABLE users (id INT);',
        'create-users'
      );

      await client.applyMigration(
        project.ref,
        'CREATE TABLE posts (id INT);',
        'create-posts'
      );

      await client.applyMigration(
        project.ref,
        'CREATE TABLE comments (id INT);',
        'create-comments'
      );

      // Verify project still accessible
      const url = await client.getProjectUrl(project.ref);
      expect(url).toBeDefined();
    });

    it('should handle validation errors without affecting project state', async () => {
      const client = new SupabaseMCPClient({
        accessToken: 'valid-token',
        baseUrl: 'https://api.supabase.com/mcp'
      });

      // Create project
      const project = await client.createProject('validation-test', 'us-east-1');

      // Try invalid migration (should fail)
      await expect(
        client.applyMigration(project.ref, 'INVALID_SQL_SYNTAX', 'bad-migration')
      ).rejects.toThrow(MCPValidationError);

      // Verify project is still accessible by getting its URL
      const url = await client.getProjectUrl(project.ref);
      expect(url).toBeDefined();
      expect(url).toContain('supabase.co');
    });
  });
});
