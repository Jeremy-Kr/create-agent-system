import { describe, expect, it } from 'vitest';
import { BUNDLED_DOC_SPEC, type DocSpec } from '../../src/core/doc-spec.js';

describe('doc-spec', () => {
  describe('BUNDLED_DOC_SPEC structure', () => {
    it('has a version string', () => {
      expect(typeof BUNDLED_DOC_SPEC.version).toBe('string');
      expect(BUNDLED_DOC_SPEC.version).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('source is bundled', () => {
      expect(BUNDLED_DOC_SPEC.source).toBe('bundled');
    });

    it('agent.requiredFields includes name and description', () => {
      expect(BUNDLED_DOC_SPEC.agent.requiredFields).toContain('name');
      expect(BUNDLED_DOC_SPEC.agent.requiredFields).toContain('description');
    });

    it('agent.optionalFields includes all 12 optional fields (including color)', () => {
      const expected = [
        'tools',
        'model',
        'color',
        'permissionMode',
        'skills',
        'disallowedTools',
        'maxTurns',
        'mcpServers',
        'hooks',
        'memory',
        'background',
        'isolation',
      ];
      for (const field of expected) {
        expect(BUNDLED_DOC_SPEC.agent.optionalFields).toContain(field);
      }
      expect(BUNDLED_DOC_SPEC.agent.optionalFields).toHaveLength(12);
    });

    it('total frontmatter fields = 14 (2 required + 12 optional)', () => {
      const total =
        BUNDLED_DOC_SPEC.agent.requiredFields.length + BUNDLED_DOC_SPEC.agent.optionalFields.length;
      expect(total).toBe(14);
    });

    it('agent.deprecatedFields is empty', () => {
      expect(BUNDLED_DOC_SPEC.agent.deprecatedFields).toHaveLength(0);
    });

    it('agent.validModels includes standard model names', () => {
      expect(BUNDLED_DOC_SPEC.agent.validModels).toEqual(
        expect.arrayContaining(['opus', 'sonnet', 'haiku', 'inherit']),
      );
    });

    it('agent.validPermissionModes includes all valid modes', () => {
      expect(BUNDLED_DOC_SPEC.agent.validPermissionModes).toEqual(
        expect.arrayContaining(['default', 'acceptEdits', 'dontAsk', 'bypassPermissions', 'plan']),
      );
    });

    it('agent.validColors has 6 colors', () => {
      expect(BUNDLED_DOC_SPEC.agent.validColors).toHaveLength(6);
      expect(BUNDLED_DOC_SPEC.agent.validColors).toEqual(
        expect.arrayContaining(['blue', 'cyan', 'green', 'yellow', 'magenta', 'red']),
      );
    });

    it('agent.descriptionRequiresExamples is false', () => {
      expect(BUNDLED_DOC_SPEC.agent.descriptionRequiresExamples).toBe(false);
    });

    it('agent.toolsFormat is array', () => {
      expect(BUNDLED_DOC_SPEC.agent.toolsFormat).toBe('array');
    });

    it('skill.requiredFields includes name and description', () => {
      expect(BUNDLED_DOC_SPEC.skill.requiredFields).toContain('name');
      expect(BUNDLED_DOC_SPEC.skill.requiredFields).toContain('description');
    });

    it('hooks.validEvents has 9 official events', () => {
      expect(BUNDLED_DOC_SPEC.hooks.validEvents).toHaveLength(9);
    });

    it('hooks.extensionEvents has 6 extension events', () => {
      expect(BUNDLED_DOC_SPEC.hooks.extensionEvents).toHaveLength(6);
    });

    it('total hook events = 15 (9 official + 6 extension)', () => {
      const total =
        BUNDLED_DOC_SPEC.hooks.validEvents.length + BUNDLED_DOC_SPEC.hooks.extensionEvents.length;
      expect(total).toBe(15);
    });

    it('hooks.hookTypes includes command, prompt, and agent', () => {
      expect(BUNDLED_DOC_SPEC.hooks.hookTypes).toEqual(
        expect.arrayContaining(['command', 'prompt', 'agent']),
      );
    });

    it('claudeMd.maxLines is a positive number', () => {
      expect(BUNDLED_DOC_SPEC.claudeMd.maxLines).toBeGreaterThan(0);
    });

    it('claudeMd.requiredSections has at least one entry', () => {
      expect(BUNDLED_DOC_SPEC.claudeMd.requiredSections.length).toBeGreaterThan(0);
    });
  });

  describe('DocSpec type completeness', () => {
    it('BUNDLED_DOC_SPEC satisfies DocSpec interface', () => {
      const spec: DocSpec = BUNDLED_DOC_SPEC;
      expect(spec).toBeDefined();
      expect(spec.agent).toBeDefined();
      expect(spec.skill).toBeDefined();
      expect(spec.hooks).toBeDefined();
      expect(spec.claudeMd).toBeDefined();
    });
  });
});
