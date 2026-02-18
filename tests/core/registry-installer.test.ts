import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ItemManifest, RegistryIndex } from '../../src/types/registry.js';
import { AGENTS_DIR, SKILLS_DIR } from '../../src/utils/constants.js';

// Mock registry-client module
vi.mock('../../src/core/registry-client.js', () => ({
  fetchRegistryIndex: vi.fn(),
  fetchItemManifest: vi.fn(),
  fetchItemContent: vi.fn(),
}));

// Mock template-renderer (processContent uses handlebars internally)
vi.mock('../../src/core/template-renderer.js', () => ({
  renderTemplate: vi.fn((content: string) => content),
}));

import {
  fetchItemContent,
  fetchItemManifest,
  fetchRegistryIndex,
} from '../../src/core/registry-client.js';
import { installFromRegistry } from '../../src/core/registry-installer.js';

const mockedFetchIndex = vi.mocked(fetchRegistryIndex);
const mockedFetchManifest = vi.mocked(fetchItemManifest);
const mockedFetchContent = vi.mocked(fetchItemContent);

const MOCK_INDEX: RegistryIndex = {
  version: 1,
  updatedAt: '2026-02-18T00:00:00Z',
  agents: [
    {
      name: 'devops-engineer',
      description: 'CI/CD pipeline management',
      author: 'community',
      version: '1.0.0',
      tags: ['devops'],
      path: 'agents/devops-engineer',
    },
  ],
  skills: [
    {
      name: 'api-design',
      description: 'API design patterns',
      author: 'community',
      version: '1.0.0',
      tags: ['api'],
      path: 'skills/api-design',
    },
  ],
  presets: [],
};

const AGENT_MANIFEST: ItemManifest = {
  name: 'devops-engineer',
  displayName: 'DevOps Engineer',
  description: 'CI/CD pipeline management',
  author: 'community',
  version: '1.0.0',
  tags: ['devops'],
  type: 'agent',
};

const SKILL_MANIFEST: ItemManifest = {
  name: 'api-design',
  displayName: 'API Design',
  description: 'API design patterns',
  author: 'community',
  version: '1.0.0',
  tags: ['api'],
  type: 'skill',
};

const AGENT_CONTENT =
  '---\nname: devops-engineer\ndescription: CI/CD pipeline management\n---\nYou are a devops engineer.';
const SKILL_CONTENT = '# API Design\nDesign patterns for APIs.';

let tempDir: string;

