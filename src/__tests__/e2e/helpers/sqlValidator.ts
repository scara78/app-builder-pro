/**
 * SQL Syntax Validator
 * Helper utility for validating PostgreSQL syntax using regex-based approach
 */

/**
 * Validation result from SQL syntax check
 */
export interface ValidationResult {
  /** Whether the SQL is valid */
  valid: boolean;
  /** List of validation errors */
  errors: string[];
}

/**
 * Validate PostgreSQL syntax using regex-based validation.
 * This is sufficient for E2E testing scope where we don't execute against a real database.
 *
 * @param sql - The SQL string to validate
 * @returns ValidationResult with valid flag and list of errors
 *
 * @example
 * const result = validateSQLSyntax('CREATE TABLE users (id UUID PRIMARY KEY);');
 * console.log(result.valid); // true
 */
export function validateSQLSyntax(sql: string): ValidationResult {
  const errors: string[] = [];

  if (!sql || sql.trim() === '') {
    return { valid: true, errors: [] };
  }

  // Check for balanced parentheses
  const openCount = (sql.match(/\(/g) || []).length;
  const closeCount = (sql.match(/\)/g) || []).length;
  if (openCount !== closeCount) {
    errors.push('Unbalanced parentheses');
  }

  // Check for semicolons (DDL should end with semicolon)
  if (!sql.includes(';') && sql.trim().length > 0) {
    errors.push('Missing semicolon terminator');
  }

  // Check for CREATE TABLE keyword if any DDL is present
  const hasDDL = /CREATE\s+(TABLE|EXTENSION|POLICY)/i.test(sql);
  const hasInsert = /INSERT\s+INTO/i.test(sql);

  if (!hasDDL && !hasInsert) {
    // If neither CREATE nor INSERT, might just be extension setup
    // That's OK - validate keywords instead
    const validKeywords = [
      'CREATE',
      'EXTENSION',
      'IF',
      'NOT',
      'EXISTS',
      'UUID',
      'TEXT',
      'INTEGER',
      'BOOLEAN',
      'TIMESTAMPTZ',
      'PRIMARY',
      'KEY',
      'REFERENCES',
      'SERIAL',
      'DEFAULT',
      'ALTER',
      'TABLE',
      'ENABLE',
      'ROW',
      'LEVEL',
      'SECURITY',
      'POLICY',
      'USING',
      'WITH',
      'CHECK',
      'FOR',
      'SELECT',
      'INSERT',
      'INTO',
      'STORAGE',
      'BUCKETS',
      'auth',
    ];

    const hasValidKeywords = validKeywords.some((keyword) =>
      new RegExp(`\\b${keyword}\\b`, 'i').test(sql)
    );

    if (!hasValidKeywords && sql.trim().length > 0) {
      errors.push('No valid PostgreSQL keywords found');
    }
  }

  // Validate quotes are balanced
  const singleQuotes = (sql.match(/'/g) || []).length;
  if (singleQuotes % 2 !== 0) {
    errors.push('Unbalanced single quotes');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if SQL contains specific table creation (case-insensitive)
 *
 * @param sql - The SQL to check
 * @param tableName - The table name to look for
 * @returns true if table is created in the SQL
 */
export function containsTable(sql: string, tableName: string): boolean {
  // Normalize both to lowercase for case-insensitive matching
  const normalizedSql = sql.toLowerCase();
  const normalizedName = tableName.toLowerCase();
  return new RegExp(`create\\s+table\\s+.*${normalizedName}`).test(normalizedSql);
}

/**
 * Check if SQL contains RLS policies
 *
 * @param sql - The SQL to check
 * @returns true if RLS is enabled in the SQL
 */
export function containsRLS(sql: string): boolean {
  return /ALTER\s+TABLE.*ENABLE\s+ROW\s+LEVEL\s+SECURITY/i.test(sql);
}

/**
 * Check if SQL contains foreign key constraint
 *
 * @param sql - The SQL to check
 * @param fromTable - Source table for FK
 * @param toTable - Target table for FK
 * @returns true if FK exists between the tables
 */
export function containsForeignKey(sql: string, fromTable: string, toTable: string): boolean {
  const normalizedSql = sql.toLowerCase();
  const normalizedFrom = fromTable.toLowerCase();
  const normalizedTo = toTable.toLowerCase();
  // FK pattern: ALTER TABLE source ADD FOREIGN KEY ... REFERENCES target
  const fkPattern = new RegExp(
    `alter\\s+table\\s+${normalizedFrom}.*foreign\\s+key.*references\\s+${normalizedTo}`,
    'i'
  );
  return fkPattern.test(normalizedSql);
}

export default validateSQLSyntax;
