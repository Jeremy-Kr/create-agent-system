import { t } from '../i18n/index.js';
import type { DocSpec } from './doc-spec.js';

export interface DocSpecIssue {
  rule: string;
  file: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface DocSpecValidationResult {
  issues: DocSpecIssue[];
  specVersion: string;
  specSource: 'bundled' | 'context7';
}

interface AgentContent {
  filePath: string;
  frontmatter: Record<string, unknown>;
  body: string;
}

export function validateAgentContent(agents: AgentContent[], spec: DocSpec): DocSpecIssue[] {
  const issues: DocSpecIssue[] = [];

  for (const agent of agents) {
    const { filePath, frontmatter } = agent;

    // Check permissionMode validity
    if (
      frontmatter.permissionMode &&
      !spec.agent.validPermissionModes.includes(frontmatter.permissionMode as string)
    ) {
      issues.push({
        rule: 'INVALID_PERMISSION_MODE',
        file: filePath,
        message: t('validator.invalid_permission_mode', {
          file: filePath,
          mode: String(frontmatter.permissionMode),
          valid: spec.agent.validPermissionModes.join(', '),
        }),
        severity: 'error',
      });
    }

    // Check example blocks in description (info-level, not required by spec)
    const desc = frontmatter.description as string | undefined;
    if (desc && !desc.includes('<example>')) {
      issues.push({
        rule: 'MISSING_EXAMPLE_BLOCKS',
        file: filePath,
        message: t('validator.missing_example_blocks', { file: filePath }),
        severity: 'info',
      });
    }
  }

  return issues;
}

function structureIssue(event: string, reason: string): DocSpecIssue {
  return {
    rule: 'INVALID_HOOK_STRUCTURE',
    file: 'settings.json',
    message: t('validator.invalid_hook_structure', { event, reason }),
    severity: 'error',
  };
}

function validateHookEntry(entry: unknown, event: string, validTypes: string[]): DocSpecIssue[] {
  if (typeof entry !== 'object' || entry === null) {
    return [structureIssue(event, 'each entry must be an object')];
  }

  const hookEntry = entry as { hooks?: unknown[] };
  if (!Array.isArray(hookEntry.hooks)) {
    return [structureIssue(event, 'entry must have a hooks array')];
  }

  const issues: DocSpecIssue[] = [];
  for (const hook of hookEntry.hooks) {
    const action = hook as { type?: string };
    if (!action.type || !validTypes.includes(action.type)) {
      issues.push(structureIssue(event, `hook type must be one of: ${validTypes.join(', ')}`));
    }
  }
  return issues;
}

export function validateHooksContent(
  hooks: Record<string, unknown>,
  spec: DocSpec,
): DocSpecIssue[] {
  const issues: DocSpecIssue[] = [];

  for (const event of Object.keys(hooks)) {
    if (!spec.hooks.validEvents.includes(event)) {
      issues.push({
        rule: 'INVALID_HOOK_EVENT',
        file: 'settings.json',
        message: t('validator.invalid_hook_event', {
          event,
          valid: spec.hooks.validEvents.join(', '),
        }),
        severity: 'error',
      });
      continue;
    }

    const entries = hooks[event];
    if (!Array.isArray(entries)) {
      issues.push(structureIssue(event, 'entries must be an array'));
      continue;
    }

    for (const entry of entries) {
      issues.push(...validateHookEntry(entry, event, spec.hooks.hookTypes));
    }
  }

  return issues;
}

export function validateDocSpec(
  agents: AgentContent[],
  hooks: Record<string, unknown> | undefined,
  spec: DocSpec,
): DocSpecValidationResult {
  const issues: DocSpecIssue[] = [];

  issues.push(...validateAgentContent(agents, spec));

  if (hooks) {
    issues.push(...validateHooksContent(hooks, spec));
  }

  return {
    issues,
    specVersion: spec.version,
    specSource: spec.source,
  };
}
