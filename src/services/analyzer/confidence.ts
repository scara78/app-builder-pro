/**
 * Confidence Calculator for Backend Requirements Analyzer
 * CHANGE 2 - Phase 3
 */

import type { Entity, AuthRequirement, StorageRequirement, CRUDSOperation, BackendRequirements } from './types';

/**
 * Confidence levels
 */
export const CONFIDENCE_THRESHOLD = {
  HIGH: 80,
  MEDIUM: 60,
  LOW: 60 // below this triggers AI fallback
} as const;

/**
 * Base confidence by pattern type
 */
const ENTITY_BASE_CONFIDENCE: Record<string, number> = {
  interface: 90,
  typeAlias: 85,
  useAuth: 95,
  loginComponent: 90,
  registerComponent: 90,
  fileInput: 85,
  uploadHandler: 90,
  formSubmit: 80,
  deleteHandler: 85
};

/**
 * Generic entity names that should be penalized
 */
const GENERIC_NAMES = ['Data', 'Item', 'Obj', 'Object', 'Record', 'Row', 'Entry', 'Model'];

/**
 * Modifiers
 */
const MODIFIERS = {
  HAS_JSDOC: 5,
  EXPLICIT_TYPES: 5,
  MULTIPLE_FIELDS: 5,
  TOP_OF_FILE: 3,
  GENERIC_NAME_PENALTY: 10
} as const;

/**
 * Weights for aggregate calculation
 */
const AGGREGATE_WEIGHTS = {
  ENTITY: 0.4,
  AUTH: 0.2,
  STORAGE: 0.2,
  CRUD: 0.2
} as const;

/**
 * Confidence calculator for backend requirements detection
 */
export class ConfidenceCalculator {
  /**
   * Calculate confidence for entity detection
   */
  /**
   * Calculate confidence score for a detected entity.
   * Applies modifiers based on interface explicitness, field count, and name genericity.
   * @param entity - Entity to calculate confidence for
   * @returns Adjusted confidence score (0-100)
   * @example
   * ```typescript
   * const calc = new ConfidenceCalculator();
   * const confidence = calc.calculateEntityConfidence({ name: 'User', typeName: 'User', fields: [...], confidence: 90 });
   * ```
   */
  calculateEntityConfidence(entity: Entity): number {
    let confidence = entity.confidence;
    
    // Check for explicit interface (not generic type alias or inferred)
    if (entity.matchType === 'pattern' && this.isExplicitInterface(entity)) {
      confidence += MODIFIERS.EXPLICIT_TYPES;
    }
    
    // Multiple fields detection bonus
    if (entity.fields.length >= 2) {
      confidence += MODIFIERS.MULTIPLE_FIELDS;
    } else if (entity.fields.length === 0) {
      confidence -= MODIFIERS.GENERIC_NAME_PENALTY;
    }
    
    // Penalize generic names
    if (GENERIC_NAMES.includes(entity.name)) {
      confidence -= MODIFIERS.GENERIC_NAME_PENALTY;
    }
    
    // Has JSDoc comment detection (would need AST, base confidence already high)
    // This is implicit in the pattern matching
    
    return this.clampConfidence(confidence);
  }

  /**
   * Calculate confidence for auth requirement
   */
  /**
   * Calculate confidence score for an authentication requirement.
   * Applies modifiers based on trigger pattern explicitness and user fields.
   * Higher confidence for useAuth hook, lower for generic component names.
   * @param auth - AuthRequirement to calculate confidence for
   * @returns Adjusted confidence score (0-100)
   * @example
   * ```typescript
   * const calc = new ConfidenceCalculator();
   * const confidence = calc.calculateAuthConfidence({ type: 'login', triggerPattern: 'useAuth', confidence: 95 });
   * ```
   */
  calculateAuthConfidence(auth: AuthRequirement): number {
    let confidence = auth.confidence;
    
    // useAuth hook is most explicit
    if (auth.triggerPattern === 'useAuth' || auth.triggerPattern === 'AuthContext' || auth.triggerPattern === 'AuthProvider') {
      confidence += MODIFIERS.EXPLICIT_TYPES;
    }
    
    // has userFields shows more explicit intent
    if (auth.userFields && auth.userFields.length > 0) {
      confidence += MODIFIERS.MULTIPLE_FIELDS;
    }
    
    return this.clampConfidence(confidence);
  }

  /**
   * Calculate confidence for storage requirement
   */
  /**
   * Calculate confidence score for a storage requirement.
   * Applies modifiers based on trigger pattern and content type specificity.
   * Higher confidence for upload handlers, lower for generic file inputs.
   * @param storage - StorageRequirement to calculate confidence for
   * @returns Adjusted confidence score (0-100)
   * @example
   * ```typescript
   * const calc = new ConfidenceCalculator();
   * const confidence = calc.calculateStorageConfidence({ contentType: 'image', triggerPattern: 'uploadHandler', confidence: 90 });
   * ```
   */
  calculateStorageConfidence(storage: StorageRequirement): number {
    let confidence = storage.confidence;
    
    // upload handler is more explicit than file input
    if (storage.triggerPattern === 'uploadHandler' || storage.triggerPattern === 'onUpload') {
      confidence += MODIFIERS.EXPLICIT_TYPES;
    }
    
    // Specific content type is higher confidence than 'any'
    if (storage.contentType !== 'any' && storage.contentType !== undefined) {
      confidence += MODIFIERS.MULTIPLE_FIELDS;
    }
    
    return this.clampConfidence(confidence);
  }

