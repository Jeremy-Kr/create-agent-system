import type { AgentName, SkillName } from './config.js';

export interface AgentDiff {
  agent: AgentName;
  field: 'enabled' | 'model';
  a: string | boolean;
  b: string | boolean;
}

export interface WorkflowDiff {
  field: string;
  a: string | number | boolean;
  b: string | number | boolean;
}

export interface SkillDiff {
  onlyInA: SkillName[];
  onlyInB: SkillName[];
  common: SkillName[];
}

export interface PresetDiffResult {
  nameA: string;
  nameB: string;
  agents: AgentDiff[];
  workflow: WorkflowDiff[];
  skills: SkillDiff;
  scaleChanged: boolean;
  scaleA?: string;
  scaleB?: string;
}
