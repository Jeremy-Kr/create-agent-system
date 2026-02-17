import type { AgentName, SkillName } from '../types/config.js';

export const AGENT_NAMES: readonly AgentName[] = [
  'po-pm',
  'architect',
  'cto',
  'designer',
  'test-writer',
  'frontend-dev',
  'backend-dev',
  'qa-reviewer',
] as const;

export const SKILL_NAMES: readonly SkillName[] = [
  'scoring',
  'visual-qa',
  'tdd-workflow',
  'adr-writing',
  'ticket-writing',
  'design-system',
  'cr-process',
] as const;

export const PRESET_NAMES = ['solo-dev', 'small-team', 'full-team'] as const;

export const SUPPORTED_FRONTMATTER_FIELDS = [
  'name',
  'description',
  'tools',
  'model',
  'permissionMode',
  'skills',
] as const;

export const VALID_MODEL_VALUES = ['opus', 'sonnet', 'haiku', 'inherit'] as const;

export const AGENTS_DIR = '.claude/agents';
export const SKILLS_DIR = '.claude/skills';
export const SETTINGS_FILE = '.claude/settings.json';
export const CLAUDE_MD_FILE = 'CLAUDE.md';

export const AGENT_DEFAULT_SKILLS: Record<AgentName, SkillName[]> = {
  'po-pm': ['scoring', 'ticket-writing', 'cr-process'],
  architect: ['scoring', 'adr-writing'],
  cto: ['scoring'],
  designer: ['design-system', 'visual-qa', 'scoring'],
  'test-writer': ['tdd-workflow', 'scoring'],
  'frontend-dev': ['visual-qa', 'scoring'],
  'backend-dev': ['scoring'],
  'qa-reviewer': ['visual-qa', 'scoring'],
};
