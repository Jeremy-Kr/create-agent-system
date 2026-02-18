import * as clack from '@clack/prompts';
import type { PresetName, TechStackInfo } from '../types/config.js';
import type { Preset } from '../types/preset.js';
import type { ParsedArgs } from './args.js';

export interface PromptResult {
  preset: PresetName;
  projectName: string;
  techStack: TechStackInfo;
  shouldRunClaude: boolean;
  customPreset?: Preset;
}

const PRESET_OPTIONS = [
  { value: 'solo-dev', label: 'Solo Dev', hint: '1-person, abbreviated workflow' },
  { value: 'small-team', label: 'Small Team', hint: 'standard workflow, EPIC-based' },
  { value: 'full-team', label: 'Full Team', hint: 'full process, Strict QA' },
  { value: 'custom', label: 'Custom', hint: 'configure agents, workflow, skills' },
] as const;

export function isValidProjectName(name: string): boolean {
  if (!name) return false;
  // npm package name rules: lowercase, no spaces, no starting with . or _
  const npmNameRegex = /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9][a-z0-9-._~]*$/;
  return npmNameRegex.test(name);
}

export async function runInteractivePrompts(
  partialArgs: Partial<ParsedArgs>,
  detectedTechStack: TechStackInfo,
): Promise<PromptResult> {
  clack.intro('create-agent-system v0.3.0');

  // Preset selection
  let preset: PresetName;
  let customPreset: Preset | undefined;
  if (partialArgs.preset) {
    preset = partialArgs.preset;
    clack.log.info(`Preset: ${preset}`);
  } else {
    const selected = await clack.select({
      message: 'Choose a preset:',
      options: PRESET_OPTIONS.map((o) => ({ value: o.value, label: `${o.label} — ${o.hint}` })),
    });
    if (clack.isCancel(selected)) {
      clack.cancel('Operation cancelled.');
      process.exit(0);
    }
    preset = selected as PresetName;
  }

  // Custom preset flow
  if (preset === 'custom') {
    const { runCustomPresetPrompts } = await import('./custom-prompts.js');
    customPreset = await runCustomPresetPrompts();
  }

  // Project name
  let projectName: string;
  if (partialArgs.projectName) {
    projectName = partialArgs.projectName;
    clack.log.info(`Project: ${projectName}`);
  } else {
    const name = await clack.text({
      message: 'Project name:',
      placeholder: 'my-project',
      validate: (value: string | undefined) => {
        if (!value || !isValidProjectName(value)) {
          return 'Invalid name. Use lowercase, hyphens, no spaces.';
        }
      },
    });
    if (clack.isCancel(name)) {
      clack.cancel('Operation cancelled.');
      process.exit(0);
    }
    projectName = name as string;
  }

  // Tech stack confirmation
  const techStack = { ...detectedTechStack };
  if (detectedTechStack.framework || detectedTechStack.language) {
    const parts = [
      detectedTechStack.framework,
      detectedTechStack.language,
      detectedTechStack.cssFramework,
      detectedTechStack.packageManager,
    ].filter(Boolean);
    const confirmed = await clack.confirm({
      message: `Detected: ${parts.join(' + ')}. Correct?`,
      initialValue: true,
    });
    if (clack.isCancel(confirmed)) {
      clack.cancel('Operation cancelled.');
      process.exit(0);
    }
  }

  // Claude Code launch
  let shouldRunClaude = false;
  if (!partialArgs.noRun) {
    const launch = await clack.confirm({
      message: 'Start Claude Code in plan mode?',
      initialValue: true,
    });
    if (clack.isCancel(launch)) {
      clack.cancel('Operation cancelled.');
      process.exit(0);
    }
    shouldRunClaude = launch as boolean;
  }

  return { preset, projectName, techStack, shouldRunClaude, customPreset };
}

export function displayResults(
  files: Array<{ path: string; action: string }>,
  warnings: string[],
): void {
  clack.log.success('Scaffolding complete!');

  for (const file of files) {
    if (file.action === 'created' || file.action === 'overwritten') {
      clack.log.info(`  + ${file.path}`);
    } else if (file.action === 'skipped') {
      clack.log.warn(`  ~ ${file.path} (skipped)`);
    }
  }

  for (const warning of warnings) {
    clack.log.warn(warning);
  }
}

export function displayValidationResults(result: {
  valid: boolean;
  errors: Array<{ rule: string; file: string; message: string }>;
  warnings: Array<{ rule: string; file: string; message: string }>;
  stats: { agentCount: number; skillCount: number; fileCount: number };
}): void {
  const { stats } = result;
  clack.log.info(
    `${stats.fileCount} files, ${stats.agentCount} agents, ${stats.skillCount} skills`,
  );

  for (const err of result.errors) {
    clack.log.error(`[${err.rule}] ${err.message}`);
  }

  for (const warn of result.warnings) {
    clack.log.warn(`[${warn.rule}] ${warn.message}`);
  }

  if (result.valid) {
    clack.log.success('Validation passed!');
  } else {
    clack.log.error(`Validation failed with ${result.errors.length} error(s).`);
  }
}
