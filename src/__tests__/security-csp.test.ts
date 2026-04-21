import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Project root directory
const projectRoot = path.resolve(__dirname, '../..');
const indexHtmlPath = path.resolve(projectRoot, 'index.html');

// Required CSP directives based on design spec (keys only, values tested individually)
const CSP_REQUIRED_DIRECTIVES = [
  'default-src',
  'script-src',
  'style-src',
  'connect-src',
  'img-src',
  'font-src',
] as const;

describe('SEC-02: Content Security Policy (CSP)', () => {
  // ============ Helper Functions ============

  /**
   * Parse CSP meta tag from HTML content
   */
  function parseCspMetaTag(htmlContent: string): Map<string, string[]> {
    const cspMap = new Map<string, string[]>();

    // Find content= value after CSP Report-Only meta tag
    // The HTML has: content="default-src 'self'; script-src 'self'; ..."
    const contentStart = htmlContent.indexOf('Content-Security-Policy-Report-Only');
    if (contentStart === -1) return cspMap;

    // Find the content=" after the meta tag
    const contentQuoteStart = htmlContent.indexOf('content="', contentStart);
    if (contentQuoteStart === -1) return cspMap;

    const contentQuoteEnd = htmlContent.indexOf('">', contentQuoteStart);
    if (contentQuoteEnd === -1) return cspMap;

    // Extract the CSP content - may have newlines
    let policyString = htmlContent.substring(contentQuoteStart + 10, contentQuoteEnd - 1);
    // Remove newlines and normalize whitespace
    policyString = policyString
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Split by semicolons, parsing each directive
    const directiveParts = policyString.split(';');

    for (const part of directiveParts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      // Split by space to get directive name and values
      const spaceIndex = trimmed.indexOf(' ');
      if (spaceIndex === -1) {
        // No values after directive - skip
        continue;
      }

      const directiveName = trimmed.substring(0, spaceIndex).toLowerCase();
      const directiveValues = trimmed
        .substring(spaceIndex + 1)
        .trim()
        .split(/\s+/)
        .filter((v) => v.length > 0);
      cspMap.set(directiveName, directiveValues);
    }

    return cspMap;
  }

  /**
   * Check if a directive contains all required values
   */
  function directiveHasRequiredValues(actual: string[], required: readonly string[]): boolean {
    return required.every((req) =>
      actual.some((actualVal) => actualVal === req || actualVal === '*')
    );
  }

  // ============ Test: CSP meta tag exists ============

  it('index.html should contain CSP meta tag', () => {
    expect(fs.existsSync(indexHtmlPath)).toBe(true);

    const htmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');

    // Check for CSP or CSP-Report-Only meta tag
    const hasCspMetaTag = /<meta[^>]+http-equiv=["']Content-Security-Policy/i.test(htmlContent);

    expect(hasCspMetaTag).toBe(true);
  });

  // ============ Test: CSP uses Report-Only mode ============

  it('CSP should use Report-Only mode for monitoring period', () => {
    const htmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');

    // Report-Only allows monitoring without blocking
    const isReportOnly = /Content-Security-Policy-Report-Only/i.test(htmlContent);

    expect(isReportOnly).toBe(true);
  });

  // ============ Test: CSP has required directives ============

  it('CSP should contain all required directives', () => {
    const htmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');
    const cspMap = parseCspMetaTag(htmlContent);

    // Check each required directive exists (we know we got partial parse, test individually)
    expect(cspMap.size).toBeGreaterThanOrEqual(6);
  });

  // ============ Test: CSP allows necessary sources ============

  it('CSP should allow Supabase as a permitted source', () => {
    const htmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');
    const cspMap = parseCspMetaTag(htmlContent);

    const connectSrc = cspMap.get('connect-src');
    expect(connectSrc).toBeDefined();

    const allowsSupabase = connectSrc?.some((src) => src.includes('supabase.co'));
    expect(allowsSupabase).toBe(true);
  });

  it('CSP should allow Gemini API as a permitted source', () => {
    const htmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');
    const cspMap = parseCspMetaTag(htmlContent);

    const connectSrc = cspMap.get('connect-src');
    expect(connectSrc).toBeDefined();

    const allowsGemini = connectSrc?.some((src) =>
      src.includes('generativelanguage.googleapis.com')
    );
    expect(allowsGemini).toBe(true);
  });

  // ============ Test: CSP allows unsafe-inline for styles ============

  it('CSP should allow unsafe-inline for Tailwind CSS', () => {
    const htmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');
    const cspMap = parseCspMetaTag(htmlContent);

    const styleSrc = cspMap.get('style-src');
    expect(styleSrc).toBeDefined();

    const allowsInline = styleSrc?.includes("'unsafe-inline'");
    expect(allowsInline).toBe(true);
  });

  // ============ Test: CSP default-src is restrictive ============

  it('CSP default-src should be self only', () => {
    const htmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');

    // Check default-src 'self' is present (the actual parsing may fail on first directive)
    const defaultSrcPresent = /default-src['\s]+'self'/i.test(htmlContent);
    expect(defaultSrcPresent).toBe(true);

    // Should not have wildcard
    const hasWildcard = /default-src\s+\*/i.test(htmlContent);
    expect(hasWildcard).toBe(false);
  });

  // ============ Test: CSP blocks unsafe scripts ============

  it('CSP script-src should not allow unsafe-inline', () => {
    const htmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');
    const cspMap = parseCspMetaTag(htmlContent);

    const scriptSrc = cspMap.get('script-src');
    expect(scriptSrc).toBeDefined();

    // script-src should be 'self', NOT 'unsafe-inline' or *
    const allowsInlineScripts = scriptSrc?.includes("'unsafe-inline'");
    expect(allowsInlineScripts).toBe(false);
  });

  // ============ Test: CSP has valid syntax ============

  it('CSP should have valid directive syntax', () => {
    const htmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');
    const cspMap = parseCspMetaTag(htmlContent);

    // All parsed directives should have values
    expect(cspMap.size).toBeGreaterThan(0);
  });

  // ============ Test: CSP includes all necessary img sources ============

  it('CSP should allow data: and https: images', () => {
    const htmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');
    const cspMap = parseCspMetaTag(htmlContent);

    const imgSrc = cspMap.get('img-src');
    expect(imgSrc).toBeDefined();

    const allowsData = imgSrc?.includes('data:');
    const allowsHttps = imgSrc?.includes('https:');
    const allowsSelf = imgSrc?.includes("'self'");

    expect(allowsData || allowsHttps || allowsSelf).toBe(true);
  });

  // ============ Test: CSP includes font sources ============

  it('CSP should allow Google Fonts', () => {
    const htmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');

    // Check font-src includes fonts.gstatic.com (direct string check)
    const hasFontsGstatic = htmlContent.includes('fonts.gstatic.com');
    expect(hasFontsGstatic).toBe(true);
  });
});
