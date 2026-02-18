import { describe, expect, it } from 'vitest';
import { findEntry, listRegistry, searchRegistry } from '../../src/core/registry-search.js';
import type { RegistryIndex } from '../../src/types/registry.js';

const MOCK_INDEX: RegistryIndex = {
  version: 1,
  updatedAt: '2026-02-18T00:00:00Z',
  agents: [
    {
      name: 'devops-engineer',
      description: 'CI/CD pipeline management',
      author: 'community',
      version: '1.0.0',
      tags: ['devops', 'ci-cd'],
      path: 'agents/devops-engineer',
    },
    {
      name: 'security-reviewer',
      description: 'Security audit and review',
      author: 'community',
      version: '1.0.0',
      tags: ['security'],
      path: 'agents/security-reviewer',
    },
  ],
  skills: [
    {
      name: 'api-design',
      description: 'API design patterns',
      author: 'community',
      version: '1.0.0',
      tags: ['api', 'design'],
      path: 'skills/api-design',
    },
  ],
  presets: [
    {
      name: 'react-fullstack',
      description: 'React fullstack development',
      author: 'community',
      version: '1.0.0',
      tags: ['react', 'fullstack'],
      path: 'presets/react-fullstack',
    },
  ],
};

describe('Registry Search (TICKET-047)', () => {
  describe('searchRegistry', () => {
    it('should match by exact name (score 100)', () => {
      const results = searchRegistry(MOCK_INDEX, 'devops-engineer');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('devops-engineer');
      expect(results[0].score).toBe(100);
    });

    it('should match by name substring', () => {
      const results = searchRegistry(MOCK_INDEX, 'devops');
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].name).toBe('devops-engineer');
      expect(results[0].score).toBeGreaterThan(0);
    });

    it('should match by description', () => {
      const results = searchRegistry(MOCK_INDEX, 'pipeline');
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].name).toBe('devops-engineer');
    });

    it('should match by tag', () => {
      const results = searchRegistry(MOCK_INDEX, 'security');
      expect(results.length).toBeGreaterThanOrEqual(1);
      const names = results.map((r) => r.name);
      expect(names).toContain('security-reviewer');
    });

    it('should filter by type option', () => {
      const results = searchRegistry(MOCK_INDEX, 'design', { type: 'skill' });
      expect(results.every((r) => r.type === 'skill')).toBe(true);
      expect(results[0].name).toBe('api-design');
    });

    it('should filter by tag option', () => {
      const results = searchRegistry(MOCK_INDEX, 'devops', { tag: 'ci-cd' });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('devops-engineer');
    });

    it('should exclude entries without matching tag when tag filter is set', () => {
      const results = searchRegistry(MOCK_INDEX, 'devops', { tag: 'nonexistent' });
      expect(results).toHaveLength(0);
    });

    it('should return empty array when no match', () => {
      const results = searchRegistry(MOCK_INDEX, 'zzz-no-match-zzz');
      expect(results).toEqual([]);
    });

    it('should sort results by score descending', () => {
      // "security" matches both tag (exact=40) and description for security-reviewer
      // Also matches description of api-design? No. Let's use a broader query.
      const results = searchRegistry(MOCK_INDEX, 'design');
      // api-design has exact name match part, and description match
      // react-fullstack has description "React fullstack development" — no "design" match
      // Scores should be sorted descending
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });

    it('should be case-insensitive', () => {
      const results = searchRegistry(MOCK_INDEX, 'DEVOPS');
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].name).toBe('devops-engineer');
    });

    it('should include type field in results', () => {
      const results = searchRegistry(MOCK_INDEX, 'api-design');
      expect(results[0].type).toBe('skill');
    });

    it('should search across all types when no type filter', () => {
      const results = searchRegistry(MOCK_INDEX, 'react');
      const types = new Set(results.map((r) => r.type));
      expect(types.has('preset')).toBe(true);
    });
  });

  describe('listRegistry', () => {
    it('should return all entries when no type filter', () => {
      const results = listRegistry(MOCK_INDEX);
      // 2 agents + 1 skill + 1 preset = 4
      expect(results).toHaveLength(4);
    });

    it('should filter by type', () => {
      const agents = listRegistry(MOCK_INDEX, { type: 'agent' });
      expect(agents).toHaveLength(2);
      expect(agents.every((r) => r.type === 'agent')).toBe(true);

      const skills = listRegistry(MOCK_INDEX, { type: 'skill' });
      expect(skills).toHaveLength(1);
      expect(skills[0].type).toBe('skill');
    });

    it('should sort by name alphabetically', () => {
      const results = listRegistry(MOCK_INDEX);
      const names = results.map((r) => r.name);
      const sorted = [...names].sort();
      expect(names).toEqual(sorted);
    });

    it('should set score to 0 for all listed items', () => {
      const results = listRegistry(MOCK_INDEX);
      expect(results.every((r) => r.score === 0)).toBe(true);
    });

    it('should include type field on every result', () => {
      const results = listRegistry(MOCK_INDEX);
      for (const r of results) {
        expect(['agent', 'skill', 'preset']).toContain(r.type);
      }
    });
  });

  describe('findEntry', () => {
    it('should find entry by exact name', () => {
      const result = findEntry(MOCK_INDEX, 'devops-engineer');
      expect(result).not.toBeNull();
      expect(result?.entry.name).toBe('devops-engineer');
      expect(result?.type).toBe('agent');
    });

    it('should find skill by name', () => {
      const result = findEntry(MOCK_INDEX, 'api-design');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('skill');
    });

    it('should find preset by name', () => {
      const result = findEntry(MOCK_INDEX, 'react-fullstack');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('preset');
    });

    it('should filter by type', () => {
      const result = findEntry(MOCK_INDEX, 'devops-engineer', 'agent');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('agent');
    });

    it('should return null when name exists but type does not match', () => {
      const result = findEntry(MOCK_INDEX, 'devops-engineer', 'skill');
      expect(result).toBeNull();
    });

    it('should return null when name not found', () => {
      const result = findEntry(MOCK_INDEX, 'nonexistent-agent');
      expect(result).toBeNull();
    });

    it('should return the full entry with all fields', () => {
      const result = findEntry(MOCK_INDEX, 'devops-engineer');
      expect(result?.entry).toEqual({
        name: 'devops-engineer',
        description: 'CI/CD pipeline management',
        author: 'community',
        version: '1.0.0',
        tags: ['devops', 'ci-cd'],
        path: 'agents/devops-engineer',
      });
    });
  });
});
