import type { ConfigFile } from '../types/config-file.js';
import type { Preset } from '../types/preset.js';
import { deriveScale } from './preset-loader.js';

export function configToPreset(config: ConfigFile): Preset {
  const scale = deriveScale(config.workflow);
  return {
    name: config.basePreset ?? 'custom',
    description: config.description ?? 'Custom config',
    scale,
    agents: config.agents,
    workflow: config.workflow,
    skills: config.skills,
  };
}

export function presetToConfigUpdate(original: ConfigFile, edited: Preset): ConfigFile {
  return {
    version: original.version,
    projectName: original.projectName,
    description: edited.description,
    basePreset: original.basePreset,
    agents: edited.agents,
    workflow: edited.workflow,
    skills: edited.skills,
    language: original.language,
  };
}
