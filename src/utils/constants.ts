import { BUNDLED_DOC_SPEC } from '../core/doc-spec.js';
import { t } from '../i18n/index.js';
import type { Messages } from '../i18n/types.js';
import type { AgentName, SkillName } from '../types/config.js';

export const VERSION = '0.1.0';

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
  'sync-spec',
] as const;

export const PRESET_NAMES = ['solo-dev', 'small-team', 'full-team'] as const;

// === Derived from DocSpec (official Claude Code spec) ===
export const SUPPORTED_FRONTMATTER_FIELDS: readonly string[] = [
  ...BUNDLED_DOC_SPEC.agent.requiredFields,
  ...BUNDLED_DOC_SPEC.agent.optionalFields,
];

export const VALID_MODEL_VALUES: readonly string[] = [...BUNDLED_DOC_SPEC.agent.validModels];

export const VALID_PERMISSION_MODES: readonly string[] = [
  ...BUNDLED_DOC_SPEC.agent.validPermissionModes,
];

export const VALID_COLORS: readonly string[] = [...BUNDLED_DOC_SPEC.agent.validColors];

export const HOOK_EVENTS: readonly string[] = [
  ...BUNDLED_DOC_SPEC.hooks.validEvents,
  ...BUNDLED_DOC_SPEC.hooks.extensionEvents,
];

// === Path constants ===
export const AGENTS_DIR = '.claude/agents';
export const SKILLS_DIR = '.claude/skills';
export const SETTINGS_FILE = '.claude/settings.json';
export const CLAUDE_MD_FILE = 'CLAUDE.md';

export const CONFIG_FILE_NAME = 'agent-system.config.yaml';

// Registry
export const DEFAULT_REGISTRY_BASE_URL =
  'https://raw.githubusercontent.com/create-agent-system/registry/main';
export const CACHE_DIR_NAME = '.create-agent-system';
export const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
export const REGISTRY_INDEX_FILE = 'registry.json';
export const REGISTRY_ENV_VAR = 'CAS_REGISTRY_URL';

// === Tool-specific constants ===
export const AGENT_DISPLAY_NAMES: Record<AgentName, string> = {
  'po-pm': 'PO/PM',
  architect: 'Architect',
  cto: 'CTO',
  designer: 'Designer',
  'test-writer': 'Test Writer',
  'frontend-dev': 'Frontend Dev',
  'backend-dev': 'Backend Dev',
  'qa-reviewer': 'QA Reviewer',
};

export function getAgentDescription(name: AgentName): string {
  const key = `agent.${name.replace(/-/g, '_')}` as keyof Messages;
  return t(key);
}

export function getSkillDescription(name: SkillName): string {
  const key = `skill.${name.replace(/-/g, '_')}` as keyof Messages;
  return t(key);
}

export const AGENT_CONTEXT_RULES: Record<
  AgentName,
  { alwaysRead: string; onDemand: string; exclude: string }
> = {
  'po-pm': { alwaysRead: 'CLAUDE.md, spec.md', onDemand: 'tickets/', exclude: 'src/, tests/' },
  architect: {
    alwaysRead: 'CLAUDE.md, adr/',
    onDemand: 'spec.md, tickets/',
    exclude: 'src/, tests/',
  },
  cto: { alwaysRead: 'CLAUDE.md, adr/', onDemand: 'spec.md, tickets/', exclude: 'tests/' },
  designer: {
    alwaysRead: 'CLAUDE.md, design-system.md',
    onDemand: 'spec.md',
    exclude: 'src/api/, tests/',
  },
  'test-writer': {
    alwaysRead: 'CLAUDE.md, spec.md, tickets/',
    onDemand: 'src/types/',
    exclude: 'src/core/, src/components/',
  },
  'frontend-dev': {
    alwaysRead: 'CLAUDE.md, adr/, design-system.md',
    onDemand: 'spec.md',
    exclude: 'src/api/, src/core/',
  },
  'backend-dev': { alwaysRead: 'CLAUDE.md, adr/', onDemand: 'spec.md', exclude: 'src/components/' },
  'qa-reviewer': { alwaysRead: 'CLAUDE.md, spec.md', onDemand: 'adr/, tickets/', exclude: '-' },
};

export const FILE_OWNERSHIP: Array<{ path: string; owner: string }> = [
  { path: 'src/components/', owner: 'frontend-dev' },
  { path: 'src/core/', owner: 'backend-dev' },
  { path: 'src/api/', owner: 'backend-dev' },
  { path: 'src/types/shared.ts', owner: 'backend-dev' },
  { path: 'tests/', owner: 'test-writer' },
  { path: 'docs/spec.md', owner: 'po-pm' },
  { path: 'docs/tickets/', owner: 'po-pm' },
  { path: 'docs/adr/', owner: 'architect' },
];

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
