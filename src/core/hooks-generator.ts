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
    SessionStart: [
      entry(
        '',
        'Read CLAUDE.md and understand the project state. Check .claude/context/decisions.jsonl for recent decisions. Check .claude/context/mailbox/ for pending messages.',
      ),
    ],
    Stop: [
      entry(
        '',
        'Before stopping, verify: Were tests run? Did the build succeed? Are there uncommitted changes? If code was modified, review for unnecessary complexity before committing. Log any significant decisions to .claude/context/decisions.jsonl.',
      ),
    ],
    PreCompact: [
      entry(
        '',
        'Context is being compressed. Preserve: current task details, acceptance criteria, file paths being worked on, and recent decisions from .claude/context/decisions.jsonl. Summarize completed work to .claude/context/scratch-pad.md before compression.',
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
        'Check file ownership rules in CLAUDE.md before modifying this file. Only the owning agent should write to owned files. Block writes to .env files or files containing hardcoded secrets/API keys.',
      ),
      entry(
        'Task',
        'When delegating to another agent, forward the original task description verbatim. Do not paraphrase or summarize — this prevents the Telephone Game problem where fidelity is lost through repeated summarization.',
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
        'Comprehensive check: Were tests run and passing? Did build succeed? Were scoring protocols applied? Are there uncommitted changes? If code was modified, review for unnecessary complexity before committing. Log session summary to .claude/context/decisions.jsonl.',
      ),
    ],
    TeammateIdle: [
      entry(
        '',
        'Check .claude/context/mailbox/ for pending messages. Check if any shared files were modified that other teammates need to be notified about. Write notifications to mailbox.',
      ),
    ],
    TaskCompleted: [
      entry(
        '',
        'Verify completion criteria: All acceptance criteria met? Tests passing? Code reviewed? Documentation updated? Log completion to .claude/context/decisions.jsonl.',
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
