import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import type { PresetName, WorkflowConfig } from '../types/config.js';
import type { Preset } from '../types/preset.js';
import { PRESET_NAMES } from '../utils/constants.js';

const presetsDir = fileURLToPath(new URL('../../presets/', import.meta.url));

export interface RawWorkflow {
  review_max_rounds: number;
  qa_mode: 'lite' | 'standard';
  visual_qa_level: 0 | 1 | 2 | 3;
  epic_based: boolean;
}

export function convertWorkflow(raw: RawWorkflow): WorkflowConfig {
  return {
    reviewMaxRounds: raw.review_max_rounds,
    qaMode: raw.qa_mode,
    visualQaLevel: raw.visual_qa_level,
    epicBased: raw.epic_based,
  };
}

export function deriveScale(workflow: WorkflowConfig): 'small' | 'medium' | 'large' {
  if (workflow.visualQaLevel >= 3 && workflow.qaMode === 'standard') {
    return 'large';
  }
  if (workflow.epicBased || workflow.qaMode === 'standard') {
    return 'medium';
  }
  return 'small';
}

export function listPresets(): PresetName[] {
  return [...PRESET_NAMES] as PresetName[];
}

export function getPresetPath(presetName: PresetName): string {
  return join(presetsDir, `${presetName}.yaml`);
}

export function parsePresetContent(content: string, presetName: string): Preset {
  let raw: Record<string, unknown>;
  try {
    raw = parseYaml(content) as Record<string, unknown>;
  } catch {
    throw new Error(`Failed to parse preset "${presetName}": malformed YAML`);
  }

  if (!raw || typeof raw !== 'object') {
    throw new Error(`Failed to parse preset "${presetName}": malformed YAML`);
  }

  for (const field of ['name', 'description', 'scale', 'agents', 'workflow', 'skills']) {
    if (!(field in raw)) {
      throw new Error(`Preset "${presetName}" is missing required field: "${field}"`);
    }
  }

  return {
    name: raw.name as PresetName,
    description: raw.description as string,
    scale: raw.scale as Preset['scale'],
    agents: raw.agents as Preset['agents'],
    workflow: convertWorkflow(raw.workflow as RawWorkflow),
    skills: raw.skills as Preset['skills'],
  };
}

export async function loadPreset(presetName: PresetName): Promise<Preset> {
  if (!(PRESET_NAMES as readonly string[]).includes(presetName)) {
    throw new Error(`Unknown preset "${presetName}". Valid presets: ${PRESET_NAMES.join(', ')}`);
  }

  const filePath = getPresetPath(presetName);

  let content: string;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch {
    throw new Error(`Failed to load preset "${presetName}": file not found at ${filePath}`);
  }

  return parsePresetContent(content, presetName);
}
