import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { t } from '../i18n/index.js';
import type { AgentName, SkillName, TechStackInfo } from '../types/config.js';
import type { Preset } from '../types/preset.js';
import {
  AGENT_CONTEXT_RULES,
  AGENT_DEFAULT_SKILLS,
  AGENT_DISPLAY_NAMES,
  AGENTS_DIR,
  CLAUDE_MD_FILE,
  FILE_OWNERSHIP,
  SETTINGS_FILE,
} from '../utils/constants.js';
import { ensureDir, fileExists, writeFileSafe } from '../utils/fs.js';
import type { SkillInstallResult } from './skill-installer.js';
import { installSkills } from './skill-installer.js';
import type { AgentTemplateData, ClaudeMdTemplateData } from './template-renderer.js';
import { renderAgentTemplate, renderClaudeMdTemplate } from './template-renderer.js';

export interface ScaffoldConfig {
  preset: Preset;
  projectName: string;
  targetDir: string;
  techStack: TechStackInfo;
  dryRun?: boolean;
  overwrite?: boolean;
}

export interface ScaffoldResult {
  files: Array<{ path: string; action: 'created' | 'skipped' | 'overwritten' }>;
  skills: SkillInstallResult[];
  warnings: string[];
}

export function computeAgentSkills(agentName: AgentName, presetSkills: SkillName[]): SkillName[] {
  const defaults = AGENT_DEFAULT_SKILLS[agentName];
  return defaults.filter((skill) => presetSkills.includes(skill));
}

export function composeAgentTemplateData(
  agentName: AgentName,
  preset: Preset,
  techStack: TechStackInfo,
): AgentTemplateData {
  const computedSkills = computeAgentSkills(agentName, preset.skills);
  const packageManager = techStack.packageManager ?? 'pnpm';
  const hasVisualQa = preset.workflow.visualQaLevel > 0 && computedSkills.includes('visual-qa');

  return {
    model: preset.agents[agentName].model,
    skills: computedSkills.length > 0 ? computedSkills.join(', ') : undefined,
    packageManager,
    visualQa: hasVisualQa,
    visualQaLevel: preset.workflow.visualQaLevel,
    epicBased: preset.workflow.epicBased,
  };
}

export function composeClaudeMdData(
  preset: Preset,
  projectName: string,
  techStack: TechStackInfo,
): ClaudeMdTemplateData {
  const packageManager = techStack.packageManager ?? 'pnpm';
  const enabledAgents = Object.entries(preset.agents)
    .filter(([_, config]) => config.enabled)
    .map(([name]) => name as AgentName);

  return {
    projectName,
    packageManager,
    visualQa: preset.workflow.visualQaLevel > 0,
    visualQaLevel: preset.workflow.visualQaLevel,
    epicBased: preset.workflow.epicBased,
    activeAgents: enabledAgents.map((name) => ({
      displayName: AGENT_DISPLAY_NAMES[name],
      ...AGENT_CONTEXT_RULES[name],
    })),
    fileOwnership: FILE_OWNERSHIP,
    headings: {
      projectMemory: t('heading.project_memory'),
      projectOverview: t('heading.project_overview'),
      commonRules: t('heading.common_rules'),
      buildCommands: t('heading.build_commands'),
      codeStyle: t('heading.code_style'),
      agentContextRules: t('heading.agent_context_rules'),
      fileOwnership: t('heading.file_ownership'),
      exclusiveOwnership: t('heading.exclusive_ownership'),
      sharedFileRules: t('heading.shared_file_rules'),
      failureModes: t('heading.failure_modes'),
      detectionCriteria: t('heading.detection_criteria'),
      escalationRules: t('heading.escalation_rules'),
      epicDependency: t('heading.epic_dependency'),
      modelConfig: t('heading.model_config'),
    },
  };
}

