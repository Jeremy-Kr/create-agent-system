import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  renderAgentTemplate,
  renderClaudeMdTemplate,
  renderTemplate,
} from '../../src/core/template-renderer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturesDir = join(__dirname, '..', 'fixtures');

describe('Template Renderer (TICKET-006)', () => {
  describe('renderTemplate — variable substitution', () => {
    it('should render simple variables', async () => {
      const result = await renderTemplate(join(fixturesDir, 'simple.hbs'), {
        name: 'World',
        model: 'opus',
      });
      expect(result).toContain('Hello, World!');
      expect(result).toContain('Model: opus');
    });

    it('should render {{model}} and {{packageManager}} variables', async () => {
      const result = await renderTemplate(join(fixturesDir, 'agent-like.hbs'), {
        model: 'sonnet',
        packageManager: 'pnpm',
        visualQa: false,
      });
      expect(result).toContain('model: sonnet');
      expect(result).toContain('pnpm test');
    });
  });

  describe('renderTemplate — conditional blocks', () => {
    it('should render {{#if}} block when condition is true', async () => {
      const result = await renderTemplate(join(fixturesDir, 'conditional.hbs'), {
        visualQa: true,
        visualQaLevel: 3,
      });
      expect(result).toContain('Visual QA enabled at Level 3');
    });

    it('should hide {{#if}} block when condition is false', async () => {
      const result = await renderTemplate(join(fixturesDir, 'conditional.hbs'), {
        visualQa: false,
      });
      expect(result).not.toContain('Visual QA enabled');
    });

    it('should render {{#unless}} block when condition is false', async () => {
      const result = await renderTemplate(join(fixturesDir, 'conditional.hbs'), {
        visualQa: false,
      });
      expect(result).toContain('No Visual QA');
    });

    it('should hide {{#unless}} block when condition is true', async () => {
      const result = await renderTemplate(join(fixturesDir, 'conditional.hbs'), {
        visualQa: true,
        visualQaLevel: 2,
      });
      expect(result).not.toContain('No Visual QA');
    });
  });

  describe('renderTemplate — {{#each}} loops', () => {
    it('should render each item in an array', async () => {
      const result = await renderTemplate(join(fixturesDir, 'each-loop.hbs'), {
        agents: [
          { name: 'po-pm', role: 'Product Owner' },
          { name: 'cto', role: 'Tech Lead' },
        ],
      });
      expect(result).toContain('po-pm');
      expect(result).toContain('Product Owner');
      expect(result).toContain('cto');
      expect(result).toContain('Tech Lead');
    });

    it('should produce empty table body when array is empty', async () => {
      const result = await renderTemplate(join(fixturesDir, 'each-loop.hbs'), {
        agents: [],
      });
      expect(result).toContain('| Agent | Role |');
      expect(result).not.toContain('po-pm');
    });
  });

  describe('renderTemplate — error handling', () => {
    it('should throw on missing template file', async () => {
      await expect(renderTemplate(join(fixturesDir, 'nonexistent.hbs'), {})).rejects.toThrow(
        /not found|ENOENT/i,
      );
    });

    it('should throw on malformed Handlebars template', async () => {
      const tmpDir = await mkdtemp(join(tmpdir(), 'template-test-'));
      const badTemplate = join(tmpDir, 'bad.hbs');
      await writeFile(badTemplate, '{{#if unclosed');
      await expect(renderTemplate(badTemplate, { unclosed: true })).rejects.toThrow();
      await rm(tmpDir, { recursive: true, force: true });
    });
  });

  describe('renderTemplate — undefined optional variables', () => {
    it('should handle undefined variables gracefully (empty output)', async () => {
      const result = await renderTemplate(join(fixturesDir, 'simple.hbs'), {
        name: 'Test',
        // model is intentionally omitted
      });
      expect(result).toContain('Hello, Test!');
      expect(result).toContain('Model: '); // model is undefined, renders empty
    });
  });

  describe('renderTemplate — skills line omission', () => {
    it('should not render skills line when skills is undefined', async () => {
      const result = await renderTemplate(join(fixturesDir, 'agent-like.hbs'), {
        model: 'opus',
        packageManager: 'pnpm',
        visualQa: false,
        // skills is intentionally omitted
      });
      expect(result).not.toContain('skills:');
    });

    it('should render skills line when skills is provided', async () => {
      const result = await renderTemplate(join(fixturesDir, 'agent-like.hbs'), {
        model: 'opus',
        packageManager: 'pnpm',
        skills: 'scoring, tdd-workflow',
        visualQa: false,
      });
      expect(result).toContain('skills: scoring, tdd-workflow');
    });
  });

  describe('renderAgentTemplate', () => {
    it('should be a convenience function that renders agent templates', async () => {
      // This test validates the function signature and basic behavior.
      // It should resolve agent template path from templates/agents/<name>.md.hbs
      await expect(
        renderAgentTemplate('po-pm', {
          model: 'opus',
          packageManager: 'pnpm',
          visualQa: false,
          epicBased: false,
        }),
      ).resolves.toBeDefined();
    });

    it('should render agent template with provided data', async () => {
      const result = await renderAgentTemplate('backend-dev', {
        model: 'opus',
        packageManager: 'pnpm',
        visualQa: true,
        visualQaLevel: 2,
        epicBased: true,
      });
      expect(result).toContain('backend-dev');
      expect(result).toContain('model: opus');
    });
  });

  describe('renderClaudeMdTemplate', () => {
    it('should be a convenience function that renders CLAUDE.md', async () => {
      await expect(
        renderClaudeMdTemplate({
          projectName: 'test-project',
          packageManager: 'pnpm',
          visualQa: false,
          epicBased: false,
          activeAgents: [],
          fileOwnership: [],
        }),
      ).resolves.toBeDefined();
    });

    it('should render project name and package manager', async () => {
      const result = await renderClaudeMdTemplate({
        projectName: 'my-app',
        packageManager: 'yarn',
        visualQa: true,
        visualQaLevel: 3,
        epicBased: true,
        activeAgents: [
          { displayName: 'PO/PM', alwaysRead: 'spec.md', onDemand: 'adr/', exclude: 'src/' },
        ],
        fileOwnership: [{ path: 'src/core/', owner: 'backend-dev' }],
      });
      expect(result).toContain('my-app');
      expect(result).toContain('yarn');
    });

    it('should render solo-dev CLAUDE.md without EPIC section', async () => {
      const result = await renderClaudeMdTemplate({
        projectName: 'solo-project',
        packageManager: 'pnpm',
        visualQa: true,
        visualQaLevel: 1,
        epicBased: false,
        activeAgents: [
          { displayName: 'PO/PM', alwaysRead: 'spec.md', onDemand: 'adr/', exclude: 'src/' },
          {
            displayName: 'Test Writer',
            alwaysRead: 'spec.md',
            onDemand: 'src/types/',
            exclude: 'src/core/',
          },
          {
            displayName: 'Backend Dev',
            alwaysRead: 'adr/',
            onDemand: 'spec.md',
            exclude: 'src/components/',
          },
        ],
        fileOwnership: [{ path: 'src/core/', owner: 'backend-dev' }],
      });
      expect(result).toContain('solo-project');
      expect(result).toContain('Level 1');
      expect(result).not.toContain('EPIC Dependency');
      expect(result).toContain('PO/PM');
      expect(result).toContain('Backend Dev');
    });

    it('should render full-team CLAUDE.md with EPIC section', async () => {
      const result = await renderClaudeMdTemplate({
        projectName: 'full-project',
        packageManager: 'pnpm',
        visualQa: true,
        visualQaLevel: 3,
        epicBased: true,
        activeAgents: [
          { displayName: 'PO/PM', alwaysRead: 'spec.md', onDemand: 'adr/', exclude: 'src/' },
          { displayName: 'Architect', alwaysRead: 'adr/', onDemand: 'tickets/', exclude: 'src/' },
          { displayName: 'CTO', alwaysRead: 'adr/', onDemand: 'tickets/', exclude: 'src/' },
          {
            displayName: 'Designer',
            alwaysRead: 'design-system.md',
            onDemand: 'spec.md',
            exclude: 'src/api/',
          },
          {
            displayName: 'Test Writer',
            alwaysRead: 'spec.md',
            onDemand: 'src/types/',
            exclude: 'src/core/',
          },
          {
            displayName: 'Frontend Dev',
            alwaysRead: 'design-system.md',
            onDemand: 'spec.md',
            exclude: 'src/api/',
          },
          {
            displayName: 'Backend Dev',
            alwaysRead: 'adr/',
            onDemand: 'spec.md',
            exclude: 'src/components/',
          },
          { displayName: 'QA Reviewer', alwaysRead: 'spec.md', onDemand: 'adr/', exclude: '-' },
        ],
        fileOwnership: [
          { path: 'src/core/', owner: 'backend-dev' },
          { path: 'src/components/', owner: 'frontend-dev' },
        ],
      });
      expect(result).toContain('full-project');
      expect(result).toContain('Level 3');
      expect(result).toContain('EPIC Dependency');
      expect(result).toContain('Architect');
      expect(result).toContain('Designer');
    });
  });
});
