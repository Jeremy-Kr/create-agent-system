import { describe, expect, it } from 'vitest';
import { isValidProjectName } from '../../src/cli/prompts.js';

describe('CLI Prompts (TICKET-015)', () => {
  describe('isValidProjectName', () => {
    it('should accept valid npm-style names', () => {
      expect(isValidProjectName('my-project')).toBe(true);
      expect(isValidProjectName('test-app')).toBe(true);
      expect(isValidProjectName('create-agent-system')).toBe(true);
    });

    it('should reject empty names', () => {
      expect(isValidProjectName('')).toBe(false);
    });

    it('should reject names with spaces', () => {
      expect(isValidProjectName('my project')).toBe(false);
    });

    it('should reject names with uppercase letters', () => {
      expect(isValidProjectName('MyProject')).toBe(false);
    });

    it('should accept names starting with @scope/', () => {
      expect(isValidProjectName('@scope/my-package')).toBe(true);
    });

    it('should reject names starting with a dot or underscore', () => {
      expect(isValidProjectName('.hidden')).toBe(false);
      expect(isValidProjectName('_private')).toBe(false);
    });
  });
});
