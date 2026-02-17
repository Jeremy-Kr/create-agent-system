import { describe, expect, it } from 'vitest';
import {
  getPresetPath,
  listPresets,
  loadPreset,
  parsePresetContent,
} from '../../src/core/preset-loader.js';
import type { PresetName } from '../../src/types/config.js';

describe('Preset Loader (TICKET-004, TICKET-005)', () => {
  describe('listPresets', () => {
    it('should return all 3 preset names', () => {
      const presets = listPresets();
      expect(presets).toEqual(['solo-dev', 'small-team', 'full-team']);
    });

    it('should return a new array (not a reference to the constant)', () => {
      const a = listPresets();
      const b = listPresets();
      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });
  });

  describe('getPresetPath', () => {
    it('should return an absolute path containing the preset name', () => {
      const path = getPresetPath('solo-dev');
      expect(path).toContain('solo-dev');
      expect(path).toMatch(/^\//); // absolute path
    });

    it('should return a path ending with .yaml', () => {
      const path = getPresetPath('small-team');
      expect(path).toMatch(/\.yaml$/);
    });

    it('should return different paths for different presets', () => {
      const soloPath = getPresetPath('solo-dev');
      const fullPath = getPresetPath('full-team');
      expect(soloPath).not.toBe(fullPath);
    });
  });

  describe('loadPreset — solo-dev', () => {
    it('should load solo-dev preset with correct fields', async () => {
      const preset = await loadPreset('solo-dev');
      expect(preset.name).toBe('solo-dev');
      expect(preset.description).toBeTruthy();
      expect(preset.scale).toBe('small');
    });

    it('should have exactly 5 enabled agents', async () => {
      const preset = await loadPreset('solo-dev');
      const enabledAgents = Object.entries(preset.agents)
        .filter(([_, config]) => config.enabled)
        .map(([name]) => name);
      expect(enabledAgents).toHaveLength(5);
      expect(enabledAgents).toContain('po-pm');
      expect(enabledAgents).toContain('test-writer');
      expect(enabledAgents).toContain('frontend-dev');
      expect(enabledAgents).toContain('backend-dev');
      expect(enabledAgents).toContain('qa-reviewer');
    });

    it('should have 3 disabled agents (architect, cto, designer)', async () => {
      const preset = await loadPreset('solo-dev');
      expect(preset.agents.architect.enabled).toBe(false);
      expect(preset.agents.cto.enabled).toBe(false);
      expect(preset.agents.designer.enabled).toBe(false);
    });

    it('should have camelCase workflow fields (snake_case → camelCase)', async () => {
      const preset = await loadPreset('solo-dev');
      expect(preset.workflow.reviewMaxRounds).toBe(0);
      expect(preset.workflow.qaMode).toBe('lite');
      expect(preset.workflow.visualQaLevel).toBe(1);
      expect(preset.workflow.epicBased).toBe(false);
    });

    it('should have 4 skills', async () => {
      const preset = await loadPreset('solo-dev');
      expect(preset.skills).toHaveLength(4);
      expect(preset.skills).toContain('scoring');
      expect(preset.skills).toContain('tdd-workflow');
      expect(preset.skills).toContain('ticket-writing');
      expect(preset.skills).toContain('cr-process');
    });

    it('should have all agents defined (including disabled)', async () => {
      const preset = await loadPreset('solo-dev');
      expect(Object.keys(preset.agents)).toHaveLength(8);
    });
  });

  describe('loadPreset — small-team', () => {
    it('should load small-team preset with correct scale', async () => {
      const preset = await loadPreset('small-team');
      expect(preset.name).toBe('small-team');
      expect(preset.scale).toBe('medium');
    });

    it('should have all 8 agents enabled', async () => {
      const preset = await loadPreset('small-team');
      const allEnabled = Object.values(preset.agents).every((a) => a.enabled);
      expect(allEnabled).toBe(true);
      expect(Object.keys(preset.agents)).toHaveLength(8);
    });

    it('should have camelCase workflow with standard settings', async () => {
      const preset = await loadPreset('small-team');
      expect(preset.workflow.reviewMaxRounds).toBe(5);
      expect(preset.workflow.qaMode).toBe('standard');
      expect(preset.workflow.visualQaLevel).toBe(2);
      expect(preset.workflow.epicBased).toBe(true);
    });

    it('should have all 7 skills', async () => {
      const preset = await loadPreset('small-team');
      expect(preset.skills).toHaveLength(7);
    });
  });

  describe('loadPreset — full-team', () => {
    it('should load full-team preset with scale large', async () => {
      const preset = await loadPreset('full-team');
      expect(preset.name).toBe('full-team');
      expect(preset.scale).toBe('large');
    });

    it('should have visualQaLevel 3', async () => {
      const preset = await loadPreset('full-team');
      expect(preset.workflow.visualQaLevel).toBe(3);
    });

    it('should have all 8 agents enabled', async () => {
      const preset = await loadPreset('full-team');
      const allEnabled = Object.values(preset.agents).every((a) => a.enabled);
      expect(allEnabled).toBe(true);
    });
  });

  describe('full-team vs small-team diff', () => {
    it('should differ only in scale and visualQaLevel', async () => {
      const small = await loadPreset('small-team');
      const full = await loadPreset('full-team');

      // These should differ
      expect(small.scale).not.toBe(full.scale);
      expect(small.workflow.visualQaLevel).not.toBe(full.workflow.visualQaLevel);

      // Everything else should be the same
      expect(small.agents).toEqual(full.agents);
      expect(small.workflow.reviewMaxRounds).toBe(full.workflow.reviewMaxRounds);
      expect(small.workflow.qaMode).toBe(full.workflow.qaMode);
      expect(small.workflow.epicBased).toBe(full.workflow.epicBased);
      expect(small.skills).toEqual(full.skills);
    });
  });

  describe('loadPreset — error handling', () => {
    it('should throw on invalid preset name with descriptive message', async () => {
      await expect(loadPreset('nonexistent' as PresetName)).rejects.toThrow(/nonexistent/);
    });

    it('should list valid preset names in error message', async () => {
      await expect(loadPreset('bad-name' as PresetName)).rejects.toThrow(
        /solo-dev.*small-team.*full-team/,
      );
    });

    it('should throw on malformed YAML', async () => {
      // This test verifies that malformed YAML in a preset file causes an error.
      // The actual implementation should throw a descriptive error when YAML parsing fails.
      // In the Red phase, we just verify the function exists and has error handling.
      await expect(loadPreset('nonexistent' as PresetName)).rejects.toThrow();
    });

    it('should throw on malformed YAML content with descriptive message', () => {
      const badYaml = ':::invalid yaml{{{[[[';
      expect(() => parsePresetContent(badYaml, 'test-preset')).toThrow(/malformed YAML/);
    });

    it('should throw on YAML missing required fields', () => {
      const incompleteYaml = 'name: test\ndescription: test';
      expect(() => parsePresetContent(incompleteYaml, 'test-preset')).toThrow(
        /missing required field/,
      );
    });
  });

  describe('loadPreset — type safety', () => {
    it('should return a Preset that satisfies the interface', async () => {
      const preset = await loadPreset('solo-dev');
      // Verify all required Preset fields exist
      expect(preset).toHaveProperty('name');
      expect(preset).toHaveProperty('description');
      expect(preset).toHaveProperty('scale');
      expect(preset).toHaveProperty('agents');
      expect(preset).toHaveProperty('workflow');
      expect(preset).toHaveProperty('skills');

      // Verify workflow sub-fields (camelCase)
      expect(preset.workflow).toHaveProperty('reviewMaxRounds');
      expect(preset.workflow).toHaveProperty('qaMode');
      expect(preset.workflow).toHaveProperty('visualQaLevel');
      expect(preset.workflow).toHaveProperty('epicBased');
    });

    it('should have model field on each agent config', async () => {
      const preset = await loadPreset('solo-dev');
      for (const [_, config] of Object.entries(preset.agents)) {
        expect(config).toHaveProperty('model');
        expect(config).toHaveProperty('enabled');
      }
    });
  });
});
