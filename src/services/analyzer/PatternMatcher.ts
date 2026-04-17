/**
 * Pattern Matcher for Backend Requirements Analyzer
 * CHANGE 2 - Phase 2
 */

import type { Entity, EntityPattern, AuthRequirement, AuthPattern, StorageRequirement, StoragePattern, CRUDSOperation, CRUDPattern } from './types';

/**
 * Container for all pattern types used by the matcher
 */
export interface MatcherPatterns {
  entity: EntityPattern[];
  auth: AuthPattern[];
  storage: StoragePattern[];
  crud: CRUDPattern[];
}

/**
 * Default entity patterns for TypeScript interface/type detection
 */
const defaultEntityPatterns: EntityPattern[] = [
  { id: 'interface', regex: /interface\s+(\w+)\s*\{([^}]+)\}/g, baseConfidence: 90 },
  { id: 'typeAlias', regex: /type\s+(\w+)\s*=\s*\{([^}]+)\}/g, baseConfidence: 85 }
];

/**
 * Default auth patterns for login/register detection
 */
const defaultAuthPatterns: AuthPattern[] = [
  { id: 'loginComponent', regex: /<Login|login|signin|sign-in/i, baseConfidence: 90, authType: 'login' },
  { id: 'registerComponent', regex: /<Register|register|signup|sign-up/i, baseConfidence: 90, authType: 'register' },
  { id: 'useAuth', regex: /useAuth|AuthContext|AuthProvider/i, baseConfidence: 95, authType: 'login' }
];

/**
 * Default storage patterns for file upload detection
 */
