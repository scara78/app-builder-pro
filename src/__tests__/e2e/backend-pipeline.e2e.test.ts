/**
 * E2E Pipeline Tests
 * CHANGE 4 - Backend Pipeline Integration
 * Phase 6D - E2E Pipeline Tests
 *
 * Tests the full backend creation pipeline with mocked services
 * Note: These tests focus on integration scenarios, using the same mock patterns
 * as the integration tests but with focus on end-to-end pipeline behavior.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBackendCreation } from '../../hooks/backend/pipeline/useBackendCreation';
import { PipelineStage } from '../../hooks/backend/pipeline/types';
import { SAMPLE_CODE } from '../../__fixtures__/pipeline/sample-code';

// ===== Mock Modules (must be at top level before imports) =====

vi.mock('../../services/analyzer/BackendRequirementsAnalyzer', () => ({
  BackendRequirementsAnalyzer: vi.fn().mockImplementation(() => ({
    analyze: vi.fn(),
  })),
}));

vi.mock('../../services/sql/SQLGenerator', () => ({
  SQLGenerator: vi.fn().mockImplementation(() => ({
    generate: vi.fn(),
  })),
}));

vi.mock('../../services/supabase/MCPClient', () => ({
  SupabaseMCPClient: vi.fn().mockImplementation(() => ({
    createProject: vi.fn(),
    applyMigration: vi.fn(),
    getProjectUrl: vi.fn(),
    getAnonKey: vi.fn(),
  })),
}));

vi.mock('../../hooks/backend/oauth/useSupabaseOAuth', () => ({
  useSupabaseOAuth: vi.fn().mockReturnValue({
    getToken: vi.fn().mockReturnValue('mock-token'),
    isAuthenticated: true,
    status: 'authenticated',
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

// ===== Import after mocks =====

import { BackendRequirementsAnalyzer } from '../../services/analyzer/BackendRequirementsAnalyzer';
import { SQLGenerator } from '../../services/sql/SQLGenerator';
import { SupabaseMCPClient } from '../../services/supabase/MCPClient';
import { useSupabaseOAuth } from '../../hooks/backend/oauth/useSupabaseOAuth';

// ===== Mock References =====

const mockAnalyzer = BackendRequirementsAnalyzer as ReturnType<typeof vi.fn>;
const mockGenerator = SQLGenerator as ReturnType<typeof vi.fn>;
const mockMCPClient = SupabaseMCPClient as ReturnType<typeof vi.fn>;
const mockOAuth = useSupabaseOAuth as ReturnType<typeof vi.fn>;

// ===== Helper Functions =====

function createMockRequirements(overrides: Record<string, unknown> = {}) {
  return {
    entities: [{ name: 'User', fields: [{ name: 'id', type: 'uuid' }] }],
    hasAuth: false,
    hasStorage: false,
    crudOperations: [],
    overallConfidence: 90,
    analysisMethod: 'pattern',
    analyzedAt: new Date().toISOString(),
    ...overrides,
  };
}

function createMockMigration(overrides: Record<string, unknown> = {}) {
  return {
    sql: 'CREATE TABLE "User" (id uuid PRIMARY KEY DEFAULT gen_random_uuid());',
    tables: ['User'],
    warnings: [],
    ...overrides,
  };
}

function createMockProject(overrides: Record<string, unknown> = {}) {
  const ref = 'test-ref-abc123';
  return {
    ref,
    name: 'test-project',
    apiUrl: `https://${ref}.supabase.co`,
    anonKey: 'mock-anon-key',
    status: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function setupSuccessfulPipeline() {
  const mockRequirements = createMockRequirements();
  const mockMigrationResult = createMockMigration();
  const mockProject = createMockProject();

  const analyzerInstance = {
    analyze: vi.fn().mockResolvedValue(mockRequirements),
  };
  const generatorInstance = {
    generate: vi.fn().mockReturnValue(mockMigrationResult),
  };
  const mcpClientInstance = {
    createProject: vi.fn().mockImplementation((name: string) => 
      Promise.resolve({ ...mockProject, name })),
    applyMigration: vi.fn().mockResolvedValue({ success: true, migrationId: 'migration-123' }),
    getProjectUrl: vi.fn().mockResolvedValue(`https://${mockProject.ref}.supabase.co`),
    getAnonKey: vi.fn().mockResolvedValue('mock-anon-key'),
  };

  mockAnalyzer.mockImplementation(() => analyzerInstance);
  mockGenerator.mockImplementation(() => generatorInstance);
  mockMCPClient.mockImplementation(() => mcpClientInstance);
  mockOAuth.mockReturnValue({
    getToken: vi.fn().mockReturnValue('valid-token'),
    isAuthenticated: true,
    status: 'authenticated',
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
  });

  return { analyzerInstance, generatorInstance, mcpClientInstance, mockRequirements, mockMigrationResult, mockProject };
}

// ===== Test Suite =====

describe('E2E Pipeline Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('E2E-001: Full pipeline happy path', () => {
    it('should complete full pipeline end-to-end', async () => {
      // Arrange
      const { analyzerInstance, generatorInstance, mcpClientInstance } = setupSuccessfulPipeline();

      const { result } = renderHook(() => useBackendCreation());

      // Initial state assertions
      expect(result.current.stage).toBe(PipelineStage.IDLE);
      expect(result.current.isCreating).toBe(false);

      // Act: Execute the pipeline
      await act(async () => {
        await result.current.createBackend(SAMPLE_CODE.simpleEntity, {
          projectName: 'test-project',
          region: 'us-east-1',
        });
      });

      // Assert: Final state
      expect(result.current.stage).toBe(PipelineStage.COMPLETE);
      expect(result.current.error).toBeNull();
      expect(result.current.result).not.toBeNull();
      expect(result.current.result?.projectName).toBe('test-project');
      expect(result.current.result?.projectUrl).toContain('supabase.co');
      expect(result.current.isCreating).toBe(false);

      // Assert: All services were called in order
      expect(analyzerInstance.analyze).toHaveBeenCalledTimes(1);
      expect(generatorInstance.generate).toHaveBeenCalledTimes(1);
      expect(mcpClientInstance.createProject).toHaveBeenCalledTimes(1);
      expect(mcpClientInstance.applyMigration).toHaveBeenCalledTimes(1);
    });

    it('should reach 100% progress on successful completion', async () => {
      // Arrange
      setupSuccessfulPipeline();

      const { result } = renderHook(() => useBackendCreation());

      // Act
      await act(async () => {
        await result.current.createBackend(SAMPLE_CODE.simpleEntity);
      });

      // Assert
      expect(result.current.progress).toBe(100);
      expect(result.current.stage).toBe(PipelineStage.COMPLETE);
    });
  });

  describe('E2E-002: MCP rate limit', () => {
    it('should handle 429 rate limit error from MCP server', async () => {
      // Arrange
      const mockRequirements = createMockRequirements();
      const mockMigrationResult = createMockMigration();

      const analyzerInstance = {
        analyze: vi.fn().mockResolvedValue(mockRequirements),
      };
      const generatorInstance = {
        generate: vi.fn().mockReturnValue(mockMigrationResult),
      };
      const mcpClientInstance = {
        createProject: vi.fn().mockRejectedValue(new Error('Rate limit exceeded. Retry after 60 seconds')),
        applyMigration: vi.fn(),
        getProjectUrl: vi.fn(),
        getAnonKey: vi.fn(),
      };

      mockAnalyzer.mockImplementation(() => analyzerInstance);
      mockGenerator.mockImplementation(() => generatorInstance);
      mockMCPClient.mockImplementation(() => mcpClientInstance);
      mockOAuth.mockReturnValue({
        getToken: vi.fn().mockReturnValue('valid-token'),
        isAuthenticated: true,
        status: 'authenticated',
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
      });

      const { result } = renderHook(() => useBackendCreation());

      // Act
      await act(async () => {
        await result.current.createBackend(SAMPLE_CODE.simpleEntity, {
          projectName: 'rate-limited-project',
        });
      });

      // Assert: Pipeline should end in error state
      expect(result.current.stage).toBe(PipelineStage.ERROR);
      expect(result.current.error).toContain('Project creation failed');
      expect(result.current.error).toContain('Rate limit');
      expect(result.current.isCreating).toBe(false);
      expect(result.current.result).toBeNull();

      // Assert: Migration should not be applied
      expect(mcpClientInstance.applyMigration).not.toHaveBeenCalled();
    });
  });

  describe('E2E-003: MCP conflict', () => {
    it('should handle 409 conflict error appropriately', async () => {
      // Arrange
      const mockRequirements = createMockRequirements();
      const mockMigrationResult = createMockMigration();

      const analyzerInstance = {
        analyze: vi.fn().mockResolvedValue(mockRequirements),
      };
      const generatorInstance = {
        generate: vi.fn().mockReturnValue(mockMigrationResult),
      };
      const mcpClientInstance = {
        createProject: vi.fn().mockRejectedValue(new Error('Project name already exists')),
        applyMigration: vi.fn(),
        getProjectUrl: vi.fn(),
        getAnonKey: vi.fn(),
      };

      mockAnalyzer.mockImplementation(() => analyzerInstance);
      mockGenerator.mockImplementation(() => generatorInstance);
      mockMCPClient.mockImplementation(() => mcpClientInstance);
      mockOAuth.mockReturnValue({
        getToken: vi.fn().mockReturnValue('valid-token'),
        isAuthenticated: true,
        status: 'authenticated',
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
      });

      const { result } = renderHook(() => useBackendCreation());

      // Act
      await act(async () => {
        await result.current.createBackend(SAMPLE_CODE.simpleEntity, {
          projectName: 'existing-project',
        });
      });

      // Assert: Error state
      expect(result.current.stage).toBe(PipelineStage.ERROR);
      expect(result.current.error).toContain('Project creation failed');
      expect(result.current.error).toContain('already exists');
    });
  });

  describe('E2E-004: Concurrent requests', () => {
    it('should handle multiple sequential requests correctly', async () => {
      // Arrange
      const { mcpClientInstance } = setupSuccessfulPipeline();

      const { result } = renderHook(() => useBackendCreation());

      // Act: First request
      await act(async () => {
        await result.current.createBackend(SAMPLE_CODE.simpleEntity, {
          projectName: 'project-1',
        });
      });

      // Assert: First request completes
      expect(result.current.stage).toBe(PipelineStage.COMPLETE);
      expect(result.current.result?.projectName).toBe('project-1');

      // Reset for second request
      act(() => {
        result.current.reset();
      });

      // Act: Second request
      await act(async () => {
        await result.current.createBackend(SAMPLE_CODE.complexApp, {
          projectName: 'project-2',
        });
      });

      // Assert: Second request completes
      expect(result.current.stage).toBe(PipelineStage.COMPLETE);
      expect(result.current.result?.projectName).toBe('project-2');

      // Assert: Both projects were created
      expect(mcpClientInstance.createProject).toHaveBeenCalledTimes(2);
    });

    it('should isolate state between different hook instances', async () => {
      // Arrange - Setup two independent pipeline instances
      const mockRequirements = createMockRequirements();
      const mockMigrationResult = createMockMigration();

      // First instance
      const analyzerInstance1 = {
        analyze: vi.fn().mockResolvedValue(mockRequirements),
      };
      const generatorInstance1 = {
        generate: vi.fn().mockReturnValue(mockMigrationResult),
      };
      const mcpClientInstance1 = {
        createProject: vi.fn().mockResolvedValue({ ...createMockProject(), name: 'instance-1-project' }),
        applyMigration: vi.fn().mockResolvedValue({ success: true }),
        getProjectUrl: vi.fn().mockResolvedValue('https://test1.supabase.co'),
        getAnonKey: vi.fn().mockResolvedValue('key-1'),
      };

      // Second instance
      const analyzerInstance2 = {
        analyze: vi.fn().mockResolvedValue(mockRequirements),
      };
      const generatorInstance2 = {
        generate: vi.fn().mockReturnValue(mockMigrationResult),
      };
      const mcpClientInstance2 = {
        createProject: vi.fn().mockResolvedValue({ ...createMockProject(), name: 'instance-2-project' }),
        applyMigration: vi.fn().mockResolvedValue({ success: true }),
        getProjectUrl: vi.fn().mockResolvedValue('https://test2.supabase.co'),
        getAnonKey: vi.fn().mockResolvedValue('key-2'),
      };

      let callCount = 0;
      mockAnalyzer.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? analyzerInstance1 : analyzerInstance2;
      });
      mockGenerator.mockImplementation(() => {
        return callCount === 1 ? generatorInstance1 : generatorInstance2;
      });
      mockMCPClient.mockImplementation(() => {
        return callCount === 1 ? mcpClientInstance1 : mcpClientInstance2;
      });
      mockOAuth.mockReturnValue({
        getToken: vi.fn().mockReturnValue('valid-token'),
        isAuthenticated: true,
        status: 'authenticated',
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
      });

      const { result: result1 } = renderHook(() => useBackendCreation());

      // Reset call count for second instance
      callCount = 0;

      const { result: result2 } = renderHook(() => useBackendCreation());

      // Act: Execute first pipeline
      await act(async () => {
        await result1.current.createBackend(SAMPLE_CODE.simpleEntity, {
          projectName: 'instance-1-project',
        });
      });

      // Reset mocks for second instance
      callCount = 0;
      mockAnalyzer.mockImplementation(() => analyzerInstance2);
      mockGenerator.mockImplementation(() => generatorInstance2);
      mockMCPClient.mockImplementation(() => mcpClientInstance2);

      // Act: Execute second pipeline
      await act(async () => {
        await result2.current.createBackend(SAMPLE_CODE.authComponent, {
          projectName: 'instance-2-project',
        });
      });

      // Assert: Both instances complete independently
      expect(result1.current.stage).toBe(PipelineStage.COMPLETE);
      expect(result2.current.stage).toBe(PipelineStage.COMPLETE);

      expect(result1.current.result?.projectName).toBe('instance-1-project');
      expect(result2.current.result?.projectName).toBe('instance-2-project');
    });
  });
});
