import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockClack } = vi.hoisted(() => ({
  mockClack: {
    log: {
      warn: vi.fn(),
      info: vi.fn(),
      message: vi.fn(),
      success: vi.fn(),
    },
  },
}));

vi.mock('@clack/prompts', () => mockClack);

vi.mock('../../src/i18n/index.js', () => ({
  t: (key: string, params?: Record<string, unknown>) => {
    if (params) {
      const parts = Object.entries(params).map(([k, v]) => `${k}=${v}`);
      return `${key} (${parts.join(', ')})`;
    }
    return key;
  },
}));

import {
  displayInstallResults,
  displayRegistryList,
  displaySearchResults,
} from '../../src/cli/registry-prompts.js';
import type { InstallResult } from '../../src/core/registry-installer.js';
import type { SearchResult } from '../../src/core/registry-search.js';

describe('Registry Prompts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('displaySearchResults', () => {
    it('should show warning when no results', () => {
      displaySearchResults([]);
      expect(mockClack.log.warn).toHaveBeenCalledWith('registry.no_results');
    });

    it('should show results count when results exist', () => {
      const results: SearchResult[] = [
        {
          name: 'test-agent',
          type: 'agent',
          description: 'Test',
          tags: [],
          score: 100,
          author: 'test',
          version: '1.0.0',
          path: 'agents/test-agent',
        },
      ];
      displaySearchResults(results);
      expect(mockClack.log.info).toHaveBeenCalledWith(expect.stringContaining('1'));
    });
  });

  describe('displayRegistryList', () => {
    it('should show warning when no items', () => {
      displayRegistryList([]);
      expect(mockClack.log.warn).toHaveBeenCalledWith('registry.no_items');
    });

    it('should show items count', () => {
      const results: SearchResult[] = [
        {
          name: 'test-skill',
          type: 'skill',
          description: 'A skill',
          tags: ['tag1'],
          score: 0,
          author: 'test',
          version: '1.0.0',
          path: 'skills/test-skill',
        },
      ];
      displayRegistryList(results);
      expect(mockClack.log.info).toHaveBeenCalledWith(expect.stringContaining('1'));
    });
  });

  describe('displayInstallResults', () => {
    it('should show installed items', () => {
      const result: InstallResult = {
        installed: [{ name: 'my-agent', type: 'agent', path: '.claude/agents/my-agent.md' }],
        skipped: [],
        warnings: [],
      };
      displayInstallResults(result);
      expect(mockClack.log.success).toHaveBeenCalled();
    });

    it('should show no_installed message when nothing installed', () => {
      const result: InstallResult = {
        installed: [],
        skipped: [{ name: 'skipped-agent', reason: 'already exists' }],
        warnings: [],
      };
      displayInstallResults(result);
      expect(mockClack.log.info).toHaveBeenCalledWith('registry.no_installed');
    });
  });
});
