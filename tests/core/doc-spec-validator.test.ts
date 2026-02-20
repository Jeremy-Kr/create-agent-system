import { describe, expect, it } from 'vitest';
import { BUNDLED_DOC_SPEC } from '../../src/core/doc-spec.js';
import {
  validateAgentContent,
  validateDocSpec,
  validateHooksContent,
} from '../../src/core/doc-spec-validator.js';

const spec = BUNDLED_DOC_SPEC;

function makeAgent(overrides: Record<string, unknown> = {}) {
  return {
    filePath: 'test-agent.md',
    frontmatter: {
      name: 'test-agent',
      description: 'A test agent.\n\n<example>\nuser: "test"\nassistant: "ok"\n</example>',
      tools: 'Read, Write',
      model: 'opus',
      ...overrides,
    },
    body: 'Agent body content.',
  };
}

describe('doc-spec-validator', () => {
  describe('validateAgentContent', () => {
    it('returns no issues for valid agent', () => {
      const issues = validateAgentContent([makeAgent()], spec);
      expect(issues).toHaveLength(0);
    });

    it('accepts permissionMode as valid field (not deprecated)', () => {
      const issues = validateAgentContent([makeAgent({ permissionMode: 'plan' })], spec);
      const deprecated = issues.filter((i) => i.rule === 'DEPRECATED_FIELD');
      expect(deprecated).toHaveLength(0);
    });

    it('accepts skills as valid field (not deprecated)', () => {
      const issues = validateAgentContent([makeAgent({ skills: 'scoring,tdd-workflow' })], spec);
      const deprecated = issues.filter((i) => i.rule === 'DEPRECATED_FIELD');
      expect(deprecated).toHaveLength(0);
    });

    it('errors on invalid permissionMode', () => {
      const issues = validateAgentContent([makeAgent({ permissionMode: 'invalid-mode' })], spec);
      const pmIssues = issues.filter((i) => i.rule === 'INVALID_PERMISSION_MODE');
      expect(pmIssues).toHaveLength(1);
      expect(pmIssues[0].severity).toBe('error');
    });

    it('accepts all valid permission modes', () => {
      for (const mode of spec.agent.validPermissionModes) {
        const issues = validateAgentContent([makeAgent({ permissionMode: mode })], spec);
        expect(issues.filter((i) => i.rule === 'INVALID_PERMISSION_MODE')).toHaveLength(0);
      }
    });

    it('info-level issue when description lacks <example> blocks', () => {
      const issues = validateAgentContent(
        [makeAgent({ description: 'A plain description without examples.' })],
        spec,
      );
      const missing = issues.filter((i) => i.rule === 'MISSING_EXAMPLE_BLOCKS');
      expect(missing).toHaveLength(1);
      expect(missing[0].severity).toBe('info');
    });

    it('no example issue when description includes <example>', () => {
      const issues = validateAgentContent([makeAgent()], spec);
      expect(issues.filter((i) => i.rule === 'MISSING_EXAMPLE_BLOCKS')).toHaveLength(0);
    });

    it('validates multiple agents at once', () => {
      const agents = [
        makeAgent({ permissionMode: 'invalid' }),
        makeAgent({ description: 'No examples here.' }),
      ];
      const issues = validateAgentContent(agents, spec);
      expect(issues.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('validateHooksContent', () => {
    it('returns no issues for valid hooks', () => {
      const hooks = {
        SessionStart: [{ matcher: '', hooks: [{ type: 'prompt', prompt: 'test' }] }],
      };
      const issues = validateHooksContent(hooks, spec);
      expect(issues).toHaveLength(0);
    });

    it('errors on invalid event name', () => {
      const hooks = {
        InvalidEvent: [{ matcher: '', hooks: [{ type: 'prompt', prompt: 'test' }] }],
      };
      const issues = validateHooksContent(hooks, spec);
      expect(issues.some((i) => i.rule === 'INVALID_HOOK_EVENT')).toBe(true);
    });

    it('errors when entries is not an array', () => {
      const hooks = { SessionStart: 'not-an-array' } as unknown as Record<string, unknown>;
      const issues = validateHooksContent(hooks, spec);
      expect(issues.some((i) => i.rule === 'INVALID_HOOK_STRUCTURE')).toBe(true);
    });

    it('errors when entry is not an object', () => {
      const hooks = { SessionStart: ['not-an-object'] } as unknown as Record<string, unknown>;
      const issues = validateHooksContent(hooks, spec);
      expect(issues.some((i) => i.rule === 'INVALID_HOOK_STRUCTURE')).toBe(true);
    });

    it('errors when entry lacks hooks array', () => {
      const hooks = { SessionStart: [{ matcher: '' }] } as unknown as Record<string, unknown>;
      const issues = validateHooksContent(hooks, spec);
      expect(issues.some((i) => i.rule === 'INVALID_HOOK_STRUCTURE')).toBe(true);
    });

    it('errors on invalid hook type', () => {
      const hooks = {
        SessionStart: [{ matcher: '', hooks: [{ type: 'invalid', prompt: 'test' }] }],
      } as unknown as Record<string, unknown>;
      const issues = validateHooksContent(hooks, spec);
      expect(issues.some((i) => i.rule === 'INVALID_HOOK_STRUCTURE')).toBe(true);
    });

    it('accepts all valid hook types', () => {
      for (const type of spec.hooks.hookTypes) {
        const hooks = {
          SessionStart: [{ matcher: '', hooks: [{ type, prompt: 'test' }] }],
        };
        const issues = validateHooksContent(hooks, spec);
        expect(issues).toHaveLength(0);
      }
    });
  });

  describe('validateDocSpec (combined)', () => {
    it('returns spec version and source', () => {
      const result = validateDocSpec([], undefined, spec);
      expect(result.specVersion).toBe(spec.version);
      expect(result.specSource).toBe('bundled');
    });

    it('combines agent and hook issues', () => {
      const agents = [makeAgent({ permissionMode: 'invalid' })];
      const hooks = { BadEvent: [{ matcher: '', hooks: [{ type: 'prompt' }] }] };
      const result = validateDocSpec(agents, hooks, spec);
      expect(result.issues.some((i) => i.rule === 'INVALID_PERMISSION_MODE')).toBe(true);
      expect(result.issues.some((i) => i.rule === 'INVALID_HOOK_EVENT')).toBe(true);
    });

    it('skips hook validation when hooks is undefined', () => {
      const result = validateDocSpec([], undefined, spec);
      expect(result.issues).toHaveLength(0);
    });
  });
});
