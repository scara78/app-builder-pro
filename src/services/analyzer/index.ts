/**
 * Backend Requirements Analyzer - Public API
 * CHANGE 2 - App Builder Cloud
 * Hybrid orchestration combining pattern matching, AI fallback, and caching
 */

export {
  BackendRequirementsAnalyzer,
  createBackendRequirementsAnalyzer,
} from './BackendRequirementsAnalyzer';
export type { AnalyzerOptions } from './BackendRequirementsAnalyzer';

export { PatternMatcher } from './PatternMatcher';
export type { MatcherPatterns, PatternAnalysis } from './PatternMatcher';

export {
  ConfidenceCalculator,
  createConfidenceCalculator,
  CONFIDENCE_THRESHOLD,
} from './confidence';

export { AIFallbackAnalyzer, createAIFallbackAnalyzer } from './AIFallbackAnalyzer';

export { AnalysisCache } from './cache';

export type {
  Entity,
  EntityField,
  CRUDOperationType,
  CRUDSOperation,
  AuthRequirementType,
  AuthRequirement,
  StorageContentType,
  StorageRequirement,
  AnalysisMethod,
  BackendRequirements,
  DetectionResult,
  PatternMatch,
  EntityPattern,
  AuthPattern,
  StoragePattern,
  CRUDPattern,
} from './types';
