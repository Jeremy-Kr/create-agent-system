import { describe, expect, it } from 'vitest';
import { isRecord, isStringArray, isValidModel } from '../../src/utils/type-guards.js';

describe('type-guards', () => {
  describe('isRecord', () => {
    it('should return true for plain objects', () => {
      expect(isRecord({})).toBe(true);
      expect(isRecord({ a: 1 })).toBe(true);
    });

    it('should return false for null', () => {
      expect(isRecord(null)).toBe(false);
    });

    it('should return false for arrays', () => {
      expect(isRecord([])).toBe(false);
      expect(isRecord([1, 2])).toBe(false);
    });

    it('should return false for primitives', () => {
      expect(isRecord('string')).toBe(false);
      expect(isRecord(42)).toBe(false);
      expect(isRecord(undefined)).toBe(false);
      expect(isRecord(true)).toBe(false);
    });
  });

  describe('isStringArray', () => {
    it('should return true for string arrays', () => {
      expect(isStringArray([])).toBe(true);
      expect(isStringArray(['a', 'b'])).toBe(true);
    });

    it('should return false for mixed arrays', () => {
      expect(isStringArray([1, 'a'])).toBe(false);
      expect(isStringArray(['a', null])).toBe(false);
      expect(isStringArray(['a', undefined])).toBe(false);
    });

    it('should return false for non-arrays', () => {
      expect(isStringArray('string')).toBe(false);
      expect(isStringArray({})).toBe(false);
      expect(isStringArray(null)).toBe(false);
      expect(isStringArray(undefined)).toBe(false);
    });
  });

  describe('isValidModel', () => {
    it('should return true for valid model values', () => {
      expect(isValidModel('opus')).toBe(true);
      expect(isValidModel('sonnet')).toBe(true);
      expect(isValidModel('haiku')).toBe(true);
    });

    it('should return false for invalid model values', () => {
      expect(isValidModel('inherit')).toBe(false);
      expect(isValidModel('gpt-4')).toBe(false);
      expect(isValidModel('')).toBe(false);
      expect(isValidModel(null)).toBe(false);
      expect(isValidModel(undefined)).toBe(false);
      expect(isValidModel(42)).toBe(false);
    });
  });
});
