import { describe, expect, it } from 'vitest';
import { formatSyncDiff, type SpecDiff } from '../../src/core/doc-spec-sync.js';

describe('doc-spec-sync', () => {
  describe('formatSyncDiff', () => {
    it('should return no-diff message when diffs are empty', () => {
      const result = formatSyncDiff([]);
      expect(result).toContain('No differences found');
    });

    it('should format added diffs', () => {
      const diffs: SpecDiff[] = [
        { path: 'agent.allFields', type: 'added', official: ['newField'], current: null },
      ];
      const result = formatSyncDiff(diffs);
      expect(result).toContain('1 difference(s)');
      expect(result).toContain('+ agent.allFields');
      expect(result).toContain('newField');
      expect(result).toContain('in official, missing from bundled');
    });

    it('should format removed diffs', () => {
      const diffs: SpecDiff[] = [
        { path: 'hooks.validEvents', type: 'removed', official: null, current: ['OldEvent'] },
      ];
      const result = formatSyncDiff(diffs);
      expect(result).toContain('- hooks.validEvents');
      expect(result).toContain('OldEvent');
      expect(result).toContain('in bundled, not in official');
    });

    it('should format changed diffs', () => {
      const diffs: SpecDiff[] = [
        { path: 'agent.validModels', type: 'changed', official: 'opus,sonnet', current: 'opus' },
      ];
      const result = formatSyncDiff(diffs);
      expect(result).toContain('~ agent.validModels');
      expect(result).toContain('official=');
      expect(result).toContain('current=');
    });

    it('should format multiple diffs', () => {
      const diffs: SpecDiff[] = [
        { path: 'a', type: 'added', official: ['x'], current: null },
        { path: 'b', type: 'removed', official: null, current: ['y'] },
        { path: 'c', type: 'changed', official: 'new', current: 'old' },
      ];
      const result = formatSyncDiff(diffs);
      expect(result).toContain('3 difference(s)');
    });
  });
});
