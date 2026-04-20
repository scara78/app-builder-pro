/**
 * Error Scenario Tests for useBackendCreation Hook
 * CHANGE 4 - Backend Pipeline Integration
 * Phase 6E - Error Scenario Tests
 *
 * Exhaustive error handling tests per pipeline stage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBackendCreation } from '../useBackendCreation';
import { PipelineStage } from '../types';
import { SAMPLE_CODE } from '../../../../__fixtures__/pipeline/sample-code';

// ===== Mock Modules (must be at top level before imports) =====

vi.mock('../../../../services/analyzer/BackendRequirementsAnalyzer', () => ({
  BackendRequirementsAnalyzer: vi.fn().mockImplementation(() => ({
    analyze: vi.fn(),
  })),
}));

vi.mock('../../../../services/sql/SQLGenerator', () => ({
  SQLGenerator: vi.fn().mockImplementation(() => ({
    generate: vi.fn(),
  })),
}));

vi.mock('../../../../services/supabase/MCPClient', () => ({
  SupabaseMCPClient: vi.fn().mockImplementation(() => ({
    createProject: vi.fn(),
    applyMigration: vi.fn(),
    getProjectUrl: vi.fn(),
    getAnonKey: vi.fn(),
  })),
}));

vi.mock('../../oauth/useSupabaseOAuth', () => ({
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

import { BackendRequirementsAnalyzer } from '../../../../services/analyzer/BackendRequirementsAnalyzer';
import { SQLGenerator } from '../../../../services/sql/SQLGenerator';
import { SupabaseMCPClient } from '../../../../services/supabase/MCPClient';
import { useSupabaseOAuth } from '../../oauth/useSupabaseOAuth';

// ===== Mock References =====

const mockAnalyzer = BackendRequirementsAnalyzer as ReturnType<typeof vi.fn>;
const mockGenerator = SQLGenerator as ReturnType<typeof vi.fn>;
const mockMCPClient = SupabaseMCPClient as ReturnType<typeof vi.fn>;
const mockOAuth = useSupabaseOAuth as ReturnType<typeof vi.fn>;

// ===== Helper Functions =====

function createMockRequirements(overrides: Record<string, unknown> = {}) {
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

function createMockMigration(overrides: Record<string, unknown> = {}) {
  return {
    sql: '-- Mock migration\nCREATE TABLE users (id uuid primary key);',
    tables: ['users'],
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

// ===== Test Suite =====

describe('useBackendCreation Error Scenario Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset OAuth mock to authenticated state by default
    mockOAuth.mockReturnValue({
      getToken: vi.fn().mockReturnValue('valid-token'),
      isAuthenticated: true,
      status: 'authenticated',
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('ERR-001: Stage 1 (analyze) error', () => {
    it('should set stage to ERROR when analyzer throws', async () => {
      // Arrange
      const analyzerInstance = {
        analyze: vi.fn().mockRejectedValue(new Error('Analysis failed: Invalid code structure')),
      };

      mockAnalyzer.mockImplementation(() => analyzerInstance);
      mockGenerator.mockImplementation(() => ({
        generate: vi.fn(),
      }));
      mockMCPClient.mockImplementation(() => ({
        createProject: vi.fn(),
        applyMigration: vi.fn(),
        getProjectUrl: vi.fn(),
        getAnonKey: vi.fn(),
      }));

      const { result } = renderHook(() => useBackendCreation());

      // Act
      await act(async () => {
        await result.current.createBackend(SAMPLE_CODE.simpleEntity);
      });

      // Assert
      expect(result.current.stage).toBe(PipelineStage.ERROR);
      expect(result.current.error).toContain('Analysis failed');
      expect(result.current.isCreating).toBe(false);
      expect(result.current.result).toBeNull();

      // Assert: Analyzer was called
      expect(analyzerInstance.analyze).toHaveBeenCalledTimes(1);
    });

    it('should contain "Analysis failed" in error message', async () => {
      // Arrange
      const analyzerInstance = {
        analyze: vi.fn().mockRejectedValue(new Error('Unexpected token at line 5')),
      };

      mockAnalyzer.mockImplementation(() => analyzerInstance);
      mockGenerator.mockImplementation(() => ({
        generate: vi.fn(),
      }));
      mockMCPClient.mockImplementation(() => ({
        createProject: vi.fn(),
        applyMigration: vi.fn(),
        getProjectUrl: vi.fn(),
        getAnonKey: vi.fn(),
      }));

      const { result } = renderHook(() => useBackendCreation());

      // Act
      await act(async () => {
        await result.current.createBackend(SAMPLE_CODE.invalidCode);
      });

      // Assert
      expect(result.current.error).toContain('Analysis failed');
      expect(result.current.error).toContain('Unexpected token');
    });
  });

  describe('ERR-002: Stage 2 (generate) error', () => {
    it('should set stage to ERROR when generator throws', async () => {
      // Arrange
      const mockRequirements = createMockRequirements();

      const analyzerInstance = {
        analyze: vi.fn().mockResolvedValue(mockRequirements),
      };

      const generatorInstance = {
        generate: vi.fn().mockImplementation(() => {
          throw new Error('SQL generation failed: Invalid entity configuration');
        }),
      };

      mockAnalyzer.mockImplementation(() => analyzerInstance);
      mockGenerator.mockImplementation(() => generatorInstance);
      mockMCPClient.mockImplementation(() => ({
        createProject: vi.fn(),
        applyMigration: vi.fn(),
        getProjectUrl: vi.fn(),
        getAnonKey: vi.fn(),
      }));

      const { result } = renderHook(() => useBackendCreation());

      // Act
      await act(async () => {
        await result.current.createBackend(SAMPLE_CODE.simpleEntity);
      });

      // Assert
      expect(result.current.stage).toBe(PipelineStage.ERROR);
      expect(result.current.error).toContain('SQL generation failed');
      expect(result.current.isCreating).toBe(false);

      // Assert: Generator was called (but MCP client methods shouldn't be)
      expect(analyzerInstance.analyze).toHaveBeenCalledTimes(1);
      expect(generatorInstance.generate).toHaveBeenCalledTimes(1);
    });

    it('should contain "SQL generation failed" in error message', async () => {
      // Arrange
      const mockRequirements = createMockRequirements();

      const analyzerInstance = {
        analyze: vi.fn().mockResolvedValue(mockRequirements),
      };

      const generatorInstance = {
        generate: vi.fn().mockImplementation(() => {
          throw new Error('Cannot determine primary key for entity');
        }),
      };

      mockAnalyzer.mockImplementation(() => analyzerInstance);
      mockGenerator.mockImplementation(() => generatorInstance);
      mockMCPClient.mockImplementation(() => ({
        createProject: vi.fn(),
        applyMigration: vi.fn(),
        getProjectUrl: vi.fn(),
        getAnonKey: vi.fn(),
      }));

      const { result } = renderHook(() => useBackendCreation());

      // Act
      await act(async () => {
        await result.current.createBackend(SAMPLE_CODE.simpleEntity);
      });

      // Assert
      expect(result.current.error).toContain('SQL generation failed');
      expect(result.current.error).toContain('Cannot determine primary key');
    });
  });

  describe('ERR-003: Stage 3 (createProject) MCP 401', () => {
    it('should set error state when MCP returns 401 unauthorized', async () => {
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
        createProject: vi.fn().mockRejectedValue(new Error('Unauthorized: Invalid or expired access token')),
        applyMigration: vi.fn(),
        getProjectUrl: vi.fn(),
        getAnonKey: vi.fn(),
      };

      mockAnalyzer.mockImplementation(() => analyzerInstance);
      mockGenerator.mockImplementation(() => generatorInstance);
      mockMCPClient.mockImplementation(() => mcpClientInstance);

      const { result } = renderHook(() => useBackendCreation());

      // Act
      await act(async () => {
        await result.current.createBackend(SAMPLE_CODE.simpleEntity, {
          projectName: 'unauthorized-project',
        });
      });

      // Assert
      expect(result.current.stage).toBe(PipelineStage.ERROR);
      expect(result.current.error).toContain('Project creation failed');
      expect(result.current.error).toContain('Unauthorized');
      expect(result.current.isCreating).toBe(false);
      expect(result.current.result).toBeNull();

      // Assert: Migration should not be applied
      expect(mcpClientInstance.applyMigration).not.toHaveBeenCalled();
    });

    it('should contain "Project creation failed" in error message', async () => {
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
        createProject: vi.fn().mockRejectedValue(new Error('401: Access token expired')),
        applyMigration: vi.fn(),
        getProjectUrl: vi.fn(),
        getAnonKey: vi.fn(),
      };

      mockAnalyzer.mockImplementation(() => analyzerInstance);
      mockGenerator.mockImplementation(() => generatorInstance);
      mockMCPClient.mockImplementation(() => mcpClientInstance);

      const { result } = renderHook(() => useBackendCreation());

      // Act
      await act(async () => {
        await result.current.createBackend(SAMPLE_CODE.simpleEntity);
      });

      // Assert
      expect(result.current.error).toContain('Project creation failed');
    });
  });

  describe('ERR-004: Stage 3 (createProject) MCP 409', () => {
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

      // First call fails with 409, second succeeds (handled by MCPClient)
      const mcpClientInstance = {
        createProject: vi.fn()
          .mockRejectedValueOnce(new Error('Conflict: Project name already exists'))
          .mockResolvedValueOnce(createMockProject()),
        applyMigration: vi.fn(),
        getProjectUrl: vi.fn(),
        getAnonKey: vi.fn(),
      };

      mockAnalyzer.mockImplementation(() => analyzerInstance);
      mockGenerator.mockImplementation(() => generatorInstance);
      mockMCPClient.mockImplementation(() => mcpClientInstance);

      const { result } = renderHook(() => useBackendCreation());

      // Act: First attempt fails with conflict
      await act(async () => {
        await result.current.createBackend(SAMPLE_CODE.simpleEntity, {
          projectName: 'existing-project',
        });
      });

      // Assert: Error state
      expect(result.current.stage).toBe(PipelineStage.ERROR);
      expect(result.current.error).toContain('Project creation failed');
      expect(result.current.error).toContain('Conflict');

      // The retry logic is typically handled inside MCPClient with suffix
      // Here we verify the error is properly reported to the user
      expect(mcpClientInstance.applyMigration).not.toHaveBeenCalled();
    });

    it('should report conflict error with helpful message', async () => {
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

      const { result } = renderHook(() => useBackendCreation());

      // Act
      await act(async () => {
        await result.current.createBackend(SAMPLE_CODE.simpleEntity, {
          projectName: 'duplicate-name',
        });
      });

      // Assert
      expect(result.current.error).toContain('Project creation failed');
      expect(result.current.error).toContain('already exists');
    });
  });

  describe('ERR-005: Stage 4 (applyMigration) error', () => {
    it('should set error state when MCP returns 400 for migration', async () => {
      // Arrange
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
        createProject: vi.fn().mockResolvedValue(mockProject),
        applyMigration: vi.fn().mockRejectedValue(
          new Error('Validation failed: SQL syntax error at line 5')
        ),
        getProjectUrl: vi.fn(),
        getAnonKey: vi.fn(),
      };

      mockAnalyzer.mockImplementation(() => analyzerInstance);
      mockGenerator.mockImplementation(() => generatorInstance);
      mockMCPClient.mockImplementation(() => mcpClientInstance);

      const { result } = renderHook(() => useBackendCreation());

      // Act
      await act(async () => {
        await result.current.createBackend(SAMPLE_CODE.simpleEntity);
      });

      // Assert
      expect(result.current.stage).toBe(PipelineStage.ERROR);
      expect(result.current.error).toContain('Migration failed');
      expect(result.current.error).toContain('SQL syntax error');
      expect(result.current.isCreating).toBe(false);

      // Assert: Project was created but migration failed
      expect(mcpClientInstance.createProject).toHaveBeenCalled();
      expect(mcpClientInstance.applyMigration).toHaveBeenCalled();
    });

    it('should contain "Migration failed" in error message', async () => {
      // Arrange
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
        createProject: vi.fn().mockResolvedValue(mockProject),
        applyMigration: vi.fn().mockRejectedValue(new Error('Foreign key constraint violation')),
        getProjectUrl: vi.fn(),
        getAnonKey: vi.fn(),
      };

      mockAnalyzer.mockImplementation(() => analyzerInstance);
      mockGenerator.mockImplementation(() => generatorInstance);
      mockMCPClient.mockImplementation(() => mcpClientInstance);

      const { result } = renderHook(() => useBackendCreation());

      // Act
      await act(async () => {
        await result.current.createBackend(SAMPLE_CODE.simpleEntity);
      });

      // Assert
      expect(result.current.error).toContain('Migration failed');
      expect(result.current.error).toContain('Foreign key');
    });
  });

  describe('ERR-006: OAuth token expired', () => {
    it('should block pipeline when token is null after being authenticated', async () => {
      // Arrange: User appears authenticated but token is null
      mockOAuth.mockReturnValue({
        getToken: vi.fn().mockReturnValue(null),
        isAuthenticated: true,
        status: 'authenticated',
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
      });

      const { result } = renderHook(() => useBackendCreation());

      // Act
      await act(async () => {
        await result.current.createBackend(SAMPLE_CODE.simpleEntity);
      });

      // Assert
      expect(result.current.stage).toBe(PipelineStage.ERROR);
      expect(result.current.error).toContain('Authentication required');
      expect(result.current.isCreating).toBe(false);
      expect(result.current.result).toBeNull();

      // Assert: No services should be called
      expect(mockAnalyzer).not.toHaveBeenCalled();
    });

    it('should contain "Authentication required" in error message', async () => {
      // Arrange
      mockOAuth.mockReturnValue({
        getToken: vi.fn().mockReturnValue(null),
        isAuthenticated: false,
        status: 'idle',
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
      });

      const { result } = renderHook(() => useBackendCreation());

      // Act
      await act(async () => {
        await result.current.createBackend(SAMPLE_CODE.simpleEntity);
      });

      // Assert
      expect(result.current.error).toContain('Authentication required');
    });

    it('should block pipeline when isAuthenticated is false', async () => {
      // Arrange
      mockOAuth.mockReturnValue({
        getToken: vi.fn().mockReturnValue(null),
        isAuthenticated: false,
        status: 'idle',
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
      });

      const { result } = renderHook(() => useBackendCreation());

      // Act
      await act(async () => {
        await result.current.createBackend(SAMPLE_CODE.simpleEntity);
      });

      // Assert
      expect(result.current.stage).toBe(PipelineStage.ERROR);
      expect(result.current.error).toContain('Authentication');
      expect(mockAnalyzer).not.toHaveBeenCalled();
    });
  });

  describe('Error Recovery', () => {
    it('should allow retry after error state', async () => {
      // Arrange: First attempt fails
      const mockRequirements = createMockRequirements();
      const mockMigrationResult = createMockMigration();
      const mockProject = createMockProject();

      const analyzerInstance = {
        analyze: vi.fn()
          .mockRejectedValueOnce(new Error('First failure'))
          .mockResolvedValueOnce(mockRequirements),
      };

      const generatorInstance = {
        generate: vi.fn().mockReturnValue(mockMigrationResult),
      };

      const mcpClientInstance = {
        createProject: vi.fn().mockResolvedValue(mockProject),
        applyMigration: vi.fn().mockResolvedValue({ success: true }),
        getProjectUrl: vi.fn().mockResolvedValue('https://test.supabase.co'),
        getAnonKey: vi.fn().mockResolvedValue('mock-anon-key'),
      };

      mockAnalyzer.mockImplementation(() => analyzerInstance);
      mockGenerator.mockImplementation(() => generatorInstance);
      mockMCPClient.mockImplementation(() => mcpClientInstance);

      const { result } = renderHook(() => useBackendCreation());

      // Act: First attempt fails
      await act(async () => {
        await result.current.createBackend(SAMPLE_CODE.simpleEntity);
      });

      // Assert: Error state
      expect(result.current.stage).toBe(PipelineStage.ERROR);

      // Act: Retry
      await act(async () => {
        await result.current.retry();
      });

      // Assert: Success after retry
      expect(result.current.stage).toBe(PipelineStage.COMPLETE);
      expect(result.current.error).toBeNull();
      expect(result.current.result).not.toBeNull();
    });

    it('should clear error when reset is called', async () => {
      // Arrange: Setup to fail
      const analyzerInstance = {
        analyze: vi.fn().mockRejectedValue(new Error('Test error')),
      };

      mockAnalyzer.mockImplementation(() => analyzerInstance);
      mockGenerator.mockImplementation(() => ({
        generate: vi.fn(),
      }));
      mockMCPClient.mockImplementation(() => ({
        createProject: vi.fn(),
        applyMigration: vi.fn(),
        getProjectUrl: vi.fn(),
        getAnonKey: vi.fn(),
      }));

      const { result } = renderHook(() => useBackendCreation());

      // Act: Trigger error
      await act(async () => {
        await result.current.createBackend(SAMPLE_CODE.simpleEntity);
      });

      // Assert: Error state
      expect(result.current.stage).toBe(PipelineStage.ERROR);
      expect(result.current.error).not.toBeNull();

      // Act: Reset
      act(() => {
        result.current.reset();
      });

      // Assert: Back to initial state
      expect(result.current.stage).toBe(PipelineStage.IDLE);
      expect(result.current.error).toBeNull();
      expect(result.current.result).toBeNull();
      expect(result.current.progress).toBe(0);
    });
  });
});
