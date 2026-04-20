/**
 * SQL Schema Generator Types
 *
 * Shared TypeScript interfaces for SQL schema generation.
 * These types define the contract between the SQL generator and its consumers.
 */

import type { BackendRequirements } from '../analyzer/types';

/**
 * Result of a migration generation operation.
 * Contains the SQL statements, list of tables created, and any warnings.
 */
export interface MigrationResult {
  /** The generated SQL DDL statements */
  sql: string;
  /** List of table names created */
  tables: string[];
  /** Warnings generated during migration generation */
  warnings: string[];
}

/**
 * Configuration options for the SQL generator.
 */
export interface SQLGeneratorConfig {
  /** Whether to enable Row Level Security (RLS) policies. Default: true */
  enableRLS?: boolean;
  /** Default file size limit for storage buckets in MB. Default: 50 */
  defaultFileSizeMB?: number;
  /** Custom logger function for warnings */
  logger?: (warning: string) => void;
}

/**
 * Interface for the SQL generator implementation.
 */
export interface SQLGenerator {
  /**
   * Generate PostgreSQL DDL from backend requirements.
   *
   * @param requirements - The backend requirements to convert
   * @returns MigrationResult containing the SQL, tables, and warnings
   */
  generate(requirements: BackendRequirements): MigrationResult;
}

/**
 * Type mapping configuration for TypeScript to PostgreSQL conversion.
 */
export interface TypeMappingConfig {
  /** The TypeScript type name */
  typescriptType: string;
  /** The corresponding PostgreSQL type */
  postgresType: string;
  /** Optional default value for the column */
  defaultValue?: string;
}

/**
 * Row Level Security policy definition.
 */
export interface RLSPolicy {
  /** Policy name */
  name: string;
  /** Table name the policy applies to */
  table: string;
  /** The action the policy controls */
  action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  /** Optional USING clause for row filtering */
  using?: string;
  /** Optional WITH CHECK clause for data validation */
  withCheck?: string;
}
