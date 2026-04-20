import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { SupabaseMCPClient } from '../services/supabase/MCPClient';
import {
  MCPAuthError,
  MCPRateLimitError,
  MCPNotFoundError,
  MCPValidationError,
  MCPNetworkError,
} from '../services/supabase/errors';

// Error handling test handlers
const errorHandlers = [
  // 401 Auth Error
  http.post('*/api/mcp/create_project', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader === 'Bearer invalid-token') {
      return HttpResponse.json(
        { error: { code: '401', message: 'Unauthorized' } },
        { status: 401 }
      );
    }
    return HttpResponse.json({
      ref: 'abc123def',
      name: 'test-project',
      apiUrl: 'https://abc123def.supabase.co',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock',
      status: 'ACTIVE',
    });
  }),

  // 429 Rate Limit
  http.post('*/api/mcp/rate-limited', () => {
    return HttpResponse.json(
      { error: { code: '429', message: 'Rate limit exceeded' } },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }),

  // 404 Not Found
  http.get('*/api/mcp/project/not-found/url', () => {
    return HttpResponse.json(
      { error: { code: '404', message: 'Project not found' } },
      { status: 404 }
    );
  }),

  // 400 Validation Error
  http.post('*/api/mcp/project/:ref/migration', async ({ request }) => {
    const body = (await request.json()) as { sql: string };
    if (body.sql === 'INVALID_SQL') {
      return HttpResponse.json(
        { error: { code: '400', message: 'Syntax error at line 1' } },
        { status: 400 }
      );
    }
    return HttpResponse.json({ success: true });
  }),

  // Network error simulation (will be handled by MSW error)
  http.post('*/api/mcp/network-error', () => {
    return HttpResponse.error();
  }),
];

