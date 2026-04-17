# Proposal: E2E Integration Test

## Intent

Validate that CHANGE 1 (MCPClient) + CHANGE 2 (BackendRequirementsAnalyzer) + CHANGE 3 (SQLGenerator) work together end-to-end before declaring the pipeline production-ready. Each change is tested in isolation with mocks—integration bugs (naming mismatches, format differences, type incompatibilities) are undetected until a real E2E flow runs.

## Scope

### In Scope
- Integration test file(s) in `src/__tests__/e2e/`
- 3-5 realistic React component examples as test data
- End-to-end flow: React code → BackendRequirements → SQL → MigrationResult
- Validation of SQL syntax (PostgreSQL parser, not execution)
- Coverage of all integration points between components

### Out of Scope
- Real Supabase execution (requires credentials, use mock)
- Performance benchmarking
- Edge case stress testing (>10 entities, >50 fields)

## Capabilities

### New Capabilities
- `e2e-integration-test`: Integration tests validating the full pipeline
- `test-fixtures`: Realistic React component examples with known expected outputs

### Modified Capabilities
- None

## Approach

**Hybrid Approach (Option C)** — validates flow correctness + SQL syntax without real DB:

1. **Real Components**: Use actual `BackendRequirementsAnalyzer` + `SQLGenerator` (no mocks)
2. **Mock MCPClient**: Already tested in CHANGE 1, mock for speed
3. **SQL Validation**: Use PostgreSQL parser (e.g., pg-query-parser or simple syntax validation) to verify SQL is valid
4. **Test Data**: 3-5 realistic React components covering:
   - Simple entity (User with name, email)
   - Multiple entities with relationships (Post with author User)
   - Entity with storage (Profile with avatar upload)
   - Entity with auth (Login, register flow)
   - Empty/minimal code edge case

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/__tests__/e2e/pipeline.test.ts` | New | Main E2E integration tests |
| `src/__tests__/e2e/fixtures/` | New | Test data (React components) |
| `src/__tests__/e2e/sql-validator.ts` | New | SQL syntax validation utility |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Test data not representative | Medium | Use real patterns from existing test suites |
| SQL validation false positives | Low | Simple regex validation sufficient for basic syntax |
| Mock behavior diverges from real | Low | MCPClient already has 59 tests; mock mirrors that interface |
| Integration point missed | Medium | Map all 3 interfaces explicitly in test |

## Rollback Plan

- Delete `src/__tests__/e2e/` directory
- No database migrations to rollback (using mocks)
- No configuration changes made

## Dependencies

- CHANGE 1 (supabase-mcp-integration): MCPClient interface
- CHANGE 2 (backend-requirements-analyzer): BackendRequirementsAnalyzer
- CHANGE 3 (sql-schema-generator): SQLGenerator, MigrationResult

## Success Criteria

- [ ] 3-5 E2E test scenarios passing (happy path + edge cases)
- [ ] SQL syntax validation for all outputs (no syntax errors)
- [ ] Integration points validated (analyzer output format → SQLGenerator input format)
- [ ] Documentation of any bugs found during testing
- [ ] Test suite runs in <5 seconds (no real API calls)