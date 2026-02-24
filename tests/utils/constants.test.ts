import { describe, expect, it } from 'vitest';
import { BUNDLED_DOC_SPEC } from '../../src/core/doc-spec.js';
import {
  AGENT_DEFAULT_SKILLS,
  AGENT_NAMES,
  AGENTS_DIR,
  CLAUDE_MD_FILE,
  HOOK_EVENTS,
  PRESET_NAMES,
  SETTINGS_FILE,
  SKILL_NAMES,
  SKILLS_DIR,
  SUPPORTED_FRONTMATTER_FIELDS,
  VALID_COLORS,
  VALID_MODEL_VALUES,
  VALID_PERMISSION_MODES,
} from '../../src/utils/constants.js';

describe('Constants (TICKET-003)', () => {
  describe('AGENT_NAMES', () => {
    it('should have exactly 8 entries', () => {
      expect(AGENT_NAMES).toHaveLength(8);
    });

    it('should contain all agent names', () => {
      expect(AGENT_NAMES).toContain('po-pm');
      expect(AGENT_NAMES).toContain('architect');
      expect(AGENT_NAMES).toContain('cto');
      expect(AGENT_NAMES).toContain('designer');
      expect(AGENT_NAMES).toContain('test-writer');
      expect(AGENT_NAMES).toContain('frontend-dev');
      expect(AGENT_NAMES).toContain('backend-dev');
      expect(AGENT_NAMES).toContain('qa-reviewer');
    });
  });

  describe('SKILL_NAMES', () => {
    it('should have exactly 9 entries', () => {
      expect(SKILL_NAMES).toHaveLength(9);
    });

    it('should contain all skill names', () => {
      expect(SKILL_NAMES).toContain('scoring');
      expect(SKILL_NAMES).toContain('visual-qa');
      expect(SKILL_NAMES).toContain('tdd-workflow');
      expect(SKILL_NAMES).toContain('adr-writing');
      expect(SKILL_NAMES).toContain('ticket-writing');
      expect(SKILL_NAMES).toContain('design-system');
      expect(SKILL_NAMES).toContain('cr-process');
      expect(SKILL_NAMES).toContain('context-engineering');
    });
  });

  describe('PRESET_NAMES', () => {
    it('should have exactly 3 entries', () => {
      expect(PRESET_NAMES).toHaveLength(3);
    });

    it('should contain solo-dev, small-team, full-team', () => {
      expect(PRESET_NAMES).toContain('solo-dev');
      expect(PRESET_NAMES).toContain('small-team');
      expect(PRESET_NAMES).toContain('full-team');
    });
  });

  describe('SUPPORTED_FRONTMATTER_FIELDS', () => {
    it('should have exactly 14 entries (2 required + 12 optional, including color)', () => {
      expect(SUPPORTED_FRONTMATTER_FIELDS).toHaveLength(14);
    });

    it('should contain all supported fields', () => {
      expect(SUPPORTED_FRONTMATTER_FIELDS).toContain('name');
      expect(SUPPORTED_FRONTMATTER_FIELDS).toContain('description');
      expect(SUPPORTED_FRONTMATTER_FIELDS).toContain('tools');
      expect(SUPPORTED_FRONTMATTER_FIELDS).toContain('model');
      expect(SUPPORTED_FRONTMATTER_FIELDS).toContain('color');
      expect(SUPPORTED_FRONTMATTER_FIELDS).toContain('permissionMode');
      expect(SUPPORTED_FRONTMATTER_FIELDS).toContain('skills');
      expect(SUPPORTED_FRONTMATTER_FIELDS).toContain('disallowedTools');
      expect(SUPPORTED_FRONTMATTER_FIELDS).toContain('maxTurns');
      expect(SUPPORTED_FRONTMATTER_FIELDS).toContain('mcpServers');
      expect(SUPPORTED_FRONTMATTER_FIELDS).toContain('hooks');
      expect(SUPPORTED_FRONTMATTER_FIELDS).toContain('memory');
      expect(SUPPORTED_FRONTMATTER_FIELDS).toContain('background');
      expect(SUPPORTED_FRONTMATTER_FIELDS).toContain('isolation');
    });

    it('should be derived from DocSpec', () => {
      const expected = [
        ...BUNDLED_DOC_SPEC.agent.requiredFields,
        ...BUNDLED_DOC_SPEC.agent.optionalFields,
      ];
      expect(SUPPORTED_FRONTMATTER_FIELDS).toEqual(expected);
    });
  });

  describe('VALID_MODEL_VALUES', () => {
    it('should have exactly 4 entries', () => {
      expect(VALID_MODEL_VALUES).toHaveLength(4);
    });

    it('should contain opus, sonnet, haiku, inherit', () => {
      expect(VALID_MODEL_VALUES).toContain('opus');
      expect(VALID_MODEL_VALUES).toContain('sonnet');
      expect(VALID_MODEL_VALUES).toContain('haiku');
      expect(VALID_MODEL_VALUES).toContain('inherit');
    });

    it('should be derived from DocSpec', () => {
      expect(VALID_MODEL_VALUES).toEqual(BUNDLED_DOC_SPEC.agent.validModels);
    });
  });

  describe('VALID_PERMISSION_MODES', () => {
    it('should have exactly 5 entries', () => {
      expect(VALID_PERMISSION_MODES).toHaveLength(5);
    });

    it('should contain all valid permission modes', () => {
      expect(VALID_PERMISSION_MODES).toContain('default');
      expect(VALID_PERMISSION_MODES).toContain('acceptEdits');
      expect(VALID_PERMISSION_MODES).toContain('dontAsk');
      expect(VALID_PERMISSION_MODES).toContain('bypassPermissions');
      expect(VALID_PERMISSION_MODES).toContain('plan');
    });

    it('should be derived from DocSpec', () => {
      expect(VALID_PERMISSION_MODES).toEqual(BUNDLED_DOC_SPEC.agent.validPermissionModes);
    });
  });

  describe('VALID_COLORS', () => {
    it('should have exactly 6 entries', () => {
      expect(VALID_COLORS).toHaveLength(6);
    });

    it('should contain all valid colors', () => {
      expect(VALID_COLORS).toContain('blue');
      expect(VALID_COLORS).toContain('cyan');
      expect(VALID_COLORS).toContain('green');
      expect(VALID_COLORS).toContain('yellow');
      expect(VALID_COLORS).toContain('magenta');
      expect(VALID_COLORS).toContain('red');
    });

    it('should be derived from DocSpec', () => {
      expect(VALID_COLORS).toEqual(BUNDLED_DOC_SPEC.agent.validColors);
    });
  });

  describe('HOOK_EVENTS', () => {
    it('should have exactly 15 entries (9 official + 6 extension)', () => {
      expect(HOOK_EVENTS).toHaveLength(15);
    });

    it('should contain official events', () => {
      expect(HOOK_EVENTS).toContain('PreToolUse');
      expect(HOOK_EVENTS).toContain('PostToolUse');
      expect(HOOK_EVENTS).toContain('Stop');
      expect(HOOK_EVENTS).toContain('SubagentStop');
      expect(HOOK_EVENTS).toContain('SessionStart');
      expect(HOOK_EVENTS).toContain('SessionEnd');
      expect(HOOK_EVENTS).toContain('UserPromptSubmit');
      expect(HOOK_EVENTS).toContain('PreCompact');
      expect(HOOK_EVENTS).toContain('Notification');
    });

    it('should contain extension events', () => {
      expect(HOOK_EVENTS).toContain('PostToolUseFailure');
      expect(HOOK_EVENTS).toContain('SubagentStart');
      expect(HOOK_EVENTS).toContain('TeammateIdle');
      expect(HOOK_EVENTS).toContain('TaskCompleted');
      expect(HOOK_EVENTS).toContain('PermissionRequest');
      expect(HOOK_EVENTS).toContain('ConfigChange');
    });

    it('should be derived from DocSpec (official + extension)', () => {
      const expected = [
        ...BUNDLED_DOC_SPEC.hooks.validEvents,
        ...BUNDLED_DOC_SPEC.hooks.extensionEvents,
      ];
      expect(HOOK_EVENTS).toEqual(expected);
    });
  });

  describe('AGENT_DEFAULT_SKILLS', () => {
    it('should have entries for all 8 agents', () => {
      expect(Object.keys(AGENT_DEFAULT_SKILLS)).toHaveLength(8);
    });

    it('po-pm should have scoring, ticket-writing, cr-process, context-engineering', () => {
      expect(AGENT_DEFAULT_SKILLS['po-pm']).toEqual(
        expect.arrayContaining(['scoring', 'ticket-writing', 'cr-process', 'context-engineering']),
      );
      expect(AGENT_DEFAULT_SKILLS['po-pm']).toHaveLength(4);
    });

    it('architect should have scoring, adr-writing, context-engineering', () => {
      expect(AGENT_DEFAULT_SKILLS.architect).toEqual(
        expect.arrayContaining(['scoring', 'adr-writing', 'context-engineering']),
      );
      expect(AGENT_DEFAULT_SKILLS.architect).toHaveLength(3);
    });

    it('cto should have scoring, context-engineering', () => {
      expect(AGENT_DEFAULT_SKILLS.cto).toEqual(
        expect.arrayContaining(['scoring', 'context-engineering']),
      );
      expect(AGENT_DEFAULT_SKILLS.cto).toHaveLength(2);
    });

    it('designer should have design-system, visual-qa, scoring, context-engineering', () => {
      expect(AGENT_DEFAULT_SKILLS.designer).toEqual(
        expect.arrayContaining(['design-system', 'visual-qa', 'scoring', 'context-engineering']),
      );
      expect(AGENT_DEFAULT_SKILLS.designer).toHaveLength(4);
    });

    it('test-writer should have tdd-workflow, scoring, context-engineering', () => {
      expect(AGENT_DEFAULT_SKILLS['test-writer']).toEqual(
        expect.arrayContaining(['tdd-workflow', 'scoring', 'context-engineering']),
      );
      expect(AGENT_DEFAULT_SKILLS['test-writer']).toHaveLength(3);
    });

    it('frontend-dev should have visual-qa, scoring, context-engineering', () => {
      expect(AGENT_DEFAULT_SKILLS['frontend-dev']).toEqual(
        expect.arrayContaining(['visual-qa', 'scoring', 'context-engineering']),
      );
      expect(AGENT_DEFAULT_SKILLS['frontend-dev']).toHaveLength(3);
    });

    it('backend-dev should have scoring, context-engineering', () => {
      expect(AGENT_DEFAULT_SKILLS['backend-dev']).toEqual(
        expect.arrayContaining(['scoring', 'context-engineering']),
      );
      expect(AGENT_DEFAULT_SKILLS['backend-dev']).toHaveLength(2);
    });

    it('qa-reviewer should have visual-qa, scoring, context-engineering', () => {
      expect(AGENT_DEFAULT_SKILLS['qa-reviewer']).toEqual(
        expect.arrayContaining(['visual-qa', 'scoring', 'context-engineering']),
      );
      expect(AGENT_DEFAULT_SKILLS['qa-reviewer']).toHaveLength(3);
    });
  });

  describe('Path constants', () => {
    it('AGENTS_DIR should be .claude/agents', () => {
      expect(AGENTS_DIR).toBe('.claude/agents');
    });

    it('SKILLS_DIR should be .claude/skills', () => {
      expect(SKILLS_DIR).toBe('.claude/skills');
    });

    it('SETTINGS_FILE should be .claude/settings.json', () => {
      expect(SETTINGS_FILE).toBe('.claude/settings.json');
    });

    it('CLAUDE_MD_FILE should be CLAUDE.md', () => {
      expect(CLAUDE_MD_FILE).toBe('CLAUDE.md');
    });
  });
});
