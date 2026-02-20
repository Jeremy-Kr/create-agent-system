export interface DocSpec {
  version: string;
  source: 'bundled' | 'context7';
  agent: {
    requiredFields: string[];
    optionalFields: string[];
    deprecatedFields: string[];
    validModels: string[];
    validPermissionModes: string[];
    validColors: string[];
    descriptionRequiresExamples: boolean;
    toolsFormat: 'comma-separated' | 'array';
  };
  skill: {
    requiredFields: string[];
    descriptionFormat: string;
    requiresVersion: boolean;
  };
  hooks: {
    validEvents: string[];
    extensionEvents: string[];
    hookTypes: string[];
  };
  claudeMd: {
    maxLines: number;
    requiredSections: string[];
  };
}

export const BUNDLED_DOC_SPEC: DocSpec = {
  version: '2026-02-20',
  source: 'bundled',
  agent: {
    requiredFields: ['name', 'description'],
    optionalFields: [
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
    ],
    deprecatedFields: [],
    validModels: ['opus', 'sonnet', 'haiku', 'inherit'],
    validPermissionModes: ['default', 'acceptEdits', 'dontAsk', 'bypassPermissions', 'plan'],
    validColors: ['blue', 'cyan', 'green', 'yellow', 'magenta', 'red'],
    descriptionRequiresExamples: false,
    toolsFormat: 'array',
  },
  skill: {
    requiredFields: ['name', 'description'],
    descriptionFormat: 'Use when user asks to...',
    requiresVersion: false,
  },
  hooks: {
    validEvents: [
      'PreToolUse',
      'PostToolUse',
      'Stop',
      'SubagentStop',
      'SessionStart',
      'SessionEnd',
      'UserPromptSubmit',
      'PreCompact',
      'Notification',
    ],
    extensionEvents: [
      'PostToolUseFailure',
      'SubagentStart',
      'TeammateIdle',
      'TaskCompleted',
      'PermissionRequest',
      'ConfigChange',
    ],
    hookTypes: ['command', 'prompt', 'agent'],
  },
  claudeMd: {
    maxLines: 150,
    requiredSections: ['Project Memory'],
  },
};
