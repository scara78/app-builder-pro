# Specification: storage-bucket-generator

## Purpose

Generates SQL statements for Supabase storage bucket configuration from StorageRequirement array.

## Requirements

### Bucket Creation

| ID | Requirement | Priority |
|-----|-------------|----------|
| SBG-001 | The generator MUST output INSERT statements for `storage.buckets` table | MUST |
| SBG-002 | Each bucket MUST have unique `id` (bucket name slug) | MUST |
| SBG-003 | Each bucket MUST have `name` matching the requirement name | MUST |
| SBG-004 | Each bucket MUST have `public` visibility flag set appropriately | MUST |
| SBG-005 | Bucket IDs MUST be URL-safe slugs (lowercase, hyphens for spaces) | MUST |

### File Size and Limits

| ID | Requirement | Priority |
|-----|-------------|----------|
| SBG-006 | The generator MUST set file size limits per bucket | MUST |
| SBG-007 | Default max file size SHOULD be 50MB unless specified | SHOULD |
| SBG-008 | The generator MUST define allowed file extensions if specified | MAY |

### Storage.objects

| ID | Requirement | Priority |
|-----|-------------|----------|
| SBG-009 | The generator MUST create storage object entries via policy or initial data | MUST |
| SBG-010 | The generator SHOULD set up proper storage policies for access | SHOULD |

### Idempotency

| ID | Requirement | Priority |
|-----|-------------|----------|
| SBG-011 | Bucket insert MUST use `ON CONFLICT DO NOTHING` | MUST |
| SBG-012 | The generator MUST handle duplicate bucket names gracefully | MUST |

### Input Processing

| ID | Requirement | Priority |
|-----|-------------|----------|
| SBG-013 | The generator MUST accept an array of StorageRequirement objects | MUST |
| SBG-014 | Each requirement MUST have at least a `name` property | MUST |
| SBG-015 | The generator SHOULD handle optional `maxSizeBytes` property | SHOULD |

### Output Format

| ID | Requirement | Priority |
|-----|-------------|----------|
| SBG-016 | The generator MUST return a string with all bucket SQL statements | MUST |
| SBG-017 | Statements MUST be separated by semicolons and newlines | MUST |

## Scenarios

### Happy Path Scenarios

| ID | Scenario | Given | When | Then |
|-----|----------|-------|------|------|
| SBG-H001 | Single bucket creation | StorageRequirement with name "avatars" | Generate is called | Returns INSERT INTO storage.buckets for avatars |
| SBG-H002 | Multiple buckets | StorageRequirement array with 3 buckets | Generate is called | Returns 3 INSERT statements |
| SBG-H003 | Public bucket | Requirement with public: true | Generate is called | Bucket marked public: true |
| SBG-H004 | Private bucket | Requirement with public: false (or not specified) | Generate is called | Bucket marked public: false |
| SBG-H005 | Idempotent execution | Generated SQL executed twice | Second execution runs | No errors (ON CONFLICT DO NOTHING) |

### Edge Case Scenarios

| ID | Scenario | Given | When | Then |
|-----|----------|-------|------|------|
| SBG-E001 | Bucket name with spaces | Requirement name "User Images" | Generate is called | Converts to "user-images" slug |
| SBG-E002 | Bucket name with uppercase | Requirement name "MyFiles" | Generate is called | Converts to lowercase "myfiles" |
| SBG-E003 | Empty bucket array | StorageRequirement array is empty | Generate is called | Returns empty SQL string |
| SBG-E004 | Custom max file size | Requirement has maxSizeBytes: 10485760 (10MB) | Generate is called | Sets bucket file_size_limit to 10485760 |

### Error State Scenarios

| ID | Scenario | Given | When | Then |
|-----|----------|-------|------|------|
| SBG-ERR001 | Duplicate bucket names | Two requirements with same name | Generate is called | Uses ON CONFLICT DO NOTHING to handle |
| SBG-ERR002 | Invalid bucket name | Bucket name with special chars like " bucket! " | Generate is called | Sanitizes and logs warning |

## Acceptance Criteria

- [ ] Input: 1 StorageRequirement → 1 INSERT INTO storage.buckets
- [ ] Input: 3 StorageRequirements → 3 INSERT statements
- [ ] Bucket names → Lowercase slug format (e.g., "user-images")
- [ ] Execution twice → No errors (idempotent)
- [ ] Public flag → Set correctly per requirement
- [ ] Custom file size → Respected in bucket config