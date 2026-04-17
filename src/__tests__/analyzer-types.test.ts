import { describe, it, expect } from 'vitest';

// Import types to test - this will fail until we create the types file
import type {
  BackendRequirements,
  Entity,
  EntityField,
  CRUDSOperation,
  AuthRequirement,
  StorageRequirement,
  DetectionResult
} from '../services/analyzer/types';

describe('Phase 1: Types and Interfaces', () => {
  describe('1.1 BackendRequirements interface', () => {
    it('should have all required properties', () => {
      const req: BackendRequirements = {
        entities: [],
        hasAuth: false,
        hasStorage: false,
        crudOperations: [],
        overallConfidence: 0,
        analysisMethod: 'pattern',
        analyzedAt: new Date().toISOString()
      };
      
      expect(req.entities).toBeDefined();
      expect(req.hasAuth).toBeDefined();
      expect(req.hasStorage).toBeDefined();
      expect(req.crudOperations).toBeDefined();
      expect(req.overallConfidence).toBeDefined();
      expect(req.analysisMethod).toBeDefined();
      expect(req.analyzedAt).toBeDefined();
    });
    
    it('should allow optional authRequirements', () => {
      const req: BackendRequirements = {
        entities: [],
        hasAuth: true,
        authRequirements: [],
        hasStorage: false,
        crudOperations: [],
        overallConfidence: 85,
        analysisMethod: 'pattern',
        analyzedAt: new Date().toISOString()
      };
      
      expect(req.authRequirements).toBeDefined();
    });
    
    it('should allow optional storageRequirements', () => {
      const req: BackendRequirements = {
        entities: [],
        hasAuth: false,
        hasStorage: true,
        storageRequirements: [],
        crudOperations: [],
        overallConfidence: 80,
        analysisMethod: 'pattern',
        analyzedAt: new Date().toISOString()
      };
      
      expect(req.storageRequirements).toBeDefined();
    });
  });
  
  describe('1.3 Entity type', () => {
    it('should have name, fields, and confidence', () => {
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
      
      expect(entity.name).toBe('User');
      expect(entity.fields).toHaveLength(2);
      expect(entity.confidence).toBe(90);
      expect(entity.matchType).toBe('pattern');
    });
    
    it('should allow ai matchType', () => {
      const entity: Entity = {
        name: 'Product',
        typeName: 'Product',
        fields: [],
        confidence: 75,
        matchType: 'ai'
      };
      
      expect(entity.matchType).toBe('ai');
    });
  });
  
  describe('1.5 CRUDOperation type', () => {
    it('should have entity, operation, and confidence', () => {
      const operation: CRUDSOperation = {
        entity: 'User',
        operation: 'create',
        triggerPattern: '<form onSubmit={handleCreate}',
        confidence: 85
      };
      
      expect(operation.entity).toBe('User');
      expect(operation.operation).toBe('create');
      expect(operation.confidence).toBe(85);
    });
    
    it('should allow all operation types', () => {
      const operations: CRUDSOperation[] = [
        { entity: 'User', operation: 'create', triggerPattern: '', confidence: 80 },
        { entity: 'User', operation: 'read', triggerPattern: '', confidence: 80 },
        { entity: 'User', operation: 'update', triggerPattern: '', confidence: 80 },
        { entity: 'User', operation: 'delete', triggerPattern: '', confidence: 80 }
      ];
      
      expect(operations[0].operation).toBe('create');
      expect(operations[1].operation).toBe('read');
      expect(operations[2].operation).toBe('update');
      expect(operations[3].operation).toBe('delete');
    });
  });
  
  describe('1.7 AuthRequirement type', () => {
    it('should have type, triggerPattern, and confidence', () => {
      const auth: AuthRequirement = {
        type: 'login',
        triggerPattern: '<Login onSubmit={handleLogin} />',
        confidence: 90
      };
      
      expect(auth.type).toBe('login');
      expect(auth.triggerPattern).toBeDefined();
      expect(auth.confidence).toBe(90);
    });
    
    it('should allow all auth types', () => {
      const authTypes: AuthRequirement['type'][] = ['login', 'register', 'profile', 'logout', 'password-reset'];
      
      authTypes.forEach(type => {
        const auth: AuthRequirement = {
          type,
          triggerPattern: '',
          confidence: 80
        };
        expect(auth.type).toBe(type);
      });
    });
    
    it('should allow optional userFields', () => {
      const auth: AuthRequirement = {
        type: 'register',
        triggerPattern: '',
        userFields: ['name', 'email', 'password'],
        confidence: 85
      };
      
      expect(auth.userFields).toBeDefined();
      expect(auth.userFields).toHaveLength(3);
    });
  });
  
  describe('1.7 StorageRequirement type', () => {
    it('should have contentType, triggerPattern, and confidence', () => {
      const storage: StorageRequirement = {
        contentType: 'image',
        triggerPattern: '<input type="file" accept="image/*" />',
        confidence: 85
      };
      
      expect(storage.contentType).toBe('image');
      expect(storage.triggerPattern).toBeDefined();
      expect(storage.confidence).toBe(85);
    });
    
    it('should allow all content types', () => {
      const contentTypes: StorageRequirement['contentType'][] = ['image', 'document', 'video', 'audio', 'any'];
      
      contentTypes.forEach((contentType) => {
        const storage: StorageRequirement = {
          contentType,
          triggerPattern: '',
          confidence: 80
        };
        expect(storage.contentType).toBe(contentType);
      });
    });
    
    it('should allow optional maxSizeMB and bucketName', () => {
      const storage: StorageRequirement = {
        contentType: 'document',
        maxSizeMB: 10,
        bucketName: 'documents',
        triggerPattern: '',
        confidence: 80
      };
      
      expect(storage.maxSizeMB).toBe(10);
      expect(storage.bucketName).toBe('documents');
    });
  });
  
  describe('1.9 DetectionResult type', () => {
    it('should include all detection metadata', () => {
      const result: DetectionResult = {
        sourceHash: 'abc123',
        detected: true,
        requirements: {
          entities: [],
          hasAuth: false,
          hasStorage: false,
          crudOperations: [],
          overallConfidence: 0,
          analysisMethod: 'pattern',
          analyzedAt: ''
        },
        cachedAt: new Date().toISOString()
      };
      
      expect(result.sourceHash).toBeDefined();
      expect(result.detected).toBeDefined();
      expect(result.requirements).toBeDefined();
      expect(result.cachedAt).toBeDefined();
    });
  });
});