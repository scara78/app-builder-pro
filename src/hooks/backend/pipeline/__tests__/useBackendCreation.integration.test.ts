/**
 * Integration Tests for useBackendCreation Hook
 * CHANGE 4 - Backend Pipeline Integration
 * Phase 6B - Hook Integration Tests
 *
 * Tests validate useBackendCreation hook orchestration with mocked services
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
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
import type { BackendRequirements } from '../../../../services/analyzer/types';
import type { MigrationResult } from '../../../../services/sql/types';
import type { SupabaseProject } from '../../../../services/supabase/types';

// ===== Mock References =====

const mockAnalyzer = BackendRequirementsAnalyzer as ReturnType<typeof vi.fn>;
const mockGenerator = SQLGenerator as ReturnType<typeof vi.fn>;
const mockMCPClient = SupabaseMCPClient as ReturnType<typeof vi.fn>;
const mockOAuth = useSupabaseOAuth as ReturnType<typeof vi.fn>;

// ===== Helper Functions =====

function createMockRequirements(overrides: Partial<BackendRequirements> = {}): BackendRequirements {
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

function createMockMigration(overrides: Partial<MigrationResult> = {}): MigrationResult {
  return {
    sql: '-- Mock migration\nCREATE TABLE users (id uuid primary key);',
    tables: ['users'],
    warnings: [],
    ...overrides,
  };
}

function createMockProject(overrides: Partial<SupabaseProject> = {}): SupabaseProject {
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
    createProject: vi.fn().mockResolvedValue(mockProject),
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

describe('useBackendCreation Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('INT-001: Happy path completo', () => {
    it('should flow through Analyzer -> SQLGenerator -> MCPClient with correct stage transitions', async () => {
      // Arrange
      const { analyzerInstance, generatorInstance, mcpClientInstance, mockRequirements, mockMigrationResult, mockProject } = setupSuccessfulPipeline();

      const { result } = renderHook(() => useBackendCreation());

      // Initial state assertions
      expect(result.current.stage).toBe(PipelineStage.IDLE);
      expect(result.current.progress).toBe(0);
      expect(result.current.isCreating).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.result).toBeNull();

      // Act
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
      expect(analyzerInstance.analyze).toHaveBeenCalledWith(SAMPLE_CODE.simpleEntity);

      expect(generatorInstance.generate).toHaveBeenCalledTimes(1);
      expect(generatorInstance.generate).toHaveBeenCalledWith(mockRequirements);

      expect(mcpClientInstance.createProject).toHaveBeenCalledTimes(1);
      expect(mcpClientInstance.createProject).toHaveBeenCalledWith('test-project', 'us-east-1');

      expect(mcpClientInstance.applyMigration).toHaveBeenCalledTimes(1);
      expect(mcpClientInstance.applyMigration).toHaveBeenCalledWith(
        mockProject.ref,
        mockMigrationResult.sql,
        'initial_schema'
      );
    });

    it('should update progress through all stages', async () => {
      // Arrange
      const { mcpClientInstance } = setupSuccessfulPipeline();

      const { result } = renderHook(() => useBackendCreation());

      // Act
      await act(async () => {
        await result.current.createBackend(SAMPLE_CODE.simpleEntity);
      });

      // Assert: Final progress is 100% at APPLYING_MIGRATION stage
      expect(result.current.progress).toBe(100);
      expect(result.current.stage).toBe(PipelineStage.COMPLETE);
    });
  });

  describe('INT-002: Auth check falla', () => {
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
      expect(result.current.error).toContain('OAuth');
      expect(result.current.isCreating).toBe(false);
      expect(result.current.result).toBeNull();

      // Assert: Services should not be called
      expect(mockAnalyzer).not.toHaveBeenCalled();
    });

    it('should block pipeline when token is null', async () => {
      // Arrange - authenticated but no token (edge case)
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
      expect(result.current.error).toContain('Authentication');
      expect(mockAnalyzer).not.toHaveBeenCalled();
    });
  });

  describe('INT-003: Analyzer fallback', () => {
    it('should complete pipeline despite low confidence analysis', async () => {
      // Arrange
      const mockRequirements = createMockRequirements({
        overallConfidence: 30, // Low confidence
        entities: [],
        hasAuth: false,
        hasStorage: false,
      });
      const mockMigrationResult = createMockMigration({
        sql: '-- Minimal migration (no tables)',
        tables: [],
      });
      const mockProject = createMockProject();

      const analyzerInstance = {
        analyze: vi.fn().mockResolvedValue(mockRequirements),
      };
      const generatorInstance = {
        generate: vi.fn().mockReturnValue(mockMigrationResult),
      };
      const mcpClientInstance = {
        createProject: vi.fn().mockResolvedValue(mockProject),
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

      const { result } = renderHook(() => useBackendCreation());

      // Act
      await act(async () => {
        await result.current.createBackend(SAMPLE_CODE.emptyCode);
      });

      // Assert: Pipeline completes despite low confidence
      expect(result.current.stage).toBe(PipelineStage.COMPLETE);
      expect(result.current.error).toBeNull();
      expect(result.current.result).not.toBeNull();

      // Assert: All services were still called
      expect(analyzerInstance.analyze).toHaveBeenCalled();
      expect(generatorInstance.generate).toHaveBeenCalledWith(mockRequirements);
      expect(mcpClientInstance.createProject).toHaveBeenCalled();
      expect(mcpClientInstance.applyMigration).toHaveBeenCalled();
    });
  });

  describe('INT-004: MCP error recovery', () => {
    it('should set error state when createProject fails', async () => {
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
        createProject: vi.fn().mockRejectedValue(new Error('Project quota exceeded')),
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
        await result.current.createBackend(SAMPLE_CODE.simpleEntity);
      });

      // Assert
      expect(result.current.stage).toBe(PipelineStage.ERROR);
      expect(result.current.error).toContain('Project creation failed');
      expect(result.current.error).toContain('Project quota exceeded');
      expect(result.current.isCreating).toBe(false);
      expect(result.current.result).toBeNull();

      // Assert: Migration should not be applied
      expect(mcpClientInstance.applyMigration).not.toHaveBeenCalled();
    });

    it('should set error state when applyMigration fails', async () => {
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
        applyMigration: vi.fn().mockRejectedValue(new Error('SQL syntax error in migration')),
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
        await result.current.createBackend(SAMPLE_CODE.simpleEntity);
      });

      // Assert
      expect(result.current.stage).toBe(PipelineStage.ERROR);
      expect(result.current.error).toContain('Migration failed');
      expect(result.current.error).toContain('SQL syntax error');
      expect(result.current.isCreating).toBe(false);
    });

    it('should set error state when analyzer fails', async () => {
      // Arrange
      const analyzerInstance = {
        analyze: vi.fn().mockRejectedValue(new Error('Code parsing failed')),
      };
      let generatorCreated = false;
      let mcpClientCreated = false;

      mockAnalyzer.mockImplementation(() => analyzerInstance);
      mockGenerator.mockImplementation(() => {
        generatorCreated = true;
        return { generate: vi.fn() };
      });
      mockMCPClient.mockImplementation(() => {
        mcpClientCreated = true;
        return { createProject: vi.fn(), applyMigration: vi.fn(), getProjectUrl: vi.fn(), getAnonKey: vi.fn() };
      });
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
        await result.current.createBackend(SAMPLE_CODE.simpleEntity);
      });

      // Assert
      expect(result.current.stage).toBe(PipelineStage.ERROR);
      expect(result.current.error).toContain('Analysis failed');
      expect(result.current.error).toContain('Code parsing failed');

      // Assert: Analyzer was called
      expect(analyzerInstance.analyze).toHaveBeenCalledTimes(1);
      // Note: Generator and MCPClient may be instantiated but their methods shouldn't be called
    });

    it('should set error state when SQLGenerator fails', async () => {
      // Arrange
      const mockRequirements = createMockRequirements();

      const analyzerInstance = {
        analyze: vi.fn().mockResolvedValue(mockRequirements),
      };
      const generatorInstance = {
        generate: vi.fn().mockImplementation(() => {
          throw new Error('Invalid entity configuration');
        }),
      };
      let mcpClientCreated = false;

      mockAnalyzer.mockImplementation(() => analyzerInstance);
      mockGenerator.mockImplementation(() => generatorInstance);
      mockMCPClient.mockImplementation(() => {
        mcpClientCreated = true;
        return { createProject: vi.fn(), applyMigration: vi.fn(), getProjectUrl: vi.fn(), getAnonKey: vi.fn() };
      });
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
        await result.current.createBackend(SAMPLE_CODE.simpleEntity);
      });

      // Assert
      expect(result.current.stage).toBe(PipelineStage.ERROR);
      expect(result.current.error).toContain('SQL generation failed');
      expect(result.current.error).toContain('Invalid entity configuration');

      // Assert: Analyzer and Generator were called, but MCP client methods shouldn't be
      expect(analyzerInstance.analyze).toHaveBeenCalledTimes(1);
      expect(generatorInstance.generate).toHaveBeenCalledTimes(1);
    });
  });

  describe('INT-005: Retry desde error', () => {
    it('should restart pipeline when retry() called from error state', async () => {
      // Arrange - Use mockRejectedValueOnce pattern (same as existing test)
      const mockRequirements = createMockRequirements();
      const mockMigrationResult = createMockMigration();
      const mockProject = createMockProject();

      const analyzerInstance = {
        analyze: vi.fn()
          .mockRejectedValueOnce(new Error('Temporary failure'))
          .mockResolvedValue(mockRequirements),
      };
      const generatorInstance = {
        generate: vi.fn().mockReturnValue(mockMigrationResult),
      };
      const mcpClientInstance = {
        createProject: vi.fn().mockResolvedValue(mockProject),
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

      const { result } = renderHook(() => useBackendCreation());

      // Act: First attempt (fails)
      await act(async () => {
        await result.current.createBackend(SAMPLE_CODE.simpleEntity, {
          projectName: 'test-project',
        });
      });

      // Assert: Error state
      expect(result.current.stage).toBe(PipelineStage.ERROR);
      expect(result.current.error).toContain('Temporary failure');
      expect(analyzerInstance.analyze).toHaveBeenCalledTimes(1);

      // Act: Retry
      await act(async () => {
        await result.current.retry();
      });

      // Assert: Analyzer called twice
      expect(analyzerInstance.analyze).toHaveBeenCalledTimes(2);

      // Assert: Pipeline completed
      await waitFor(() => {
        expect(result.current.stage).toBe(PipelineStage.COMPLETE);
      });
      expect(result.current.error).toBeNull();
      expect(result.current.result).not.toBeNull();
    });

    it('should return false when retry() called from non-error state', async () => {
      // Arrange
      mockOAuth.mockReturnValue({
        getToken: vi.fn().mockReturnValue('valid-token'),
        isAuthenticated: true,
        status: 'authenticated',
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
      });

      const { result } = renderHook(() => useBackendCreation());

      // Act: Call retry when in IDLE state
      let retryResult: boolean;
      act(() => {
        retryResult = result.current.retry();
      });

      // Assert: Retry not initiated
      expect(retryResult!).toBe(false);
      expect(result.current.stage).toBe(PipelineStage.IDLE);
    });

    it('should use stored code and options when retrying', async () => {
      // Arrange - Use mockRejectedValueOnce pattern
      const mockRequirements = createMockRequirements();
      const mockMigrationResult = createMockMigration();
      const mockProject = createMockProject({ name: 'custom-retry-project' });

      const analyzerInstance = {
        analyze: vi.fn()
          .mockRejectedValueOnce(new Error('First failure'))
          .mockResolvedValue(mockRequirements),
      };
      const generatorInstance = {
        generate: vi.fn().mockReturnValue(mockMigrationResult),
      };
      const mcpClientInstance = {
        createProject: vi.fn().mockResolvedValue(mockProject),
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

      const { result } = renderHook(() => useBackendCreation());

      const customCode = SAMPLE_CODE.complexApp;
      const customOptions = {
        projectName: 'custom-retry-project',
        region: 'eu-west-1',
        enableRLS: false,
      };

      // Act: First attempt with custom options
      await act(async () => {
        await result.current.createBackend(customCode, customOptions);
      });

      // Assert: Error state
      expect(result.current.stage).toBe(PipelineStage.ERROR);
      expect(analyzerInstance.analyze).toHaveBeenCalledTimes(1);
      expect(analyzerInstance.analyze).toHaveBeenNthCalledWith(1, customCode);

      // Act: Retry
      await act(async () => {
        await result.current.retry();
      });

      // Assert: Second call used stored code
      expect(analyzerInstance.analyze).toHaveBeenCalledTimes(2);
      expect(analyzerInstance.analyze).toHaveBeenNthCalledWith(2, customCode);

      // Wait for completion
      await waitFor(() => {
        expect(result.current.stage).toBe(PipelineStage.COMPLETE);
      });

      // Assert: createProject was called at least once with the correct options
      // (Each retry creates a new MCP client instance, so we verify the call was made)
      expect(mcpClientInstance.createProject).toHaveBeenCalledWith('custom-retry-project', 'eu-west-1');
    });
  });

  describe('INT-006: Abort signal', () => {
    it('should abort pipeline and set correct state', async () => {
      // Arrange - Create a slow analyzer that we can abort mid-execution
      const mockRequirements = createMockRequirements();
      let analyzeResolve: (value: BackendRequirements) => void;
      const analyzePromise = new Promise<BackendRequirements>((resolve) => {
        analyzeResolve = resolve;
      });

      const analyzerInstance = {
        analyze: vi.fn().mockImplementation(() => {
          // Return a promise that doesn't resolve immediately
          return analyzePromise;
        }),
      };

      const generatorInstance = {
        generate: vi.fn().mockReturnValue(createMockMigration()),
      };

      const mcpClientInstance = {
        createProject: vi.fn().mockResolvedValue(createMockProject()),
        applyMigration: vi.fn().mockResolvedValue({ success: true }),
        getProjectUrl: vi.fn().mockResolvedValue('https://test.supabase.co'),
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

      const { result } = renderHook(() => useBackendCreation());

      // Start the pipeline (don't await, we want to abort mid-execution)
      act(() => {
        result.current.createBackend(SAMPLE_CODE.simpleEntity);
      });

      // Wait for pipeline to enter ANALYZING stage
      await waitFor(() => {
        expect(result.current.stage).toBe(PipelineStage.ANALYZING);
      });
      expect(result.current.isCreating).toBe(true);

      // Act: Abort the pipeline
      let abortResult: boolean;
      act(() => {
        abortResult = result.current.abort();
      });

      // Assert: Abort was triggered
      expect(abortResult!).toBe(true);
      expect(result.current.stage).toBe(PipelineStage.IDLE);
      expect(result.current.error).toBe('Pipeline aborted by user');
      expect(result.current.isCreating).toBe(false);

      // Resolve the pending analyze promise (simulates async cleanup)
      analyzeResolve!(mockRequirements);

      // Assert: Generator and MCP should NOT have been called
      expect(generatorInstance.generate).not.toHaveBeenCalled();
      expect(mcpClientInstance.createProject).not.toHaveBeenCalled();
    });

    it('should return false when abort called with no pipeline running', async () => {
      // Arrange
      mockOAuth.mockReturnValue({
        getToken: vi.fn().mockReturnValue('valid-token'),
        isAuthenticated: true,
        status: 'authenticated',
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
      });

      const { result } = renderHook(() => useBackendCreation());

      // Assert: Initial state is IDLE
      expect(result.current.stage).toBe(PipelineStage.IDLE);
      expect(result.current.isCreating).toBe(false);

      // Act: Call abort when not running
      let abortResult: boolean;
      act(() => {
        abortResult = result.current.abort();
      });

      // Assert: Abort returns false
      expect(abortResult!).toBe(false);
    });

    it('should allow starting new pipeline after abort', async () => {
      // Arrange - First attempt that will be aborted
      const slowAnalyzer = {
        analyze: vi.fn().mockImplementation(() => new Promise(() => {})), // Never resolves
      };

      const fastAnalyzer = {
        analyze: vi.fn().mockResolvedValue(createMockRequirements()),
      };

      const generatorInstance = {
        generate: vi.fn().mockReturnValue(createMockMigration()),
      };

      const mcpClientInstance = {
        createProject: vi.fn().mockResolvedValue(createMockProject()),
        applyMigration: vi.fn().mockResolvedValue({ success: true }),
        getProjectUrl: vi.fn().mockResolvedValue('https://test.supabase.co'),
        getAnonKey: vi.fn().mockResolvedValue('mock-anon-key'),
      };

      mockOAuth.mockReturnValue({
        getToken: vi.fn().mockReturnValue('valid-token'),
        isAuthenticated: true,
        status: 'authenticated',
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
      });

      // First call uses slow analyzer
      mockAnalyzer.mockImplementation(() => slowAnalyzer);
      mockGenerator.mockImplementation(() => generatorInstance);
      mockMCPClient.mockImplementation(() => mcpClientInstance);

      const { result } = renderHook(() => useBackendCreation());

      // Start pipeline
      act(() => {
        result.current.createBackend(SAMPLE_CODE.simpleEntity);
      });

      await waitFor(() => {
        expect(result.current.stage).toBe(PipelineStage.ANALYZING);
      });

      // Abort
      act(() => {
        result.current.abort();
      });

      expect(result.current.stage).toBe(PipelineStage.IDLE);

      // Now setup for successful second attempt
      mockAnalyzer.mockImplementation(() => fastAnalyzer);

      // Act: Start new pipeline after abort
      await act(async () => {
        await result.current.createBackend(SAMPLE_CODE.simpleEntity);
      });

      // Assert: New pipeline completes successfully
      expect(result.current.stage).toBe(PipelineStage.COMPLETE);
      expect(result.current.error).toBeNull();
      expect(result.current.result).not.toBeNull();
    });
  });

  describe('Additional integration scenarios', () => {
    it('should reset all state when reset() is called', async () => {
      // Arrange
      setupSuccessfulPipeline();

      const { result } = renderHook(() => useBackendCreation());

      // Act: Complete a pipeline run
      await act(async () => {
        await result.current.createBackend(SAMPLE_CODE.simpleEntity);
      });

      // Assert: Complete state
      await waitFor(() => {
        expect(result.current.stage).toBe(PipelineStage.COMPLETE);
      });
      expect(result.current.result).not.toBeNull();

      // Act: Reset
      act(() => {
        result.current.reset();
      });

      // Assert: All state reset to initial
      expect(result.current.stage).toBe(PipelineStage.IDLE);
      expect(result.current.progress).toBe(0);
      expect(result.current.isCreating).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.result).toBeNull();
    });

    it('should use auto-generated project name when not provided', async () => {
      // Arrange
      const { mcpClientInstance } = setupSuccessfulPipeline();

      const { result } = renderHook(() => useBackendCreation());

      // Act: No project name provided
      await act(async () => {
        await result.current.createBackend(SAMPLE_CODE.simpleEntity);
      });

      // Assert: Auto-generated name used (matches pattern backend-{timestamp})
      expect(mcpClientInstance.createProject).toHaveBeenCalledWith(
        expect.stringMatching(/^backend-\d+$/),
        'us-east-1'
      );
    });

    it('should use fallback URL when getProjectUrl fails', async () => {
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
        applyMigration: vi.fn().mockResolvedValue({ success: true, migrationId: 'migration-123' }),
        getProjectUrl: vi.fn().mockRejectedValue(new Error('URL fetch failed')),
        getAnonKey: vi.fn().mockRejectedValue(new Error('Key fetch failed')),
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
        await result.current.createBackend(SAMPLE_CODE.simpleEntity);
      });

      // Assert: Fallback URL used
      expect(result.current.stage).toBe(PipelineStage.COMPLETE);
      expect(result.current.result?.projectUrl).toBe(`https://${mockProject.ref}.supabase.co`);
      expect(result.current.result?.anonKey).toBe('Unable to fetch anon key');
    });
  });
});
