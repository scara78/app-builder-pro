import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  createProjectMock,
  getProjectUrlMock,
  getAnonKeyMock,
  applyMigrationMock,
} from '../services/supabase/__fixtures__/mock-responses';

// Create a server instance for testing - use absolute URLs for Node.js
const mcpServer = setupServer(
  http.post('*/api/mcp/create_project', async ({ request }) => {
    const body = (await request.json()) as { name: string; region: string };
    const data = createProjectMock(body.name, body.region);
    return HttpResponse.json(data);
  }),
  http.get('*/api/mcp/project/:ref/url', ({ params }) => {
    const data = getProjectUrlMock(params.ref as string);
    if ('error' in data) {
      return HttpResponse.json(data, { status: 404 });
    }
    return HttpResponse.json(data);
  }),
  http.get('*/api/mcp/project/:ref/anon_key', ({ params }) => {
    const data = getAnonKeyMock(params.ref as string);
    if ('error' in data) {
      return HttpResponse.json(data, { status: 404 });
    }
    return HttpResponse.json(data);
  }),
  http.post('*/api/mcp/project/:ref/migration', async ({ params, request }) => {
    const body = (await request.json()) as { sql: string; name: string };
    const data = applyMigrationMock(params.ref as string, body.sql, body.name);
    if ('error' in data) {
      return HttpResponse.json(data, { status: 400 });
    }
    return HttpResponse.json(data);
  })
);

describe('MCP Server Mock Handlers', () => {
  beforeAll(() => {
    // Configure MSW to use http://localhost as base URL for Node.js
    mcpServer.listen({ onUnhandledRequest: 'bypass' });
  });

  afterAll(() => {
    mcpServer.close();
  });

  it('should return valid project credentials on successful creation', async () => {
    const response = await fetch('http://localhost/api/mcp/create_project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'test-app', region: 'us-east-1' }),
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ref).toBeDefined();
    expect(data.name).toBe('test-app');
    expect(data.apiUrl).toMatch(/^https:\/\/.+\.supabase\.co$/);
    expect(data.anonKey).toMatch(/^eyJ/);
    expect(data.status).toBe('ACTIVE');
  });

  it('should return project URL for valid ref', async () => {
    const response = await fetch('http://localhost/api/mcp/project/abc123/url');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.url).toBe('https://abc123.supabase.co');
  });

  it('should return anon key for valid ref', async () => {
    const response = await fetch('http://localhost/api/mcp/project/abc123/anon_key');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.anonKey).toMatch(/^eyJ/);
  });

  it('should execute migration successfully', async () => {
    const response = await fetch('http://localhost/api/mcp/project/abc123/migration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sql: 'CREATE TABLE users (id UUID PRIMARY KEY);',
        name: 'create_users',
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.migrationId).toBeDefined();
  });

  it('should handle 404 for invalid project ref', async () => {
    const response = await fetch('http://localhost/api/mcp/project/invalid-ref/url');

    expect(response.status).toBe(404);
  });
});
