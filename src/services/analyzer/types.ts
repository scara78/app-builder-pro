/**
 * Type definitions for Backend Requirements Analyzer
 * CHANGE 2 - App Builder Cloud
 */

/**
 * Field within an entity
 */
export interface EntityField {
  name: string;
  type: string;
  isOptional: boolean;
}

/**
 * Entity detected from TypeScript interfaces or type aliases
 */
export interface Entity {
  /** Name of the detected entity (e.g., "User", "Product", "Order") */
  name: string;
  /** Type name of the entity */
  typeName: string;
  /** Detected fields with their types */
  fields: EntityField[];
  /** Confidence score: 0-100 */
  confidence: number;
  /** Type of match: pattern | ai */
  matchType: 'pattern' | 'ai';
}

/**
 * CRUD operation type
 */
export type CRUDOperationType = 'create' | 'read' | 'update' | 'delete';

/**
 * CRUD operation detected from form handlers or data operations
 */
export interface CRUDSOperation {
  /** Related entity */
  entity: string;
  /** Type of operation */
  operation: CRUDOperationType;
  /** Code pattern that triggered the detection */
  triggerPattern: string;
  /** Confidence score: 0-100 */
  confidence: number;
}

/**
 * Authentication requirement type
 */
export type AuthRequirementType = 'login' | 'register' | 'profile' | 'logout' | 'password-reset';

/**
 * Authentication requirement detected from login/register patterns
 */
export interface AuthRequirement {
  /** Type of auth requirement */
  type: AuthRequirementType;
  /** Pattern that detected the requirement */
  triggerPattern: string;
  /** Related user fields */
  userFields?: string[];
  /** Confidence score: 0-100 */
  confidence: number;
}

/**
 * Storage content type
 */
export type StorageContentType = 'image' | 'document' | 'video' | 'audio' | 'any';

/**
 * Storage requirement detected from file upload patterns
 */
export interface StorageRequirement {
  /** Type of content to store */
  contentType: StorageContentType;
  /** Maximum expected size in MB */
  maxSizeMB?: number;
  /** Suggested bucket name */
  bucketName?: string;
  /** Pattern that detected the requirement */
  triggerPattern: string;
  /** Confidence score: 0-100 */
  confidence: number;
}

/**
 * Analysis method used
 */
export type AnalysisMethod = 'pattern' | 'hybrid' | 'ai';

/**
 * Complete backend requirements detected from React code
 */
export interface BackendRequirements {
  /** Detected database entities */
  entities: Entity[];
  /** Indicates if auth was detected */
  hasAuth: boolean;
  /** Authentication requirements */
  authRequirements?: AuthRequirement[];
  /** Indicates if storage was detected */
  hasStorage: boolean;
  /** Storage requirements */
  storageRequirements?: StorageRequirement[];
  /** Detected CRUD operations */
  crudOperations: CRUDSOperation[];
  /** Overall confidence level: 0-100 */
  overallConfidence: number;
  /** Analysis method used: pattern | hybrid */
  analysisMethod: AnalysisMethod;
  /** Timestamp of analysis */
  analyzedAt: string;
}

/**
 * Detection result with cache metadata
 */
export interface DetectionResult {
  /** SHA256 hash of source code */
  sourceHash: string;
  /** Whether any requirements were detected */
  detected: boolean;
  /** Detected requirements */
  requirements: BackendRequirements;
  /** When result was cached */
  cachedAt: string;
}

/**
 * Pattern match result
 */
export interface PatternMatch {
  /** Pattern identifier */
  patternId: string;
  /** Matched text */
  matchedText: string;
  /** Confidence score */
  confidence: number;
  /** Match position in source */
  position: {
    start: number;
    end: number;
  };
}

/**
 * Entity detection pattern
 */
export interface EntityPattern {
  id: string;
  regex: RegExp;
  baseConfidence: number;
  fieldRegex?: RegExp;
}

/**
 * Auth detection pattern
 */
export interface AuthPattern {
  id: string;
  regex: RegExp;
  baseConfidence: number;
  authType: AuthRequirementType;
}

/**
 * Storage detection pattern
 */
export interface StoragePattern {
  id: string;
  regex: RegExp;
  baseConfidence: number;
  contentType: StorageContentType;
}

/**
 * CRUD detection pattern
 */
export interface CRUDPattern {
  id: string;
  regex: RegExp;
  baseConfidence: number;
  operation: CRUDOperationType;
}