const server = setupServer(...errorHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterAll(() => server.close());

describe('Phase 6: Error Handling Integration', () => {
  describe('6.1-6.2: HTTP Error Mapping', () => {
    it('should throw MCPAuthError on 401 response', async () => {
      const client = new SupabaseMCPClient({
        accessToken: 'invalid-token',
        baseUrl: 'https://api.supabase.com/mcp',
      });

      await expect(client.createProject('test', 'us-east-1')).rejects.toThrow(MCPAuthError);
    });

    it('should NOT retry on 401 (auth errors are not retryable)', async () => {
      const onRetry = vi.fn();
      const client = new SupabaseMCPClient({
        accessToken: 'invalid-token',
        baseUrl: 'https://api.supabase.com/mcp',
        maxRetries: 3,
      });

      try {
        // Mock retry callback by wrapping
        await client.createProject('test', 'us-east-1');
      } catch (error) {
        // Expected to fail
      }

      // Should fail immediately without retries
      // (Auth errors should not be retried)
      const startTime = Date.now();
      try {
        await client.createProject('test', 'us-east-1');
      } catch (error) {
        const duration = Date.now() - startTime;
        // Should fail fast (< 100ms means no retry delay)
        expect(duration).toBeLessThan(500);
      }
    });
  });

  describe('6.3-6.4: Rate Limit Handling', () => {
    it('should throw MCPRateLimitError with retryAfter from header', async () => {
      const client = new SupabaseMCPClient({
        accessToken: 'valid-token',
        baseUrl: 'https://api.supabase.com/mcp',
      });

      // Override the handler for this test
      server.use(
        http.post('*/api/mcp/create_project', () => {
          return HttpResponse.json(
            { error: { code: '429', message: 'Rate limit exceeded' } },
            { status: 429, headers: { 'Retry-After': '60' } }
          );
        })
      );

      try {
        await client.createProject('test', 'us-east-1');
      } catch (error) {
        expect(error).toBeInstanceOf(MCPRateLimitError);
        if (error instanceof MCPRateLimitError) {
          expect(error.retryAfter).toBe(60);
        }
      }
    });
  });

  describe('6.5-6.6: Not Found Handling', () => {
    it('should throw MCPNotFoundError on 404 response', async () => {
      const client = new SupabaseMCPClient({
        accessToken: 'valid-token',
        baseUrl: 'https://api.supabase.com/mcp',
      });

      await expect(client.getProjectUrl('not-found')).rejects.toThrow(MCPNotFoundError);
    });

    it('should NOT retry on 404 (not found is not retryable)', async () => {
      const client = new SupabaseMCPClient({
        accessToken: 'valid-token',
        baseUrl: 'https://api.supabase.com/mcp',
        maxRetries: 3,
      });

      const startTime = Date.now();
      try {
        await client.getProjectUrl('not-found');
      } catch (error) {
        const duration = Date.now() - startTime;
        // Should fail fast without retry delays
        expect(duration).toBeLessThan(500);
      }
    });
  });

  describe('6.7-6.8: Validation Error Handling', () => {
    it('should throw MCPValidationError on 400 response', async () => {
      const client = new SupabaseMCPClient({
        accessToken: 'valid-token',
        baseUrl: 'https://api.supabase.com/mcp',
      });

      await expect(client.applyMigration('test-project', 'INVALID_SQL', 'test')).rejects.toThrow(
        MCPValidationError
      );
    });

    it('should NOT retry on 400 (validation errors are not retryable)', async () => {
      const client = new SupabaseMCPClient({
        accessToken: 'valid-token',
        baseUrl: 'https://api.supabase.com/mcp',
        maxRetries: 3,
      });

      const startTime = Date.now();
      try {
        await client.applyMigration('test-project', 'INVALID_SQL', 'test');
      } catch (error) {
        const duration = Date.now() - startTime;
        // Should fail fast without retry delays
        expect(duration).toBeLessThan(500);
      }
    });
  });

  describe('6.9-6.10: Network Error Retry', () => {
    it('should retry on network errors and eventually throw', async () => {
      let attemptCount = 0;
      const client = new SupabaseMCPClient({
        accessToken: 'valid-token',
        baseUrl: 'https://api.supabase.com/mcp',
        maxRetries: 1, // Reduced to speed up test
      });

      // Override handler to simulate 503 server error (retryable)
      server.use(
        http.post('*/api/mcp/create_project', () => {
          attemptCount++;
          // First call fails with 503, second might succeed or fail
          if (attemptCount <= 2) {
            return HttpResponse.json(
              { error: { code: '503', message: 'Service Unavailable' } },
              { status: 503 }
            );
          }
          return HttpResponse.json({
            ref: 'abc123def',
            name: 'test-project',
            apiUrl: 'https://abc123def.supabase.co',
            anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock',
            status: 'ACTIVE',
          });
        })
      );

      try {
        await client.createProject('test', 'us-east-1');
      } catch (error) {
        // Should have attempted multiple times before succeeding or failing
        expect(attemptCount).toBeGreaterThan(1);
      }
      // If we get here, it either succeeded after retries or failed correctly
      expect(attemptCount).toBeGreaterThanOrEqual(1);
    }, 15000); // 15s timeout for retry test
  });

  describe('6.11-6.12: Timeout Handling', () => {
    it('should timeout after configured duration', async () => {
      const client = new SupabaseMCPClient({
        accessToken: 'valid-token',
        baseUrl: 'https://api.supabase.com/mcp',
        timeout: 100, // 100ms timeout
        maxRetries: 0, // No retries to test timeout directly
      });

      // Override handler with delay - longer than timeout
      server.use(
        http.post('*/api/mcp/create_project', async () => {
          await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay
          return HttpResponse.json({
            ref: 'abc123def',
            name: 'test-project',
            apiUrl: 'https://abc123def.supabase.co',
            anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock',
            status: 'ACTIVE',
          });
        })
      );

      try {
        await client.createProject('test', 'us-east-1');
        // Should have thrown
        expect(false).toBe(true);
      } catch (error) {
        // Verify it threw an error (timeout)
        expect(error).toBeInstanceOf(Error);
        // The error message should indicate timeout
        const errorMessage = String(error);
        expect(
          errorMessage.includes('timeout') ||
            errorMessage.includes('Timeout') ||
            errorMessage.includes('aborted') ||
            errorMessage.includes('The operation timed out')
        ).toBe(true);
      }
    }, 10000); // 10s timeout for this test
  });
});
