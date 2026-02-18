import { describe, expect, it } from 'vitest';
import { deriveScale } from '../../src/cli/custom-prompts.js';
import type { WorkflowConfig } from '../../src/types/config.js';

describe('Custom Prompts (TICKET-022)', () => {
  describe('deriveScale', () => {
    it('should return "large" when visualQaLevel >= 3 and qaMode is standard', () => {
      const workflow: WorkflowConfig = {
        reviewMaxRounds: 5,
        qaMode: 'standard',
        visualQaLevel: 3,
        epicBased: true,
      };
      expect(deriveScale(workflow)).toBe('large');
    });

    it('should return "medium" when epicBased is true', () => {
      const workflow: WorkflowConfig = {
        reviewMaxRounds: 3,
        qaMode: 'lite',
        visualQaLevel: 1,
        epicBased: true,
      };
      expect(deriveScale(workflow)).toBe('medium');
    });

    it('should return "medium" when qaMode is standard', () => {
      const workflow: WorkflowConfig = {
        reviewMaxRounds: 3,
        qaMode: 'standard',
        visualQaLevel: 2,
        epicBased: false,
      };
      expect(deriveScale(workflow)).toBe('medium');
    });

    it('should return "small" when neither epicBased nor standard qaMode', () => {
      const workflow: WorkflowConfig = {
        reviewMaxRounds: 0,
        qaMode: 'lite',
        visualQaLevel: 1,
        epicBased: false,
      };
      expect(deriveScale(workflow)).toBe('small');
    });

    it('should return "small" for minimal config', () => {
      const workflow: WorkflowConfig = {
        reviewMaxRounds: 0,
        qaMode: 'lite',
        visualQaLevel: 0,
        epicBased: false,
      };
      expect(deriveScale(workflow)).toBe('small');
    });

    it('should prioritize large over medium (visualQaLevel 3 + standard)', () => {
      const workflow: WorkflowConfig = {
        reviewMaxRounds: 5,
        qaMode: 'standard',
        visualQaLevel: 3,
        epicBased: true,
      };
      // Even though epicBased is true (medium), visualQaLevel 3 + standard → large
      expect(deriveScale(workflow)).toBe('large');
    });

    it('should not return large when visualQaLevel is 3 but qaMode is lite', () => {
      const workflow: WorkflowConfig = {
        reviewMaxRounds: 0,
        qaMode: 'lite',
        visualQaLevel: 3,
        epicBased: false,
      };
      expect(deriveScale(workflow)).toBe('small');
    });
  });
});
