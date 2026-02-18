import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const HOOKS_PATH = resolve(import.meta.dirname, '../../plugin/hooks/hooks.json');

describe('Hooks Configuration (TICKET-061)', () => {
  it('should be valid JSON', () => {
    const content = readFileSync(HOOKS_PATH, 'utf-8');
    expect(() => JSON.parse(content)).not.toThrow();
  });

  it('should have hooks array', () => {
    const config = JSON.parse(readFileSync(HOOKS_PATH, 'utf-8'));
    expect(Array.isArray(config.hooks)).toBe(true);
    expect(config.hooks.length).toBeGreaterThan(0);
  });

  it('should have a postToolUse event hook', () => {
    const config = JSON.parse(readFileSync(HOOKS_PATH, 'utf-8'));
    const postToolUseHook = config.hooks.find((h: { event: string }) => h.event === 'postToolUse');
    expect(postToolUseHook).toBeDefined();
  });

  it('should have matcher with tool and pattern', () => {
    const config = JSON.parse(readFileSync(HOOKS_PATH, 'utf-8'));
    const hook = config.hooks[0];
    expect(hook.matcher).toHaveProperty('tool');
    expect(hook.matcher).toHaveProperty('pattern');
  });

  it('should have command that runs validate --quiet', () => {
    const config = JSON.parse(readFileSync(HOOKS_PATH, 'utf-8'));
    const hook = config.hooks[0];
    expect(hook.command).toContain('validate');
    expect(hook.command).toContain('--quiet');
  });
});
