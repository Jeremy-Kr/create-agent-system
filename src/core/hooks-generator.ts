import type { AgentSystemConfig } from '../types/config.js';
import type { HookEntry, HooksConfig } from '../types/hooks.js';

type Scale = AgentSystemConfig['scale'];

function entry(matcher: string, prompt: string): HookEntry {
  return {
    matcher,
    hooks: [{ type: 'prompt', prompt }],
  };
}

function smallHooks(): HooksConfig {
  return {
    SessionStart: [entry('', 'Read CLAUDE.md and understand the project state before proceeding.')],
    Stop: [
      entry(
        '',
        'Before stopping, verify: Were tests run? Did the build succeed? Are there uncommitted changes that should be committed?',
      ),
    ],
  };
}

function mediumHooks(): HooksConfig {
  const base = smallHooks();
  return {
    ...base,
    PreToolUse: [
      entry(
        'Write|Edit',
        'Check file ownership rules in CLAUDE.md before modifying this file. Only the owning agent should write to owned files.',
      ),
    ],
    PostToolUse: [
      entry(
        'Bash',
        'Check the command output for test failures, lint errors, or type errors. If any are found, address them before proceeding.',
      ),
    ],
  };
}

function largeHooks(): HooksConfig {
  const base = mediumHooks();
  return {
    ...base,
    PreToolUse: [
      ...(base.PreToolUse ?? []),
      entry(
        'Bash',
        'Check for destructive commands (rm -rf, git reset --hard, DROP TABLE, etc.) and privilege escalation. Block if found.',
      ),
    ],
    Stop: [
      entry(
        '',
        'Comprehensive check: Were tests run and passing? Did build succeed? Were scoring protocols applied? Are there uncommitted changes?',
      ),
    ],
    TeammateIdle: [
      entry(
        '',
        'Check if any shared files were modified that other teammates need to be notified about.',
      ),
    ],
    TaskCompleted: [
      entry(
        '',
        'Verify completion criteria: All acceptance criteria met? Tests passing? Code reviewed? Documentation updated if needed?',
      ),
    ],
  };
}

export function generateHooks(scale: Scale): HooksConfig {
  switch (scale) {
    case 'small':
      return smallHooks();
    case 'medium':
      return mediumHooks();
    case 'large':
      return largeHooks();
  }
}
