import { describe, it, expect } from 'vitest';
import { sanitizeInput } from '../utils/sanitize';

describe('SEC-03: Sanitization Integration - Input Points', () => {
  // Test directo de la utilidad que se usa en los componentes

  // ============ RED - ChatPanel input: XSS script tag ============
  it('sanitizes chat input like ChatPanel would', () => {
    const userInput = '<script>alert("XSS")</script>Hello World';
    const result = sanitizeInput(userInput);

    // No debe contener script tags
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('</script>');
    // Debe contener texto seguro
    expect(result).toContain('Hello World');
  });

  // ============ TRIANGULATE - ChatPanel input: event handlers ============
  it('sanitizes event handlers in chat input', () => {
    const userInput = '<img src=x onerror=alert(1)> test <div onclick=bad()>click</div>';
    const result = sanitizeInput(userInput);

    // Sin handlers maliciosos
    expect(result).not.toContain('onerror');
    expect(result).not.toContain('onclick');
    expect(result).not.toContain('<img');
    // Texto seguro intacto
    expect(result).toContain('test');
  });

  // ============ TRIANGULATE - SettingsModal API key edge case ============
  it('handles potential XSS in sensitive fields', () => {
    // API keys podrían tener caracteres especiales maliciosos accidentalmente
    const apiKey = 'AIzaSy<xss>evil</script>abc123';
    const result = sanitizeInput(apiKey);

    // Debe neutralizar cualquier XSS - script tag debe haber sido eliminado
    expect(result).not.toContain('<xss>');
    expect(result).not.toContain('</script>');
    // Texto seguro debe permanecer
    expect(result).toContain('AIzaSy');
  });

  // ============ RED - LandingPage prompt input ============
  it('sanitizes landing page prompt input', () => {
    const prompt = '<script>document.location="evil.com"</script>Build me an app';
    const result = sanitizeInput(prompt);

    expect(result).not.toContain('<script>');
    expect(result).toContain('Build me an app');
  });
});
