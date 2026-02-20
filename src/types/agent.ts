export interface AgentFrontmatter {
  name: string;
  description: string;
  tools?: string; // comma-separated
  model?: 'opus' | 'sonnet' | 'haiku' | 'inherit';
  color?: 'blue' | 'cyan' | 'green' | 'yellow' | 'magenta' | 'red';
  permissionMode?: 'default' | 'acceptEdits' | 'dontAsk' | 'bypassPermissions' | 'plan';
  skills?: string; // comma-separated or YAML list
  disallowedTools?: string;
  maxTurns?: number;
  mcpServers?: string;
  hooks?: string;
  memory?: 'user' | 'project' | 'local';
  background?: boolean;
  isolation?: 'worktree';
}
