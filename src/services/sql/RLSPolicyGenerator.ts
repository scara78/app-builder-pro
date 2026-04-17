/**
 * RLSPolicyGenerator Module
 * 
 * Generates Row-Level Security (RLS) policies for PostgreSQL tables.
 * Enforces authenticated access controls on Supabase.
 */

import type { Entity } from '../analyzer/types';

/**
 * Owner field naming conventions to detect ownership.
 * As per spec RLS-008/SHOULD.
 */
const OWNER_FIELD_PATTERNS = [
  'owner_id',
  'user_id',
  'created_by',
  'owner',
  'author_id',
];

/**
 * Reserved tables that should not have RLS policies.
 * As per spec RLS-ERR001.
 */
const RESERVED_TABLES = [
  'auth.users',
  'auth.sessions',
  'auth.refresh_tokens',
  'auth.mfa',
];

/**
 * CRUD operations supported by RLS policies.
 */
type RLSOperation = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';

/**
 * Detect owner field from entity fields.
 * 
 * @param entity - The entity to inspect
 * @returns The owner field name or undefined if not found
 * 
 * @example
 * detectOwnerField(entityWithOwnerId) // returns 'owner_id'
 * detectOwnerField(entityWithUserId) // returns 'user_id'
 */
function detectOwnerField(entity: Entity): string | undefined {
  for (const field of entity.fields) {
    const fieldName = field.name.toLowerCase();
    if (OWNER_FIELD_PATTERNS.includes(fieldName)) {
      return field.name;
    }
  }
  return undefined;
}

/**
 * Generate a single RLS policy statement.
 * 
 * @param table - The table name
 * @param operation - The CRUD operation
 * @param ownerField - The owner field name (optional for permissive policies)
 * @returns The policy SQL statement
 */
function generatePolicy(
  table: string,
  operation: RLSOperation,
  ownerField?: string
): string {
  const policyName = `${table}_${operation.toLowerCase()}_policy`;
  
  let usingClause = '';
  if (ownerField) {
    // RLS-006/MUST: Use auth.uid() in USING clause
    // RLS-007/MUST: Use auth.uid() from Supabase auth extension
    usingClause = ` USING (auth.uid() = ${ownerField})`;
  } else {
    // Permissive policy when no owner field - allows all authenticated users
    usingClause = ` USING (true)`;
  }

  // RLS-010/MUST: Use CREATE POLICY IF NOT EXISTS for idempotency
  return `CREATE POLICY IF NOT EXISTS "${policyName}"
  ON ${table} FOR ${operation}${usingClause};`;
}

/**
 * Generate RLS policies for an entity.
 * 
 * Generates ALTER TABLE to enable RLS and creates policies for all CRUD operations.
 * 
 * @param entity - The entity to generate RLS for
 * @returns SQL string with RLS policies
 * 
 * @example
 * const entity = { name: 'users', fields: [...] };
 * const sql = generateRLS(entity);
 * // Returns:
 * // ALTER TABLE users ENABLE ROW LEVEL SECURITY;
 * // CREATE POLICY IF NOT EXISTS "users_select_policy" ON users FOR SELECT USING (auth.uid() = owner_id);
 * // CREATE POLICY IF NOT EXISTS "users_insert_policy" ON users FOR INSERT ...;
 * // CREATE POLICY IF NOT EXISTS "users_update_policy" ON users FOR UPDATE ...;
 * // CREATE POLICY IF NOT EXISTS "users_delete_policy" ON users FOR DELETE ...;
 */
export function generateRLS(entity: Entity): string {
  const table = entity.name;
  const statements: string[] = [];

  // RLS-ERR001: Skip reserved tables
  if (RESERVED_TABLES.includes(table)) {
    return `-- Skipping RLS for reserved table: ${table}`;
  }

  // RLS-001/MUST: Enable RLS on the table
  statements.push(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);

  // Detect owner field for isolation
  const ownerField = detectOwnerField(entity);

  // RLS-002 through RLS-005: Create policies for all CRUD operations
  const operations: RLSOperation[] = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
  
  for (const operation of operations) {
    statements.push(generatePolicy(table, operation, ownerField));
  }

  return statements.join('\n');
}

/**
 * Generate RLS for multiple entities.
 * 
 * @param entities - Array of entities
 * @returns Combined RLS SQL for all entities
 */
export function generateRLSForEntities(entities: Entity[]): string {
  const results = entities.map(entity => generateRLS(entity));
  return results.filter(sql => sql.length > 0).join('\n\n');
}