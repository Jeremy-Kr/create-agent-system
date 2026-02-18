import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ItemManifest, RegistryIndex } from '../../src/types/registry.js';
import { AGENTS_DIR, SKILLS_DIR } from '../../src/utils/constants.js';

// Mock registry-client (no real HTTP in tests)
vi.mock('../../src/core/registry-client.js', () => ({
  fetchRegistryIndex: vi.fn(),
  fetchItemManifest: vi.fn(),
  fetchItemContent: vi.fn(),
}));

import {
  fetchItemContent,
  fetchItemManifest,
  fetchRegistryIndex,
} from '../../src/core/registry-client.js';
import { installFromRegistry } from '../../src/core/registry-installer.js';
import { findEntry, listRegistry, searchRegistry } from '../../src/core/registry-search.js';
import { fileExists } from '../../src/utils/fs.js';

const mockedFetchIndex = vi.mocked(fetchRegistryIndex);
const mockedFetchManifest = vi.mocked(fetchItemManifest);
const mockedFetchContent = vi.mocked(fetchItemContent);

const MOCK_INDEX: RegistryIndex = {
  version: 1,
  updatedAt: '2026-02-18T00:00:00Z',
  agents: [
    {
      name: 'devops-engineer',
      description: 'CI/CD pipeline management and DevOps automation',
      author: 'community',
      version: '1.0.0',
      tags: ['devops', 'ci-cd'],
      path: 'agents/devops-engineer',
    },
    {
      name: 'security-reviewer',
      description: 'Security audit and code review',
      author: 'community',
      version: '1.0.0',
      tags: ['security', 'audit'],
      path: 'agents/security-reviewer',
    },
  ],
  skills: [
    {
      name: 'api-design',
      description: 'API design patterns and best practices',
      author: 'community',
      version: '1.0.0',
      tags: ['api', 'design'],
      path: 'skills/api-design',
    },
    {
      name: 'database-migration',
      description: 'Database migration strategies',
      author: 'community',
      version: '1.0.0',
      tags: ['database', 'migration'],
      path: 'skills/database-migration',
    },
  ],
  presets: [
    {
      name: 'react-fullstack',
      description: 'React fullstack development preset',
      author: 'community',
      version: '1.0.0',
      tags: ['react', 'fullstack'],
      path: 'presets/react-fullstack',
    },
  ],
};

const AGENT_MANIFEST: ItemManifest = {
  name: 'devops-engineer',
  displayName: 'DevOps Engineer',
  description: 'CI/CD pipeline management',
  author: 'community',
  version: '1.0.0',
  tags: ['devops', 'ci-cd'],
  type: 'agent',
};

const SKILL_MANIFEST: ItemManifest = {
  name: 'api-design',
  displayName: 'API Design',
  description: 'API design patterns',
  author: 'community',
  version: '1.0.0',
  tags: ['api', 'design'],
  type: 'skill',
};

let tempDir: string;

