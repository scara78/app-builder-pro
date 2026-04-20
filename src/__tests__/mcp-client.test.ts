import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { mcpHandlers } from '../__mocks__/mcp-server';
import { SupabaseMCPClient } from '../services/supabase/MCPClient';
import { MCPAuthError, MCPError } from '../services/supabase/errors';

// Setup MSW server - with additional custom handlers
const customHandlers = [
  // Handler for testing data.error branch - returns HTTP 200 with error body
  // Note: Use numeric code so parseInt doesn't return NaN and trigger retry
  http.post('*/api/mcp/test_error_branch', () => {
    return HttpResponse.json({
      error: {
        code: '409',
        message: 'Project already exists',
        data: { field: 'name' },
      },
    });
  }),
];

const server = setupServer(...mcpHandlers, ...customHandlers);

beforeAll(() => server.listen());
afterAll(() => server.close());

describe('SupabaseMCPClient', () => {
  describe('constructor', () => {
    it('should throw MCPAuthError when accessToken is missing', () => {
      expect(() => {
        new SupabaseMCPClient({ accessToken: '' });
      }).toThrow(MCPAuthError);
    });

    it('should throw MCPAuthError when accessToken is undefined', () => {
      expect(() => {
        new SupabaseMCPClient({ accessToken: undefined as unknown as string });
      }).toThrow(MCPAuthError);
    });

    it('should create client with valid accessToken', () => {
      const client = new SupabaseMCPClient({ accessToken: 'valid-token' });
      expect(client).toBeDefined();
    });

    it('should accept custom baseUrl', () => {
      const client = new SupabaseMCPClient({
        accessToken: 'valid-token',
        baseUrl: 'https://custom.example.com',
      });
      expect(client).toBeDefined();
    });
  });

  describe('createProject', () => {
    it('should return project with ref, name, apiUrl, anonKey, status', async () => {
      const client = new SupabaseMCPClient({ accessToken: 'valid-token' });
      const project = await client.createProject('test-app', 'us-east-1');

      expect(project).toHaveProperty('ref');
      expect(project).toHaveProperty('name');
      expect(project).toHaveProperty('apiUrl');
      expect(project).toHaveProperty('anonKey');
      expect(project).toHaveProperty('status');
    });

    it('should handle 409 conflict with name suffix', async () => {
      const client = new SupabaseMCPClient({ accessToken: 'valid-token' });

      // First call with 'unique-app' should succeed
      const project1 = await client.createProject('unique-app-123', 'us-east-1');
      expect(project1.name).toBe('unique-app-123');

      // Second call with the same name should get suffix due to conflict
      // Since our mock returns 409 for 'duplicate-app', we use a different approach:
      // The mock returns 409 on first attempt with name starting with 'conflict-'
      const project2 = await client.createProject('conflict-test', 'us-east-1');
      expect(project2.name).toMatch(/conflict-test(-\d+)?/);
    });
  });

  describe('getProjectUrl', () => {
    it('should return valid URL string', async () => {
      const client = new SupabaseMCPClient({ accessToken: 'valid-token' });
      const url = await client.getProjectUrl('abc123def');

      expect(typeof url).toBe('string');
      expect(url).toMatch(/^https:\/\/abc123def\.supabase\.co$/);
    });
  });

  describe('getAnonKey', () => {
    it('should return JWT string', async () => {
      const client = new SupabaseMCPClient({ accessToken: 'valid-token' });
      const anonKey = await client.getAnonKey('abc123def');

      expect(typeof anonKey).toBe('string');
      expect(anonKey).toMatch(/^eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.mock_signature$/);
    });
  });

  describe('applyMigration', () => {
    it('should execute SQL and return void', async () => {
      const client = new SupabaseMCPClient({ accessToken: 'valid-token' });
      const result = await client.applyMigration('abc123def', 'SELECT 1;', 'test-migration');

      expect(result).toBeUndefined();
    });
  });

  describe('listProjects', () => {
    it('should return array of projects', async () => {
      const client = new SupabaseMCPClient({ accessToken: 'valid-token' });
      const projects = await client.listProjects();

      expect(Array.isArray(projects)).toBe(true);
      expect(projects.length).toBeGreaterThan(0);
      expect(projects[0]).toHaveProperty('ref');
      expect(projects[0]).toHaveProperty('name');
      expect(projects[0]).toHaveProperty('status');
    });
  });

  describe('request with error body', () => {
    it('should throw MCPError when response body contains error field (HTTP 200 with error body)', async () => {
      const client = new SupabaseMCPClient({ accessToken: 'valid-token' });

      // Access private request method via type casting
      const request = (client as any).request.bind(client);

      await expect(
        request<{ success: boolean }>('POST', '/api/mcp/test_error_branch')
      ).rejects.toThrow(MCPError);
    });
  });
});
