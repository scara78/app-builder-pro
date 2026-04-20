/**
 * Supabase Client Template
 * CHANGE 6 - Supabase Frontend Adapter
 *
 * Generates the Supabase client initialization code.
 * This template is injected into src/lib/supabase.ts
 */

/**
 * Generate Supabase client initialization code.
 *
 * Creates a configured Supabase client that can be imported
 * throughout the application.
 *
 * @param projectUrl - URL of the Supabase project
 * @param anonKey - Anonymous key for the project
 * @returns TypeScript code for the client file
 *
 * @example
 * ```ts
 * const code = supabaseClientTemplate(
 *   'https://abc123.supabase.co',
 *   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 * );
 * // Returns:
 * // import { createClient } from '@supabase/supabase-js';
 * //
 * // export const supabase = createClient(
 * //   'https://abc123.supabase.co',
 * //   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 * // );
 * ```
 */
export function supabaseClientTemplate(projectUrl: string, anonKey: string): string {
  return `import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  '${projectUrl}',
  '${anonKey}'
);
`;
}
