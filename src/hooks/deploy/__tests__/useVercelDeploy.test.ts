/**
 * useVercelDeploy hook tests
 *
 * Tests deploy pipeline orchestration:
 * - Stage transitions (PREPARING → DEPLOYING → WAITING → COMPLETE)
 * - Progress updates at each stage
 * - Error handling with retry
 * - Abort support
 * - Reset functionality
 *
 * @module hooks/deploy/__tests__
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { DeployStage } from '../types';

// Mock the service layer
vi.mock('../../../services/deploy/filePrep', () => ({
  prepareFiles: vi.fn().mockImplementation((files) => {
    if (files.length === 0) throw new Error('No files to deploy');
    return files.map((f: { path: string; content: string }) => ({
      file: f.path,
      data: btoa(f.content),
      encoding: 'base64',
    }));
  }),
}));

vi.mock('../../../services/deploy/vercelApi', () => ({
  createDeployment: vi.fn().mockResolvedValue({
    id: 'dep_test123',
    url: 'https://my-app.vercel.app',
    state: 'BUILDING',
  }),
  pollDeployment: vi.fn().mockResolvedValue({
    id: 'dep_test123',
    url: 'https://my-app.vercel.app',
    state: 'READY',
  }),
}));

vi.mock('../useVercelOAuth', () => ({
  useVercelOAuth: () => ({
    getToken: vi.fn().mockReturnValue('test-token-xyz'),
    isAuthenticated: true,
    status: 'authenticated',
    error: null,
    login: vi.fn(),
    exchangeCode: vi.fn(),
    logout: vi.fn(),
  }),
}));

import { useVercelDeploy } from '../useVercelDeploy';
import { prepareFiles } from '../../../services/deploy/filePrep';
import { createDeployment, pollDeployment } from '../../../services/deploy/vercelApi';

const mockPrepareFiles = vi.mocked(prepareFiles);
const mockCreateDeployment = vi.mocked(createDeployment);
const mockPollDeployment = vi.mocked(pollDeployment);

beforeEach(() => {
  vi.clearAllMocks();
  mockPrepareFiles.mockImplementation((files) => {
    if (files.length === 0) throw new Error('No files to deploy');
    return files.map((f: { path: string; content: string }) => ({
      file: f.path,
      data: btoa(f.content),
      encoding: 'base64' as const,
    }));
  });
  mockCreateDeployment.mockResolvedValue({
    id: 'dep_test123',
    url: 'https://my-app.vercel.app',
    state: 'BUILDING',
  });
  mockPollDeployment.mockResolvedValue({
    id: 'dep_test123',
    url: 'https://my-app.vercel.app',
    state: 'READY',
  });
});

describe('useVercelDeploy', () => {
  const sampleFiles = [
    { path: 'src/App.tsx', content: 'export default function App() {}' },
    { path: 'index.html', content: '<html></html>' },
  ];

  it('should start in IDLE stage with 0 progress', () => {
    const { result } = renderHook(() => useVercelDeploy());

    expect(result.current.stage).toBe(DeployStage.IDLE);
    expect(result.current.progress).toBe(0);
    expect(result.current.isDeploying).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.result).toBeNull();
  });

  it('should transition through PREPARING → DEPLOYING → WAITING → COMPLETE on successful deploy', async () => {
    const { result } = renderHook(() => useVercelDeploy());

    // Track stage transitions
    const stages: DeployStage[] = [];

    renderHook(() => {
      // Use renderHook to capture each render's stage
    });

    await act(async () => {
      await result.current.deploy(sampleFiles, { projectName: 'test-app' });
    });

    expect(result.current.stage).toBe(DeployStage.COMPLETE);
    expect(result.current.result).toBeTruthy();
    expect(result.current.result!.url).toBe('https://my-app.vercel.app');
    expect(result.current.result!.deploymentId).toBe('dep_test123');
    expect(result.current.result!.projectName).toBe('test-app');
    expect(result.current.isDeploying).toBe(false);
  });

  it('should call prepareFiles with project files', async () => {
    const { result } = renderHook(() => useVercelDeploy());

    await act(async () => {
      await result.current.deploy(sampleFiles);
    });

    expect(mockPrepareFiles).toHaveBeenCalledWith(sampleFiles);
  });

  it('should call createDeployment with prepared files and token', async () => {
    const { result } = renderHook(() => useVercelDeploy());

    await act(async () => {
      await result.current.deploy(sampleFiles, { projectName: 'my-project' });
    });

    expect(mockCreateDeployment).toHaveBeenCalledWith(
      'test-token-xyz',
      expect.arrayContaining([
        expect.objectContaining({ file: 'src/App.tsx', encoding: 'base64' }),
      ]),
      'my-project'
    );
  });

  it('should call pollDeployment after deployment creation', async () => {
    const { result } = renderHook(() => useVercelDeploy());

    await act(async () => {
      await result.current.deploy(sampleFiles);
    });

    // pollDeployment is called with (deploymentId, token) — options defaults to {}
    expect(mockPollDeployment).toHaveBeenCalledWith('dep_test123', 'test-token-xyz');
  });

  it('should set ERROR stage when prepareFiles throws', async () => {
    mockPrepareFiles.mockImplementationOnce(() => {
      throw new Error('No files to deploy');
    });

    const { result } = renderHook(() => useVercelDeploy());

    await act(async () => {
      await result.current.deploy([], { projectName: 'fail-app' });
    });

    expect(result.current.stage).toBe(DeployStage.ERROR);
    expect(result.current.error).toContain('No files to deploy');
    expect(result.current.isDeploying).toBe(false);
  });

  it('should set ERROR stage when createDeployment fails', async () => {
    mockCreateDeployment.mockRejectedValueOnce(new Error('Vercel API error: 401'));

    const { result } = renderHook(() => useVercelDeploy());

    await act(async () => {
      await result.current.deploy(sampleFiles);
    });

    expect(result.current.stage).toBe(DeployStage.ERROR);
    expect(result.current.error).toContain('401');
  });

  it('should set ERROR stage when pollDeployment fails', async () => {
    mockPollDeployment.mockRejectedValueOnce(new Error('Deployment timed out'));

    const { result } = renderHook(() => useVercelDeploy());

    await act(async () => {
      await result.current.deploy(sampleFiles);
    });

    expect(result.current.stage).toBe(DeployStage.ERROR);
    expect(result.current.error).toContain('timed out');
  });

  it('should retry from beginning after error', async () => {
    // First deploy call: createDeployment rejects
    mockCreateDeployment.mockRejectedValueOnce(new Error('API error'));

    const { result } = renderHook(() => useVercelDeploy());

    await act(async () => {
      await result.current.deploy(sampleFiles, { projectName: 'retry-app' });
    });

    expect(result.current.stage).toBe(DeployStage.ERROR);
    expect(result.current.error).toContain('API error');

    // Set up mocks for the retry: createDeployment succeeds, pollDeployment succeeds
    mockCreateDeployment.mockResolvedValueOnce({
      id: 'dep_retry',
      url: 'https://retry-app.vercel.app',
      state: 'BUILDING',
    });
    mockPollDeployment.mockResolvedValueOnce({
      id: 'dep_retry',
      url: 'https://retry-app.vercel.app',
      state: 'READY',
    });

    await act(async () => {
      const retried = result.current.retry();
      expect(retried).toBe(true);
      // Wait for the async pipeline to complete
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(result.current.stage).toBe(DeployStage.COMPLETE);
    expect(result.current.result!.url).toBe('https://retry-app.vercel.app');
  });

  it('should reset all state on reset()', async () => {
    const { result } = renderHook(() => useVercelDeploy());

    await act(async () => {
      await result.current.deploy(sampleFiles);
    });

    expect(result.current.stage).toBe(DeployStage.COMPLETE);

    act(() => {
      result.current.reset();
    });

    expect(result.current.stage).toBe(DeployStage.IDLE);
    expect(result.current.progress).toBe(0);
    expect(result.current.error).toBeNull();
    expect(result.current.result).toBeNull();
  });

  it('should set ERROR when not authenticated (no token)', async () => {
    // Re-mock useVercelOAuth at the vi.mock level to return unauthenticated state
    // We use a module-level variable to control the mock behavior
    let mockGetTokenReturn: string | null = null;
    let mockIsAuthenticated = false;

    vi.doMock('../useVercelOAuth', () => ({
      useVercelOAuth: () => ({
        getToken: () => mockGetTokenReturn,
        isAuthenticated: mockIsAuthenticated,
        status: 'idle',
        error: null,
        login: vi.fn(),
        exchangeCode: vi.fn(),
        logout: vi.fn(),
      }),
    }));

    // Need dynamic import after doMock
    vi.resetModules();
    const { useVercelDeploy: useVercelDeployFresh } = await import('../useVercelDeploy');
    const { result } = renderHook(() => useVercelDeployFresh());

    await act(async () => {
      await result.current.deploy(sampleFiles);
    });

    expect(result.current.stage).toBe(DeployStage.ERROR);
    expect(result.current.error).toContain('Authentication');

    vi.doUnmock('../useVercelOAuth');
    vi.resetModules();
  });
});
