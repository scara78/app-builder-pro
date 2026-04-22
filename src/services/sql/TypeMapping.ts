/**
 * TypeMapping Module
 *
 * Converts TypeScript types to PostgreSQL types for SQL schema generation.
 * Provides predictable fallbacks for unknown types.
 */

import { logWarnSafe } from '../../utils/logger';

// TypeScript type constants
export enum TS_TYPE {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'Date',
  JSON = 'json',
}

// PostgreSQL type constants
export enum PG_TYPE {
  TEXT = 'TEXT',
  INTEGER = 'INTEGER',
  BOOLEAN = 'BOOLEAN',
  TIMESTAMPTZ = 'TIMESTAMPTZ',
  JSONB = 'JSONB',
  NUMERIC = 'NUMERIC',
}

/**
 * Type mapping from TypeScript to PostgreSQL types.
 * This constant object is exported as per spec requirement TM-011.
 */
export const typeMap: Record<string, string> = {
  [TS_TYPE.STRING]: PG_TYPE.TEXT,
  [TS_TYPE.NUMBER]: PG_TYPE.INTEGER,
  [TS_TYPE.BOOLEAN]: PG_TYPE.BOOLEAN,
  [TS_TYPE.DATE]: PG_TYPE.TIMESTAMPTZ,
  timestamp: PG_TYPE.TIMESTAMPTZ,
  [TS_TYPE.JSON]: PG_TYPE.JSONB,
};

/**
 * Custom logger function type
 */
type Logger = (warning: string) => void;

/**
 * Get the PostgreSQL type for a given TypeScript type.
 *
 * @param typescriptType - The TypeScript type to convert
 * @param nullable - Whether the field is optional (nullable)
 * @param logger - Optional custom logger for warnings
 * @returns The corresponding PostgreSQL type
 * @throws TypeError if input is null or undefined
 *
 * @example
 * getPostgresType('string') // returns 'TEXT'
 * getPostgresType('number') // returns 'INTEGER'
 * getPostgresType('CustomType') // returns 'TEXT' and logs warning
 */
export function getPostgresType(
  typescriptType: string,
  logger?: Logger
): string {
  // TM-ERR001 & TM-ERR002: Throw TypeError for null/undefined
  if (typescriptType === null || typescriptType === undefined) {
    throw new TypeError('typescriptType cannot be null or undefined');
  }

  // Convert to lowercase for case-insensitive matching (TM-E003)
  const normalizedType = typescriptType.toLowerCase();

  // TM-E002: Handle array types
  if (normalizedType.endsWith('[]')) {
    const elementType = normalizedType.slice(0, -2);
    const pgType = typeMap[elementType] || PG_TYPE.TEXT;
    return `${pgType}[]`;
  }

  // Check for exact match in typeMap
  // Handle both lowercase and original case
  let pgType =
    typeMap[typescriptType] ||
    typeMap[normalizedType] ||
    typeMap[normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1)];

  // TM-E001 & TM-008: Unknown types default to TEXT with warning
  if (!pgType) {
    pgType = PG_TYPE.TEXT;
    const warning = `Unknown TypeScript type "${typescriptType}", defaulting to TEXT`;

    if (logger) {
      logger(warning);
    } else {
      logWarnSafe('TypeMapping', warning);
    }
  }

  return pgType;
}
