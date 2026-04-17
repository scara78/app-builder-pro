/**
 * TypeMapping Test Suite
 * 
 * Tests for TypeScript to PostgreSQL type mapping.
 * Following Strict TDD - tests written first.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getPostgresType, typeMap, TS_TYPE, PG_TYPE } from '../TypeMapping';

describe('TypeMapping', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe('getPostgresType', () => {
    // TM-H001: String type mapping
    it('should map string type to TEXT', () => {
      expect(getPostgresType('string')).toBe('TEXT');
    });

    // TM-H002: Number type mapping
    it('should map number type to INTEGER', () => {
      expect(getPostgresType('number')).toBe('INTEGER');
    });

    // TM-H003: Boolean type mapping
    it('should map boolean type to BOOLEAN', () => {
      expect(getPostgresType('boolean')).toBe('BOOLEAN');
    });

    // TM-H004: Date type mapping
    it('should map Date type to TIMESTAMPTZ', () => {
      expect(getPostgresType('Date')).toBe('TIMESTAMPTZ');
    });

    // TM-H005: JSON type mapping
    it('should map json type to JSONB', () => {
      expect(getPostgresType('json')).toBe('JSONB');
    });

    // TM-H006: Nullable field handling
    it('should handle nullable fields', () => {
      expect(getPostgresType('string', true)).toBe('TEXT');
    });

    // TM-E001: Unknown type default
    it('should default unknown types to TEXT and log warning', () => {
      const result = getPostgresType('CustomType');
      expect(result).toBe('TEXT');
      expect(warnSpy).toHaveBeenCalledWith(
        'Unknown TypeScript type "CustomType", defaulting to TEXT'
      );
    });

    // TM-E002: Array type mapping
    it('should map string[] to TEXT[]', () => {
      expect(getPostgresType('string[]')).toBe('TEXT[]');
    });

    // TM-E003: Case insensitive input
    it('should handle case insensitive input', () => {
      expect(getPostgresType('String')).toBe('TEXT');
      expect(getPostgresType('NUMBER')).toBe('INTEGER');
    });

    // TM-E004: Partial date types
    it('should map timestamp to TIMESTAMPTZ', () => {
      expect(getPostgresType('timestamp')).toBe('TIMESTAMPTZ');
    });

    // TM-ERR001: Null input
    it('should throw TypeError for null input', () => {
      expect(() => getPostgresType(null as unknown as string)).toThrow(TypeError);
    });

    // TM-ERR002: Undefined input
    it('should throw TypeError for undefined input', () => {
      expect(() => getPostgresType(undefined as unknown as string)).toThrow(TypeError);
    });
  });

  describe('typeMap', () => {
    it('should have string mapped to TEXT', () => {
      expect(typeMap.string).toBe('TEXT');
    });

    it('should have number mapped to INTEGER', () => {
      expect(typeMap.number).toBe('INTEGER');
    });

    it('should have boolean mapped to BOOLEAN', () => {
      expect(typeMap.boolean).toBe('BOOLEAN');
    });

    it('should have Date mapped to TIMESTAMPTZ', () => {
      expect(typeMap.Date).toBe('TIMESTAMPTZ');
    });

    it('should have json mapped to JSONB', () => {
      expect(typeMap.json).toBe('JSONB');
    });
  });

  describe('TS_TYPE enum', () => {
    it('should export string type', () => {
      expect(TS_TYPE.STRING).toBe('string');
    });

    it('should export number type', () => {
      expect(TS_TYPE.NUMBER).toBe('number');
    });

    it('should export boolean type', () => {
      expect(TS_TYPE.BOOLEAN).toBe('boolean');
    });

    it('should export Date type', () => {
      expect(TS_TYPE.DATE).toBe('Date');
    });

    it('should export json type', () => {
      expect(TS_TYPE.JSON).toBe('json');
    });
  });

  describe('PG_TYPE enum', () => {
    it('should export TEXT type', () => {
      expect(PG_TYPE.TEXT).toBe('TEXT');
    });

    it('should export INTEGER type', () => {
      expect(PG_TYPE.INTEGER).toBe('INTEGER');
    });

    it('should export BOOLEAN type', () => {
      expect(PG_TYPE.BOOLEAN).toBe('BOOLEAN');
    });

    it('should export TIMESTAMPTZ type', () => {
      expect(PG_TYPE.TIMESTAMPTZ).toBe('TIMESTAMPTZ');
    });

    it('should export JSONB type', () => {
      expect(PG_TYPE.JSONB).toBe('JSONB');
    });
  });
});