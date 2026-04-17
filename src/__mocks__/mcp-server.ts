/**
 * MSW handlers for Supabase MCP Server in browser environment
 * 
 * This module provides mock handlers for the MCP server API endpoints.
 * It simulates the behavior of the actual Supabase MCP server for testing purposes.
 */

import { http, HttpResponse, delay } from 'msw';
import { createProjectMock, getProjectUrlMock, getAnonKeyMock, applyMigrationMock, mockErrorResponses } from '../services/supabase/__fixtures__/mock-responses';

/**
 * Wraps response in MCPResponse format
 */
function wrapInMCPResponse<T>(data: T) {
  return { result: data };
}

/**
 * Creates MSW handlers for Supabase MCP endpoints
 */
export const mcpHandlers = [
  // POST /api/mcp/create_project - Create a new Supabase project
  http.post('*/api/mcp/create_project', async ({ request }) => {
    const body = await request.json() as { name: string; region: string };
    
    // Simulate auth error for specific test cases
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || authHeader === 'Bearer invalid-token') {
      return HttpResponse.json(mockErrorResponses.authError, { status: 401 });
    }
    
    // Check for rate limiting simulation
    const searchParams = new URL(request.url).searchParams;
    if (searchParams.get('simulate') === 'rate_limit') {
      return HttpResponse.json(
        mockErrorResponses.rateLimitError(60), 
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
    
    // Check for 409 conflict simulation (for names starting with 'conflict-')
    if (body.name.startsWith('conflict-')) {
      // Check if already exists by checking if there's a suffix
      const suffixMatch = body.name.match(/-(\d+)$/);
      if (suffixMatch) {
        const suffix = parseInt(suffixMatch[1], 10);
        // If we've tried too many times, return success
        if (suffix > 10) {
          const data = createProjectMock(body.name, body.region);
          return HttpResponse.json(wrapInMCPResponse(data));
        }
        // Second attempt and beyond should succeed
        if (suffix > 0) {
          const data = createProjectMock(body.name, body.region);
          return HttpResponse.json(wrapInMCPResponse(data));
        }
      }
      // First attempt - return 409 conflict
      return HttpResponse.json(
        { error: 'Project name already exists', code: 'CONFLICT' },
        { status: 409 }
      );
    }
    
    const data = createProjectMock(body.name, body.region);
    return HttpResponse.json(wrapInMCPResponse(data));
  }),

  // GET /api/mcp/project/:ref/url - Get project URL
  http.get('*/api/mcp/project/:ref/url', ({ params }) => {
    const { ref } = params;
    
    // Simulate 404 for invalid refs
    if (ref === 'not-found') {
      return HttpResponse.json(mockErrorResponses.notFoundError, { status: 404 });
    }
    
    const data = getProjectUrlMock(ref as string);
    if ('error' in data) {
      return HttpResponse.json(data, { status: 404 });
    }
    return HttpResponse.json(wrapInMCPResponse(data));
  }),

  // GET /api/mcp/project/:ref/anon_key - Get anon key
  http.get('*/api/mcp/project/:ref/anon_key', ({ params }) => {
    const { ref } = params;
    
    if (ref === 'not-found') {
      return HttpResponse.json(mockErrorResponses.notFoundError, { status: 404 });
    }
    
    const data = getAnonKeyMock(ref as string);
    if ('error' in data) {
      return HttpResponse.json(data, { status: 404 });
    }
    return HttpResponse.json(wrapInMCPResponse(data));
  }),

  // POST /api/mcp/project/:ref/migration - Apply SQL migration
  http.post('*/api/mcp/project/:ref/migration', async ({ params, request }) => {
    const { ref } = params;
    const body = await request.json() as { sql: string; name: string };
    
    // Simulate auth error
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || authHeader === 'Bearer invalid-token') {
      return HttpResponse.json(mockErrorResponses.authError, { status: 401 });
    }
    
    // Simulate validation error for invalid SQL
    if (body.sql.includes('INVALID_SQL')) {
      return HttpResponse.json(
        mockErrorResponses.validationError('Syntax error at line 1'), 
        { status: 400 }
      );
    }
    
    if (ref === 'not-found') {
      return HttpResponse.json(mockErrorResponses.notFoundError, { status: 404 });
    }
    
    const data = applyMigrationMock(ref as string, body.sql, body.name);
    if ('error' in data) {
      return HttpResponse.json(data, { status: 400 });
    }
    return HttpResponse.json(wrapInMCPResponse(data));
  }),

  // GET /api/mcp/projects - List all projects
  http.get('*/api/mcp/projects', () => {
    return HttpResponse.json(wrapInMCPResponse({
      projects: [
        { ref: 'abc123def4', name: 'my-first-app', apiUrl: 'https://abc123def4.supabase.co', status: 'ACTIVE' },
        { ref: 'xyz789uvw0', name: 'production-app', apiUrl: 'https://xyz789uvw0.supabase.co', status: 'ACTIVE' }
      ]
    }));
  })
];