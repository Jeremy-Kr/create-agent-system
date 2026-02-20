import { describe, expect, it } from 'vitest';
import { generateHooks } from '../../src/core/hooks-generator.js';
import { HOOK_EVENTS } from '../../src/utils/constants.js';

describe('hooks-generator', () => {
  describe('generateHooks', () => {
    it('small scale returns SessionStart and Stop only', () => {
      const hooks = generateHooks('small');
      const events = Object.keys(hooks);
      expect(events).toEqual(['SessionStart', 'Stop']);
    });

    it('medium scale includes PreToolUse and PostToolUse', () => {
      const hooks = generateHooks('medium');
      const events = Object.keys(hooks);
      expect(events).toContain('SessionStart');
      expect(events).toContain('Stop');
      expect(events).toContain('PreToolUse');
      expect(events).toContain('PostToolUse');
    });

    it('large scale includes TeammateIdle and TaskCompleted', () => {
      const hooks = generateHooks('large');
      const events = Object.keys(hooks);
      expect(events).toContain('TeammateIdle');
      expect(events).toContain('TaskCompleted');
    });

    it('large scale has more PreToolUse entries than medium', () => {
      const medium = generateHooks('medium');
      const large = generateHooks('large');
      const mediumEntries = medium.PreToolUse ?? [];
      const largeEntries = large.PreToolUse ?? [];
      expect(largeEntries.length).toBeGreaterThan(mediumEntries.length);
    });

    it('all events are valid HOOK_EVENTS', () => {
      for (const scale of ['small', 'medium', 'large'] as const) {
        const hooks = generateHooks(scale);
        for (const event of Object.keys(hooks)) {
          expect(HOOK_EVENTS).toContain(event);
        }
      }
    });

    it('all hook actions use prompt type', () => {
      for (const scale of ['small', 'medium', 'large'] as const) {
        const hooks = generateHooks(scale);
        const allEntries = Object.values(hooks).flat();
        for (const entry of allEntries) {
          for (const hook of entry.hooks) {
            expect(hook.type).toBe('prompt');
            expect(hook.prompt).toBeTruthy();
          }
        }
      }
    });

    it('each entry has a matcher string', () => {
      for (const scale of ['small', 'medium', 'large'] as const) {
        const hooks = generateHooks(scale);
        const allEntries = Object.values(hooks).flat();
        for (const entry of allEntries) {
          expect(typeof entry.matcher).toBe('string');
        }
      }
    });

    it('medium PreToolUse matcher targets Write|Edit', () => {
      const hooks = generateHooks('medium');
      const matchers = (hooks.PreToolUse ?? []).map((e) => e.matcher);
      expect(matchers).toContain('Write|Edit');
    });

    it('large PreToolUse matcher includes Bash', () => {
      const hooks = generateHooks('large');
      const matchers = (hooks.PreToolUse ?? []).map((e) => e.matcher);
      expect(matchers).toContain('Bash');
    });
  });
});
