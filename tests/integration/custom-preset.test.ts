import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  detectConfigFile,
  loadConfigFile,
  saveConfigFile,
} from '../../src/core/config-file-loader.js';
import { diffPresets } from '../../src/core/preset-differ.js';
import { loadPreset } from '../../src/core/preset-loader.js';
import { scaffold } from '../../src/core/scaffolder.js';
import { validate } from '../../src/core/validator.js';
import type { TechStackInfo } from '../../src/types/config.js';
import type { Preset } from '../../src/types/preset.js';
import { CONFIG_FILE_NAME } from '../../src/utils/constants.js';

// Mock child_process to prevent actual network calls
vi.mock('node:child_process', () => ({
  execFile: (_cmd: string, _args: string[], _opts: unknown, cb: (err: Error) => void) => {
    cb(new Error('mocked: no network'));
  },
}));

const DEFAULT_TECH_STACK: TechStackInfo = {
  language: 'typescript',
  framework: undefined,
  cssFramework: undefined,
  packageManager: 'pnpm',
};

describe('Integration: Custom Preset Pipeline (TICKET-034)', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'cas-custom-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  describe('custom preset scaffolding', () => {
    it('should scaffold with a custom preset (subset of agents)', async () => {
      const base = await loadPreset('solo-dev');
      const customPreset: Preset = {
        ...base,
        name: 'custom',
        description: 'Custom test preset',
        agents: {
          ...base.agents,
          architect: { enabled: true, model: 'opus' },
        },
        skills: ['scoring', 'tdd-workflow', 'adr-writing'],
      };

      const result = await scaffold({
        preset: customPreset,
        projectName: 'custom-test',
        targetDir: tmpDir,
        techStack: DEFAULT_TECH_STACK,
        dryRun: false,
        overwrite: false,
      });

      expect(result.files.length).toBeGreaterThan(0);

      // Architect should be scaffolded since it's now enabled
      const agentFiles = result.files.filter((f) => f.path.includes('.claude/agents/'));
      const agentNames = agentFiles.filter((f) => f.action === 'created').map((f) => f.path);
      expect(agentNames.some((n) => n.includes('architect'))).toBe(true);
    });

    it('should pass validation after custom preset scaffolding', async () => {
      const base = await loadPreset('small-team');
      const customPreset: Preset = {
        ...base,
        name: 'custom',
        description: 'Custom validated preset',
      };

      await scaffold({
        preset: customPreset,
        projectName: 'validation-test',
        targetDir: tmpDir,
        techStack: DEFAULT_TECH_STACK,
        dryRun: false,
        overwrite: false,
      });

      const validation = await validate(tmpDir);
      expect(validation.valid).toBe(true);
    });
  });

  describe('config file round-trip', () => {
    it('should save config, detect it, and load it back', async () => {
      const preset = await loadPreset('solo-dev');

      // Save
      const configPath = await saveConfigFile(tmpDir, preset, 'my-app', 'solo-dev');
      expect(configPath).toContain(CONFIG_FILE_NAME);

      // Detect
      const detected = await detectConfigFile(tmpDir);
      expect(detected).toBe(true);

      // Load
      const { preset: loaded, projectName } = await loadConfigFile(tmpDir);
      expect(projectName).toBe('my-app');
      expect(loaded.agents['po-pm'].enabled).toBe(preset.agents['po-pm'].enabled);
      expect(loaded.workflow.qaMode).toBe(preset.workflow.qaMode);
      expect(loaded.skills).toEqual(preset.skills);
    });

    it('should scaffold from loaded config file', async () => {
      const preset = await loadPreset('small-team');
      await saveConfigFile(tmpDir, preset, 'config-scaffold-test', 'small-team');

      const { preset: loaded, projectName } = await loadConfigFile(tmpDir);

      const result = await scaffold({
        preset: loaded,
        projectName,
        targetDir: tmpDir,
        techStack: DEFAULT_TECH_STACK,
        dryRun: false,
        overwrite: false,
      });

      expect(result.files.length).toBeGreaterThan(0);

      const validation = await validate(tmpDir);
      expect(validation.valid).toBe(true);
    });
  });

  describe('preset diff', () => {
    it('should diff solo-dev vs full-team', async () => {
      const solo = await loadPreset('solo-dev');
      const full = await loadPreset('full-team');
      const diff = diffPresets(solo, full);

      expect(diff.nameA).toBe('solo-dev');
      expect(diff.nameB).toBe('full-team');
      expect(diff.scaleChanged).toBe(true);
      expect(diff.agents.length).toBeGreaterThan(0);
      expect(diff.workflow.length).toBeGreaterThan(0);
      expect(diff.skills.onlyInB.length).toBeGreaterThan(0);
    });

    it('should diff small-team vs full-team (minimal diff)', async () => {
      const small = await loadPreset('small-team');
      const full = await loadPreset('full-team');
      const diff = diffPresets(small, full);

      // Only scale and visualQaLevel should differ
      expect(diff.scaleChanged).toBe(true);
      expect(diff.agents).toHaveLength(0);
      expect(diff.workflow).toHaveLength(1);
      expect(diff.workflow[0].field).toBe('visualQaLevel');
      expect(diff.skills.onlyInA).toHaveLength(0);
      expect(diff.skills.onlyInB).toHaveLength(0);
    });

    it('should report no differences for identical presets', async () => {
      const solo1 = await loadPreset('solo-dev');
      const solo2 = await loadPreset('solo-dev');
      const diff = diffPresets(solo1, solo2);

      expect(diff.agents).toHaveLength(0);
      expect(diff.workflow).toHaveLength(0);
      expect(diff.skills.onlyInA).toHaveLength(0);
      expect(diff.skills.onlyInB).toHaveLength(0);
      expect(diff.scaleChanged).toBe(false);
    });
  });
});
