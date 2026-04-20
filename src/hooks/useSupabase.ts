/**
 * Hook para usar Supabase en componentes React
 * Proporciona acceso al cliente y helpers comunes
 *
 * NOTE: This hook requires a Supabase client to be configured.
 * Currently used for testing purposes only.
 * For production, use useSupabaseOAuth from '@/hooks/backend/oauth'.
 */

import { useEffect, useState, useCallback } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

// Placeholder - in production, this would be a real Supabase client
// Currently this hook is only used in tests with mocks
const supabase = null as unknown as SupabaseClient;

interface UseSupabaseReturn {
  client: SupabaseClient;
  isReady: boolean;
  error: Error | null;
}

/**
 * Hook para obtener el cliente de Supabase
 * Asegura que el cliente esté inicializado antes de usarlo
 */
export function useSupabase(): UseSupabaseReturn {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      // El cliente ya se inicializa en el import
      setIsReady(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to initialize Supabase'));
    }
  }, []);

  return {
    client: supabase,
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
 */
export function useSupabaseQuery<T = any>(
  options: UseSupabaseQueryOptions
): UseSupabaseQueryReturn<T> {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { client } = useSupabase();

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = client.from(options.table).select(options.select || '*');

      // Aplicar filtros si existen
      if (options.filters) {
        query = options.filters(query);
      }

      // Aplicar ordenamiento
      if (options.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true,
        });
      }

      // Aplicar límite
      if (options.limit) {
        query = query.limit(options.limit);
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
  }, [client, options]);

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

/**
 * Hook para operaciones de insert/update/delete
 */
export function useSupabaseMutation<T = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { client } = useSupabase();

  const insert = useCallback(
    async (
      table: string,
      data: Record<string, unknown> | Record<string, unknown>[]
    ): Promise<T | null> => {
      setLoading(true);
      setError(null);

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
