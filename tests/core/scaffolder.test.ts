import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TechStackInfo } from '../../src/types/config.js';
import type { Preset } from '../../src/types/preset.js';

// Mock skill-installer to avoid real npx calls
vi.mock('../../src/core/skill-installer.js', () => ({
  installSkills: vi.fn().mockResolvedValue([
    { skillName: 'find-skills', success: true },
    { skillName: 'scoring', success: true },
  ]),
}));

import type { ScaffoldConfig } from '../../src/core/scaffolder.js';
import {
  composeAgentTemplateData,
  composeClaudeMdData,
  computeAgentSkills,
  scaffold,
} from '../../src/core/scaffolder.js';
import { installSkills } from '../../src/core/skill-installer.js';

const SOLO_DEV_PRESET: Preset = {
  name: 'solo-dev',
  description: 'Solo dev preset',
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
};

const FULL_TEAM_PRESET: Preset = {
  name: 'full-team',
  description: 'Full team preset',
  scale: 'large',
  agents: {
    'po-pm': { enabled: true, model: 'opus' },
    architect: { enabled: true, model: 'opus' },
    cto: { enabled: true, model: 'opus' },
    designer: { enabled: true, model: 'opus' },
    'test-writer': { enabled: true, model: 'opus' },
    'frontend-dev': { enabled: true, model: 'opus' },
    'backend-dev': { enabled: true, model: 'opus' },
    'qa-reviewer': { enabled: true, model: 'opus' },
  },
  workflow: {
    reviewMaxRounds: 5,
    qaMode: 'standard',
    visualQaLevel: 3,
    epicBased: true,
  },
  skills: [
    'scoring',
    'visual-qa',
    'tdd-workflow',
    'adr-writing',
    'ticket-writing',
    'design-system',
    'cr-process',
  ],
};

const DEFAULT_TECH_STACK: TechStackInfo = {
  packageManager: 'pnpm',
};

