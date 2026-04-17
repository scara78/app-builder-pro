/**
 * MigrationBuilder Module
 * 
 * Composes SQL from multiple generators.
 * Orchestrates the creation of complete migration files with proper ordering.
 * 
 * Order of SQL execution:
 * 1. Extensions (CREATE EXTENSION)
 * 2. Tables (CREATE TABLE)
 * 3. RLS (ALTER TABLE + policies)
 * 4. Storage buckets (INSERT)
 */

import type { BackendRequirements, Entity, StorageRequirement } from '../analyzer/types';
import type { MigrationResult, SQLGeneratorConfig } from './types';
import { getPostgresType } from './TypeMapping';
import { generateRLS } from './RLSPolicyGenerator';
import { generateBuckets } from './StorageBucketGenerator';

/**
 * MigrationBuilder
 * 
 * Composes complete migration SQL from backend requirements.
 * Orchestrates all sub-generators and ensures correct ordering.
 */
export class MigrationBuilder {
  private config: SQLGeneratorConfig;

  /**
   * Create a MigrationBuilder instance.
   * 
   * @param config - Optional configuration options
   */
  constructor(config?: SQLGeneratorConfig) {
    this.config = {
      enableRLS: config?.enableRLS ?? true,
      defaultFileSizeMB: config?.defaultFileSizeMB ?? 50,
      logger: config?.logger,
    };
  }

  /**
   * Build a complete migration SQL from requirements.
   * 
   * @param requirements - Backend requirements from analyzer
   * @returns MigrationResult with SQL, tables, and warnings
   */
  build(requirements: BackendRequirements): MigrationResult {
    const sqlParts: string[] = [];
    const tables: string[] = [];
    const warnings: string[] = [];

    // 1. Extensions (first in order)
    sqlParts.push(this.generateExtensions());

    // 2. Tables
    if (requirements.entities && requirements.entities.length > 0) {
      const tableSQL = this.generateTables(requirements.entities, warnings);
      sqlParts.push(tableSQL);
      
      for (const entity of requirements.entities) {
        tables.push(entity.name);
      }
    }

    // 3. RLS (per table, after table creation)
    if (this.config.enableRLS && requirements.entities && requirements.entities.length > 0) {
      const rlsSQL = this.generateRLS(requirements.entities, warnings);
      if (rlsSQL) {
        sqlParts.push(rlsSQL);
      }
    }

    // 4. Storage buckets (last in order)
    if (requirements.storageRequirements && requirements.storageRequirements.length > 0) {
      const bucketSQL = generateBuckets(requirements.storageRequirements);
      if (bucketSQL) {
        sqlParts.push(bucketSQL);
      }
    }

    return {
      sql: sqlParts.join('\n\n'),
      tables,
      warnings,
    };
  }

  /**
   * Generate extension creation statements.
   */
  private generateExtensions(): string {
    // SG-001: uuid-ossp extension for UUID generation
    return `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;
  }

  /**
   * Generate table creation SQL for all entities.
   */
  private generateTables(entities: Entity[], warnings: string[]): string {
    const tableStatements: string[] = [];

    for (const entity of entities) {
      tableStatements.push(this.generateTableSQL(entity, warnings));
    }

    return tableStatements.join('\n');
  }

  /**
   * Generate CREATE TABLE for a single entity.
   */
  private generateTableSQL(entity: Entity, warnings: string[]): string {
    const tableName = entity.name;
    const columns: string[] = [];

    // Add standard columns first: id, created_at, updated_at
    columns.push('id UUID PRIMARY KEY DEFAULT uuid_generate_v4()');
    columns.push('created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()');
    columns.push('updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()');

    // Add entity fields
    for (const field of entity.fields) {
      // Skip id as we already added it
      if (field.name === 'id') continue;
      
      let pgType: string;
      try {
        pgType = getPostgresType(field.type, field.isOptional, this.config.logger);
      } catch (error) {
        // Unknown type fallback to TEXT
        pgType = 'TEXT';
        const warning = `Unknown type "${field.type}" for field "${field.name}", defaulting to TEXT`;
        warnings.push(warning);
        if (this.config.logger) {
          this.config.logger(warning);
        }
      }

      const nullable = field.isOptional ? '' : 'NOT NULL';
      columns.push(`${field.name} ${pgType} ${nullable}`.trim());
    }

    return `CREATE TABLE IF NOT EXISTS ${tableName} (
  ${columns.join(',\n  ')}
);`;
  }

  /**
   * Generate RLS policies for all entities.
   */
  private generateRLS(entities: Entity[], warnings: string[]): string {
    const policyStatements: string[] = [];

    for (const entity of entities) {
      const rlsSQL = generateRLS(entity);
      if (rlsSQL && !rlsSQL.startsWith('--')) {
        policyStatements.push(rlsSQL);
      }
    }

    return policyStatements.join('\n');
  }
}

/**
 * Build a migration from BackendRequirements.
 * 
 * @param requirements - Backend requirements from analyzer
 * @returns MigrationResult with SQL, tables, and warnings
 * 
 * @example
 * const requirements = { entities: [...], storageRequirements: [...] };
 * const result = build(requirements);
 * // Returns { sql: "...", tables: ["users", ...], warnings: [...] }
 */
export function build(requirements: BackendRequirements): MigrationResult {
  const builder = new MigrationBuilder();
  return builder.build(requirements);
}