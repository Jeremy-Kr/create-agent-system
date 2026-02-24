export interface AgentSystemConfig {
  preset: PresetName;
  projectName: string;
  scale: 'small' | 'medium' | 'large';
  agents: Record<AgentName, AgentConfig>;
  workflow: WorkflowConfig;
  skills: SkillName[];
  techStack?: TechStackInfo;
}

export interface AgentConfig {
  enabled: boolean;
  model: 'opus' | 'sonnet' | 'haiku';
}

export interface WorkflowConfig {
  reviewMaxRounds: number;
  qaMode: 'lite' | 'standard';
  visualQaLevel: 0 | 1 | 2 | 3;
  epicBased: boolean;
}

export interface TechStackInfo {
  framework?: string;
  language?: string;
  packageManager?: string;
  cssFramework?: string;
}

export type PresetName = 'solo-dev' | 'small-team' | 'full-team' | 'custom';

export type AgentName =
  | 'po-pm'
  | 'architect'
  | 'cto'
  | 'designer'
  | 'test-writer'
  | 'frontend-dev'
  | 'backend-dev'
  | 'qa-reviewer';

export type SkillName =
  | 'scoring'
  | 'visual-qa'
  | 'tdd-workflow'
  | 'adr-writing'
  | 'ticket-writing'
  | 'design-system'
  | 'cr-process'
  | 'sync-spec'
  | 'context-engineering';
