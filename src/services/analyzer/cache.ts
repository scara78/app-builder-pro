/**
 * Analysis Cache for Backend Requirements Analyzer
 * CHANGE 2 - Phase 5: Cache Layer
 */

import { createHash } from 'crypto';
import type { DetectionResult } from './types';

/**
 * Cache entry with metadata
 */
interface CacheEntry {
  key: string;
  result: DetectionResult;
  createdAt: number;
  ttl: number;
}

/**
 * In-memory cache for analysis results with TTL support
 */
export class AnalysisCache {
  private cache: Map<string, CacheEntry> = new Map();
  private defaultTTL: number;

  /**
   * Create a new analysis cache
   * @param defaultTTL - Time-to-live in milliseconds (default: 5 minutes = 300000ms)
   */
  /**
   * Create a new analysis cache with configurable TTL (time-to-live).
   * @param defaultTTL - Time-to-live in milliseconds (default: 5 minutes = 300000ms)
   * @example
   * ```typescript
   * // Default: 5 minute TTL
   * const cache = new AnalysisCache();
   *
   * // Custom: 10 minute TTL
   * const cache = new AnalysisCache(600000);
   * ```
   */
  constructor(defaultTTL: number = 300000) {
    this.defaultTTL = defaultTTL;
  }

  /**
   * Generate a SHA256 hash key from code
   */
  /**
   * Generate a SHA256 hash key from code content for cache lookup.
   * Uses crypto module to create deterministic keys.
   * @param code - Source code to hash
   * @returns SHA256 hash as hex string
   * @example
   * ```typescript
   * const cache = new AnalysisCache();
   * const key = cache.generateKey('interface User { id: string; }');
   * ```
   */
  generateKey(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  /**
   * Check if an entry is expired
   */
  isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.createdAt > entry.ttl;
  }

  /**
   * Get cached result for code
   * @returns DetectionResult or null if not found or expired
   */
  /**
   * Get cached analysis result for given code if exists and not expired.
   * Checks SHA256 hash key, validates TTL expiration before returning.
   * @param code - Source code to look up in cache
   * @returns DetectionResult or null if not found or expired
   * @example
   * ```typescript
   * const cache = new AnalysisCache();
   * const result = cache.get('interface User { id: string; }');
   * if (result) { console.log('Cache hit:', result); }
   * ```
   */
  get(code: string): DetectionResult | null {
    const key = this.generateKey(code);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    return entry.result;
  }

  /**
   * Store analysis result in cache
   */
  /**
   * Store analysis result in cache with SHA256 hash key and TTL expiration.
   * @param code - Source code as cache key
   * @param result - DetectionResult to store
   * @example
   * ```typescript
   * const cache = new AnalysisCache();
   * cache.set('interface User { id: string; }', { sourceHash: '...', detected: true, requirements: {...}, cachedAt: '...' });
   * ```
   */
  set(code: string, result: DetectionResult): void {
    const key = this.generateKey(code);
    this.cache.set(key, {
      key,
      result,
      createdAt: Date.now(),
      ttl: this.defaultTTL,
    });
  }

  /**
   * Check if code exists in cache (and is not expired)
   */
  /**
   * Check if code exists in cache and is not expired.
   * Useful for quick cache existence checks without retrieving data.
   * @param code - Source code to check in cache
   * @returns True if code is in cache and not expired
   * @example
   * ```typescript
   * const cache = new AnalysisCache();
   * if (cache.has('interface User { id: string; }')) {
   *   console.log('Cache entry exists');
   * }
   * ```
   */
  has(code: string): boolean {
    const key = this.generateKey(code);
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear all cached entries
   */
  /**
   * Clear all cached entries, removing all analysis results from cache.
   * Useful for testing or when cache needs to be invalidated.
   * @example
   * ```typescript
   * const cache = new AnalysisCache();
   * cache.clear(); // All entries removed
   * ```
   */
  clear(): void {
    this.cache.clear();
  }
}
