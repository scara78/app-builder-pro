import { describe, it, expect } from 'vitest';
import { sanitizeInput } from '../utils/sanitize';

describe('SEC-03: Input Sanitization', () => {
  // ============ RED - Test: XSS attempt should be sanitized ============
  it('should sanitize XSS attack attempts (<script>)', () => {
    const maliciousInput = '<script>alert("XSS")</script>Hello';
    const sanitized = sanitizeInput(maliciousInput);

    // Script tags should be removed
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('</script>');
    // But safe content should remain
    expect(sanitized).toContain('Hello');
  });

  // ============ RED - Test: HTML entities should be escaped ============
  it('should escape dangerous HTML entities', () => {
    const maliciousInput = '<img src=x onerror=alert(1)>';
    const sanitized = sanitizeInput(maliciousInput);

    // onerror handlers should be removed
    expect(sanitized).not.toContain('onerror');
    expect(sanitized).not.toContain('<img');
  });

  // ============ RED - Test: Normal text should pass through ============
  it('should allow normal text without modification', () => {
    const normalInput = 'Create a hello world app with React';
    const sanitized = sanitizeInput(normalInput);

    expect(sanitized).toBe(normalInput);
  });

  // ============ RED - Test: Limit input length ============
  it('should truncate excessively long input', () => {
    const longInput = 'A'.repeat(50000);
    const sanitized = sanitizeInput(longInput);

    // Should be limited to a reasonable max length
    expect(sanitized.length).toBeLessThanOrEqual(10000);
  });

  // ============ TRIANGULATION - Test: JavaScript handlers ============
  it('should remove javascript: URIs', () => {
    const maliciousInput = '<a href="javascript:alert(1)">Click</a>';
    const sanitized = sanitizeInput(maliciousInput);

    expect(sanitized).not.toContain('javascript:');
  });
});
