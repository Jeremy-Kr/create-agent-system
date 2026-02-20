import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadPreset } from '../../src/core/preset-loader.js';
import { scaffold } from '../../src/core/scaffolder.js';
import { validate } from '../../src/core/validator.js';
import type { TechStackInfo } from '../../src/types/config.js';

// Mock child_process to prevent actual `npx skills add` network calls
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

describe('Integration: Scaffolding Pipeline (TICKET-018)', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'cas-integration-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  // --- solo-dev preset ---
  describe('solo-dev preset', () => {
    it('should produce correct files', async () => {
      const preset = await loadPreset('solo-dev');
      const result = await scaffold({
        preset,
        projectName: 'test-app',
        targetDir: tmpDir,
        techStack: DEFAULT_TECH_STACK,
      });

      const agentFiles = await readdir(join(tmpDir, '.claude', 'agents'));
      const expectedAgents = [
        'po-pm.md',
        'test-writer.md',
        'frontend-dev.md',
        'backend-dev.md',
        'qa-reviewer.md',
      ];
      const excludedAgents = ['architect.md', 'cto.md', 'designer.md'];

      for (const agent of expectedAgents) {
        expect(agentFiles).toContain(agent);
      }
      for (const agent of excludedAgents) {
        expect(agentFiles).not.toContain(agent);
      }

      // CLAUDE.md and settings.json should exist
      const rootFiles = await readdir(tmpDir);
      expect(rootFiles).toContain('CLAUDE.md');

      const settingsPath = join(tmpDir, '.claude', 'settings.json');
      const settings = JSON.parse(await readFile(settingsPath, 'utf-8'));
      expect(settings.env?.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS).toBe('1');
      expect(settings.agentTeams).toBeUndefined();

      // Result should record all files
      expect(result.files.length).toBeGreaterThanOrEqual(7); // 5 agents + CLAUDE.md + settings.json
    });

    it('should have correct frontmatter in agents', async () => {
      const preset = await loadPreset('solo-dev');
      await scaffold({
        preset,
        projectName: 'test-app',
        targetDir: tmpDir,
        techStack: DEFAULT_TECH_STACK,
      });

      // Helper to parse agent file content
      const getAgentContent = async (agentName: string) => {
        return readFile(join(tmpDir, '.claude', 'agents', `${agentName}.md`), 'utf-8');
      };

      // All solo-dev agents should have model: opus, no color
      for (const agent of ['po-pm', 'test-writer', 'frontend-dev', 'backend-dev', 'qa-reviewer']) {
        const content = await getAgentContent(agent);
        expect(content).toContain('model: opus');
        // tools should be comma-separated, not JSON array
        expect(content).toContain('tools: Read, Write, Edit, Grep, Glob, Bash');
        expect(content).not.toContain('["Read"');
        // Should NOT have color field
        expect(content).not.toMatch(/^color:/m);
        // Should NOT have permissionMode in frontmatter
        expect(content).not.toMatch(/^permissionMode:/m);
        // Should have <example> blocks in description
        expect(content).toContain('<example>');
      }

      // backend-dev should have skills: scoring
      const beContent = await getAgentContent('backend-dev');
      expect(beContent).toContain('skills: scoring');

      // po-pm should have skills with scoring, ticket-writing, cr-process
      const poContent = await getAgentContent('po-pm');
      expect(poContent).toContain('skills:');
      expect(poContent).toContain('scoring');
    });

    it('should generate CLAUDE.md without EPIC section but with visual QA', async () => {
      const preset = await loadPreset('solo-dev');
      await scaffold({
        preset,
        projectName: 'test-app',
        targetDir: tmpDir,
        techStack: DEFAULT_TECH_STACK,
      });

      const claudeMd = await readFile(join(tmpDir, 'CLAUDE.md'), 'utf-8');

      // solo-dev: epicBased is false
      expect(claudeMd).not.toMatch(/EPIC/i);

      // solo-dev: visualQaLevel 1
      expect(claudeMd).toContain('Level 1');

      // Should contain failure modes section
      expect(claudeMd.toLowerCase()).toContain('failure');
    });

    it('should pass validation', async () => {
      const preset = await loadPreset('solo-dev');
      await scaffold({
        preset,
        projectName: 'test-app',
        targetDir: tmpDir,
        techStack: DEFAULT_TECH_STACK,
      });

      const result = await validate(tmpDir);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.stats.agentCount).toBe(5);
    });
  });

  // --- small-team preset ---
  describe('small-team preset', () => {
    it('should produce all 8 agent files', async () => {
      const preset = await loadPreset('small-team');
      await scaffold({
        preset,
        projectName: 'test-app',
        targetDir: tmpDir,
        techStack: DEFAULT_TECH_STACK,
      });

      const agentFiles = await readdir(join(tmpDir, '.claude', 'agents'));
      expect(agentFiles).toHaveLength(8);

      const expectedAgents = [
        'po-pm.md',
        'architect.md',
        'cto.md',
        'designer.md',
        'test-writer.md',
        'frontend-dev.md',
        'backend-dev.md',
        'qa-reviewer.md',
      ];
      for (const agent of expectedAgents) {
        expect(agentFiles).toContain(agent);
      }

      // settings.json
      const settings = JSON.parse(
        await readFile(join(tmpDir, '.claude', 'settings.json'), 'utf-8'),
      );
      expect(settings.env?.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS).toBe('1');
      expect(settings.agentTeams).toBeUndefined();
    });

    it('should have skills and example blocks in all agents', async () => {
      const preset = await loadPreset('small-team');
      await scaffold({
        preset,
        projectName: 'test-app',
        targetDir: tmpDir,
        techStack: DEFAULT_TECH_STACK,
      });

      const allAgents = [
        'po-pm',
        'architect',
        'cto',
        'designer',
        'test-writer',
        'frontend-dev',
        'backend-dev',
        'qa-reviewer',
      ];

      for (const agent of allAgents) {
        const content = await readFile(join(tmpDir, '.claude', 'agents', `${agent}.md`), 'utf-8');
        // Should NOT have color field
        expect(content).not.toMatch(/^color:/m);
        // Should have <example> blocks
        expect(content).toContain('<example>');
        // tools should be comma-separated
        expect(content).toContain('tools: Read, Write, Edit, Grep, Glob, Bash');
        // Should have skills for agents with default skills
        expect(content).toContain('skills:');
      }
    });

    it('should generate CLAUDE.md with EPIC section', async () => {
      const preset = await loadPreset('small-team');
      await scaffold({
        preset,
        projectName: 'test-app',
        targetDir: tmpDir,
        techStack: DEFAULT_TECH_STACK,
      });

      const claudeMd = await readFile(join(tmpDir, 'CLAUDE.md'), 'utf-8');

      // small-team: epicBased is true
      expect(claudeMd).toMatch(/EPIC/i);

      // small-team: visualQaLevel 2
      expect(claudeMd).toContain('Level 2');

      // All 8 agents should appear in context rules
      const allAgentNames = [
        'PO/PM',
        'Architect',
        'CTO',
        'Designer',
        'Test Writer',
        'Frontend Dev',
        'Backend Dev',
        'QA Reviewer',
      ];
      for (const name of allAgentNames) {
        expect(claudeMd).toContain(name);
      }
    });

    it('should pass validation', async () => {
      const preset = await loadPreset('small-team');
      await scaffold({
        preset,
        projectName: 'test-app',
        targetDir: tmpDir,
        techStack: DEFAULT_TECH_STACK,
      });

      const result = await validate(tmpDir);
      expect(result.valid).toBe(true);
      expect(result.stats.agentCount).toBe(8);
    });
  });

  // --- full-team preset ---
  describe('full-team preset', () => {
    it('should produce same structure as small-team', async () => {
      const preset = await loadPreset('full-team');
      await scaffold({
        preset,
        projectName: 'test-app',
        targetDir: tmpDir,
        techStack: DEFAULT_TECH_STACK,
      });

      const agentFiles = await readdir(join(tmpDir, '.claude', 'agents'));
      expect(agentFiles).toHaveLength(8);
    });

    it('should have visual QA Level 3 in CLAUDE.md', async () => {
      const preset = await loadPreset('full-team');
      await scaffold({
        preset,
        projectName: 'test-app',
        targetDir: tmpDir,
        techStack: DEFAULT_TECH_STACK,
      });

      const claudeMd = await readFile(join(tmpDir, 'CLAUDE.md'), 'utf-8');
      expect(claudeMd).toContain('Level 3');
    });

    it('should pass validation', async () => {
      const preset = await loadPreset('full-team');
      await scaffold({
        preset,
        projectName: 'test-app',
        targetDir: tmpDir,
        techStack: DEFAULT_TECH_STACK,
      });

      const result = await validate(tmpDir);
      expect(result.valid).toBe(true);
      expect(result.stats.agentCount).toBe(8);
    });
  });

  // --- Cross-cutting integration tests ---
  describe('cross-cutting', () => {
    it('should not create any files in dry-run mode', async () => {
      const preset = await loadPreset('solo-dev');
      const result = await scaffold({
        preset,
        projectName: 'test-app',
        targetDir: tmpDir,
        techStack: DEFAULT_TECH_STACK,
        dryRun: true,
      });

      // Temp dir should be empty
      const contents = await readdir(tmpDir);
      expect(contents).toHaveLength(0);

      // But result.files should record what would be done
      expect(result.files.length).toBeGreaterThan(0);
    });

    it('should not overwrite existing files by default', async () => {
      // Pre-create a custom CLAUDE.md
      const customContent = '# My Custom CLAUDE.md\nDo not overwrite me!';
      await writeFile(join(tmpDir, 'CLAUDE.md'), customContent, 'utf-8');

      const preset = await loadPreset('solo-dev');
      const result = await scaffold({
        preset,
        projectName: 'test-app',
        targetDir: tmpDir,
        techStack: DEFAULT_TECH_STACK,
        overwrite: false,
      });

      // CLAUDE.md should still have custom content
      const content = await readFile(join(tmpDir, 'CLAUDE.md'), 'utf-8');
      expect(content).toBe(customContent);

      // Result should show CLAUDE.md as skipped
      const claudeMdEntry = result.files.find((f) => f.path.endsWith('CLAUDE.md'));
      expect(claudeMdEntry?.action).toBe('skipped');
    });

    it('should overwrite existing files when overwrite is true', async () => {
      // Pre-create a CLAUDE.md
      await writeFile(join(tmpDir, 'CLAUDE.md'), 'old content', 'utf-8');

      const preset = await loadPreset('solo-dev');
      await scaffold({
        preset,
        projectName: 'test-app',
        targetDir: tmpDir,
        techStack: DEFAULT_TECH_STACK,
        overwrite: true,
      });

      // CLAUDE.md should have been replaced
      const content = await readFile(join(tmpDir, 'CLAUDE.md'), 'utf-8');
      expect(content).not.toBe('old content');
      expect(content).toContain('test-app'); // Generated content should include project name
    });

    it('should merge settings.json with existing config', async () => {
      // Pre-create settings.json with existing permissions
      await mkdir(join(tmpDir, '.claude'), { recursive: true });
      await writeFile(
        join(tmpDir, '.claude', 'settings.json'),
        JSON.stringify({ permissions: { allow: ['Read'] } }),
        'utf-8',
      );

      const preset = await loadPreset('solo-dev');
      await scaffold({
        preset,
        projectName: 'test-app',
        targetDir: tmpDir,
        techStack: DEFAULT_TECH_STACK,
      });

      const settings = JSON.parse(
        await readFile(join(tmpDir, '.claude', 'settings.json'), 'utf-8'),
      );

      // Both existing and new settings should be present
      expect(settings.permissions).toEqual({ allow: ['Read'] });
      expect(settings.env?.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS).toBe('1');
      expect(settings.agentTeams).toBeUndefined();
    });

    it('should detect invalid agent setup via validator', async () => {
      // Create minimal valid structure
      const preset = await loadPreset('solo-dev');
      await scaffold({
        preset,
        projectName: 'test-app',
        targetDir: tmpDir,
        techStack: DEFAULT_TECH_STACK,
      });

      // Now break an agent file with invalid frontmatter
      await writeFile(
        join(tmpDir, '.claude', 'agents', 'bad-agent.md'),
        '---\ninvalid: yaml: bad: nesting\n---\nBody',
        'utf-8',
      );

      const result = await validate(tmpDir);
      // The valid agents should still be counted, but the bad one should trigger errors
      const yamlErrors = result.errors.filter((e) => e.rule === 'YAML_PARSE_ERROR');
      // bad-agent.md may parse as valid YAML but fail on MISSING_NAME/MISSING_DESCRIPTION
      const nameErrors = result.errors.filter((e) => e.rule === 'MISSING_NAME');
      const descErrors = result.errors.filter((e) => e.rule === 'MISSING_DESCRIPTION');
      expect(yamlErrors.length + nameErrors.length + descErrors.length).toBeGreaterThan(0);
    });

    it('should detect missing skill reference via validator', async () => {
      // Create a minimal agent with a nonexistent skill
      await mkdir(join(tmpDir, '.claude', 'agents'), { recursive: true });
      await writeFile(join(tmpDir, 'CLAUDE.md'), '# Test Project', 'utf-8');
      await writeFile(
        join(tmpDir, '.claude', 'agents', 'test-agent.md'),
        '---\nname: Test Agent\ndescription: An agent for testing purposes\nskills: nonexistent-skill\n---\nBody content here.',
        'utf-8',
      );

      const result = await validate(tmpDir);
      expect(result.valid).toBe(false);
      const skillErrors = result.errors.filter((e) => e.rule === 'INVALID_SKILL_REFERENCE');
      expect(skillErrors).toHaveLength(1);
      expect(skillErrors[0].message).toContain('nonexistent-skill');
    });
  });
});
