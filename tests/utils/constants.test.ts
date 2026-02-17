import { describe, expect, it } from 'vitest';
import {
  AGENT_DEFAULT_SKILLS,
  AGENT_NAMES,
  AGENTS_DIR,
  CLAUDE_MD_FILE,
  PRESET_NAMES,
  SETTINGS_FILE,
  SKILL_NAMES,
  SKILLS_DIR,
  SUPPORTED_FRONTMATTER_FIELDS,
  VALID_MODEL_VALUES,
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
    it('should have exactly 7 entries', () => {
      expect(SKILL_NAMES).toHaveLength(7);
    });

    it('should contain all skill names', () => {
      expect(SKILL_NAMES).toContain('scoring');
      expect(SKILL_NAMES).toContain('visual-qa');
      expect(SKILL_NAMES).toContain('tdd-workflow');
      expect(SKILL_NAMES).toContain('adr-writing');
      expect(SKILL_NAMES).toContain('ticket-writing');
      expect(SKILL_NAMES).toContain('design-system');
      expect(SKILL_NAMES).toContain('cr-process');
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
    it('should have exactly 6 entries', () => {
      expect(SUPPORTED_FRONTMATTER_FIELDS).toHaveLength(6);
    });

    it('should contain all supported fields', () => {
      expect(SUPPORTED_FRONTMATTER_FIELDS).toContain('name');
      expect(SUPPORTED_FRONTMATTER_FIELDS).toContain('description');
      expect(SUPPORTED_FRONTMATTER_FIELDS).toContain('tools');
      expect(SUPPORTED_FRONTMATTER_FIELDS).toContain('model');
      expect(SUPPORTED_FRONTMATTER_FIELDS).toContain('permissionMode');
      expect(SUPPORTED_FRONTMATTER_FIELDS).toContain('skills');
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
  });

  describe('AGENT_DEFAULT_SKILLS', () => {
    it('should have entries for all 8 agents', () => {
      expect(Object.keys(AGENT_DEFAULT_SKILLS)).toHaveLength(8);
    });

    it('po-pm should have scoring, ticket-writing, cr-process', () => {
      expect(AGENT_DEFAULT_SKILLS['po-pm']).toEqual(
        expect.arrayContaining(['scoring', 'ticket-writing', 'cr-process']),
      );
      expect(AGENT_DEFAULT_SKILLS['po-pm']).toHaveLength(3);
    });

    it('architect should have scoring, adr-writing', () => {
      expect(AGENT_DEFAULT_SKILLS['architect']).toEqual(
        expect.arrayContaining(['scoring', 'adr-writing']),
      );
      expect(AGENT_DEFAULT_SKILLS['architect']).toHaveLength(2);
    });

    it('cto should have scoring', () => {
      expect(AGENT_DEFAULT_SKILLS['cto']).toEqual(expect.arrayContaining(['scoring']));
      expect(AGENT_DEFAULT_SKILLS['cto']).toHaveLength(1);
    });

    it('designer should have design-system, visual-qa, scoring', () => {
      expect(AGENT_DEFAULT_SKILLS['designer']).toEqual(
        expect.arrayContaining(['design-system', 'visual-qa', 'scoring']),
      );
      expect(AGENT_DEFAULT_SKILLS['designer']).toHaveLength(3);
    });

    it('test-writer should have tdd-workflow, scoring', () => {
      expect(AGENT_DEFAULT_SKILLS['test-writer']).toEqual(
        expect.arrayContaining(['tdd-workflow', 'scoring']),
      );
      expect(AGENT_DEFAULT_SKILLS['test-writer']).toHaveLength(2);
    });

    it('frontend-dev should have visual-qa, scoring', () => {
      expect(AGENT_DEFAULT_SKILLS['frontend-dev']).toEqual(
        expect.arrayContaining(['visual-qa', 'scoring']),
      );
      expect(AGENT_DEFAULT_SKILLS['frontend-dev']).toHaveLength(2);
    });

    it('backend-dev should have scoring', () => {
      expect(AGENT_DEFAULT_SKILLS['backend-dev']).toEqual(expect.arrayContaining(['scoring']));
      expect(AGENT_DEFAULT_SKILLS['backend-dev']).toHaveLength(1);
    });

    it('qa-reviewer should have visual-qa, scoring', () => {
      expect(AGENT_DEFAULT_SKILLS['qa-reviewer']).toEqual(
        expect.arrayContaining(['visual-qa', 'scoring']),
      );
      expect(AGENT_DEFAULT_SKILLS['qa-reviewer']).toHaveLength(2);
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
