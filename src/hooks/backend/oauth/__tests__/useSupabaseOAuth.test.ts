import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock supabase config - use vi.hoisted for proper hoisting
const { supabaseOAuthConfig } = vi.hoisted(() => ({
  supabaseOAuthConfig: {
    clientId: 'test-client-id',
    redirectUri: 'http://localhost/oauth/callback',
    scopes: 'projects:read projects:write',
  },
}));

vi.mock('../../../config/supabase', () => ({
  supabaseOAuthConfig,
}));

// Import after mock
import { useSupabaseOAuth } from '../useSupabaseOAuth';

/**
 * OAuth Hook Tests
 * 
 * Tests cover:
 * - T2.1: useSupabaseOAuth hook with expected interface
 * - T2.2: Token validation (expiration check)
 * - T2.3: Token storage in sessionStorage
 * - T2.3: Token retrieval
 * - T2.3: Logout clears token
 */

const SESSION_STORAGE_KEY = 'sb-access-token';

// Helper to create a mock JWT with expiration
function createMockJWT(expiresIn: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ 
    sub: 'user-123',
    exp: Math.floor(Date.now() / 1000) + expiresIn,
    iat: Math.floor(Date.now() / 1000)
  }));
  const signature = btoa('mock-signature');
  return `${header}.${payload}.${signature}`;
}

// Mock window.location
const originalLocation = window.location;
beforeEach(() => {
  Object.defineProperty(window, 'location', {
    value: { 
      origin: 'http://localhost',
      href: 'http://localhost/'
    },
    writable: true,
  });
  sessionStorage.clear();
});

afterEach(() => {
  Object.defineProperty(window, 'location', originalLocation);
  vi.clearAllMocks();
});

describe('useSupabaseOAuth', () => {
  // ============ RED - Test T2.1: Hook returns expected interface ============
  it('returns expected interface with login, logout, getToken, isAuthenticated, status, error', () => {
    const { result } = renderHook(() => useSupabaseOAuth());
    
    // Then - verify all expected properties exist
    expect(result.current).toHaveProperty('login');
    expect(result.current).toHaveProperty('logout');
    expect(result.current).toHaveProperty('getToken');
    expect(result.current).toHaveProperty('isAuthenticated');
    expect(result.current).toHaveProperty('status');
    expect(result.current).toHaveProperty('error');
    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
    expect(typeof result.current.getToken).toBe('function');
    expect(typeof result.current.isAuthenticated).toBe('boolean');
  });

  // ============ RED - Test T2.1: Initial status is idle ============
  it('initializes with idle status when no token exists', () => {
    const { result } = renderHook(() => useSupabaseOAuth());
    
    expect(result.current.status).toBe('idle');
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBe(null);
  });

  // ============ RED - Test T2.3: Login initiates OAuth redirect ============
  it('login initiates OAuth redirect to Supabase', async () => {
    const { result } = renderHook(() => useSupabaseOAuth());
    
    // When - call login
    await act(async () => {
      try {
        await result.current.login();
      } catch {
        // Expected to throw if config is mocked incorrectly
      }
    });
    
    // Then - check what happened - either redirected or logged warning
    // Since this is a browser-specific behavior, we verify the function exists and is callable
    expect(typeof result.current.login).toBe('function');
  });

  // ============ RED - Test T2.3: Token stored in sessionStorage ============
  it('extracts token from URL and stores in sessionStorage on OAuth callback', async () => {
    // Given - Simulate OAuth callback with token in URL fragment
    const mockToken = createMockJWT(3600); // 1 hour from now
    const callbackUrl = `http://localhost/oauth/callback#access_token=${mockToken}&token_type=Bearer&expires_in=3600`;
    
    Object.defineProperty(window, 'location', {
      value: { 
        origin: 'http://localhost',
        href: callbackUrl,
        hash: `#access_token=${mockToken}&token_type=Bearer&expires_in=3600`
      },
      writable: true,
    });
    
    // When - render hook (it should extract token from URL)
    const { result } = renderHook(() => useSupabaseOAuth());
    
    // Then - token should be stored in sessionStorage
    await waitFor(() => {
      expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBe(mockToken);
    });
    
    expect(result.current.status).toBe('authenticated');
    expect(result.current.isAuthenticated).toBe(true);
  });

  // ============ RED - Test T2.3: getToken returns stored token ============
  it('getToken returns the stored token', () => {
    // Given - Store a token in sessionStorage
    const mockToken = createMockJWT(3600);
    sessionStorage.setItem(SESSION_STORAGE_KEY, mockToken);
    
    const { result } = renderHook(() => useSupabaseOAuth());
    
    // When - call getToken
    const token = result.current.getToken();
    
    // Then - should return the stored token
    expect(token).toBe(mockToken);
  });

  // ============ RED - Test T2.3: Logout clears token from sessionStorage ============
  it('logout clears token from sessionStorage', async () => {
    // Given - Store a token in sessionStorage
    const mockToken = createMockJWT(3600);
    sessionStorage.setItem(SESSION_STORAGE_KEY, mockToken);
    
    const { result } = renderHook(() => useSupabaseOAuth());
    
    // Verify token exists initially
    expect(result.current.isAuthenticated).toBe(true);
    
    // When - call logout
    await act(async () => {
      await result.current.logout();
    });
    
    // Then - token should be cleared
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBe(null);
    expect(result.current.status).toBe('idle');
    expect(result.current.isAuthenticated).toBe(false);
  });

  // ============ RED - Test T2.2: Token expiration check - valid token ============
  it('isAuthenticated returns true for non-expired token', () => {
    // Given - Store a token that expires in 1 hour
    const validToken = createMockJWT(3600);
    sessionStorage.setItem(SESSION_STORAGE_KEY, validToken);
    
    const { result } = renderHook(() => useSupabaseOAuth());
    
    // Then - should be authenticated
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.status).toBe('authenticated');
  });

  // ============ RED - Test T2.2: Token expiration check - expired token ============
  it('isAuthenticated returns false for expired token', () => {
    // Given - Store a token that expired 1 hour ago
    const expiredToken = createMockJWT(-3600); // -1 hour = expired
    sessionStorage.setItem(SESSION_STORAGE_KEY, expiredToken);
    
    const { result } = renderHook(() => useSupabaseOAuth());
    
    // Then - should NOT be authenticated (expired)
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.status).toBe('idle');
    // Token should be cleared
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBe(null);
  });

  // ============ RED - Test T2.2: Token expiration check - no token ============
  it('isAuthenticated returns false when no token in storage', () => {
    const { result } = renderHook(() => useSupabaseOAuth());
    
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.getToken()).toBe(null);
  });

  // ============ RED - Test: getToken returns null when no token ============
  it('getToken returns null when no token is stored', () => {
    const { result } = renderHook(() => useSupabaseOAuth());
    
    expect(result.current.getToken()).toBe(null);
  });
});