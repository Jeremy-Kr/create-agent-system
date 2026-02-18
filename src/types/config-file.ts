import type { Locale } from '../i18n/types.js';
import type { AgentConfig, AgentName, PresetName, SkillName, WorkflowConfig } from './config.js';

export interface ConfigFile {
  version: string;
  projectName: string;
  description?: string;
  basePreset?: PresetName;
  agents: Record<AgentName, AgentConfig>;
  workflow: WorkflowConfig;
  skills: SkillName[];
  language?: Locale;
}
