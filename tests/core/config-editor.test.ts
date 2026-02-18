import { describe, expect, it } from 'vitest';
import { configToPreset, presetToConfigUpdate } from '../../src/core/config-editor.js';
import type { ConfigFile } from '../../src/types/config-file.js';
import type { Preset } from '../../src/types/preset.js';

const sampleConfig: ConfigFile = {
  version: '0.2',
  projectName: 'test-project',
  description: 'Test project description',
  basePreset: 'small-team',
  agents: {
    'po-pm': { enabled: true, model: 'opus' },
    architect: { enabled: true, model: 'opus' },
    cto: { enabled: true, model: 'opus' },
    designer: { enabled: false, model: 'opus' },
    'test-writer': { enabled: true, model: 'opus' },
    'frontend-dev': { enabled: true, model: 'opus' },
    'backend-dev': { enabled: true, model: 'opus' },
    'qa-reviewer': { enabled: true, model: 'opus' },
  },
  workflow: {
    reviewMaxRounds: 5,
    qaMode: 'standard',
    visualQaLevel: 2,
    epicBased: true,
  },
  skills: ['scoring', 'tdd-workflow', 'ticket-writing'],
  language: 'ko',
};

describe('config-editor', () => {
  describe('configToPreset', () => {
    it('should convert ConfigFile to Preset correctly', () => {
      const preset = configToPreset(sampleConfig);
      expect(preset.name).toBe('small-team');
      expect(preset.description).toBe('Test project description');
      expect(preset.agents).toEqual(sampleConfig.agents);
      expect(preset.workflow).toEqual(sampleConfig.workflow);
      expect(preset.skills).toEqual(sampleConfig.skills);
    });

    it('should derive scale from workflow', () => {
      const preset = configToPreset(sampleConfig);
      // standard qaMode + epicBased → medium (visualQaLevel < 3)
      expect(preset.scale).toBe('medium');
    });

    it('should default to "custom" name when no basePreset', () => {
      const config: ConfigFile = { ...sampleConfig, basePreset: undefined };
      const preset = configToPreset(config);
      expect(preset.name).toBe('custom');
    });

    it('should default description when missing', () => {
      const config: ConfigFile = { ...sampleConfig, description: undefined };
      const preset = configToPreset(config);
      expect(preset.description).toBe('Custom config');
    });
  });

  describe('presetToConfigUpdate', () => {
    const editedPreset: Preset = {
      name: 'custom',
      description: 'Edited preset',
      scale: 'large',
      agents: {
        ...sampleConfig.agents,
        designer: { enabled: true, model: 'opus' },
      },
      workflow: {
        reviewMaxRounds: 3,
        qaMode: 'standard',
        visualQaLevel: 3,
        epicBased: true,
      },
      skills: ['scoring', 'tdd-workflow', 'visual-qa'],
    };

    it('should preserve original metadata fields', () => {
      const result = presetToConfigUpdate(sampleConfig, editedPreset);
      expect(result.version).toBe('0.2');
      expect(result.projectName).toBe('test-project');
      expect(result.basePreset).toBe('small-team');
      expect(result.language).toBe('ko');
    });

    it('should apply edited preset values', () => {
      const result = presetToConfigUpdate(sampleConfig, editedPreset);
      expect(result.agents.designer.enabled).toBe(true);
      expect(result.workflow.visualQaLevel).toBe(3);
      expect(result.skills).toEqual(['scoring', 'tdd-workflow', 'visual-qa']);
    });

    it('should update description from edited preset', () => {
      const result = presetToConfigUpdate(sampleConfig, editedPreset);
      expect(result.description).toBe('Edited preset');
    });

    it('should round-trip consistently', () => {
      const preset = configToPreset(sampleConfig);
      const configBack = presetToConfigUpdate(sampleConfig, preset);
      expect(configBack.agents).toEqual(sampleConfig.agents);
      expect(configBack.workflow).toEqual(sampleConfig.workflow);
      expect(configBack.skills).toEqual(sampleConfig.skills);
    });
  });
});
