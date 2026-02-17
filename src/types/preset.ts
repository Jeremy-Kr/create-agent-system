import type { AgentConfig, AgentName, PresetName, SkillName, WorkflowConfig } from './config.js';

export interface Preset {
  name: PresetName;
  description: string;
  scale: 'small' | 'medium' | 'large';
  agents: Record<AgentName, AgentConfig>;
  workflow: WorkflowConfig;
  skills: SkillName[];
}
