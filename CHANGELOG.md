# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - Backend Creation Pipeline Integration (CHANGE 4)

#### Phase 1: useBackendCreation Hook
- Main orchestration hook for backend creation pipeline
- 4-stage pipeline: analyze → generate → createProject → applyMigration
- Progress tracking with percentage updates
- State management for stage, progress, error, and result

#### Phase 2: useSupabaseOAuth Hook
- OAuth authentication hook for Supabase integration
- Token lifecycle management (storage, retrieval, expiration)
- JWT decoding for token validation
- 30-second expiration buffer for clock skew handling

#### Phase 3: Hook Tests
- Comprehensive unit tests for useBackendCreation
- Comprehensive unit tests for useSupabaseOAuth
- Mock implementations for services
- Test coverage > 96% for statements

#### Phase 4: UI Components
- BackendCreationModal: Real-time progress display
- CredentialsModal: Credential display with copy functionality
- Visual stage indicators with icons
- Error state with retry button
- Success state with setup instructions

#### Phase 5: TopBar Integration
- Connect UI components to builder interface
- "Create Backend" button in TopBar
- Modal state management
- OAuth flow integration

#### Phase 6: Integration Tests
- End-to-end pipeline tests
- Error handling tests
- Abort functionality tests
- OAuth flow tests
- Coverage: 96.97% statements, 81.45% branches, 80.86% functions

#### Phase 7: Documentation
- JSDoc comments for all public APIs
- Feature documentation (README.md)
- Pipeline flow diagram
- Usage examples and API reference
- Error handling guide

### Features

#### Abort Functionality
- Cancel in-progress pipeline execution
- AbortController-based cancellation
- Graceful cleanup on abort
- User-facing cancel button

#### Error Recovery
- Detailed error messages per stage
- Retry from error state
- Reset to initial state
- Error logging for debugging

#### Security
- Token stored in sessionStorage (cleared on close)
- JWT expiration validation
- Row Level Security enabled by default
- State parameter in OAuth flow

## [0.1.0] - 2026-04-15

### Added
- Initial project structure
- Basic React 19 setup with TypeScript
- Vite configuration
- ESLint and Prettier setup
- Vitest test framework
- TDD workflow documentation
