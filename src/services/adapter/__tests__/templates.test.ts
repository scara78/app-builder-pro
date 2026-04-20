/**
 * Template Tests
 * CHANGE 6 - Supabase Frontend Adapter
 *
 * Tests for template generation functions.
 */

import { describe, it, expect } from 'vitest';
import { supabaseClientTemplate } from '../templates/supabaseClient';
import { useAuthTemplate } from '../templates/useAuth';

describe('supabaseClientTemplate', () => {
  it('should generate valid TypeScript code', () => {
    const projectUrl = 'https://test-project.supabase.co';
    const anonKey = 'test-anon-key-12345';

    const result = supabaseClientTemplate(projectUrl, anonKey);

    // Check structure
    expect(result).toContain("import { createClient } from '@supabase/supabase-js'");
    expect(result).toContain('export const supabase');
    expect(result).toContain('createClient');
  });

  it('should include project URL in generated code', () => {
    const projectUrl = 'https://myapp.supabase.co';
    const anonKey = 'key123';

    const result = supabaseClientTemplate(projectUrl, anonKey);

    expect(result).toContain(projectUrl);
  });

  it('should include anon key in generated code', () => {
    const projectUrl = 'https://test.supabase.co';
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';

    const result = supabaseClientTemplate(projectUrl, anonKey);

    expect(result).toContain(anonKey);
  });

  it('should use single quotes for imports', () => {
    const result = supabaseClientTemplate('url', 'key');

    expect(result).toContain("from '@supabase/supabase-js'");
  });

  it('should export named supabase client', () => {
    const result = supabaseClientTemplate('url', 'key');

    expect(result).toMatch(/export const supabase/);
  });

  it('should handle URLs with special characters', () => {
    const projectUrl = 'https://abc-123-xyz.supabase.co';
    const anonKey = 'eyJ-abc-123';

    const result = supabaseClientTemplate(projectUrl, anonKey);

    expect(result).toContain(projectUrl);
    expect(result).toContain(anonKey);
  });
});

describe('useAuthTemplate', () => {
  it('should generate valid TypeScript code', () => {
    const result = useAuthTemplate();

    // Check imports
    expect(result).toContain("import { useState, useEffect, useCallback } from 'react'");
    expect(result).toContain('@supabase/supabase-js');
  });

  it('should export useAuth hook', () => {
    const result = useAuthTemplate();

    expect(result).toContain('export function useAuth()');
  });

  it('should include signIn function', () => {
    const result = useAuthTemplate();

    expect(result).toContain('signIn');
    expect(result).toContain('signInWithPassword');
  });

  it('should include signUp function', () => {
    const result = useAuthTemplate();

    expect(result).toContain('signUp');
    expect(result).toContain('supabase.auth.signUp');
  });

  it('should include signOut function', () => {
    const result = useAuthTemplate();

    expect(result).toContain('signOut');
    expect(result).toContain('supabase.auth.signOut');
  });

  it('should include user state', () => {
    const result = useAuthTemplate();

    expect(result).toContain('user');
    expect(result).toContain('setUser');
  });

  it('should include loading state', () => {
    const result = useAuthTemplate();

    expect(result).toContain('loading');
    expect(result).toContain('setLoading');
  });

  it('should include error state', () => {
    const result = useAuthTemplate();

    expect(result).toContain('error');
    expect(result).toContain('setError');
  });

  it('should import supabase client', () => {
    const result = useAuthTemplate();

    expect(result).toContain("from '../lib/supabase'");
  });

  it('should handle auth state changes', () => {
    const result = useAuthTemplate();

    expect(result).toContain('onAuthStateChange');
  });

  it('should get initial session', () => {
    const result = useAuthTemplate();

    expect(result).toContain('getSession');
  });

  it('should cleanup subscription on unmount', () => {
    const result = useAuthTemplate();

    expect(result).toContain('subscription.unsubscribe');
  });

  it('should include clearError function', () => {
    const result = useAuthTemplate();

    expect(result).toContain('clearError');
  });

  it('should have JSDoc documentation', () => {
    const result = useAuthTemplate();

    expect(result).toContain('@example');
    // JSDoc block should be present
    expect(result).toContain('* Authentication hook for Supabase');
  });
});
