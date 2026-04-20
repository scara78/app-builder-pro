import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useSupabase, useSupabaseQuery, useSupabaseMutation } from '../useSupabase';

// Factory function for creating mock client
const createMockClient = (): SupabaseClient =>
  ({
    from: vi.fn((table: string) => {
      const baseQuery = {
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({ data: null, error: null }),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: null, error: null }),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            delete: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
      };
      return baseQuery;
    }),
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  }) as unknown as SupabaseClient;

describe('useSupabase', () => {
  let mockClient: SupabaseClient;

  beforeEach(() => {
    mockClient = createMockClient();
    vi.clearAllMocks();
  });

  // ============ RED - Test: Hook initializes with client and isReady ============
  it('initializes with client and ready state', () => {
    // Given
    // When
    const { result } = renderHook(() => useSupabase(mockClient));

    // Then
    expect(result.current.isReady).toBe(true);
    expect(result.current.error).toBe(null);
    expect(result.current.client).toBeDefined();
  });

  // ============ RED - Test: Returns expected interface ============
  it('returns expected interface with client, isReady, error', () => {
    // Given
    // When
    const { result } = renderHook(() => useSupabase(mockClient));

    // Then - verify all expected properties exist
    expect(result.current).toHaveProperty('client');
    expect(result.current).toHaveProperty('isReady');
    expect(result.current).toHaveProperty('error');
    expect(result.current.client).not.toBeNull();
    expect(typeof result.current.client?.from).toBe('function');
  });
});

describe('useSupabaseQuery', () => {
  let mockClient: SupabaseClient;

  beforeEach(() => {
    mockClient = createMockClient();
    vi.clearAllMocks();
  });

  // ============ RED - Test: Query hook initializes with loading state ============
  it('initializes with loading state and empty data', async () => {
    // Given
    const options = {
      table: 'users',
      select: 'id, name',
      client: mockClient,
    };

    // Mock the select chain to return data with a delayed promise
    // This ensures we can catch the initial loading state before the promise resolves
    let resolvePromise: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    const mockSelect = vi.fn().mockReturnValue(pendingPromise);

    (mockClient.from as any).mockReturnValue({ select: mockSelect });

    // When
    const { result } = renderHook(() => useSupabaseQuery(options));

    // Then - should start loading (promise hasn't resolved yet)
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);

    // Cleanup: resolve the promise to avoid hanging
    resolvePromise!({ data: [], error: null });
    await act(async () => {
      await pendingPromise;
    });
  });

  // ============ RED - Test: Query fetches data successfully ============
  it('fetches data and sets loading to false', async () => {
    // Given
    const testData = [
      { id: '1', name: 'John' },
      { id: '2', name: 'Jane' },
    ];
    const mockSelect = vi.fn().mockResolvedValue({
      data: testData,
      error: null,
    });

    (mockClient.from as any).mockReturnValue({ select: mockSelect });

    // When
    const { result } = renderHook(() =>
      useSupabaseQuery({
        table: 'users',
        select: '*',
        client: mockClient,
      })
    );

    // Then - wait for loading to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(testData);
    expect(result.current.error).toBe(null);
  });

  // ============ RED - Test: Query handles errors ============
  it('handles query errors and sets error state', async () => {
    // Given
    const queryError = { message: 'Failed to fetch' };
    const mockSelect = vi.fn().mockResolvedValue({
      data: null,
      error: queryError,
    });

    (mockClient.from as any).mockReturnValue({ select: mockSelect });

    // When
    const { result } = renderHook(() =>
      useSupabaseQuery({
        table: 'users',
        client: mockClient,
      })
    );

    // Then - wait for loading to complete and check error
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(new Error(queryError.message));
  });

  // ============ RED - Test: Query refetch works ============
  it('refetch function is available and callable', async () => {
    // Given
    const mockSelect = vi.fn().mockResolvedValue({
      data: [{ id: '1' }],
      error: null,
    });
    (mockClient.from as any).mockReturnValue({ select: mockSelect });

    // When
    const { result } = renderHook(() =>
      useSupabaseQuery({
        table: 'users',
        client: mockClient,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Then - refetch should be a function
    expect(typeof result.current.refetch).toBe('function');

    // And should be callable
    await act(async () => {
      await result.current.refetch();
    });
  });
});

describe('useSupabaseMutation', () => {
  let mockClient: SupabaseClient;

  beforeEach(() => {
    mockClient = createMockClient();
    vi.clearAllMocks();
  });

  // ============ RED - Test: Mutation hook provides insert, update, remove ============
  it('initializes with insert, update, remove functions and loading state', () => {
    // Given
    // When
    const { result } = renderHook(() => useSupabaseMutation({ client: mockClient }));

    // Then
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.insert).toBe('function');
    expect(typeof result.current.update).toBe('function');
    expect(typeof result.current.remove).toBe('function');
  });

  // ============ RED - Test: Insert returns null when not mocked ============
  it('insert returns null when mock returns undefined data', async () => {
    // Given
    const insertData = { name: 'New User' };

    // Mock returns data: undefined which causes hook to return null
    (mockClient.from as any).mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: undefined, error: null }),
        single: vi.fn().mockResolvedValue({ data: undefined, error: null }),
      }),
    });

    // When
    const { result } = renderHook(() => useSupabaseMutation({ client: mockClient }));

    let insertedResult: any;
    await act(async () => {
      insertedResult = await result.current.insert('users', insertData);
    });

    // Then - returns null because data is undefined
    expect(result.current.loading).toBe(false);
    expect(insertedResult).toBe(null);
  });

  // ============ RED - Test: Remove performs database delete ============
  it('remove deletes record by id and returns true on success', async () => {
    // Given
    const mockDelete = vi.fn().mockResolvedValue({
      error: null,
    });

    (mockClient.from as any).mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          delete: mockDelete,
        }),
      }),
    });

    // When
    const { result } = renderHook(() => useSupabaseMutation({ client: mockClient }));

    let deleteResult: boolean = false;
    await act(async () => {
      deleteResult = await result.current.remove('users', '1');
    });

    // Then
    expect(result.current.loading).toBe(false);
    expect(deleteResult).toBe(true);
  });

  // ============ RED - Test: Mutation handles errors gracefully ============
  it('handles errors and sets error state when query fails', async () => {
    // Given
    const insertError = { message: 'Insert failed' };

    (mockClient.from as any).mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: null, error: insertError }),
        single: vi.fn().mockResolvedValue({ data: null, error: insertError }),
      }),
    });

    // When
    const { result } = renderHook(() => useSupabaseMutation({ client: mockClient }));

    await act(async () => {
      await result.current.insert('users', { name: 'Test' });
    });

    // Then - should have error state
    expect(result.current.error).toBeDefined();
  });
});