const defaultStoragePatterns: StoragePattern[] = [
  { id: 'fileInput', regex: /type\s*=\s*['"]file['"]|file\s*upload/i, baseConfidence: 85, contentType: 'any' },
  { id: 'uploadHandler', regex: /onUpload|handleUpload|uploadFile/i, baseConfidence: 90, contentType: 'any' }
];

/**
 * Default CRUD patterns for form handler detection
 */
const defaultCrudPatterns: CRUDPattern[] = [
  { id: 'formCreate', regex: /<form.*onSubmit|handleCreate|onCreate/i, baseConfidence: 80, operation: 'create' },
  { id: 'handleDelete', regex: /handleDelete|onDelete|delete\w+/i, baseConfidence: 85, operation: 'delete' },
  { id: 'handleUpdate', regex: /handleUpdate|onUpdate|update\w+/i, baseConfidence: 85, operation: 'update' },
  { id: 'fetchRead', regex: /fetch\(.*\/api\/|useEffect.*fetch|loadData/i, baseConfidence: 70, operation: 'read' }
];

/**
 * Pattern analysis result
 */
export interface PatternAnalysis {
  entities: Entity[];
  authRequirements: AuthRequirement[];
  storageRequirements: StorageRequirement[];
  crudOperations: CRUDSOperation[];
  overallConfidence: number;
}

/**
 * Pattern matching engine for detecting backend requirements
 */
export class PatternMatcher {
  private patterns: MatcherPatterns;

  /**
   * Creates a PatternMatcher with custom patterns for detecting backend requirements.
   * @param patterns - Optional custom patterns for entity, auth, storage, and CRUD detection
   * @example
   * ```typescript
   * const matcher = new PatternMatcher({
   *   entity: [{ id: 'custom', regex: /myPattern/g, baseConfidence: 80 }]
   * });
   * ```
   */
  constructor(patterns?: Partial<MatcherPatterns>) {
    this.patterns = {
      entity: patterns?.entity ?? defaultEntityPatterns,
      auth: patterns?.auth ?? defaultAuthPatterns,
      storage: patterns?.storage ?? defaultStoragePatterns,
      crud: patterns?.crud ?? defaultCrudPatterns
    };
  }

  /**
   * Analyze code to detect all backend requirements in a single pass.
   * Combines entity detection, auth detection, storage detection, and CRUD detection.
   * @param code - React/TypeScript code to analyze
   * @returns PatternAnalysis containing all detected requirements with overall confidence
   * @example
   * ```typescript
   * const matcher = new PatternMatcher();
   * const result = matcher.analyze(code);
   * console.log(result.entities, result.authRequirements, result.overallConfidence);
   * ```
   */
  analyze(code: string): PatternAnalysis {
    const entities = this.detectEntities(code);
    const authRequirements = this.detectAuth(code);
    const storageRequirements = this.detectStorage(code);
    const crudOperations = this.detectCRUD(code);

    // Calculate overall confidence
    const confidences: number[] = [];
    if (entities.length) confidences.push(...entities.map(e => e.confidence));
    if (authRequirements.length) confidences.push(...authRequirements.map(a => a.confidence));
    if (storageRequirements.length) confidences.push(...storageRequirements.map(s => s.confidence));
    if (crudOperations.length) confidences.push(...crudOperations.map(c => c.confidence));

    const overallConfidence = confidences.length 
      ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
      : 0;

    return {
      entities,
      authRequirements,
      storageRequirements,
      crudOperations,
      overallConfidence
    };
  }

  /**
   * Extract field names from interface body
   */
  private extractFields(body: string): { name: string; type: string; isOptional: boolean }[] {
    const fields: { name: string; type: string; isOptional: boolean }[] = [];
    
    // Match field patterns: name?: type; or name: type;
    const fieldRegex = /(\w+)(\??):\s*(\w+)/g;
    let match;
    
    while ((match = fieldRegex.exec(body)) !== null) {
      fields.push({
        name: match[1],
        type: match[3],
        isOptional: match[2] === '?'
      });
    }
    
    return fields;
  }

  /**
   * Detect database entities from TypeScript interfaces or type aliases
   */
  /**
   * Detect database entities from TypeScript interfaces or type aliases.
   * Scans code for interface declarations and type aliases, extracting field names and types.
   * Higher confidence (90%+) for 'interface' keyword, lower (85%) for 'type' aliases.
   * @param code - React/TypeScript code to scan
   * @returns Array of detected Entity objects with name, fields, typeName, and confidence
   * @example
   * ```typescript
   * const entities = matcher.detectEntities('interface User { id: string; name: string; }');
   * // [{ name: 'User', typeName: 'User', fields: [...], confidence: 90 }]
   * ```
   */
  detectEntities(code: string): Entity[] {
    const entities: Entity[] = [];

    for (const pattern of this.patterns.entity) {
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      let match;

      while ((match = regex.exec(code)) !== null) {
        const name = match[1];
        const body = match[2] || '';
        const fields = this.extractFields(body);

        // Check if exported
        const isExported = /export\s+interface|export\s+type/.test(code.substring(Math.max(0, match.index - 20), match.index));
        
        entities.push({
          name,
          typeName: name,
          fields,
          confidence: isExported ? Math.min(100, pattern.baseConfidence + 10) : pattern.baseConfidence,
          matchType: 'pattern'
        });
      }
    }

    // Remove duplicates (same entity name)
    const unique = new Map<string, Entity>();
    for (const entity of entities) {
      if (!unique.has(entity.name) || unique.get(entity.name)!.confidence < entity.confidence) {
        unique.set(entity.name, entity);
      }
    }

    return Array.from(unique.values());
  }

  /**
   * Detect authentication requirements from login/register patterns
   */
  /**
   * Detect authentication requirements from login/register patterns.
   * Identifies auth-related components, hooks, and context providers.
   * Higher confidence (95%) for useAuth hook, lower (90%) for component names.
   * @param code - React/TypeScript code to scan
   * @returns Array of detected AuthRequirement objects with type, triggerPattern, and confidence
   * @example
   * ```typescript
   * const auth = matcher.detectAuth('<Login />');
   * // [{ type: 'login', triggerPattern: 'loginComponent', confidence: 90 }]
   * ```
   */
  detectAuth(code: string): AuthRequirement[] {
    const requirements: AuthRequirement[] = [];

    for (const pattern of this.patterns.auth) {
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      
      if (regex.test(code)) {
        requirements.push({
          type: pattern.authType,
          triggerPattern: pattern.id,
          confidence: pattern.baseConfidence
        });
      }
    }

    return requirements;
  }

  /**
   * Detect storage requirements from file upload patterns
   */
  /**
   * Detect storage requirements from file upload patterns.
   * Identifies file inputs, upload handlers, and storage-related components.
   * Higher confidence (90%) for upload handlers, lower (85%) for file inputs.
   * @param code - React/TypeScript code to scan
   * @returns Array of detected StorageRequirement objects with contentType, triggerPattern, and confidence
   * @example
   * ```typescript
   * const storage = matcher.detectStorage('<input type="file" />');
   * // [{ contentType: 'any', triggerPattern: 'fileInput', confidence: 85 }]
   * ```
   */
  detectStorage(code: string): StorageRequirement[] {
    const requirements: StorageRequirement[] = [];

    for (const pattern of this.patterns.storage) {
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      
      if (regex.test(code)) {
        requirements.push({
          contentType: pattern.contentType,
          triggerPattern: pattern.id,
          confidence: pattern.baseConfidence
        });
      }
    }

    return requirements;
  }

  /**
   * Detect CRUD operations from form handlers
   */
  /**
   * Detect CRUD (Create, Read, Update, Delete) operations from form handlers.
   * Identifies form submissions, API calls, and data manipulation patterns.
   * Higher confidence (85%) for explicit handlers, lower (70-80%) for generic patterns.
   * @param code - React/TypeScript code to scan
   * @returns Array of detected CRUDSOperation objects with entity, operation, triggerPattern, and confidence
   * @example
   * ```typescript
   * const crud = matcher.detectCRUD('<form onSubmit={handleCreate}>');
   * // [{ entity: 'Unknown', operation: 'create', triggerPattern: 'formCreate', confidence: 80 }]
   * ```
   */
  detectCRUD(code: string): CRUDSOperation[] {
    const operations: CRUDSOperation[] = [];

    for (const pattern of this.patterns.crud) {
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      
      if (regex.test(code)) {
        // Try to find related entity
        const entityMatch = code.match(/(?:interface|type)\s+(\w+)/);
        
        operations.push({
          entity: entityMatch ? entityMatch[1] : 'Unknown',
          operation: pattern.operation,
          triggerPattern: pattern.id,
          confidence: pattern.baseConfidence
        });
      }
    }

    return operations;
  }
}