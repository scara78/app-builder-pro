/**
 * Test fixtures for Supabase MCP client testing
 * Contains mock responses that simulate the MCP server behavior
 */

/**
 * Creates a mock project creation response
 */
export function createProjectMock(name: string, region: string) {
  const ref = generateRef();
  return {
    ref,
    name,
    apiUrl: `https://${ref}.supabase.co`,
    anonKey: generateAnonKey(ref),
    status: 'ACTIVE'
  };
}

/**
 * Creates a mock project URL response
 */
export function getProjectUrlMock(ref: string): { url: string } | { error: string } {
  if (!ref || ref === 'invalid-ref') {
    return { error: 'Project not found' };
  }
  return { url: `https://${ref}.supabase.co` };
}

/**
 * Creates a mock anon key response
 */
export function getAnonKeyMock(ref: string): { anonKey: string } | { error: string } {
  if (!ref || ref === 'invalid-ref') {
    return { error: 'Project not found' };
  }
  return { anonKey: generateAnonKey(ref) };
}

/**
 * Creates a mock migration response
 */
export function applyMigrationMock(
  ref: string, 
  _sql: string, 
  name: string
): { success: boolean; migrationId: string } | { error: string } {
  if (!ref || ref === 'invalid-ref') {
    return { error: 'Project not found' };
  }
  return {
    success: true,
    migrationId: `migration_${Date.now()}_${name}`
  };
}

/**
 * Generates a mock project reference
 */
function generateRef(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Generates a mock JWT anon key
 */
function generateAnonKey(ref: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ 
    aud: ref, 
    exp: Math.floor(Date.now() / 1000) + 3600 
  }));
  const signature = 'mock_signature';
  return `${header}.${payload}.${signature}`;
}

/**
 * Mock error responses for different error types
 */
export const mockErrorResponses = {
  authError: {
    error: 'Unauthorized',
    code: 'AUTH',
    message: 'Invalid or expired access token'
  },
  rateLimitError: (retryAfter: number) => ({
    error: 'Rate limit exceeded',
    code: 'RATE_LIMIT',
    retryAfter
  }),
  notFoundError: {
    error: 'Project not found',
    code: 'NOT_FOUND'
  },
  validationError: (details: string) => ({
    error: 'Validation failed',
    code: 'VALIDATION',
    details
  })
};

/**
 * Sample project data for testing
 */
export const sampleProjects = [
  {
    ref: 'abc123def4',
    name: 'my-first-app',
    apiUrl: 'https://abc123def4.supabase.co',
    status: 'ACTIVE'
  },
  {
    ref: 'xyz789uvw',
    name: 'production-app',
    apiUrl: 'https://xyz789uvw.supabase.co',
    status: 'ACTIVE'
  }
];

/**
 * Sample SQL migrations for testing
 */
export const sampleMigrations = [
  {
    name: 'create_users_table',
    sql: `CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);`
  },
  {
    name: 'create_products_table',
    sql: `CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);`
  }
];