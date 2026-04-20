/**
 * Hook para usar Supabase en componentes React
 * Proporciona acceso al cliente y helpers comunes
 *
 * NOTE: This hook requires a Supabase client to be provided.
 * For production OAuth flow, use useSupabaseOAuth from '@/hooks/backend/oauth'.
 *
 * @param externalClient - Optional Supabase client (useful for testing with mocks)
 */

import { useEffect, useState, useCallback } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

interface UseSupabaseReturn {
  client: SupabaseClient | null;
  isReady: boolean;
  error: Error | null;
}

/**
 * Hook para obtener el cliente de Supabase
 * @param externalClient - Optional client to use (for dependency injection in tests)
 */
export function useSupabase(externalClient?: SupabaseClient): UseSupabaseReturn {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      if (externalClient) {
        setIsReady(true);
      } else {
        setError(new Error('No Supabase client provided'));
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to initialize Supabase'));
    }
  }, [externalClient]);

  return {
    client: externalClient ?? null,
    isReady,
    error,
  };
}

interface UseSupabaseQueryOptions {
  table: string;
  select?: string;
  filters?: (query: any) => any;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  client?: SupabaseClient; // Optional client for dependency injection
}

interface UseSupabaseQueryReturn<T> {
  data: T[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para hacer queries a Supabase
 * Simplifica el uso de select con filtros
 * @param options - Query options including optional client for testing
 */
export function useSupabaseQuery<T = any>(
  options: UseSupabaseQueryOptions
): UseSupabaseQueryReturn<T> {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { client } = useSupabase(options.client);

  // Extract individual dependencies to avoid object recreation issues
  const { table, select: selectFields, filters, orderBy, limit } = options;

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!client) {
      setError(new Error('No Supabase client available'));
      setLoading(false);
      return;
    }

    try {
      let query = client.from(table).select(selectFields || '*');

      // Aplicar filtros si existen
      if (filters) {
        query = filters(query);
      }

      // Aplicar ordenamiento
      if (orderBy) {
        query = query.order(orderBy.column, {
          ascending: orderBy.ascending ?? true,
        });
      }

      // Aplicar límite
      if (limit) {
        query = query.limit(limit);
      }

      const { data: result, error: queryError } = await query;

      if (queryError) {
        throw new Error(queryError.message);
      }

      setData(result as T[]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Query failed'));
    } finally {
      setLoading(false);
    }
  }, [client, table, selectFields, filters, orderBy, limit]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    data,
    loading,
    error,
    refetch: fetch,
  };
}

interface UseSupabaseMutationOptions {
  client?: SupabaseClient; // Optional client for dependency injection
}

/**
 * Hook para operaciones de insert/update/delete
 * @param options - Options including optional client for testing
 */
export function useSupabaseMutation<T = any>(options?: UseSupabaseMutationOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { client } = useSupabase(options?.client);

  const insert = useCallback(
    async (
      table: string,
      data: Record<string, unknown> | Record<string, unknown>[]
    ): Promise<T | null> => {
      setLoading(true);
      setError(null);

      if (!client) {
        setError(new Error('No Supabase client available'));
        setLoading(false);
        return null;
      }

      try {
        const { data: result, error: insertError } = await client
          .from(table)
          .insert(data)
          .select()
          .single();

        if (insertError) {
          throw new Error(insertError.message);
        }

        return result as T;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Insert failed'));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  const update = useCallback(
    async (table: string, id: string, data: Record<string, unknown>): Promise<T | null> => {
      setLoading(true);
      setError(null);

      if (!client) {
        setError(new Error('No Supabase client available'));
        setLoading(false);
        return null;
      }

      try {
        const { data: result, error: updateError } = await client
          .from(table)
          .update(data)
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          throw new Error(updateError.message);
        }

        return result as T;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Update failed'));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  const remove = useCallback(
    async (table: string, id: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      if (!client) {
        setError(new Error('No Supabase client available'));
        setLoading(false);
        return false;
      }

      try {
        const { error: deleteError } = await client.from(table).delete().eq('id', id);

        if (deleteError) {
          throw new Error(deleteError.message);
        }

        return true;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Delete failed'));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [client]
  );

  return {
    insert,
    update,
    remove,
    loading,
    error,
  };
}
