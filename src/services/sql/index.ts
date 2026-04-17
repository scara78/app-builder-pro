/**
 * SQL Schema Generator - Public API
 * 
 * This module exports all public APIs from the SQL schema generator.
 * Use these exports to generate PostgreSQL DDL from backend requirements.
 * 
 * @example
 * import { SQLGenerator } from '@/services/sql';
 * const generator = new SQLGenerator();
 * const result = generator.generate(requirements);
 */

export { SQLGenerator } from './SQLGenerator';
export { MigrationBuilder, build } from './MigrationBuilder';

// Type exports
export type { MigrationResult, SQLGeneratorConfig, SQLGenerator, TypeMappingConfig, RLSPolicy } from './types';

// TypeMapping exports
export { getPostgresType, typeMap } from './TypeMapping';
export { TS_TYPE, PG_TYPE } from './TypeMapping';

// RLSPolicyGenerator exports
export { generateRLS, generateRLSForEntities } from './RLSPolicyGenerator';

// StorageBucketGenerator exports
export { generateBuckets, sanitizeSlug } from './StorageBucketGenerator';