/**
 * SQLGenerator Module
 * 
 * Main entry point for SQL schema generation.
 * Orchestrates all sub-generators to produce complete migration SQL.
 * 
 * @example
 * const generator = new SQLGenerator();
 * const result = generator.generate(requirements);
 * // result.sql contains complete migration DDL
 */

import type { BackendRequirements } from '../analyzer/types';
import type { MigrationResult, SQLGeneratorConfig } from './types';
import { MigrationBuilder } from './MigrationBuilder';

/**
 * SQLGenerator
 * 
 * Main class that generates PostgreSQL DDL from backend requirements.
 * Uses MigrationBuilder internally to orchestrate sub-generators.
 */
export class SQLGenerator {
  private config: SQLGeneratorConfig;
  private migrationBuilder: MigrationBuilder;

  /**
   * Create a new SQLGenerator instance.
   * 
   * @param config - Optional configuration options
   * @example
   * const generator = new SQLGenerator({ enableRLS: false });
   */
  constructor(config?: SQLGeneratorConfig) {
    this.config = {
      enableRLS: config?.enableRLS ?? true,
      defaultFileSizeMB: config?.defaultFileSizeMB ?? 50,
      logger: config?.logger,
    };
    this.migrationBuilder = new MigrationBuilder(this.config);
  }

  /**
   * Generate PostgreSQL DDL from backend requirements.
   * 
   * @param requirements - The backend requirements from analyzer
   * @returns MigrationResult containing SQL, tables, and warnings
   * @throws TypeError if requirements is null or undefined
   * 
   * @example
   * const requirements = {
   *   entities: [{ name: 'User', fields: [...] }],
   *   hasAuth: true,
   *   storageRequirements: [...]
   * };
   * const result = generator.generate(requirements);
   * console.log(result.sql); // Full DDL
   */
  generate(requirements: BackendRequirements): MigrationResult {
    // SG-ERR001: Validate input
    if (requirements === null || requirements === undefined) {
      throw new TypeError('requirements cannot be null or undefined');
    }

    // Delegate to MigrationBuilder
    return this.migrationBuilder.build(requirements);
  }
}