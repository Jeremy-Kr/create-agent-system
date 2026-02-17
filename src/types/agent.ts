export interface AgentFrontmatter {
  name: string;
  description: string;
  tools?: string;
  model?: 'opus' | 'sonnet' | 'haiku' | 'inherit';
  permissionMode?: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan' | 'ignore';
  skills?: string;
}
