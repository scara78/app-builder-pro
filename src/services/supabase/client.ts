/**
 * Supabase Client Configuration
 * Cliente oficial de Supabase para operaciones con la base de datos
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuración del cliente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Singleton para el cliente
let supabaseClient: SupabaseClient | null = null;

/**
 * Obtiene o crea el cliente de Supabase
 * Usa patrón singleton para evitar múltiples instancias
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key not configured. Some features may not work.');
    // Crear cliente vacío para desarrollo/testing
    return createClient('http://localhost:54321', 'dummy-key');
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    db: {
      schema: 'public',
    },
  });

  return supabaseClient;
}

/**
 * Resetea el cliente (útil para testing)
 */
export function resetSupabaseClient(): void {
  supabaseClient = null;
}

// Exportar el cliente directamente para uso simple
export const supabase = getSupabaseClient();

// Re-exportar tipos útiles
export type { SupabaseClient };