  /**
   * Calculate confidence for CRUD operation
   */
  /**
   * Calculate confidence score for a CRUD operation.
   * Applies modifiers based on operation type and trigger pattern.
   * Higher confidence for delete operations (explicit intent), lower for generic form submissions.
   * @param operation - CRUDSOperation to calculate confidence for
   * @returns Adjusted confidence score (0-100)
   * @example
   * ```typescript
   * const calc = new ConfidenceCalculator();
   * const confidence = calc.calculateCRUDConfidence({ entity: 'User', operation: 'delete', triggerPattern: 'handleDelete', confidence: 85 });
   * ```
   */
  calculateCRUDConfidence(operation: CRUDSOperation): number {
    let confidence = operation.confidence;
    
    // Delete handler is more explicit (destructive action requires intent)
    if (operation.operation === 'delete') {
      confidence += MODIFIERS.EXPLICIT_TYPES;
    }
    
    // Form submit is generic, less explicit
    if (operation.triggerPattern === 'formSubmit') {
      confidence -= 5;
    }
    
    return this.clampConfidence(confidence);
  }

  /**
   * Calculate aggregate confidence for full backend requirements
   */
  /**
   * Calculate aggregate confidence for complete backend requirements.
   * Uses weighted average: entities (40%), auth (20%), storage (20%), CRUD (20%).
   * @param requirements - Full BackendRequirements to calculate aggregate confidence for
   * @returns Weighted aggregate confidence score (0-100)
   * @example
   * ```typescript
   * const calc = new ConfidenceCalculator();
   * const aggregate = calc.calculateAggregate(requirements);
   * ```
   */
  calculateAggregate(requirements: BackendRequirements): number {
    const entityConfidences = requirements.entities.map(e => this.calculateEntityConfidence(e));
    const authConfidences = requirements.authRequirements?.map(a => this.calculateAuthConfidence(a)) ?? [];
    const storageConfidences = requirements.storageRequirements?.map(s => this.calculateStorageConfidence(s)) ?? [];
    const crudConfidences = requirements.crudOperations.map(c => this.calculateCRUDConfidence(c));
    
    // Calculate weighted average
    const avgEntity = entityConfidences.length 
      ? entityConfidences.reduce((a, b) => a + b, 0) / entityConfidences.length 
      : 0;
    
    const avgAuth = authConfidences.length 
      ? authConfidences.reduce((a, b) => a + b, 0) / authConfidences.length 
      : 0;
    
    const avgStorage = storageConfidences.length 
      ? storageConfidences.reduce((a, b) => a + b, 0) / storageConfidences.length 
      : 0;
    
    const avgCRUD = crudConfidences.length 
      ? crudConfidences.reduce((a, b) => a + b, 0) / crudConfidences.length 
      : 0;
    
    // Weighted aggregate
    const aggregate = 
      (avgEntity * AGGREGATE_WEIGHTS.ENTITY) +
      (avgAuth * AGGREGATE_WEIGHTS.AUTH) +
      (avgStorage * AGGREGATE_WEIGHTS.STORAGE) +
      (avgCRUD * AGGREGATE_WEIGHTS.CRUD);
    
    return Math.round(this.clampConfidence(aggregate));
  }

  /**
   * Determine if AI fallback should be triggered
   * Threshold: 0.7 (70%) - MEDIUM confidence triggers fallback
   */
  /**
   * Determine if AI fallback should be triggered based on confidence threshold.
   * Triggers when confidence is below HIGH threshold (80%), enabling hybrid analysis.
   * @param confidence - Confidence score to evaluate
   * @returns True if confidence is below threshold and AI fallback should be used
   * @example
   * ```typescript
   * const calc = new ConfidenceCalculator();
   * const shouldFallback = calc.shouldTriggerAIFallback(65); // true, below 80%
   * const shouldNotFallback = calc.shouldTriggerAIFallback(85); // false, above 80%
   * ```
   */
  shouldTriggerAIFallback(confidence: number): boolean {
    return confidence < CONFIDENCE_THRESHOLD.HIGH;
  }

  /**
   * Check if confidence is in HIGH range
   */
  isHighConfidence(confidence: number): boolean {
    return confidence >= CONFIDENCE_THRESHOLD.HIGH;
  }

  /**
   * Check if confidence is in MEDIUM range
   */
  isMediumConfidence(confidence: number): boolean {
    return confidence >= CONFIDENCE_THRESHOLD.MEDIUM && confidence < CONFIDENCE_THRESHOLD.HIGH;
  }

  /**
   * Check if confidence is LOW (triggers AI fallback)
   */
  isLowConfidence(confidence: number): boolean {
    return confidence < CONFIDENCE_THRESHOLD.LOW;
  }

  /**
   * Check if entity is explicit interface
   */
  private isExplicitInterface(entity: Entity): boolean {
    // Interface declarations are more explicit than type aliases
    return entity.typeName.toLowerCase() !== 'data' && 
           entity.typeName.toLowerCase() !== 'item' &&
           entity.fields.length > 0;
  }

  /**
   * Clamp confidence to 0-100 range
   */
  private clampConfidence(value: number): number {
    return Math.max(0, Math.min(100, Math.round(value)));
  }
}

/**
 * Factory function to create ConfidenceCalculator
 */
export function createConfidenceCalculator(): ConfidenceCalculator {
  return new ConfidenceCalculator();
}