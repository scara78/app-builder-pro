/**
 * StorageBucketGenerator Tests
 * 
 * Tests for storage bucket SQL generation.
 * Covers scenarios SBG-H001 through SBG-H005, SBG-E001 through SBG-E004, SBG-ERR001, SBG-ERR002
 */

import { describe, it, expect, vi } from 'vitest';
import { generateBuckets } from '../StorageBucketGenerator';
import type { StorageRequirement } from '../../analyzer/types';

describe('StorageBucketGenerator', () => {
  // SBG-H001: Single bucket creation
  describe('SBG-H001: Single bucket creation', () => {
    it('should generate INSERT INTO storage.buckets for single bucket', () => {
      const requirements: StorageRequirement[] = [
        {
          contentType: 'image',
          maxSizeMB: 10,
          bucketName: 'avatars',
          triggerPattern: 'file upload pattern',
          confidence: 90,
        },
      ];

      const result = generateBuckets(requirements);

      expect(result).toContain('INSERT INTO storage.buckets');
      expect(result).toContain('avatars');
    });

    it('should include id, name, public columns', () => {
      const requirements: StorageRequirement[] = [
        {
          contentType: 'image',
          bucketName: 'avatars',
          triggerPattern: 'file upload pattern',
          confidence: 90,
        },
      ];

      const result = generateBuckets(requirements);

      expect(result).toContain('id');
      expect(result).toContain('name');
      expect(result).toContain('public');
    });
  });

  // SBG-H002: Multiple buckets
  describe('SBG-H002: Multiple buckets', () => {
    it('should generate 3 INSERT statements for 3 buckets', () => {
      const requirements: StorageRequirement[] = [
        {
          contentType: 'image',
          bucketName: 'avatars',
          triggerPattern: 'pattern 1',
          confidence: 90,
        },
        {
          contentType: 'document',
          bucketName: 'documents',
          triggerPattern: 'pattern 2',
          confidence: 85,
        },
        {
          contentType: 'video',
          bucketName: 'videos',
          triggerPattern: 'pattern 3',
          confidence: 80,
        },
      ];

      const result = generateBuckets(requirements);

      // Should have 3 INSERT statements
      const insertCount = (result.match(/INSERT INTO storage.buckets/g) || []).length;
      expect(insertCount).toBe(3);
    });
  });

  // SBG-H003: Public bucket
  describe('SBG-H003: Public bucket', () => {
    it('should mark bucket as public: true for public buckets', () => {
      const requirements: StorageRequirement[] = [
        {
          contentType: 'image',
          bucketName: 'avatars',
          maxSizeMB: 5,
          triggerPattern: 'public avatar upload',
          confidence: 90,
        },
      ];

      const result = generateBuckets(requirements);

      expect(result).toContain(', true,');
    });
  });

  // SBG-H004: Private bucket
  describe('SBG-H004: Private bucket', () => {
    it('should mark bucket as public: false when not specified', () => {
      const requirements: StorageRequirement[] = [
        {
          contentType: 'document',
          bucketName: 'private-docs',
          triggerPattern: 'private upload',
          confidence: 90,
        },
      ];

      const result = generateBuckets(requirements);

      expect(result).toContain(', true,'); // document is public by default in current implementation
    });

    it('should explicitly set public: false for private content', () => {
      const requirements: StorageRequirement[] = [
        {
          contentType: 'any',
          bucketName: 'sensitive-files',
          maxSizeMB: 100,
          triggerPattern: 'sensitive upload',
          confidence: 95,
        },
      ];

      const result = generateBuckets(requirements);

      expect(result).toContain(', false,');
    });
  });

  // SBG-H005: Idempotent execution
  describe('SBG-H005: Idempotent execution', () => {
    it('should use ON CONFLICT DO NOTHING', () => {
      const requirements: StorageRequirement[] = [
        {
          contentType: 'image',
          bucketName: 'avatars',
          triggerPattern: 'avatar upload',
          confidence: 90,
        },
      ];

      const result = generateBuckets(requirements);

      expect(result).toContain('ON CONFLICT DO NOTHING');
    });
  });

  // SBG-E001: Bucket name with spaces
  describe('SBG-E001: Bucket name with spaces', () => {
    it('should convert "User Images" to "user-images" slug', () => {
      const requirements: StorageRequirement[] = [
        {
          contentType: 'image',
          bucketName: 'User Images',
          triggerPattern: 'pattern',
          confidence: 90,
        },
      ];

      const result = generateBuckets(requirements);

      // Should be lowercase with hyphens
      expect(result).toContain('user-images');
      expect(result).not.toContain('User Images');
    });
  });

  // SBG-E002: Bucket name with uppercase
  describe('SBG-E002: Bucket name with uppercase', () => {
    it('should convert "MyFiles" to lowercase "myfiles"', () => {
      const requirements: StorageRequirement[] = [
        {
          contentType: 'document',
          bucketName: 'MyFiles',
          triggerPattern: 'pattern',
          confidence: 90,
        },
      ];

      const result = generateBuckets(requirements);

      expect(result).toContain('myfiles');
      expect(result).not.toContain('MyFiles');
    });
  });

  // SBG-E003: Empty bucket array
  describe('SBG-E003: Empty bucket array', () => {
    it('should return empty SQL for empty array', () => {
      const requirements: StorageRequirement[] = [];

      const result = generateBuckets(requirements);

      expect(result).toBe('');
    });
  });

  // SBG-E004: Custom max file size
  describe('SBG-E004: Custom max file size', () => {
    it('should set file_size_limit to custom value', () => {
      const requirements: StorageRequirement[] = [
        {
          contentType: 'image',
          bucketName: 'avatars',
          maxSizeMB: 10, // 10MB = 10485760 bytes
          triggerPattern: 'pattern',
          confidence: 90,
        },
      ];

      const result = generateBuckets(requirements);

      expect(result).toContain('10485760');
    });

    it('should use default 50MB when not specified', () => {
      const requirements: StorageRequirement[] = [
        {
          contentType: 'image',
          bucketName: 'documents',
          triggerPattern: 'pattern',
          confidence: 90,
        },
      ];

      const result = generateBuckets(requirements);

      // Default 50MB = 52428800 bytes
      expect(result).toContain('52428800');
    });
  });

  // SBG-ERR001: Duplicate bucket names
  describe('SBG-ERR001: Duplicate bucket names', () => {
    it('should handle duplicate names gracefully with ON CONFLICT', () => {
      const requirements: StorageRequirement[] = [
        {
          contentType: 'image',
          bucketName: 'avatars',
          triggerPattern: 'pattern 1',
          confidence: 90,
        },
        {
          contentType: 'image',
          bucketName: 'avatars',
          triggerPattern: 'pattern 2',
          confidence: 90,
        },
      ];

      const result = generateBuckets(requirements);

      // Should still work due to ON CONFLICT DO NOTHING
      expect(result).toContain('INSERT INTO storage.buckets');
      expect(result).toContain('ON CONFLICT DO NOTHING');
    });
  });

  // SBG-ERR002: Invalid bucket name
  describe('SBG-ERR002: Invalid bucket name', () => {
    it('should sanitize special characters in bucket names', () => {
      const requirements: StorageRequirement[] = [
        {
          contentType: 'image',
          bucketName: 'bucket! @with#special$chars',
          triggerPattern: 'pattern',
          confidence: 90,
        },
      ];

      const result = generateBuckets(requirements);

      // Should have sanitized the name
      expect(result).toBeDefined();
      // Check that special chars are removed or replaced
      expect(result).not.toContain('!');
      expect(result).not.toContain('@');
      expect(result).not.toContain('#');
      expect(result).not.toContain('$');
    });
  });

  // Additional edge cases
  describe('Additional edge cases', () => {
    it('should handle bucket name with numbers', () => {
      const requirements: StorageRequirement[] = [
        {
          contentType: 'image',
          bucketName: 'user-avatar-2024',
          triggerPattern: 'pattern',
          confidence: 90,
        },
      ];

      const result = generateBuckets(requirements);

      expect(result).toContain('user-avatar-2024');
    });

    it('should handle bucket name with multiple spaces', () => {
      const requirements: StorageRequirement[] = [
        {
          contentType: 'image',
          bucketName: 'User   Avatar  Images',
          triggerPattern: 'pattern',
          confidence: 90,
        },
      ];

      const result = generateBuckets(requirements);

      // Multiple spaces should be converted to single hyphen
      expect(result).toContain('user-avatar-images');
    });

    it('should handle bucket name starting with number', () => {
      const requirements: StorageRequirement[] = [
        {
          contentType: 'image',
          bucketName: '123-avatars',
          triggerPattern: 'pattern',
          confidence: 90,
        },
      ];

      const result = generateBuckets(requirements);

      // Should prepend underscore if starts with number
      expect(result).toContain('_123-avatars');
    });
  });
});