describe('Registry Integration (TICKET-050)', () => {
  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'cas-integration-'));
    vi.clearAllMocks();
    mockedFetchIndex.mockResolvedValue(MOCK_INDEX);
  });

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  describe('search → find → install pipeline', () => {
    it('should search, find entry, then install agent', async () => {
      // 1. Search
      const results = searchRegistry(MOCK_INDEX, 'devops');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe('devops-engineer');

      // 2. Find specific entry
      const found = findEntry(MOCK_INDEX, 'devops-engineer', 'agent');
      expect(found).not.toBeNull();
      expect(found?.type).toBe('agent');

      // 3. Install
      mockedFetchManifest.mockResolvedValue(AGENT_MANIFEST);
      mockedFetchContent.mockResolvedValue(
        '---\nname: devops-engineer\ndescription: DevOps\n---\nYou are a devops engineer.',
      );

      const installResult = await installFromRegistry(['devops-engineer'], {
        targetDir: tempDir,
      });

      expect(installResult.installed).toHaveLength(1);
      const agentFile = join(tempDir, AGENTS_DIR, 'devops-engineer.md');
      expect(await fileExists(agentFile)).toBe(true);
    });
  });

  describe('list with type filter', () => {
    it('should list only agents', () => {
      const agents = listRegistry(MOCK_INDEX, { type: 'agent' });
      expect(agents).toHaveLength(2);
      expect(agents.every((a) => a.type === 'agent')).toBe(true);
    });

    it('should list only skills', () => {
      const skills = listRegistry(MOCK_INDEX, { type: 'skill' });
      expect(skills).toHaveLength(2);
      expect(skills.every((s) => s.type === 'skill')).toBe(true);
    });

    it('should list only presets', () => {
      const presets = listRegistry(MOCK_INDEX, { type: 'preset' });
      expect(presets).toHaveLength(1);
      expect(presets[0].name).toBe('react-fullstack');
    });

    it('should list all items when no type filter', () => {
      const all = listRegistry(MOCK_INDEX);
      expect(all).toHaveLength(5);
    });
  });

  describe('search with tag filter', () => {
    it('should filter by tag', () => {
      const results = searchRegistry(MOCK_INDEX, 'devops', { tag: 'ci-cd' });
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe('devops-engineer');
    });

    it('should return empty when tag does not match', () => {
      const results = searchRegistry(MOCK_INDEX, 'devops', { tag: 'nonexistent' });
      expect(results).toHaveLength(0);
    });
  });

  describe('install multiple items', () => {
    it('should install agent and skill together', async () => {
      mockedFetchManifest
        .mockResolvedValueOnce(AGENT_MANIFEST)
        .mockResolvedValueOnce(SKILL_MANIFEST);

      mockedFetchContent
        .mockResolvedValueOnce('---\nname: devops-engineer\n---\nAgent content')
        .mockResolvedValueOnce('# API Design\nSkill content');

      const result = await installFromRegistry(['devops-engineer', 'api-design'], {
        targetDir: tempDir,
      });

      expect(result.installed).toHaveLength(2);

      const agentFile = join(tempDir, AGENTS_DIR, 'devops-engineer.md');
      const skillFile = join(tempDir, SKILLS_DIR, 'api-design', 'SKILL.md');
      expect(await fileExists(agentFile)).toBe(true);
      expect(await fileExists(skillFile)).toBe(true);
    });
  });

  describe('install with existing files', () => {
    it('should skip existing, install new', async () => {
      // Pre-create agent
      const agentDir = join(tempDir, AGENTS_DIR);
      await mkdir(agentDir, { recursive: true });
      await writeFile(join(agentDir, 'devops-engineer.md'), 'existing', 'utf-8');

      mockedFetchManifest
        .mockResolvedValueOnce(AGENT_MANIFEST)
        .mockResolvedValueOnce(SKILL_MANIFEST);

      mockedFetchContent
        .mockResolvedValueOnce('---\nname: devops-engineer\n---\nNew content')
        .mockResolvedValueOnce('# API Design\nSkill content');

      const result = await installFromRegistry(['devops-engineer', 'api-design'], {
        targetDir: tempDir,
        yes: true,
      });

      expect(result.installed).toHaveLength(1);
      expect(result.installed[0].name).toBe('api-design');
      expect(result.skipped).toHaveLength(1);
      expect(result.skipped[0].name).toBe('devops-engineer');

      // Original content preserved
      const content = await readFile(join(agentDir, 'devops-engineer.md'), 'utf-8');
      expect(content).toBe('existing');
    });
  });

  describe('install with dependency chain', () => {
    it('should install agent and its skill dependency', async () => {
      const agentWithDeps: ItemManifest = {
        ...AGENT_MANIFEST,
        dependencies: { skills: ['api-design'] },
      };

      mockedFetchManifest
        .mockResolvedValueOnce(agentWithDeps) // agent
        .mockResolvedValueOnce(SKILL_MANIFEST); // dependency

      mockedFetchContent
        .mockResolvedValueOnce('---\nname: devops-engineer\n---\nAgent')
        .mockResolvedValueOnce('# API Design\nSkill');

      const result = await installFromRegistry(['devops-engineer'], {
        targetDir: tempDir,
        yes: true,
      });

      expect(result.installed.some((i) => i.name === 'devops-engineer')).toBe(true);

      const skillFile = join(tempDir, SKILLS_DIR, 'api-design', 'SKILL.md');
      expect(await fileExists(skillFile)).toBe(true);
    });
  });
});
