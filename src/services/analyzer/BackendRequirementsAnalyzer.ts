/**
 * Backend Requirements Analyzer
 * CHANGE 2 - Phase 6: Main Analyzer Integration
 * Hybrid orchestration combining pattern matching, AI fallback, and caching
 */

import type {
  BackendRequirements,
  Entity,
  AuthRequirement,
  StorageRequirement,
  CRUDSOperation,
  DetectionResult,
  AnalysisMethod,
} from './types';
import { PatternMatcher, type PatternAnalysis } from './PatternMatcher';
import { ConfidenceCalculator } from './confidence';
import { AIFallbackAnalyzer } from './AIFallbackAnalyzer';
import { AnalysisCache } from './cache';
import { logWarnSafe } from '../../utils/logger';

/**
 * Options for BackendRequirementsAnalyzer
 */
export interface AnalyzerOptions {
  /** Custom pattern matcher instance */
  patternMatcher?: PatternMatcher;
  /** Custom confidence calculator instance */
  confidenceCalculator?: ConfidenceCalculator;
  /** Custom AI fallback analyzer instance */
  aiFallback?: AIFallbackAnalyzer;
  /** Custom cache instance */
  cache?: AnalysisCache;
  /** Whether to use caching (default: false) */
  useCache?: boolean;
  /** AI threshold for fallback (reserved for future use) */
  aiThreshold?: number;
}

/**
 * Analysis result with all combined data
 */
interface AnalysisResult {
  entities: Entity[];
  authRequirements: AuthRequirement[];
  storageRequirements: StorageRequirement[];
  crudOperations: CRUDSOperation[];
  hasAuth: boolean;
  hasStorage: boolean;
  overallConfidence: number;
  analysisMethod: AnalysisMethod;
}

/**
 * Main analyzer class that orchestrates pattern matching, AI fallback, and caching
 * to detect backend requirements from React code
 */
export class BackendRequirementsAnalyzer {
  private patternMatcher: PatternMatcher;
  private confidenceCalculator: ConfidenceCalculator;
  private aiFallback: AIFallbackAnalyzer | null;
  private cache: AnalysisCache | null;
  private useCache: boolean;

  /**
   * Create a new BackendRequirementsAnalyzer
   * @param options - Configuration options
   */
  /**
   * Creates a new BackendRequirementsAnalyzer with optional custom dependencies.
   * Allows injection of custom pattern matcher, confidence calculator, AI analyzer, and cache.
   * @param options - Configuration options for the analyzer
   * @example
   * ```typescript
   * // Default analyzer with pattern matching only
   * const analyzer = new BackendRequirementsAnalyzer();
   *
   * // Full analyzer with AI fallback and caching
   * const analyzer = new BackendRequirementsAnalyzer({
   *   aiFallback: new AIFallbackAnalyzer(apiKey),
   *   cache: new AnalysisCache(),
   *   useCache: true,
   *   aiThreshold: 80
   * });
   * ```
   */
  constructor(options?: AnalyzerOptions) {
    this.patternMatcher = options?.patternMatcher ?? new PatternMatcher();
    this.confidenceCalculator = options?.confidenceCalculator ?? new ConfidenceCalculator();
    this.aiFallback = options?.aiFallback ?? null;
    this.cache = options?.cache ?? null;
    this.useCache = options?.useCache ?? false;
  }

  /**
   * Analyze code to detect backend requirements
   * @param code - React/TypeScript code to analyze
   * @returns BackendRequirements detected from the code
   */
  /**
   * Analyze React/TypeScript code to detect backend requirements.
   * Orchestrates pattern matching, AI fallback (optional), and caching (optional).
   * Returns complete BackendRequirements with entities, auth, storage, and CRUD.
   * @param code - React/TypeScript code to analyze
   * @returns Promise<BackendRequirements> with detected requirements and confidence
   * @example
   * ```typescript
   * const analyzer = new BackendRequirementsAnalyzer({
   *   aiFallback: new AIFallbackAnalyzer(apiKey),
   *   useCache: true
   * });
   *
   * const requirements = await analyzer.analyze(`
   *   interface User { id: string; email: string; }
   *   function Login() { return <form>...</form>; }
   * `);
   *
   * console.log(requirements.entities, requirements.hasAuth, requirements.overallConfidence);
   * ```
   */
  async analyze(code: string): Promise<BackendRequirements> {
    // Handle empty code
    if (!code || code.trim() === '') {
      return this.createEmptyRequirements();
    }

    // Step 1: Check cache if enabled
    if (this.useCache && this.cache) {
      const cached = this.cache.get(code);
      if (cached) {
        return cached.requirements;
      }
    }

    // Step 2: Run pattern matcher first (fast)
    const patternResult = this.patternMatcher.analyze(code);

    // Step 3: Calculate confidence
    const initialConfidence = patternResult.overallConfidence;

    // Step 4: Determine if we need AI fallback
    let finalResult: AnalysisResult;

    if (this.confidenceCalculator.shouldTriggerAIFallback(initialConfidence) && this.aiFallback) {
      // Hybrid mode: pattern + AI
      finalResult = await this.runHybridAnalysis(code, patternResult);
    } else {
      // Pattern-only mode
      finalResult = this.combineResults(patternResult, 'pattern');
    }

    // Step 5: Build final requirements
    const requirements: BackendRequirements = {
      entities: finalResult.entities,
      hasAuth: finalResult.hasAuth,
      authRequirements: finalResult.authRequirements,
      hasStorage: finalResult.hasStorage,
      storageRequirements: finalResult.storageRequirements,
      crudOperations: finalResult.crudOperations,
      overallConfidence: finalResult.overallConfidence,
      analysisMethod: finalResult.analysisMethod,
      analyzedAt: new Date().toISOString(),
    };

    // Step 6: Cache result if enabled
    if (this.useCache && this.cache) {
      const detectionResult: DetectionResult = {
        sourceHash: this.cache.generateKey(code),
        detected: finalResult.entities.length > 0 || finalResult.hasAuth || finalResult.hasStorage,
        requirements,
        cachedAt: new Date().toISOString(),
      };
      this.cache.set(code, detectionResult);
    }

    return requirements;
  }

