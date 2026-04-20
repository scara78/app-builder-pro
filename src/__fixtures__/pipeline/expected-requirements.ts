/**
 * Expected BackendRequirements objects for assertions
 * CHANGE 4 - Backend Pipeline Integration
 */

import type { BackendRequirements } from '../../services/analyzer/types';

/**
 * Expected requirements fixtures for pipeline integration tests
 */
export const EXPECTED_REQUIREMENTS: {
  simpleUser: BackendRequirements;
  withAuth: BackendRequirements;
  withStorage: BackendRequirements;
  complex: BackendRequirements;
} = {
  /**
   * Basic user entity, no auth, no storage
   */
  simpleUser: {
    entities: [
      {
        name: 'User',
        typeName: 'User',
        fields: [
          { name: 'id', type: 'string', isOptional: false },
          { name: 'email', type: 'string', isOptional: false },
          { name: 'name', type: 'string', isOptional: false },
        ],
        confidence: 95,
        matchType: 'pattern',
      },
    ],
    hasAuth: false,
    hasStorage: false,
    crudOperations: [],
    overallConfidence: 95,
    analysisMethod: 'pattern',
    analyzedAt: '2024-01-01T00:00:00.000Z',
  },

  /**
   * Entity with auth requirements
   */
  withAuth: {
    entities: [
      {
        name: 'User',
        typeName: 'User',
        fields: [
          { name: 'id', type: 'string', isOptional: false },
          { name: 'email', type: 'string', isOptional: false },
          { name: 'password', type: 'string', isOptional: false },
        ],
        confidence: 90,
        matchType: 'pattern',
      },
    ],
    hasAuth: true,
    authRequirements: [
      {
        type: 'login',
        triggerPattern: 'handleSubmit',
        userFields: ['email', 'password'],
        confidence: 95,
      },
    ],
    hasStorage: false,
    crudOperations: [],
    overallConfidence: 92,
    analysisMethod: 'pattern',
    analyzedAt: '2024-01-01T00:00:00.000Z',
  },

  /**
   * Entity with storage requirements
   */
  withStorage: {
    entities: [],
    hasAuth: false,
    hasStorage: true,
    storageRequirements: [
      {
        contentType: 'image',
        maxSizeMB: 10,
        bucketName: 'images',
        triggerPattern: 'input[type="file"]',
        confidence: 90,
      },
    ],
    crudOperations: [],
    overallConfidence: 90,
    analysisMethod: 'pattern',
    analyzedAt: '2024-01-01T00:00:00.000Z',
  },

  /**
   * Multiple entities with relations
   */
  complex: {
    entities: [
      {
        name: 'User',
        typeName: 'User',
        fields: [
          { name: 'id', type: 'string', isOptional: false },
          { name: 'email', type: 'string', isOptional: false },
          { name: 'name', type: 'string', isOptional: false },
          { name: 'avatar', type: 'string', isOptional: true },
        ],
        confidence: 95,
        matchType: 'pattern',
      },
      {
        name: 'Post',
        typeName: 'Post',
        fields: [
          { name: 'id', type: 'string', isOptional: false },
          { name: 'title', type: 'string', isOptional: false },
          { name: 'content', type: 'string', isOptional: false },
          { name: 'authorId', type: 'string', isOptional: false },
          { name: 'createdAt', type: 'string', isOptional: false },
        ],
        confidence: 95,
        matchType: 'pattern',
      },
      {
        name: 'Comment',
        typeName: 'Comment',
        fields: [
          { name: 'id', type: 'string', isOptional: false },
          { name: 'content', type: 'string', isOptional: false },
          { name: 'postId', type: 'string', isOptional: false },
          { name: 'authorId', type: 'string', isOptional: false },
          { name: 'createdAt', type: 'string', isOptional: false },
        ],
        confidence: 95,
        matchType: 'pattern',
      },
    ],
    hasAuth: false,
    hasStorage: false,
    crudOperations: [
      { entity: 'Post', operation: 'create', triggerPattern: 'createPost', confidence: 90 },
      { entity: 'Post', operation: 'read', triggerPattern: 'fetchPosts', confidence: 90 },
      { entity: 'Post', operation: 'delete', triggerPattern: 'deletePost', confidence: 90 },
      { entity: 'Comment', operation: 'create', triggerPattern: 'addComment', confidence: 90 },
    ],
    overallConfidence: 93,
    analysisMethod: 'pattern',
    analyzedAt: '2024-01-01T00:00:00.000Z',
  },
};

export default EXPECTED_REQUIREMENTS;
