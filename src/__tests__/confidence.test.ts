/**
 * Tests for ConfidenceCalculator (Phase 3)
 * CHANGE 2 - Backend Requirements Analyzer
 */

import { describe, it, expect } from 'vitest';
import { ConfidenceCalculator } from '../services/analyzer/confidence';
import type { Entity, AuthRequirement, StorageRequirement, CRUDSOperation, BackendRequirements } from '../services/analyzer/types';

describe('ConfidenceCalculator', () => {
  describe('calculateEntityConfidence', () => {
    it('should return 0-100 score for entity detection', () => {
      const calculator = new ConfidenceCalculator();
      
      const entity: Entity = {
        name: 'User',
        typeName: 'User',
        fields: [
          { name: 'id', type: 'string', isOptional: false },
          { name: 'email', type: 'string', isOptional: false },
          { name: 'name', type: 'string', isOptional: true }
        ],
        confidence: 90,
        matchType: 'pattern'
      };
      
      const result = calculator.calculateEntityConfidence(entity);
      
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should return high confidence for explicit interface', () => {
      const calculator = new ConfidenceCalculator();
      
      const entity: Entity = {
        name: 'User',
        typeName: 'User',
        fields: [
          { name: 'id', type: 'string', isOptional: false },
          { name: 'email', type: 'string', isOptional: false }
        ],
        confidence: 90,
        matchType: 'pattern'
      };
      
      const result = calculator.calculateEntityConfidence(entity);
      
      // Base 90 + explicit types + multiple fields
      expect(result).toBeGreaterThanOrEqual(80);
    });

    it('should return Low confidence for generic entity name', () => {
      const calculator = new ConfidenceCalculator();
      
      const entity: Entity = {
        name: 'Data',
        typeName: 'Data',
        fields: [],
        confidence: 50,
        matchType: 'pattern'
      };
      
      const result = calculator.calculateEntityConfidence(entity);
      
      // Should be penalized for generic name
      expect(result).toBeLessThan(80);
    });
  });

  describe('calculateAuthConfidence', () => {
    it('should return high confidence for useAuth hook detection', () => {
      const calculator = new ConfidenceCalculator();
      
      const auth: AuthRequirement = {
        type: 'login',
        triggerPattern: 'useAuth',
        confidence: 95
      };
      
      const result = calculator.calculateAuthConfidence(auth);
      
      expect(result).toBeGreaterThanOrEqual(90);
    });

    it('should return medium confidence for user state detection', () => {
      const calculator = new ConfidenceCalculator();
      
      const auth: AuthRequirement = {
        type: 'login',
        triggerPattern: 'user',
        confidence: 70
      };
      
      const result = calculator.calculateAuthConfidence(auth);
      
      expect(result).toBeGreaterThanOrEqual(60);
    });
  });

  describe('calculateStorageConfidence', () => {
    it('should return high confidence for file input detection', () => {
      const calculator = new ConfidenceCalculator();
      
      const storage: StorageRequirement = {
        contentType: 'image',
        triggerPattern: 'fileInput',
        confidence: 85
      };
      
      const result = calculator.calculateStorageConfidence(storage);
      
      expect(result).toBeGreaterThanOrEqual(80);
    });

    it('should return high confidence for upload handler', () => {
      const calculator = new ConfidenceCalculator();
      
      const storage: StorageRequirement = {
        contentType: 'document',
        triggerPattern: 'uploadHandler',
        confidence: 90
      };
      
      const result = calculator.calculateStorageConfidence(storage);
      
      expect(result).toBeGreaterThanOrEqual(85);
    });
  });

  describe('calculateCRUDConfidence', () => {
    it('should return high confidence for delete handler', () => {
      const calculator = new ConfidenceCalculator();
      
      const crud: CRUDSOperation = {
        entity: 'User',
        operation: 'delete',
        triggerPattern: 'handleDelete',
        confidence: 85
      };
      
      const result = calculator.calculateCRUDConfidence(crud);
      
      expect(result).toBeGreaterThanOrEqual(80);
    });

    it('should return medium confidence for form submit', () => {
      const calculator = new ConfidenceCalculator();
      
      const crud: CRUDSOperation = {
        entity: 'User',
        operation: 'create',
        triggerPattern: 'formSubmit',
        confidence: 80
      };
      
      const result = calculator.calculateCRUDConfidence(crud);
      
      expect(result).toBeGreaterThanOrEqual(70);
    });
  });

  describe('calculateAggregate', () => {
    it('should return aggregate confidence score between 0-100', () => {
      const calculator = new ConfidenceCalculator();
      
      const requirements: BackendRequirements = {
        entities: [
          {
            name: 'User',
            typeName: 'User',
            fields: [{ name: 'id', type: 'string', isOptional: false }],
            confidence: 90,
            matchType: 'pattern'
          }
        ],
        hasAuth: true,
        authRequirements: [
          { type: 'login', triggerPattern: 'useAuth', confidence: 95 }
        ],
        hasStorage: false,
        storageRequirements: [],
        crudOperations: [
          { entity: 'User', operation: 'create', triggerPattern: 'formCreate', confidence: 80 }
        ],
        overallConfidence: 88,
        analysisMethod: 'pattern',
        analyzedAt: new Date().toISOString()
      };
      
      const result = calculator.calculateAggregate(requirements);
      
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should weight entity confidence at 0.4', () => {
      const calculator = new ConfidenceCalculator();
      
      const requirements: BackendRequirements = {
        entities: [
          {
            name: 'User',
            typeName: 'User',
            fields: [
              { name: 'id', type: 'string', isOptional: false },
              { name: 'email', type: 'string', isOptional: false }
            ],
            confidence: 95,
            matchType: 'pattern'
          }
        ],
        hasAuth: true,
        authRequirements: [
          { type: 'login', triggerPattern: 'useAuth', confidence: 95 }
        ],
        hasStorage: true,
        storageRequirements: [
          { contentType: 'image', triggerPattern: 'fileInput', confidence: 85 }
        ],
        crudOperations: [
          { entity: 'User', operation: 'create', triggerPattern: 'formCreate', confidence: 80 }
        ],
        overallConfidence: 90,
        analysisMethod: 'pattern',
        analyzedAt: new Date().toISOString()
      };
      
      const result = calculator.calculateAggregate(requirements);
      
      // Should reflect high entity weight
      expect(result).toBeGreaterThanOrEqual(80);
    });
  });

  describe('shouldTriggerAIFallback', () => {
    it('should trigger AI fallback when confidence < 60', () => {
      const calculator = new ConfidenceCalculator();
      
      const result = calculator.shouldTriggerAIFallback(50);
      
      expect(result).toBe(true);
    });

    it('should NOT trigger AI fallback when confidence >= 80', () => {
      const calculator = new ConfidenceCalculator();
      
      const result = calculator.shouldTriggerAIFallback(80);
      
      expect(result).toBe(false);
    });

    it('should trigger AI fallback at threshold 0.7 (70%)', () => {
      const calculator = new ConfidenceCalculator();
      
      // 70% should trigger (MEDIUM confidence -> AI fallback)
      const result70 = calculator.shouldTriggerAIFallback(70);
      expect(result70).toBe(true);
      
      // 65% should trigger
      const result65 = calculator.shouldTriggerAIFallback(65);
      expect(result65).toBe(true);
    });

    it('should NOT trigger AI fallback at HIGH confidence >= 80', () => {
      const calculator = new ConfidenceCalculator();
      
      const result = calculator.shouldTriggerAIFallback(85);
      
      expect(result).toBe(false);
    });
  });
});