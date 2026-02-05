import { describe, it, expect } from 'vitest';
import { safeJsonParse, sumYearValues } from './json-helpers';

describe('json-helpers', () => {
  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const result = safeJsonParse('{"key": "value"}', {});
      expect(result).toEqual({ key: 'value' });
    });

    it('should parse valid JSON array', () => {
      const result = safeJsonParse('[1, 2, 3]', []);
      expect(result).toEqual([1, 2, 3]);
    });

    it('should return fallback for null input', () => {
      const result = safeJsonParse(null, { default: true });
      expect(result).toEqual({ default: true });
    });

    it('should return fallback for undefined input', () => {
      const result = safeJsonParse(undefined, 'fallback');
      expect(result).toBe('fallback');
    });

    it('should return fallback for empty string', () => {
      const result = safeJsonParse('', []);
      expect(result).toEqual([]);
    });

    it('should return fallback for invalid JSON', () => {
      const result = safeJsonParse('not valid json', { error: true });
      expect(result).toEqual({ error: true });
    });

    it('should return fallback for malformed JSON', () => {
      const result = safeJsonParse('{"key": }', {});
      expect(result).toEqual({});
    });

    it('should handle nested objects', () => {
      const json = '{"outer": {"inner": {"value": 42}}}';
      const result = safeJsonParse(json, {});
      expect(result).toEqual({ outer: { inner: { value: 42 } } });
    });

    it('should handle numbers as JSON', () => {
      const result = safeJsonParse('42', 0);
      expect(result).toBe(42);
    });

    it('should handle boolean as JSON', () => {
      const result = safeJsonParse('true', false);
      expect(result).toBe(true);
    });

    it('should handle null JSON value', () => {
      const result = safeJsonParse('null', 'fallback');
      expect(result).toBe(null);
    });
  });

  describe('sumYearValues', () => {
    it('should sum values for default 5 years', () => {
      const json = JSON.stringify({
        year_0: 100,
        year_1: 200,
        year_2: 300,
        year_3: 400,
        year_4: 500,
      });
      const result = sumYearValues(json);
      expect(result).toBe(1500);
    });

    it('should sum values for specified number of years', () => {
      const json = JSON.stringify({
        year_0: 100,
        year_1: 200,
        year_2: 300,
        year_3: 400,
        year_4: 500,
      });
      const result = sumYearValues(json, 3);
      expect(result).toBe(600); // year_0 + year_1 + year_2
    });

    it('should handle missing year values', () => {
      const json = JSON.stringify({
        year_0: 100,
        year_2: 300,
        // year_1, year_3, year_4 missing
      });
      const result = sumYearValues(json);
      expect(result).toBe(400); // 100 + 0 + 300 + 0 + 0
    });

    it('should return 0 for null input', () => {
      const result = sumYearValues(null);
      expect(result).toBe(0);
    });

    it('should return 0 for empty string', () => {
      const result = sumYearValues('');
      expect(result).toBe(0);
    });

    it('should return 0 for invalid JSON', () => {
      const result = sumYearValues('not valid json');
      expect(result).toBe(0);
    });

    it('should return 0 for empty object', () => {
      const result = sumYearValues('{}');
      expect(result).toBe(0);
    });

    it('should handle single year', () => {
      const json = JSON.stringify({ year_0: 500 });
      const result = sumYearValues(json, 1);
      expect(result).toBe(500);
    });

    it('should handle 10 years', () => {
      const yearValues: Record<string, number> = {};
      for (let i = 0; i < 10; i++) {
        yearValues[`year_${i}`] = 100;
      }
      const result = sumYearValues(JSON.stringify(yearValues), 10);
      expect(result).toBe(1000);
    });

    it('should ignore non-year keys', () => {
      const json = JSON.stringify({
        year_0: 100,
        year_1: 200,
        other_key: 9999,
        notes: 'ignored',
      });
      const result = sumYearValues(json, 2);
      expect(result).toBe(300);
    });

    it('should handle zero values', () => {
      const json = JSON.stringify({
        year_0: 0,
        year_1: 0,
        year_2: 100,
      });
      const result = sumYearValues(json, 3);
      expect(result).toBe(100);
    });

    it('should handle negative values', () => {
      const json = JSON.stringify({
        year_0: 100,
        year_1: -50,
        year_2: 200,
      });
      const result = sumYearValues(json, 3);
      expect(result).toBe(250);
    });

    it('should handle decimal values', () => {
      const json = JSON.stringify({
        year_0: 100.5,
        year_1: 200.25,
      });
      const result = sumYearValues(json, 2);
      expect(result).toBe(300.75);
    });
  });
});
