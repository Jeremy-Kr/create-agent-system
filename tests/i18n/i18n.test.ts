import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { detectSystemLocale } from '../../src/i18n/detect.js';
import { en } from '../../src/i18n/en.js';
import { getLocale, initI18n, t } from '../../src/i18n/index.js';
import { ko } from '../../src/i18n/ko.js';
import type { Messages } from '../../src/i18n/types.js';

describe('i18n', () => {
  beforeEach(() => {
    initI18n('en');
  });

  describe('initI18n', () => {
    it('should default to en', () => {
      initI18n();
      expect(getLocale()).toBe('en');
    });

    it('should set locale to ko', () => {
      initI18n('ko');
      expect(getLocale()).toBe('ko');
    });

    it('should set locale to en', () => {
      initI18n('en');
      expect(getLocale()).toBe('en');
    });
  });

  describe('t()', () => {
    it('should return English messages by default', () => {
      initI18n('en');
      expect(t('prompt.choose_preset')).toBe('Choose a preset:');
    });

    it('should return Korean messages when locale is ko', () => {
      initI18n('ko');
      expect(t('prompt.choose_preset')).toBe('프리셋을 선택하세요:');
    });

    it('should interpolate variables', () => {
      initI18n('en');
      expect(t('display.validation_stats', { files: 11, agents: 5, skills: 4 })).toBe(
        '11 files, 5 agents, 4 skills',
      );
    });

    it('should interpolate variables in Korean', () => {
      initI18n('ko');
      expect(t('display.validation_stats', { files: 11, agents: 5, skills: 4 })).toBe(
        '11개 파일, 5개 에이전트, 4개 스킬',
      );
    });

    it('should interpolate multiple occurrences of same variable', () => {
      initI18n('en');
      // validator.invalid_skill_ref uses {skill} twice
      const result = t('validator.invalid_skill_ref', { file: 'test.md', skill: 'my-skill' });
      expect(result).toContain('my-skill');
      expect(result.indexOf('my-skill')).not.toBe(result.lastIndexOf('my-skill'));
    });

    it('should handle string and number variables', () => {
      initI18n('en');
      expect(t('display.validation_failed', { count: 3 })).toBe(
        'Validation failed with 3 error(s).',
      );
    });
  });

  describe('getLocale()', () => {
    it('should return current locale', () => {
      initI18n('ko');
      expect(getLocale()).toBe('ko');
      initI18n('en');
      expect(getLocale()).toBe('en');
    });
  });

  describe('message completeness', () => {
    it('should have all en keys in ko', () => {
      const enKeys = Object.keys(en).sort();
      const koKeys = Object.keys(ko).sort();
      expect(koKeys).toEqual(enKeys);
    });

    it('should have the same number of keys in en and ko', () => {
      expect(Object.keys(en).length).toBe(Object.keys(ko).length);
    });

    it('should have non-empty values for all keys in en', () => {
      for (const [key, value] of Object.entries(en)) {
        expect(value, `en key "${key}" should not be empty`).not.toBe('');
      }
    });

    it('should have non-empty values for all keys in ko', () => {
      for (const [key, value] of Object.entries(ko)) {
        expect(value, `ko key "${key}" should not be empty`).not.toBe('');
      }
    });
  });

  describe('detectSystemLocale()', () => {
    const originalLang = process.env.LANG;
    const originalLcAll = process.env.LC_ALL;

    beforeEach(() => {
      delete process.env.LANG;
      delete process.env.LC_ALL;
    });

    afterEach(() => {
      if (originalLang !== undefined) process.env.LANG = originalLang;
      else delete process.env.LANG;
      if (originalLcAll !== undefined) process.env.LC_ALL = originalLcAll;
      else delete process.env.LC_ALL;
    });

    it('should return en when no LANG is set', () => {
      expect(detectSystemLocale()).toBe('en');
    });

    it('should return ko when LANG starts with ko', () => {
      process.env.LANG = 'ko_KR.UTF-8';
      expect(detectSystemLocale()).toBe('ko');
    });

    it('should return en when LANG is en_US', () => {
      process.env.LANG = 'en_US.UTF-8';
      expect(detectSystemLocale()).toBe('en');
    });

    it('should check LC_ALL when LANG is not set', () => {
      process.env.LC_ALL = 'ko_KR.UTF-8';
      expect(detectSystemLocale()).toBe('ko');
    });

    it('should prefer LANG over LC_ALL', () => {
      process.env.LANG = 'en_US.UTF-8';
      process.env.LC_ALL = 'ko_KR.UTF-8';
      expect(detectSystemLocale()).toBe('en');
    });
  });

  describe('variable placeholders consistency', () => {
    it('should have same variable placeholders in en and ko for each key', () => {
      const varRegex = /\{(\w+)\}/g;
      for (const key of Object.keys(en) as (keyof Messages)[]) {
        const enVars = [...en[key].matchAll(varRegex)].map((m) => m[1]).sort();
        const koVars = [...ko[key].matchAll(varRegex)].map((m) => m[1]).sort();
        expect(koVars, `Variables mismatch for key "${key}"`).toEqual(enVars);
      }
    });
  });
});