describe('Registry Installer (TICKET-048)', () => {
  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'cas-install-'));
    vi.clearAllMocks();

    mockedFetchIndex.mockResolvedValue(MOCK_INDEX);
  });

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  describe('installFromRegistry — agent', () => {
    it('should install agent file to .claude/agents/', async () => {
      mockedFetchManifest.mockResolvedValue(AGENT_MANIFEST);
      mockedFetchContent.mockResolvedValue(AGENT_CONTENT);

      const result = await installFromRegistry(['devops-engineer'], {
        targetDir: tempDir,
      });

      expect(result.installed).toHaveLength(1);
      expect(result.installed[0].name).toBe('devops-engineer');
      expect(result.installed[0].type).toBe('agent');

      const filePath = join(tempDir, AGENTS_DIR, 'devops-engineer.md');
      const content = await readFile(filePath, 'utf-8');
      expect(content).toContain('devops-engineer');
    });
  });

  describe('installFromRegistry — skill', () => {
    it('should install skill file to .claude/skills/<name>/SKILL.md', async () => {
      mockedFetchManifest.mockResolvedValue(SKILL_MANIFEST);
      mockedFetchContent.mockResolvedValue(SKILL_CONTENT);

      const result = await installFromRegistry(['api-design'], {
        targetDir: tempDir,
      });

      expect(result.installed).toHaveLength(1);
      expect(result.installed[0].name).toBe('api-design');
      expect(result.installed[0].type).toBe('skill');

      const filePath = join(tempDir, SKILLS_DIR, 'api-design', 'SKILL.md');
      const content = await readFile(filePath, 'utf-8');
      expect(content).toContain('API Design');
    });
  });

  describe('installFromRegistry — not found', () => {
    it('should skip and report when item not found in registry', async () => {
      const result = await installFromRegistry(['nonexistent-thing'], {
        targetDir: tempDir,
      });

      expect(result.installed).toHaveLength(0);
      expect(result.skipped).toHaveLength(1);
      expect(result.skipped[0].name).toBe('nonexistent-thing');
      expect(result.skipped[0].reason).toContain('not found');
    });
  });

  describe('installFromRegistry — conflict handling', () => {
    it('should skip when file exists and --yes mode (default skip)', async () => {
      mockedFetchManifest.mockResolvedValue(AGENT_MANIFEST);
      mockedFetchContent.mockResolvedValue(AGENT_CONTENT);

      // Pre-create the file
      const agentDir = join(tempDir, AGENTS_DIR);
      await mkdir(agentDir, { recursive: true });
      await writeFile(join(agentDir, 'devops-engineer.md'), 'existing content', 'utf-8');

      const result = await installFromRegistry(['devops-engineer'], {
        targetDir: tempDir,
        yes: true,
      });

      expect(result.skipped).toHaveLength(1);
      expect(result.skipped[0].reason).toContain('already exists');

      // Verify original content preserved
      const content = await readFile(join(agentDir, 'devops-engineer.md'), 'utf-8');
      expect(content).toBe('existing content');
    });

    it('should overwrite when force is true', async () => {
      mockedFetchManifest.mockResolvedValue(AGENT_MANIFEST);
      mockedFetchContent.mockResolvedValue(AGENT_CONTENT);

      // Pre-create the file
      const agentDir = join(tempDir, AGENTS_DIR);
      await mkdir(agentDir, { recursive: true });
      await writeFile(join(agentDir, 'devops-engineer.md'), 'old content', 'utf-8');

      const result = await installFromRegistry(['devops-engineer'], {
        targetDir: tempDir,
        force: true,
      });

      expect(result.installed).toHaveLength(1);

      const content = await readFile(join(agentDir, 'devops-engineer.md'), 'utf-8');
      expect(content).toContain('devops-engineer');
      expect(content).not.toBe('old content');
    });

    it('should use onConflict callback when provided', async () => {
      mockedFetchManifest.mockResolvedValue(AGENT_MANIFEST);
      mockedFetchContent.mockResolvedValue(AGENT_CONTENT);

      // Pre-create the file
      const agentDir = join(tempDir, AGENTS_DIR);
      await mkdir(agentDir, { recursive: true });
      await writeFile(join(agentDir, 'devops-engineer.md'), 'old', 'utf-8');

      const onConflict = vi.fn().mockResolvedValue('overwrite');

      const result = await installFromRegistry(['devops-engineer'], {
        targetDir: tempDir,
        onConflict,
      });

      expect(onConflict).toHaveBeenCalled();
      expect(result.installed).toHaveLength(1);
    });
  });

  describe('installFromRegistry — dependencies', () => {
    it('should detect and install missing dependencies with --yes', async () => {
      const agentWithDeps: ItemManifest = {
        ...AGENT_MANIFEST,
        dependencies: { skills: ['api-design'] },
      };

      mockedFetchManifest
        .mockResolvedValueOnce(agentWithDeps) // first call: agent manifest
        .mockResolvedValueOnce(SKILL_MANIFEST); // second call: dependency manifest

      mockedFetchContent
        .mockResolvedValueOnce(AGENT_CONTENT) // agent content
        .mockResolvedValueOnce(SKILL_CONTENT); // skill content

      const result = await installFromRegistry(['devops-engineer'], {
        targetDir: tempDir,
        yes: true,
      });

      // Agent should be installed
      expect(result.installed.some((i) => i.name === 'devops-engineer')).toBe(true);
    });

    it('should warn when dependencies are skipped', async () => {
      const agentWithDeps: ItemManifest = {
        ...AGENT_MANIFEST,
        dependencies: { skills: ['api-design'] },
      };

      mockedFetchManifest.mockResolvedValue(agentWithDeps);
      mockedFetchContent.mockResolvedValue(AGENT_CONTENT);

      const onDependencies = vi.fn().mockResolvedValue(false);

      const result = await installFromRegistry(['devops-engineer'], {
        targetDir: tempDir,
        onDependencies,
      });

      expect(result.warnings.some((w) => w.includes('api-design'))).toBe(true);
    });
  });

  describe('installFromRegistry — multiple items', () => {
    it('should install multiple items in a single call', async () => {
      mockedFetchManifest
        .mockResolvedValueOnce(AGENT_MANIFEST)
        .mockResolvedValueOnce(SKILL_MANIFEST);

      mockedFetchContent.mockResolvedValueOnce(AGENT_CONTENT).mockResolvedValueOnce(SKILL_CONTENT);

      const result = await installFromRegistry(['devops-engineer', 'api-design'], {
        targetDir: tempDir,
      });

      expect(result.installed).toHaveLength(2);
    });
  });

  describe('installFromRegistry — minCliVersion warning', () => {
    it('should add warning when minCliVersion is specified', async () => {
      const manifestWithVersion: ItemManifest = {
        ...AGENT_MANIFEST,
        minCliVersion: '0.3.0',
      };

      mockedFetchManifest.mockResolvedValue(manifestWithVersion);
      mockedFetchContent.mockResolvedValue(AGENT_CONTENT);

      const result = await installFromRegistry(['devops-engineer'], {
        targetDir: tempDir,
      });

      expect(result.warnings.some((w) => w.includes('0.3.0'))).toBe(true);
    });
  });
});
