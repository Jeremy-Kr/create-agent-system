import * as clack from '@clack/prompts';
import { t } from '../i18n/index.js';
import type { PresetName, TechStackInfo } from '../types/config.js';
import type { Preset } from '../types/preset.js';
import { VERSION } from '../utils/constants.js';
import type { ParsedArgs } from './args.js';
import { cancelGuard } from './clack-utils.js';

export interface PromptResult {
  preset: PresetName;
  projectName: string;
  techStack: TechStackInfo;
  shouldRunClaude: boolean;
  customPreset?: Preset;
}

function getPresetOptions() {
  return [
    { value: 'solo-dev', label: `${t('preset.solo_dev')} — ${t('preset.solo_dev.hint')}` },
    { value: 'small-team', label: `${t('preset.small_team')} — ${t('preset.small_team.hint')}` },
    { value: 'full-team', label: `${t('preset.full_team')} — ${t('preset.full_team.hint')}` },
    { value: 'custom', label: `${t('preset.custom')} — ${t('preset.custom.hint')}` },
  ] as const;
}

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
  clack.intro(`create-agent-system v${VERSION}`);

  // Preset selection
  let preset: PresetName;
  let customPreset: Preset | undefined;
  if (partialArgs.preset) {
    preset = partialArgs.preset;
    clack.log.info(`Preset: ${preset}`);
  } else {
    preset = cancelGuard(
      await clack.select({
        message: t('prompt.choose_preset'),
        options: [...getPresetOptions()],
      }),
    ) as PresetName;
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
    projectName = cancelGuard(
      await clack.text({
        message: t('prompt.project_name'),
        placeholder: t('prompt.project_name.placeholder'),
        validate: (value: string | undefined) => {
          if (!value || !isValidProjectName(value)) {
            return t('prompt.project_name.invalid');
          }
        },
      }),
    ) as string;
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
    cancelGuard(
      await clack.confirm({
        message: t('prompt.tech_stack_confirm', { stack: parts.join(' + ') }),
        initialValue: true,
      }),
    );
  }

  // Claude Code launch
  let shouldRunClaude = false;
  if (!partialArgs.noRun) {
    shouldRunClaude = cancelGuard(
      await clack.confirm({
        message: t('prompt.start_claude'),
        initialValue: true,
      }),
    ) as boolean;
  }

  return { preset, projectName, techStack, shouldRunClaude, customPreset };
}

export function displayResults(
  files: Array<{ path: string; action: string }>,
  warnings: string[],
): void {
  clack.log.success(t('display.scaffolding_complete'));

  for (const file of files) {
    if (file.action === 'created' || file.action === 'overwritten') {
      clack.log.info(t('display.file_created', { path: file.path }));
    } else if (file.action === 'skipped') {
      clack.log.warn(t('display.file_skipped', { path: file.path }));
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
    t('display.validation_stats', {
      files: stats.fileCount,
      agents: stats.agentCount,
      skills: stats.skillCount,
    }),
  );

  for (const err of result.errors) {
    clack.log.error(`[${err.rule}] ${err.message}`);
  }

  for (const warn of result.warnings) {
    clack.log.warn(`[${warn.rule}] ${warn.message}`);
  }

  if (result.valid) {
    clack.log.success(t('display.validation_passed'));
  } else {
    clack.log.error(t('display.validation_failed', { count: result.errors.length }));
  }
}
