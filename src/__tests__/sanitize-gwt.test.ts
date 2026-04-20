/**
 * BDD GWT Format Example - sanitize.test.ts migrated
 *
 * This file demonstrates the migration from standard vitest to GWT format.
 * See original at: sanitize.test.ts
 */
import { describe, it, expect } from 'vitest';
import { sanitizeInput } from '../utils/sanitize';

describe('Input Sanitization (GWT Format)', () => {
  /**
   * Feature: XSS Prevention
   * As a user
   * I want malicious input to be sanitized
   * So that my application is protected from XSS attacks
   */

  // ============ Scenario: XSS script tags are removed ============
  it('removes script tags from malicious input', () => {
    // GIVEN: A malicious input containing script tags
    const maliciousInput = '<script>alert("XSS")</script>Hello';

    // WHEN: The input is sanitized
    const sanitized = sanitizeInput(maliciousInput);

    // THEN: Script tags should be removed
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('</script>');
    // But safe content should remain
    expect(sanitized).toContain('Hello');
  });

  // ============ Scenario: HTML entities are escaped ============
  it('removes dangerous HTML event handlers', () => {
    // GIVEN: An img tag with onerror handler
    const maliciousInput = '<img src=x onerror=alert(1)>';

    // WHEN: The input is sanitized
    const sanitized = sanitizeInput(maliciousInput);

    // THEN: Event handlers should be removed
    expect(sanitized).not.toContain('onerror');
    expect(sanitized).not.toContain('<img>');
  });

  // ============ Scenario: Safe text passes through unchanged ============
  it('allows normal text without modification', () => {
    // GIVEN: Normal user input
    const normalInput = 'Create a hello world app with React';

    // WHEN: The input is sanitized
    const sanitized = sanitizeInput(normalInput);

    // THEN: The input should be unchanged
    expect(sanitized).toBe(normalInput);
  });

  // ============ Scenario: Excessively long input is truncated ============
  it('truncates input exceeding maximum length', () => {
    // GIVEN: An input exceeding 10000 characters
    const longInput = 'A'.repeat(50000);

    // WHEN: The input is sanitized
    const sanitized = sanitizeInput(longInput);

    // THEN: The result should be truncated to max length
    expect(sanitized.length).toBeLessThanOrEqual(10000);
  });
});
