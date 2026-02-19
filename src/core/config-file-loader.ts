import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { stringify as stringifyYaml } from 'yaml';
import type { Locale } from '../i18n/types.js';
import type { PresetName, SkillName, WorkflowConfig } from '../types/config.js';
import type { ConfigFile } from '../types/config-file.js';
import type { Preset } from '../types/preset.js';
import { AGENT_NAMES, CONFIG_FILE_NAME, SKILL_NAMES } from '../utils/constants.js';
import { fileExists } from '../utils/fs.js';
import { isRecord, isStringArray, isValidModel } from '../utils/type-guards.js';
import { safeParseYaml } from '../utils/yaml.js';
import { convertWorkflow, deriveScale, type RawWorkflow } from './preset-loader.js';

export function getConfigFilePath(targetDir: string): string {
  return join(targetDir, CONFIG_FILE_NAME);
}

export async function detectConfigFile(targetDir: string): Promise<boolean> {
  return fileExists(getConfigFilePath(targetDir));
}

function convertWorkflowToSnake(workflow: WorkflowConfig): RawWorkflow {
  return {
    review_max_rounds: workflow.reviewMaxRounds,
    qa_mode: workflow.qaMode,
    visual_qa_level: workflow.visualQaLevel,
    epic_based: workflow.epicBased,
  };
}

function validateConfigRequiredFields(raw: Record<string, unknown>): void {
  if (!raw.agents || typeof raw.agents !== 'object') {
    throw new Error('Config file missing required field: "agents"');
  }
  if (!raw.workflow || typeof raw.workflow !== 'object') {
    throw new Error('Config file missing required field: "workflow"');
  }
  if (!raw.skills || !Array.isArray(raw.skills)) {
    throw new Error('Config file missing required field: "skills"');
  }
}

function buildAgentsFromRaw(rawAgents: Record<string, unknown>): Preset['agents'] {
  const agents = {} as Preset['agents'];
  for (const name of AGENT_NAMES) {
    const agentRaw = rawAgents[name];
    if (isRecord(agentRaw)) {
      agents[name] = {
        enabled: Boolean(agentRaw.enabled),
        model: isValidModel(agentRaw.model) ? agentRaw.model : 'opus',
      };
    } else {
      agents[name] = { enabled: false, model: 'opus' };
    }
  }
  return agents;
}

function buildSkillsFromRaw(rawSkills: unknown[]): SkillName[] {
  const validated = isStringArray(rawSkills) ? rawSkills : [];
  return validated.filter((s) => (SKILL_NAMES as readonly string[]).includes(s)) as SkillName[];
}

export async function loadConfigFile(
  targetDir: string,
): Promise<{ preset: Preset; projectName: string; language?: Locale }> {
  const filePath = getConfigFilePath(targetDir);
  let content: string;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch {
    throw new Error(`Config file not found: ${filePath}`);
  }

  const raw = safeParseYaml(content, 'config file');
  validateConfigRequiredFields(raw);

  const projectName = (raw.project_name as string) || 'my-project';
  const workflow = convertWorkflow(raw.workflow as RawWorkflow);
  const agents = buildAgentsFromRaw(isRecord(raw.agents) ? raw.agents : {});
  const skills = buildSkillsFromRaw(raw.skills as unknown[]);
  const scale = deriveScale(workflow);

  const preset: Preset = {
    name: (raw.base_preset as PresetName) || 'custom',
    description: (raw.description as string) || 'Custom config',
    scale,
    agents,
    workflow,
    skills,
  };

  const language = (raw.language as Locale) || undefined;

  return { preset, projectName, language };
}

export async function saveConfigFile(
  targetDir: string,
  preset: Preset,
  projectName: string,
  basePreset?: PresetName,
  language?: Locale,
): Promise<string> {
  const configFile: ConfigFile = {
    version: '1.0',
    projectName,
    description: preset.description,
    basePreset: basePreset || (preset.name === 'custom' ? undefined : preset.name),
    agents: preset.agents,
    workflow: preset.workflow,
    skills: preset.skills,
    language,
  };

  // Convert to snake_case YAML structure
  const yamlObj: Record<string, unknown> = {
    version: configFile.version,
    project_name: configFile.projectName,
  };
  if (configFile.description) yamlObj.description = configFile.description;
  if (configFile.basePreset) yamlObj.base_preset = configFile.basePreset;

  // Agents as-is (keys are already kebab-case)
  yamlObj.agents = configFile.agents;

  // Workflow in snake_case
  yamlObj.workflow = convertWorkflowToSnake(configFile.workflow);

  yamlObj.skills = configFile.skills;
  if (configFile.language) yamlObj.language = configFile.language;

  const yamlContent = stringifyYaml(yamlObj, { lineWidth: 120 });
  const filePath = getConfigFilePath(targetDir);
  await writeFile(filePath, yamlContent, 'utf-8');
  return filePath;
}
