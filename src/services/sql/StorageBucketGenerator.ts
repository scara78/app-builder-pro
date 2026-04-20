/**
 * StorageBucketGenerator Module
 *
 * Generates SQL statements for Supabase storage bucket configuration.
 * Handles bucket creation with slug sanitization and idempotency.
 */

import type { StorageRequirement } from '../analyzer/types';

/**
 * Default file size limit in bytes (50MB).
 * As per spec SBG-007/SHOULD.
 */
const DEFAULT_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

/**
 * Generate a URL-safe slug from a bucket name.
 *
 * Sanitization rules (per spec SBG-005/MUST):
 * - Convert to lowercase
 * - Replace spaces with hyphens
 * - Remove special characters
 * - Handle names starting with numbers
 *
 * @param name - The original bucket name
 * @returns Sanitized slug
 *
 * @example
 * sanitizeSlug('User Images') // returns 'user-images'
 * sanitizeSlug('MyFiles')    // returns 'myfiles'
 * sanitizeSlug('123 avatars') // returns '_123-avatars'
 */
export function sanitizeSlug(name: string): string {
  // Convert to lowercase
  let slug = name.toLowerCase();

  // Replace multiple spaces with single hyphen
  slug = slug.replace(/\s+/g, '-');

  // Remove special characters (only allow alphanumeric and hyphens)
  slug = slug.replace(/[^a-z0-9-]/g, '');

  // Replace multiple hyphens with single hyphen
  slug = slug.replace(/-+/g, '-');

  // Remove leading hyphens
  slug = slug.replace(/^-+/, '');

  // Remove trailing hyphens
  slug = slug.replace(/-+$/, '');

  // If starts with a number, prepend underscore
  if (/^[0-9]/.test(slug)) {
    slug = '_' + slug;
  }

  return slug || 'bucket';
}

/**
 * Generate file size limit in bytes.
 *
 * @param maxSizeMB - Max size in MB (optional)
 * @returns Size in bytes
 *
 * @example
 * getFileSizeLimit(10)  // returns 10485760
 * getFileSizeLimit()    // returns 52428800 (default 50MB)
 */
function getFileSizeLimit(maxSizeMB?: number): number {
  if (maxSizeMB !== undefined && maxSizeMB > 0) {
    return maxSizeMB * 1024 * 1024;
  }
  return DEFAULT_FILE_SIZE_BYTES;
}

/**
 * Determine if a bucket should be public based on content type.
 *
 * Public buckets: image, document (for public downloads)
 * Private buckets: video, audio, any (sensitive content)
 *
 * @param contentType - The storage content type
 * @returns Whether the bucket should be public
 */
function isPublicBucket(contentType: string): boolean {
  // SBG-004/MUST: Set public visibility appropriately
  return contentType === 'image' || contentType === 'document';
}

/**
 * Generate a single storage bucket INSERT statement.
 *
 * @param req - The storage requirement
 * @returns SQL INSERT statement
 */
function generateBucketInsert(req: StorageRequirement): string {
  const slug = sanitizeSlug(req.bucketName || req.contentType);
  const isPublic = isPublicBucket(req.contentType);
  const fileSizeLimit = getFileSizeLimit(req.maxSizeMB);

  // SBG-001/MUST: Output INSERT for storage.buckets
  // SBG-002/MUST: Each bucket has unique id
  // SBG-003/MUST: Each bucket has name
  // SBG-004/MUST: public visibility flag
  // SBG-006/MUST: file size limits
  // SBG-011/MUST: ON CONFLICT DO NOTHING for idempotency

  return `INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('${slug}', '${slug}', ${isPublic}, ${fileSizeLimit})
ON CONFLICT DO NOTHING;`;
}

/**
 * Generate storage bucket SQL from requirements.
 *
 * Converts StorageRequirement array into PostgreSQL INSERT statements
 * for the Supabase storage.buckets table.
 *
 * @param requirements - Array of storage requirements
 * @returns SQL string with bucket INSERT statements
 *
 * @example
 * const requirements = [{ contentType: 'image', bucketName: 'avatars' }];
 * const sql = generateBuckets(requirements);
 * // Returns:
 * // INSERT INTO storage.buckets (id, name, public, file_size_limit)
 * // VALUES ('avatars', 'avatars', true, 52428800)
 * // ON CONFLICT DO NOTHING;
 */
export function generateBuckets(requirements: StorageRequirement[]): string {
  // SBG-E003: Handle empty array
  if (!requirements || requirements.length === 0) {
    return '';
  }

  // SBG-013/MUST: Accept array of StorageRequirement
  // SBG-014/MUST: Each requirement has name property

  const inserts: string[] = [];

  // Track seen slugs to handle duplicates
  const seenSlugs = new Set<string>();

  for (const req of requirements) {
    const bucketName = req.bucketName || req.contentType;
    const slug = sanitizeSlug(bucketName);

    // SBG-012/MUST: Handle duplicate bucket names gracefully
    if (seenSlugs.has(slug)) {
      continue;
    }
    seenSlugs.add(slug);

    inserts.push(generateBucketInsert(req));
  }

  // SBG-016/MUST: Return string with all statements
  // SBG-017/MUST: Statements separated by newlines
  return inserts.join('\n');
}
