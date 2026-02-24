import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { t } from '../i18n/index.js';
import type { AgentName, SkillName, TechStackInfo } from '../types/config.js';
import type { Preset } from '../types/preset.js';
import {
  AGENT_CONTEXT_RULES,
  AGENT_DEFAULT_SKILLS,
  AGENT_DISPLAY_NAMES,
  AGENTS_DIR,
  CLAUDE_MD_FILE,
  CONTEXT_DIR,
  FILE_OWNERSHIP,
  LOGS_DIR,
  MAILBOX_DIR,
  SETTINGS_FILE,
} from '../utils/constants.js';
import { ensureDir, fileExists, writeFileSafe } from '../utils/fs.js';
import { BUNDLED_DOC_SPEC, type DocSpec } from './doc-spec.js';
import type { DocSpecValidationResult } from './doc-spec-validator.js';
import { validateDocSpec } from './doc-spec-validator.js';
import { generateHooks } from './hooks-generator.js';
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
  noDocCheck?: boolean;
  docSpec?: DocSpec;
}

export interface ScaffoldResult {
  files: Array<{ path: string; action: 'created' | 'skipped' | 'overwritten' }>;
  skills: SkillInstallResult[];
  warnings: string[];
  docSpecResult?: DocSpecValidationResult;
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
    .filter(([_, agentConfig]) => agentConfig.enabled)
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

interface RenderedAgent {
  agentName: AgentName;
  filePath: string;
  content: string;
}

async function renderAgentsToMemory(
  enabledAgents: AgentName[],
  targetDir: string,
  preset: Preset,
  techStack: TechStackInfo,
): Promise<RenderedAgent[]> {
  const agents: RenderedAgent[] = [];
  for (const agentName of enabledAgents) {
    const filePath = join(targetDir, AGENTS_DIR, `${agentName}.md`);
    const templateData = composeAgentTemplateData(agentName, preset, techStack);
    const content = await renderAgentTemplate(agentName, templateData);
    agents.push({ agentName, filePath, content });
  }
  return agents;
}

function parseFrontmatterFromContent(
  content: string,
): { data: Record<string, unknown>; body: string } | null {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return null;
  try {
    const data = parseYaml(match[1]) as Record<string, unknown>;
    return { data, body: match[2] };
  } catch {
    return null;
  }
}

async function writeRenderedAgents(
  agents: RenderedAgent[],
  dryRun: boolean | undefined,
  overwrite: boolean | undefined,
): Promise<ScaffoldResult['files']> {
  const files: ScaffoldResult['files'] = [];
  for (const { filePath, content } of agents) {
    if (dryRun) {
      files.push({ path: filePath, action: 'created' });
      continue;
    }
    const { skipped, existed } = await writeFileSafe(filePath, content, overwrite);
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
  preset: Preset,
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

  // Merge hooks: generated hooks take priority, preserve existing for other events
  const existingHooks = (existingSettings.hooks ?? {}) as Record<string, unknown>;
  const mergedHooks = { ...existingHooks, ...generateHooks(preset.scale) };

  const mergedSettings = {
    ...existingSettings,
    env: {
      ...((existingSettings.env as Record<string, string>) ?? {}),
      CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '1',
    },
    hooks: mergedHooks,
  };
  // Remove legacy agentTeams key if present
  delete (mergedSettings as Record<string, unknown>).agentTeams;
  await writeFile(settingsPath, JSON.stringify(mergedSettings, null, 2), 'utf-8');
  return [{ path: settingsPath, action: 'created' }];
}

async function writeContextLayer(
  targetDir: string,
  dryRun: boolean | undefined,
): Promise<ScaffoldResult['files']> {
  const files: ScaffoldResult['files'] = [];
  const dirs = [
    join(targetDir, CONTEXT_DIR),
    join(targetDir, MAILBOX_DIR),
    join(targetDir, LOGS_DIR),
  ];

  if (dryRun) {
    files.push({ path: join(targetDir, CONTEXT_DIR, 'scratch-pad.md'), action: 'created' });
    files.push({ path: join(targetDir, CONTEXT_DIR, 'decisions.jsonl'), action: 'created' });
    return files;
  }

  for (const dir of dirs) {
    await ensureDir(dir);
  }

  const scratchPadPath = join(targetDir, CONTEXT_DIR, 'scratch-pad.md');
  const scratchPadContent = `# Scratch Pad

Working memory for intermediate results, tool outputs, and temporary notes.
Agents write here to offload context from the conversation window.

---

`;
  const scratchResult = await writeFileSafe(scratchPadPath, scratchPadContent);
  files.push({
    path: scratchPadPath,
    action: scratchResult.skipped ? 'skipped' : 'created',
  });

  const decisionsPath = join(targetDir, CONTEXT_DIR, 'decisions.jsonl');
  const decisionsContent = `{"_schema":"decision","_version":"1.0","_description":"Append-only log of agent decisions. Each line: {agent, decision, reason, ts}"}
`;
  const decisionsResult = await writeFileSafe(decisionsPath, decisionsContent);
  files.push({
    path: decisionsPath,
    action: decisionsResult.skipped ? 'skipped' : 'created',
  });

  return files;
}

async function installSkillsWithWarnings(
  skills: SkillName[],
  targetDir: string,
  warnings: string[],
): Promise<SkillInstallResult[]> {
  const results = await installSkills(skills, targetDir);
  for (const sr of results) {
    if (!sr.success) {
      warnings.push(
        `Skill "${sr.skillName}" installation failed: ${sr.error ?? 'unknown error'}. Install manually with: npx skills add ${sr.skillName}`,
      );
    }
  }
  return results;
}

async function runDocSpecValidation(
  renderedAgents: { filePath: string; content: string }[],
  scale: 'small' | 'medium' | 'large',
  docSpec?: DocSpec,
): Promise<DocSpecValidationResult> {
  const spec = docSpec ?? BUNDLED_DOC_SPEC;
  const agentContents = renderedAgents
    .map(({ filePath, content }) => {
      const parsed = parseFrontmatterFromContent(content);
      if (!parsed) return null;
      return { filePath, frontmatter: parsed.data, body: parsed.body };
    })
    .filter((a): a is NonNullable<typeof a> => a !== null);

  const hooks = generateHooks(scale);
  return validateDocSpec(agentContents, hooks as unknown as Record<string, unknown>, spec);
}

export async function scaffold(config: ScaffoldConfig): Promise<ScaffoldResult> {
  const { preset, projectName, targetDir, techStack, dryRun, overwrite, noDocCheck, docSpec } =
    config;
  const result: ScaffoldResult = { files: [], skills: [], warnings: [] };

  const enabledAgents = Object.entries(preset.agents)
    .filter(([_, agentConfig]) => agentConfig.enabled)
    .map(([name]) => name as AgentName);

  // 1. Create directories
  if (!dryRun) {
    await ensureDir(join(targetDir, AGENTS_DIR));
  }

  // 2. Render agent templates to memory
  const renderedAgents = dryRun
    ? []
    : await renderAgentsToMemory(enabledAgents, targetDir, preset, techStack);

  // 3. Doc-spec validation (pre-write)
  if (!noDocCheck && !dryRun && renderedAgents.length > 0) {
    const docSpecResult = await runDocSpecValidation(renderedAgents, preset.scale, docSpec);
    result.docSpecResult = docSpecResult;
    for (const issue of docSpecResult.issues) {
      result.warnings.push(`[doc-spec] ${issue.message}`);
    }
  }

  // 4. Write agent files
  const agentFiles = dryRun
    ? enabledAgents.map((name) => ({
        path: join(targetDir, AGENTS_DIR, `${name}.md`),
        action: 'created' as const,
      }))
    : await writeRenderedAgents(renderedAgents, dryRun, overwrite);
  result.files.push(...agentFiles);

  // 5. CLAUDE.md
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

  // 6. Skills
  if (!dryRun) {
    result.skills = await installSkillsWithWarnings(preset.skills, targetDir, result.warnings);
  }

  // 7. settings.json (with hooks)
  result.files.push(...(await mergeSettingsJson(targetDir, preset, dryRun)));

  // 8. Context layer (scratch pad, decisions log, mailbox)
  result.files.push(...(await writeContextLayer(targetDir, dryRun)));

  return result;
}