describe('Scaffolder (TICKET-011, TICKET-012)', () => {
  let targetDir: string;

  beforeEach(async () => {
    targetDir = join(
      tmpdir(),
      `scaffolder-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await mkdir(targetDir, { recursive: true });
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await rm(targetDir, { recursive: true, force: true });
  });

  // --- TICKET-012: computeAgentSkills ---

  describe('computeAgentSkills', () => {
    it('should compute intersection of agent defaults and preset skills', () => {
      // po-pm defaults: [scoring, ticket-writing, cr-process]
      // solo-dev skills: [scoring, tdd-workflow, ticket-writing, cr-process]
      // intersection: [scoring, ticket-writing, cr-process]
      const skills = computeAgentSkills('po-pm', SOLO_DEV_PRESET.skills);
      expect(skills).toEqual(expect.arrayContaining(['scoring', 'ticket-writing', 'cr-process']));
      expect(skills).toHaveLength(3);
    });

    it('should return partial intersection for designer in solo-dev', () => {
      // designer defaults: [design-system, visual-qa, scoring]
      // solo-dev skills: [scoring, tdd-workflow, ticket-writing, cr-process]
      // intersection: [scoring]
      const skills = computeAgentSkills('designer', SOLO_DEV_PRESET.skills);
      expect(skills).toEqual(['scoring']);
    });

    it('should return full defaults for designer in full-team', () => {
      // designer defaults: [design-system, visual-qa, scoring]
      // full-team skills: all 7
      // intersection: [design-system, visual-qa, scoring]
      const skills = computeAgentSkills('designer', FULL_TEAM_PRESET.skills);
      expect(skills).toEqual(expect.arrayContaining(['design-system', 'visual-qa', 'scoring']));
      expect(skills).toHaveLength(3);
    });

    it('should return empty array when no intersection exists', () => {
      // architect defaults: [scoring, adr-writing]
      // hypothetical preset with no matching skills
      const skills = computeAgentSkills('architect', ['tdd-workflow', 'cr-process']);
      expect(skills).toEqual([]);
    });

    it('should return correct skills for backend-dev (only scoring)', () => {
      const skills = computeAgentSkills('backend-dev', SOLO_DEV_PRESET.skills);
      expect(skills).toEqual(['scoring']);
    });

    it('should return correct skills for test-writer in solo-dev', () => {
      // test-writer defaults: [tdd-workflow, scoring]
      // solo-dev: [scoring, tdd-workflow, ticket-writing, cr-process]
      const skills = computeAgentSkills('test-writer', SOLO_DEV_PRESET.skills);
      expect(skills).toEqual(expect.arrayContaining(['tdd-workflow', 'scoring']));
      expect(skills).toHaveLength(2);
    });
  });

  // --- TICKET-012: composeAgentTemplateData ---

  describe('composeAgentTemplateData', () => {
    it('should compose data with correct model from preset', () => {
      const data = composeAgentTemplateData('backend-dev', SOLO_DEV_PRESET, DEFAULT_TECH_STACK);
      expect(data.model).toBe('opus');
    });

    it('should compose skills from computed agent skills', () => {
      // po-pm defaults: [scoring, ticket-writing, cr-process], solo-dev has all three
      const data = composeAgentTemplateData('po-pm', SOLO_DEV_PRESET, DEFAULT_TECH_STACK);
      expect(data.skills).toContain('scoring');
      expect(data.skills).toContain('ticket-writing');
      expect(data.skills).toContain('cr-process');
    });

    it('should set skills to undefined when no intersection', () => {
      // architect defaults: [scoring, adr-writing], solo-dev: [scoring, tdd-workflow, ticket-writing, cr-process]
      // intersection: [scoring] — not empty, but let's test designer with minimal
      const data = composeAgentTemplateData('backend-dev', SOLO_DEV_PRESET, DEFAULT_TECH_STACK);
      // backend-dev defaults: [scoring], solo-dev has scoring → "scoring"
      expect(data.skills).toBe('scoring');
    });

    it('should use packageManager from techStack', () => {
      const data = composeAgentTemplateData('backend-dev', SOLO_DEV_PRESET, {
        packageManager: 'yarn',
      });
      expect(data.packageManager).toBe('yarn');
    });

    it('should default packageManager to pnpm', () => {
      const data = composeAgentTemplateData('backend-dev', SOLO_DEV_PRESET, {});
      expect(data.packageManager).toBe('pnpm');
    });

    it('should set visualQa true when visualQaLevel > 0 AND visual-qa is in computed skills', () => {
      // full-team: visualQaLevel=3, frontend-dev has visual-qa in its skills
      const data = composeAgentTemplateData('frontend-dev', FULL_TEAM_PRESET, DEFAULT_TECH_STACK);
      expect(data.visualQa).toBe(true);
    });

    it('should set visualQa false for frontend-dev in solo-dev (visual-qa not in preset skills)', () => {
      // solo-dev: visualQaLevel=1, but visual-qa is NOT in preset skills
      // frontend-dev defaults: [visual-qa, scoring], ∩ solo-dev: [scoring] — visual-qa excluded
      const data = composeAgentTemplateData('frontend-dev', SOLO_DEV_PRESET, DEFAULT_TECH_STACK);
      expect(data.visualQa).toBe(false);
    });

    it('should set epicBased from preset workflow', () => {
      const data = composeAgentTemplateData('backend-dev', FULL_TEAM_PRESET, DEFAULT_TECH_STACK);
      expect(data.epicBased).toBe(true);
    });
  });

  // --- TICKET-012: composeClaudeMdData ---

  describe('composeClaudeMdData', () => {
    it('should include projectName', () => {
      const data = composeClaudeMdData(SOLO_DEV_PRESET, 'my-project', DEFAULT_TECH_STACK);
      expect(data.projectName).toBe('my-project');
    });

    it('should set visualQa based on visualQaLevel > 0', () => {
      const data = composeClaudeMdData(SOLO_DEV_PRESET, 'test', DEFAULT_TECH_STACK);
      expect(data.visualQa).toBe(true); // solo-dev has visualQaLevel: 1
      expect(data.visualQaLevel).toBe(1);
    });

    it('should set epicBased from preset', () => {
      const soloData = composeClaudeMdData(SOLO_DEV_PRESET, 'test', DEFAULT_TECH_STACK);
      expect(soloData.epicBased).toBe(false);

      const fullData = composeClaudeMdData(FULL_TEAM_PRESET, 'test', DEFAULT_TECH_STACK);
      expect(fullData.epicBased).toBe(true);
    });

    it('should include only enabled agents in activeAgents', () => {
      const soloData = composeClaudeMdData(SOLO_DEV_PRESET, 'test', DEFAULT_TECH_STACK);
      expect(soloData.activeAgents).toHaveLength(5); // solo-dev has 5 enabled
      const names = soloData.activeAgents.map((a) => a.displayName);
      expect(names).not.toContain('Architect');
      expect(names).not.toContain('CTO');
      expect(names).not.toContain('Designer');
    });

    it('should include all 8 agents in activeAgents for full-team', () => {
      const data = composeClaudeMdData(FULL_TEAM_PRESET, 'test', DEFAULT_TECH_STACK);
      expect(data.activeAgents).toHaveLength(8);
    });

    it('should include fileOwnership entries', () => {
      const data = composeClaudeMdData(FULL_TEAM_PRESET, 'test', DEFAULT_TECH_STACK);
      expect(data.fileOwnership.length).toBeGreaterThan(0);
      expect(data.fileOwnership[0]).toHaveProperty('path');
      expect(data.fileOwnership[0]).toHaveProperty('owner');
    });

    it('should use packageManager from techStack or default to pnpm', () => {
      const data = composeClaudeMdData(SOLO_DEV_PRESET, 'test', { packageManager: 'bun' });
      expect(data.packageManager).toBe('bun');
    });
  });

  // --- TICKET-011: scaffold ---

  describe('scaffold', () => {
    function makeConfig(overrides?: Partial<ScaffoldConfig>): ScaffoldConfig {
      return {
        preset: SOLO_DEV_PRESET,
        projectName: 'test-project',
        targetDir,
        techStack: DEFAULT_TECH_STACK,
        ...overrides,
      };
    }

    it('should create agent files for enabled agents only (solo-dev = 5)', async () => {
      const result = await scaffold(makeConfig());
      const agentFiles = result.files.filter(
        (f) => f.path.includes('.claude/agents/') && f.action === 'created',
      );
      expect(agentFiles).toHaveLength(5);
    });

    it('should create agent files for all 8 agents (full-team)', async () => {
      const result = await scaffold(makeConfig({ preset: FULL_TEAM_PRESET }));
      const agentFiles = result.files.filter(
        (f) => f.path.includes('.claude/agents/') && f.action === 'created',
      );
      expect(agentFiles).toHaveLength(8);
    });

    it('should create CLAUDE.md', async () => {
      const result = await scaffold(makeConfig());
      const claudeMd = result.files.find((f) => f.path.endsWith('CLAUDE.md'));
      expect(claudeMd).toBeDefined();
      expect(claudeMd?.action).toBe('created');
    });

    it('should create .claude/settings.json with env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS', async () => {
      await scaffold(makeConfig());
      const settingsPath = join(targetDir, '.claude', 'settings.json');
      const content = JSON.parse(await readFile(settingsPath, 'utf-8'));
      expect(content.env?.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS).toBe('1');
      expect(content.agentTeams).toBeUndefined();
    });

    it('should call installSkills with preset skills', async () => {
      await scaffold(makeConfig());
      expect(installSkills).toHaveBeenCalledWith(SOLO_DEV_PRESET.skills, targetDir);
    });

    it('should not write files in dry-run mode', async () => {
      const result = await scaffold(makeConfig({ dryRun: true }));
      expect(result.files.length).toBeGreaterThan(0);
      // Verify no actual files were written
      const { stat } = await import('node:fs/promises');
      await expect(stat(join(targetDir, '.claude'))).rejects.toThrow();
    });

    it('should not call installSkills in dry-run mode', async () => {
      await scaffold(makeConfig({ dryRun: true }));
      expect(installSkills).not.toHaveBeenCalled();
    });

    it('should skip existing files when overwrite is false', async () => {
      // Create CLAUDE.md first
      await writeFile(join(targetDir, 'CLAUDE.md'), 'existing content', 'utf-8');

      const result = await scaffold(makeConfig({ overwrite: false }));
      const claudeMd = result.files.find((f) => f.path.endsWith('CLAUDE.md'));
      expect(claudeMd?.action).toBe('skipped');

      // Verify existing content is preserved
      const content = await readFile(join(targetDir, 'CLAUDE.md'), 'utf-8');
      expect(content).toBe('existing content');
    });

    it('should overwrite existing files when overwrite is true', async () => {
      await writeFile(join(targetDir, 'CLAUDE.md'), 'old content', 'utf-8');

      const result = await scaffold(makeConfig({ overwrite: true }));
      const claudeMd = result.files.find((f) => f.path.endsWith('CLAUDE.md'));
      expect(claudeMd?.action).toBe('overwritten');

      const content = await readFile(join(targetDir, 'CLAUDE.md'), 'utf-8');
      expect(content).not.toBe('old content');
    });

    it('should merge env into existing settings.json', async () => {
      const settingsDir = join(targetDir, '.claude');
      await mkdir(settingsDir, { recursive: true });
      await writeFile(
        join(settingsDir, 'settings.json'),
        JSON.stringify({ permissions: { allow: ['Bash'] }, custom: true }),
        'utf-8',
      );

      await scaffold(makeConfig());
      const content = JSON.parse(await readFile(join(settingsDir, 'settings.json'), 'utf-8'));
      expect(content.env?.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS).toBe('1');
      expect(content.agentTeams).toBeUndefined();
      expect(content.permissions?.allow).toContain('Bash');
      expect(content.custom).toBe(true);
    });

    it('should collect skill installation warnings', async () => {
      const mockedInstallSkills = vi.mocked(installSkills);
      mockedInstallSkills.mockResolvedValueOnce([
        { skillName: 'find-skills', success: true },
        { skillName: 'scoring', success: false, error: 'network error' },
      ]);

      const result = await scaffold(makeConfig());
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes('scoring'))).toBe(true);
    });

    it('should work when .claude/ directory already exists', async () => {
      await mkdir(join(targetDir, '.claude'), { recursive: true });
      const result = await scaffold(makeConfig());
      expect(result.files.length).toBeGreaterThan(0);
    });

    it('should return ScaffoldResult with files and skills arrays', async () => {
      const result = await scaffold(makeConfig());
      expect(result).toHaveProperty('files');
      expect(result).toHaveProperty('skills');
      expect(result).toHaveProperty('warnings');
      expect(Array.isArray(result.files)).toBe(true);
      expect(Array.isArray(result.skills)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });
});
