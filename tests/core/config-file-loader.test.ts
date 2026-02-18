import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  detectConfigFile,
  getConfigFilePath,
  loadConfigFile,
  saveConfigFile,
} from '../../src/core/config-file-loader.js';
import type { Preset } from '../../src/types/preset.js';
import { CONFIG_FILE_NAME } from '../../src/utils/constants.js';

describe('Config File Loader (TICKET-025)', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = join(
      tmpdir(),
      `cas-test-config-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('getConfigFilePath', () => {
    it('should return path with CONFIG_FILE_NAME', () => {
      const path = getConfigFilePath('/some/dir');
      expect(path).toBe(join('/some/dir', CONFIG_FILE_NAME));
    });
  });

  describe('detectConfigFile', () => {
    it('should return false when no config file exists', async () => {
      expect(await detectConfigFile(tempDir)).toBe(false);
    });

    it('should return true when config file exists', async () => {
      await writeFile(join(tempDir, CONFIG_FILE_NAME), 'version: "0.2"', 'utf-8');
      expect(await detectConfigFile(tempDir)).toBe(true);
    });
  });

  describe('loadConfigFile', () => {
    const validConfig = `
version: "0.2"
project_name: test-app
description: "Test config"
base_preset: solo-dev
agents:
  po-pm: { enabled: true, model: opus }
  architect: { enabled: false, model: opus }
  cto: { enabled: false, model: opus }
  designer: { enabled: false, model: opus }
  test-writer: { enabled: true, model: opus }
  frontend-dev: { enabled: true, model: opus }
  backend-dev: { enabled: true, model: opus }
  qa-reviewer: { enabled: true, model: opus }
workflow:
  review_max_rounds: 0
  qa_mode: lite
  visual_qa_level: 1
  epic_based: false
skills:
  - scoring
  - tdd-workflow
`;

    it('should load a valid config file', async () => {
      await writeFile(join(tempDir, CONFIG_FILE_NAME), validConfig, 'utf-8');
      const { preset, projectName } = await loadConfigFile(tempDir);

      expect(projectName).toBe('test-app');
      expect(preset.name).toBe('solo-dev');
      expect(preset.description).toBe('Test config');
      expect(preset.agents['po-pm'].enabled).toBe(true);
      expect(preset.agents.architect.enabled).toBe(false);
      expect(preset.workflow.reviewMaxRounds).toBe(0);
      expect(preset.workflow.qaMode).toBe('lite');
      expect(preset.skills).toContain('scoring');
      expect(preset.skills).toContain('tdd-workflow');
    });

    it('should derive scale correctly from workflow', async () => {
      const largeConfig = validConfig
        .replace('qa_mode: lite', 'qa_mode: standard')
        .replace('visual_qa_level: 1', 'visual_qa_level: 3');
      await writeFile(join(tempDir, CONFIG_FILE_NAME), largeConfig, 'utf-8');
      const { preset } = await loadConfigFile(tempDir);
      expect(preset.scale).toBe('large');
    });

    it('should default missing agents to disabled', async () => {
      const partialConfig = `
version: "0.2"
agents:
  po-pm: { enabled: true, model: opus }
workflow:
  review_max_rounds: 0
  qa_mode: lite
  visual_qa_level: 0
  epic_based: false
skills:
  - scoring
`;
      await writeFile(join(tempDir, CONFIG_FILE_NAME), partialConfig, 'utf-8');
      const { preset } = await loadConfigFile(tempDir);
      expect(preset.agents['po-pm'].enabled).toBe(true);
      expect(preset.agents.architect.enabled).toBe(false);
      expect(preset.agents.cto.enabled).toBe(false);
    });

    it('should filter out invalid skill names', async () => {
      const configWithBadSkills = `
version: "0.2"
agents:
  po-pm: { enabled: true, model: opus }
workflow:
  review_max_rounds: 0
  qa_mode: lite
  visual_qa_level: 0
  epic_based: false
skills:
  - scoring
  - nonexistent-skill
  - tdd-workflow
`;
      await writeFile(join(tempDir, CONFIG_FILE_NAME), configWithBadSkills, 'utf-8');
      const { preset } = await loadConfigFile(tempDir);
      expect(preset.skills).toEqual(['scoring', 'tdd-workflow']);
    });

    it('should throw on missing config file', async () => {
      await expect(loadConfigFile(tempDir)).rejects.toThrow(/Config file not found/);
    });

    it('should throw on malformed YAML', async () => {
      await writeFile(join(tempDir, CONFIG_FILE_NAME), ':::invalid{{{', 'utf-8');
      await expect(loadConfigFile(tempDir)).rejects.toThrow(/malformed YAML/);
    });

    it('should throw on missing agents field', async () => {
      await writeFile(
        join(tempDir, CONFIG_FILE_NAME),
        'version: "0.2"\nworkflow: {}\nskills: []',
        'utf-8',
      );
      await expect(loadConfigFile(tempDir)).rejects.toThrow(/missing required field.*agents/);
    });

    it('should throw on missing workflow field', async () => {
      await writeFile(
        join(tempDir, CONFIG_FILE_NAME),
        'version: "0.2"\nagents: {}\nskills: []',
        'utf-8',
      );
      await expect(loadConfigFile(tempDir)).rejects.toThrow(/missing required field.*workflow/);
    });

    it('should throw on missing skills field', async () => {
      await writeFile(
        join(tempDir, CONFIG_FILE_NAME),
        'version: "0.2"\nagents: {}\nworkflow: {}',
        'utf-8',
      );
      await expect(loadConfigFile(tempDir)).rejects.toThrow(/missing required field.*skills/);
    });

    it('should use "custom" as name when base_preset is missing', async () => {
      const noBaseConfig = `
version: "0.2"
agents:
  po-pm: { enabled: true, model: opus }
workflow:
  review_max_rounds: 0
  qa_mode: lite
  visual_qa_level: 0
  epic_based: false
skills: []
`;
      await writeFile(join(tempDir, CONFIG_FILE_NAME), noBaseConfig, 'utf-8');
      const { preset } = await loadConfigFile(tempDir);
      expect(preset.name).toBe('custom');
    });

    it('should default project_name to "my-project"', async () => {
      const noNameConfig = `
version: "0.2"
agents:
  po-pm: { enabled: true, model: opus }
workflow:
  review_max_rounds: 0
  qa_mode: lite
  visual_qa_level: 0
  epic_based: false
skills: []
`;
      await writeFile(join(tempDir, CONFIG_FILE_NAME), noNameConfig, 'utf-8');
      const { projectName } = await loadConfigFile(tempDir);
      expect(projectName).toBe('my-project');
    });
  });

  describe('saveConfigFile', () => {
    const testPreset: Preset = {
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
      skills: ['scoring', 'tdd-workflow'],
    };

    it('should save config file and return path', async () => {
      const path = await saveConfigFile(tempDir, testPreset, 'my-app', 'solo-dev');
      expect(path).toBe(join(tempDir, CONFIG_FILE_NAME));

      const content = await readFile(path, 'utf-8');
      expect(content).toContain('version:');
      expect(content).toContain('project_name: my-app');
      expect(content).toContain('base_preset: solo-dev');
    });

    it('should produce YAML with snake_case workflow keys', async () => {
      await saveConfigFile(tempDir, testPreset, 'my-app');
      const content = await readFile(join(tempDir, CONFIG_FILE_NAME), 'utf-8');
      expect(content).toContain('review_max_rounds');
      expect(content).toContain('qa_mode');
      expect(content).toContain('visual_qa_level');
      expect(content).toContain('epic_based');
    });

    it('should round-trip: save then load', async () => {
      await saveConfigFile(tempDir, testPreset, 'my-app', 'solo-dev');
      const { preset, projectName } = await loadConfigFile(tempDir);

      expect(projectName).toBe('my-app');
      expect(preset.agents['po-pm'].enabled).toBe(true);
      expect(preset.agents.architect.enabled).toBe(false);
      expect(preset.workflow.reviewMaxRounds).toBe(0);
      expect(preset.workflow.qaMode).toBe('lite');
      expect(preset.skills).toEqual(['scoring', 'tdd-workflow']);
    });
  });
});
