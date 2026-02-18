import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import type { Locale } from '../i18n/types.js';
import type { PresetName, SkillName, WorkflowConfig } from '../types/config.js';
import type { ConfigFile } from '../types/config-file.js';
import type { Preset } from '../types/preset.js';
import { AGENT_NAMES, CONFIG_FILE_NAME, SKILL_NAMES } from '../utils/constants.js';
import { fileExists } from '../utils/fs.js';
import { isRecord, isStringArray, isValidModel } from '../utils/type-guards.js';
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

  let raw: Record<string, unknown>;
  try {
    const parsed = parseYaml(content);
    if (!isRecord(parsed)) {
      throw new Error('Failed to parse config file: malformed YAML (expected an object)');
    }
    raw = parsed;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Failed to parse config file')) {
      throw error;
    }
    throw new Error('Failed to parse config file: YAML syntax error');
  }

  // Validate required fields
  if (!raw.agents || typeof raw.agents !== 'object') {
    throw new Error('Config file missing required field: "agents"');
  }
  if (!raw.workflow || typeof raw.workflow !== 'object') {
    throw new Error('Config file missing required field: "workflow"');
  }
  if (!raw.skills || !Array.isArray(raw.skills)) {
    throw new Error('Config file missing required field: "skills"');
  }

  const projectName = (raw.project_name as string) || 'my-project';
  const workflow = convertWorkflow(raw.workflow as RawWorkflow);

  // Validate and build agents
  const agents = {} as Preset['agents'];
  const rawAgents = isRecord(raw.agents) ? raw.agents : {};
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

  // Validate skills
  const rawSkills = isStringArray(raw.skills) ? raw.skills : [];
  const skills = rawSkills.filter((s) =>
    (SKILL_NAMES as readonly string[]).includes(s),
  ) as SkillName[];

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
