/**
 * Shared test utilities for pipeline integration tests
 * CHANGE 4 - Backend Pipeline Integration
 */

import { vi } from 'vitest';
import type { BackendRequirements } from '../../services/analyzer/types';
import type { MigrationResult } from '../../services/sql/types';
import type { SupabaseProject } from '../../services/supabase/types';

/**
 * Creates mock objects for all pipeline dependencies
 */
export function createMockPipelineMocks() {
  const mockAnalyzer = {
    analyze: vi.fn<() => Promise<BackendRequirements>>(),
  };

  const mockGenerator = {
    generate: vi.fn<() => MigrationResult>(),
  };

  const mockMcpClient = {
    createProject: vi.fn<() => Promise<SupabaseProject>>(),
    getProject: vi.fn<() => Promise<SupabaseProject>>(),
    applyMigration: vi.fn<() => Promise<{ success: boolean; migrationId: string }>>(),
    getProjectUrl: vi.fn<() => Promise<string>>(),
    getAnonKey: vi.fn<() => Promise<string>>(),
  };

  const mockOAuth = {
    getAccessToken: vi.fn<() => Promise<string>>(),
    refreshToken: vi.fn<() => Promise<string>>(),
    isAuthenticated: vi.fn<() => Promise<boolean>>(),
  };

  return {
    analyzer: mockAnalyzer,
    generator: mockGenerator,
    mcpClient: mockMcpClient,
    oauth: mockOAuth,
  };
}

/**
 * Creates a mock SupabaseProject with sensible defaults
 */
export function createMockProject(
  overrides: Partial<SupabaseProject> = {}
): SupabaseProject {
  const defaultRef = 'test-ref-abc123';
  return {
    ref: defaultRef,
    name: 'test-project',
    apiUrl: `https://${defaultRef}.supabase.co`,
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QtcmVmLWFiYzEyMyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE5NTAwMDAwMDB9.mock_signature',
    status: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

/**
 * Creates a mock BackendRequirements with sensible defaults
 */
export function createMockRequirements(
  overrides: Partial<BackendRequirements> = {}
): BackendRequirements {
  return {
    entities: [],
    hasAuth: false,
    hasStorage: false,
    crudOperations: [],
    overallConfidence: 90,
    analysisMethod: 'pattern',
    analyzedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a mock MigrationResult with sensible defaults
 */
export function createMockMigration(
  overrides: Partial<MigrationResult> = {}
): MigrationResult {
  return {
    sql: '-- Empty migration',
    tables: [],
    warnings: [],
    ...overrides,
  };
}

/**
 * Async helper to wait for pipeline completion
 * Polls the result until it resolves or times out
 */
export async function waitForPipelineCompletion<T>(
  result: Promise<T>,
  options: { timeout?: number } = {}
): Promise<T> {
  const { timeout = 30000 } = options;

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Pipeline did not complete within ${timeout}ms`));
    }, timeout);
  });

  return Promise.race([result, timeoutPromise]);
}

/**
 * Creates a deferred promise for testing async flows
 */
export function createDeferred<T>() {
  let resolve: (value: T) => void;
  let reject: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    promise,
    resolve: resolve!,
    reject: reject!,
  };
}

/**
 * Waits for a specific number of milliseconds
 * Useful for testing async behavior
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
