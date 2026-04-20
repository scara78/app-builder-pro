/**
 * UseAuth Hook Template
 * CHANGE 6 - Supabase Frontend Adapter
 *
 * Generates a complete authentication hook for Supabase.
 * This template is injected into src/hooks/useAuth.ts
 */

import type { User, Session, AuthError } from '@supabase/supabase-js';

/**
 * Generate the useAuth hook code.
 *
 * Creates a comprehensive auth hook with:
 * - signIn(email, password)
 * - signUp(email, password)
 * - signOut()
 * - user state
 * - loading state
 * - error state
 *
 * @returns TypeScript code for the auth hook file
 *
 * @example
 * ```tsx
 * const { user, loading, error, signIn, signUp, signOut } = useAuth();
 *
 * // Sign in
 * await signIn('user@example.com', 'password123');
 *
 * // Check auth state
 * if (loading) return <Spinner />;
 * if (error) return <Error message={error.message} />;
 * if (user) return <Dashboard user={user} />;
 * ```
 */
export function useAuthTemplate(): string {
  return `import { useState, useEffect, useCallback } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UseAuthReturn {
  /** Current authenticated user, null if not logged in */
  user: User | null;
  /** Current session, null if not logged in */
  session: Session | null;
  /** Loading state for auth operations */
  loading: boolean;
  /** Error from last auth operation */
  error: AuthError | null;
  /** Sign in with email and password */
  signIn: (email: string, password: string) => Promise<void>;
  /** Sign up with email and password */
  signUp: (email: string, password: string) => Promise<void>;
  /** Sign out current user */
  signOut: () => Promise<void>;
  /** Reset error state */
  clearError: () => void;
}

/**
 * Authentication hook for Supabase.
 *
 * Provides authentication state and methods for:
 * - Email/password sign in
 * - Email/password sign up
 * - Sign out
 * - Session management
 *
 * @example
 * \`\`\`tsx
 * function LoginComponent() {
 *   const { user, loading, error, signIn } = useAuth();
 *
 *   const handleSubmit = async (e: React.FormEvent) => {
 *     e.preventDefault();
 *     await signIn(email, password);
 *   };
 *
 *   if (loading) return <Spinner />;
 *   if (user) return <Navigate to="/dashboard" />;
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       {error && <div className="error">{error.message}</div>}
 *       <input type="email" onChange={(e) => setEmail(e.target.value)} />
 *       <input type="password" onChange={(e) => setPassword(e.target.value)} />
 *       <button type="submit">Sign In</button>
 *     </form>
 *   );
 * }
 * \`\`\`
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (err) {
      setError(err as AuthError);
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
    } catch (err) {
      setError(err as AuthError);
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      setError(err as AuthError);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    clearError,
  };
}
`;
}

/**
 * Auth state interface for consumers.
 * Re-exported for convenience.
 */
export type { User, Session, AuthError };
