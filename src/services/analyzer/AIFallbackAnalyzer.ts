/**
 * AI Fallback Analyzer for Backend Requirements Detection
 * CHANGE 2 - Phase 4
 * Uses Gemini API for semantic analysis when pattern matching is insufficient
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { 
  BackendRequirements, 
  Entity, 
  EntityField,
  AuthRequirement, 
  StorageRequirement,
  CRUDSOperation,
  AnalysisMethod 
} from './types';

/**
 * Default timeout for AI API calls in milliseconds
 */
const DEFAULT_TIMEOUT_MS = 10000;

/**
 * AI prompt template for backend requirements analysis
 */
const AI_PROMPT_TEMPLATE = `Analyze this React code and detect backend requirements.

Code:
{code}

Respond ONLY with JSON in this format:
{
  "entities": [{"name": "User", "fields": [{"name": "email", "type": "string"}]}],
  "hasAuth": true,
  "authRequirements": [{"type": "login", "confidence": 90}],
  "hasStorage": false,
  "storageRequirements": [],
  "crudOperations": [{"entity": "User", "operation": "create", "confidence": 85}],
  "overallConfidence": 85,
  "analysisMethod": "ai"
}`;

/**
 * AI Fallback Analyzer using Gemini API
 * Triggered when pattern matching confidence is below threshold
 */
export class AIFallbackAnalyzer {
  private genAI: GoogleGenerativeAI;
  private modelId: string = 'gemini-2.0-flash';
  private timeout: number;

  /**
   * Create a new AIFallbackAnalyzer
   * @param apiKey - Gemini API key
   * @param timeout - Timeout in milliseconds (default: 10000)
   */
  constructor(apiKey: string, timeout: number = DEFAULT_TIMEOUT_MS) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.timeout = timeout;
  }

  /**
   * Analyze code using Gemini AI for semantic understanding
   * @param code - React/TypeScript code to analyze
   * @returns BackendRequirements detected from AI analysis
   */
  async analyze(code: string): Promise<BackendRequirements> {
    const prompt = this.buildPrompt(code);
    
    // Create timeout controller
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => {
      timeoutController.abort();
    }, this.timeout);

    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelId });
      
      const result = await model.generateContent(prompt, {
        signal: timeoutController.signal
      });
      
      clearTimeout(timeoutId);
      
      const response = await result.response;
      const text = response.text();
      
      return this.parseResponse(text);
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Check if it was a timeout
      if (error instanceof Error && error.name === 'AbortError') {
        return this.handleTimeout();
      }
      
      return this.handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Build the prompt for AI analysis
   * @param code - Code to analyze
   * @returns Formatted prompt string
   */
  buildPrompt(code: string): string {
    const sanitizedCode = code.trim().slice(0, 50000); // Limit code size
    return AI_PROMPT_TEMPLATE.replace('{code}', sanitizedCode);
  }

  /**
   * Parse AI JSON response to BackendRequirements
   * @param response - Raw AI response text
   * @returns Parsed BackendRequirements
   */
  parseResponse(response: string): BackendRequirements {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        return this.handleMalformedResponse();
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and transform to our types
      return this.transformResponse(parsed);
    } catch {
      return this.handleMalformedResponse();
    }
  }

  /**
   * Handle timeout - return fallback with zero confidence
   */
  handleTimeout(): BackendRequirements {
    return this.createFallbackResult('Timeout during AI analysis');
  }

  /**
   * Handle error - return fallback with zero confidence
   */
  handleError(error: Error): BackendRequirements {
    console.error('[AIFallbackAnalyzer] Error:', error.message);
    return this.createFallbackResult(`Error: ${error.message}`);
  }

  /**
   * Handle malformed AI response
   */
  handleMalformedResponse(): BackendRequirements {
    console.warn('[AIFallbackAnalyzer] Malformed AI response, returning fallback');
    return this.createFallbackResult('Malformed AI response');
  }

  /**
   * Create a fallback result with zero confidence
   */
  private createFallbackResult(reason: string): BackendRequirements {
    return {
      entities: [],
      hasAuth: false,
      authRequirements: [],
      hasStorage: false,
      storageRequirements: [],
      crudOperations: [],
      overallConfidence: 0,
      analysisMethod: 'ai',
      analyzedAt: new Date().toISOString()
    };
  }

  /**
   * Transform AI response to our BackendRequirements type
   */
  private transformResponse(parsed: any): BackendRequirements {
    // Transform entities
    const entities: Entity[] = (parsed.entities ?? []).map((e: any) => ({
      name: e.name ?? 'Unknown',
      typeName: e.name ?? 'Unknown',
      fields: (e.fields ?? []).map((f: any): EntityField => ({
        name: f.name ?? '',
        type: f.type ?? 'string',
        isOptional: f.isOptional ?? false
      })),
      confidence: e.confidence ?? 50,
      matchType: 'ai' as const
    }));

    // Transform auth requirements
    const authRequirements: AuthRequirement[] = (parsed.authRequirements ?? []).map((a: any) => ({
      type: a.type ?? 'login',
      triggerPattern: 'AI',
      userFields: a.userFields,
      confidence: a.confidence ?? 50
    }));

    // Transform storage requirements  
    const storageRequirements: StorageRequirement[] = (parsed.storageRequirements ?? []).map((s: any) => ({
      contentType: s.contentType ?? 'any',
      maxSizeMB: s.maxSizeMB,
      bucketName: s.bucketName,
      triggerPattern: 'AI',
      confidence: s.confidence ?? 50
    }));

    // Transform CRUD operations
    const crudOperations: CRUDSOperation[] = (parsed.crudOperations ?? []).map((c: any) => ({
      entity: c.entity ?? 'Unknown',
      operation: c.operation ?? 'read',
      triggerPattern: 'AI',
      confidence: c.confidence ?? 50
    }));

    return {
      entities,
      hasAuth: parsed.hasAuth ?? false,
      authRequirements,
      hasStorage: parsed.hasStorage ?? false,
      storageRequirements,
      crudOperations,
      overallConfidence: parsed.overallConfidence ?? 50,
      analysisMethod: 'ai',
      analyzedAt: new Date().toISOString()
    };
  }
}

/**
 * Factory function to create AIFallbackAnalyzer
 */
export function createAIFallbackAnalyzer(apiKey: string, timeout?: number): AIFallbackAnalyzer {
  return new AIFallbackAnalyzer(apiKey, timeout);
}