  /**
   * Run hybrid analysis combining pattern and AI results
   */
  private async runHybridAnalysis(
    code: string,
    patternResult: PatternAnalysis
  ): Promise<AnalysisResult> {
    if (!this.aiFallback) {
      return this.combineResults(patternResult, 'pattern');
    }

    try {
      const aiResult = await this.aiFallback.analyze(code);

      // Combine pattern and AI results
      return this.mergeResults(patternResult, aiResult, 'hybrid');
    } catch (_error) {
      // If AI fails, fall back to pattern-only
      logWarnSafe('BackendRequirementsAnalyzer', 'AI fallback failed, using pattern results');
      return this.combineResults(patternResult, 'pattern');
    }
  }

  /**
   * Combine pattern results into final result
   */
  private combineResults(patternResult: PatternAnalysis, method: AnalysisMethod): AnalysisResult {
    const hasAuth = patternResult.authRequirements.length > 0;
    const hasStorage = patternResult.storageRequirements.length > 0;

    return {
      entities: patternResult.entities,
      authRequirements: patternResult.authRequirements,
      storageRequirements: patternResult.storageRequirements,
      crudOperations: patternResult.crudOperations,
      hasAuth,
      hasStorage,
      overallConfidence: patternResult.overallConfidence,
      analysisMethod: method,
    };
  }

  /**
   * Merge pattern and AI results (hybrid mode)
   */
  private mergeResults(
    patternResult: PatternAnalysis,
    aiResult: BackendRequirements,
    method: AnalysisMethod
  ): AnalysisResult {
    // Prefer pattern results if they have higher confidence
    // Merge entities, deduplicating by name
    const entityMap = new Map<string, Entity>();

    // Add pattern entities first (higher confidence typically)
    for (const entity of patternResult.entities) {
      entityMap.set(entity.name, entity);
    }

    // Add AI entities that don't exist
    for (const entity of aiResult.entities) {
      if (!entityMap.has(entity.name)) {
        entityMap.set(entity.name, entity);
      }
    }

    // Merge auth - use whichever is higher confidence
    const authRequirements =
      patternResult.authRequirements.length > 0
        ? patternResult.authRequirements
        : (aiResult.authRequirements ?? []);

    // Merge storage
    const storageRequirements =
      patternResult.storageRequirements.length > 0
        ? patternResult.storageRequirements
        : (aiResult.storageRequirements ?? []);

    // Merge CRUD operations
    const crudMap = new Map<string, CRUDSOperation>();
    for (const op of patternResult.crudOperations) {
      crudMap.set(`${op.entity}-${op.operation}`, op);
    }
    for (const op of aiResult.crudOperations ?? []) {
      if (!crudMap.has(`${op.entity}-${op.operation}`)) {
        crudMap.set(`${op.entity}-${op.operation}`, op);
      }
    }

    return {
      entities: Array.from(entityMap.values()),
      authRequirements,
      storageRequirements,
      crudOperations: Array.from(crudMap.values()),
      hasAuth: authRequirements.length > 0,
      hasStorage: storageRequirements.length > 0,
      overallConfidence: Math.max(patternResult.overallConfidence, aiResult.overallConfidence),
      analysisMethod: method,
    };
  }

  /**
   * Create empty requirements for invalid input
   */
  private createEmptyRequirements(): BackendRequirements {
    return {
      entities: [],
      hasAuth: false,
      authRequirements: [],
      hasStorage: false,
      storageRequirements: [],
      crudOperations: [],
      overallConfidence: 0,
      analysisMethod: 'pattern',
      analyzedAt: new Date().toISOString(),
    };
  }
}

/**
 * Factory function to create a BackendRequirementsAnalyzer
 */
export function createBackendRequirementsAnalyzer(
  options?: AnalyzerOptions
): BackendRequirementsAnalyzer {
  return new BackendRequirementsAnalyzer(options);
}
