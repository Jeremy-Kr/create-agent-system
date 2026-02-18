import { describe, expect, it } from 'vitest';
import { diffPresets } from '../../src/core/preset-differ.js';
import type { Preset } from '../../src/types/preset.js';

function makePreset(overrides: Partial<Preset> = {}): Preset {
  return {
    name: 'solo-dev',
    description: 'Test preset',
    scale: 'small',
    agents: {
      'po-pm': { enabled: true, model: 'opus' },
      architect: { enabled: false, model: 'opus' },
      cto: { enabled: false, model: 'opus' },
      designer: { enabled: false, model: 'opus' },
      'test-writer': { enabled: true, model: 'opus' },
      'frontend-dev': { enabled: true, model: 'opus' },
      'backend-dev': { enabled: true, model: 'opus' },
      'qa-reviewer': { enabled: true, model: 'opus' },
    },
    workflow: {
      reviewMaxRounds: 0,
      qaMode: 'lite',
      visualQaLevel: 1,
      epicBased: false,
    },
    skills: ['scoring', 'tdd-workflow', 'ticket-writing', 'cr-process'],
    ...overrides,
  };
}

describe('Preset Differ (TICKET-028)', () => {
  describe('diffPresets', () => {
    it('should report no differences for identical presets', () => {
      const a = makePreset();
      const b = makePreset();
      const diff = diffPresets(a, b);

      expect(diff.agents).toHaveLength(0);
      expect(diff.workflow).toHaveLength(0);
      expect(diff.skills.onlyInA).toHaveLength(0);
      expect(diff.skills.onlyInB).toHaveLength(0);
      expect(diff.scaleChanged).toBe(false);
    });

    it('should detect agent enabled changes', () => {
      const a = makePreset();
      const b = makePreset({
        agents: {
          ...makePreset().agents,
          architect: { enabled: true, model: 'opus' },
        },
      });
      const diff = diffPresets(a, b);

      const archDiff = diff.agents.find((d) => d.agent === 'architect');
      expect(archDiff).toBeDefined();
      expect(archDiff?.field).toBe('enabled');
      expect(archDiff?.a).toBe(false);
      expect(archDiff?.b).toBe(true);
    });

    it('should detect agent model changes', () => {
      const a = makePreset();
      const b = makePreset({
        agents: {
          ...makePreset().agents,
          'po-pm': { enabled: true, model: 'sonnet' },
        },
      });
      const diff = diffPresets(a, b);

      const modelDiff = diff.agents.find((d) => d.agent === 'po-pm' && d.field === 'model');
      expect(modelDiff).toBeDefined();
      expect(modelDiff?.a).toBe('opus');
      expect(modelDiff?.b).toBe('sonnet');
    });

    it('should detect workflow changes', () => {
      const a = makePreset();
      const b = makePreset({
        workflow: {
          reviewMaxRounds: 5,
          qaMode: 'standard',
          visualQaLevel: 3,
          epicBased: true,
        },
      });
      const diff = diffPresets(a, b);

      expect(diff.workflow.length).toBeGreaterThan(0);
      const roundsDiff = diff.workflow.find((d) => d.field === 'reviewMaxRounds');
      expect(roundsDiff?.a).toBe(0);
      expect(roundsDiff?.b).toBe(5);
    });

    it('should detect all 4 workflow field changes', () => {
      const a = makePreset();
      const b = makePreset({
        workflow: {
          reviewMaxRounds: 5,
          qaMode: 'standard',
          visualQaLevel: 3,
          epicBased: true,
        },
      });
      const diff = diffPresets(a, b);

      expect(diff.workflow).toHaveLength(4);
      expect(diff.workflow.map((d) => d.field)).toEqual(
        expect.arrayContaining(['reviewMaxRounds', 'qaMode', 'visualQaLevel', 'epicBased']),
      );
    });

    it('should detect skills only in A', () => {
      const a = makePreset({ skills: ['scoring', 'tdd-workflow', 'ticket-writing'] });
      const b = makePreset({ skills: ['scoring', 'tdd-workflow'] });
      const diff = diffPresets(a, b);

      expect(diff.skills.onlyInA).toEqual(['ticket-writing']);
      expect(diff.skills.onlyInB).toHaveLength(0);
      expect(diff.skills.common).toEqual(['scoring', 'tdd-workflow']);
    });

    it('should detect skills only in B', () => {
      const a = makePreset({ skills: ['scoring'] });
      const b = makePreset({ skills: ['scoring', 'visual-qa'] });
      const diff = diffPresets(a, b);

      expect(diff.skills.onlyInA).toHaveLength(0);
      expect(diff.skills.onlyInB).toEqual(['visual-qa']);
    });

    it('should detect scale changes', () => {
      const a = makePreset({ scale: 'small' });
      const b = makePreset({ scale: 'large' });
      const diff = diffPresets(a, b);

      expect(diff.scaleChanged).toBe(true);
      expect(diff.scaleA).toBe('small');
      expect(diff.scaleB).toBe('large');
    });

    it('should set nameA and nameB from presets', () => {
      const a = makePreset({ name: 'solo-dev' });
      const b = makePreset({ name: 'full-team' });
      const diff = diffPresets(a, b);

      expect(diff.nameA).toBe('solo-dev');
      expect(diff.nameB).toBe('full-team');
    });

    it('should detect multiple agent changes at once', () => {
      const a = makePreset();
      const b = makePreset({
        agents: {
          ...makePreset().agents,
          architect: { enabled: true, model: 'opus' },
          cto: { enabled: true, model: 'sonnet' },
        },
      });
      const diff = diffPresets(a, b);

      // architect: enabled changed, cto: enabled + model changed
      expect(diff.agents.length).toBeGreaterThanOrEqual(3);
    });
  });
});