async function writeAgentFiles(
  enabledAgents: AgentName[],
  targetDir: string,
  preset: Preset,
  techStack: TechStackInfo,
  dryRun: boolean | undefined,
  overwrite: boolean | undefined,
): Promise<ScaffoldResult['files']> {
  const files: ScaffoldResult['files'] = [];
  for (const agentName of enabledAgents) {
    const filePath = join(targetDir, AGENTS_DIR, `${agentName}.md`);
    if (dryRun) {
      files.push({ path: filePath, action: 'created' });
      continue;
    }
    const templateData = composeAgentTemplateData(agentName, preset, techStack);
    const rendered = await renderAgentTemplate(agentName, templateData);
    const { skipped, existed } = await writeFileSafe(filePath, rendered, overwrite);
    if (skipped) {
      files.push({ path: filePath, action: 'skipped' });
    } else {
      files.push({ path: filePath, action: existed ? 'overwritten' : 'created' });
    }
  }
  return files;
}

async function writeClaudeMdFile(
  targetDir: string,
  preset: Preset,
  projectName: string,
  techStack: TechStackInfo,
  dryRun: boolean | undefined,
  overwrite: boolean | undefined,
): Promise<{ files: ScaffoldResult['files']; warnings: string[] }> {
  const claudeMdPath = join(targetDir, CLAUDE_MD_FILE);
  if (dryRun) {
    return { files: [{ path: claudeMdPath, action: 'created' }], warnings: [] };
  }
  const claudeMdData = composeClaudeMdData(preset, projectName, techStack);
  const claudeMdContent = await renderClaudeMdTemplate(claudeMdData);
  const { skipped, existed } = await writeFileSafe(claudeMdPath, claudeMdContent, overwrite);
  if (skipped) {
    return {
      files: [{ path: claudeMdPath, action: 'skipped' }],
      warnings: ['CLAUDE.md already exists; skipped (use --overwrite to replace)'],
    };
  }
  return {
    files: [{ path: claudeMdPath, action: existed && overwrite ? 'overwritten' : 'created' }],
    warnings: [],
  };
}

async function mergeSettingsJson(
  targetDir: string,
  dryRun: boolean | undefined,
): Promise<ScaffoldResult['files']> {
  const settingsPath = join(targetDir, SETTINGS_FILE);
  if (dryRun) {
    return [{ path: settingsPath, action: 'created' }];
  }
  await ensureDir(join(targetDir, '.claude'));
  let existingSettings: Record<string, unknown> = {};
  if (await fileExists(settingsPath)) {
    try {
      existingSettings = JSON.parse(await readFile(settingsPath, 'utf-8'));
    } catch {
      // If existing settings.json is malformed, start fresh
    }
  }
  const mergedSettings = { ...existingSettings, agentTeams: { enabled: true } };
  await writeFile(settingsPath, JSON.stringify(mergedSettings, null, 2), 'utf-8');
  return [{ path: settingsPath, action: 'created' }];
}

export async function scaffold(config: ScaffoldConfig): Promise<ScaffoldResult> {
  const { preset, projectName, targetDir, techStack, dryRun, overwrite } = config;
  const result: ScaffoldResult = { files: [], skills: [], warnings: [] };

  const enabledAgents = Object.entries(preset.agents)
    .filter(([_, config]) => config.enabled)
    .map(([name]) => name as AgentName);

  // 1. Create directories
  if (!dryRun) {
    await ensureDir(join(targetDir, AGENTS_DIR));
  }

  // 2. Agent files
  result.files.push(
    ...(await writeAgentFiles(enabledAgents, targetDir, preset, techStack, dryRun, overwrite)),
  );

  // 3. CLAUDE.md
  const claudeMd = await writeClaudeMdFile(
    targetDir,
    preset,
    projectName,
    techStack,
    dryRun,
    overwrite,
  );
  result.files.push(...claudeMd.files);
  result.warnings.push(...claudeMd.warnings);

  // 4. Skills
  if (!dryRun) {
    const skillResults = await installSkills(preset.skills, targetDir);
    result.skills = skillResults;
    for (const sr of skillResults) {
      if (!sr.success) {
        result.warnings.push(
          `Skill "${sr.skillName}" installation failed: ${sr.error ?? 'unknown error'}. Install manually with: npx @anthropic/skills add ${sr.skillName}`,
        );
      }
    }
  }

  // 5. settings.json
  result.files.push(...(await mergeSettingsJson(targetDir, dryRun)));

  return result;
}
