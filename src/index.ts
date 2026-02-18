#!/usr/bin/env node

import { basename, dirname, resolve } from 'node:path';
import * as clack from '@clack/prompts';
import { type ParsedArgs, parseArgs } from './cli/args.js';
import { displayResults, displayValidationResults, runInteractivePrompts } from './cli/prompts.js';
import {
  displayInstallResults,
  displayRegistryList,
  displaySearchResults,
  promptConflictResolution,
  promptDependencyInstall,
} from './cli/registry-prompts.js';
import { runClaudeCode } from './cli/runner.js';
import { detectConfigFile, loadConfigFile, saveConfigFile } from './core/config-file-loader.js';
import { diffPresets, displayDiff } from './core/preset-differ.js';
import { loadPreset } from './core/preset-loader.js';
import { fetchRegistryIndex } from './core/registry-client.js';
import { installFromRegistry } from './core/registry-installer.js';
import { listRegistry, searchRegistry } from './core/registry-search.js';
import { scaffold } from './core/scaffolder.js';
import { validate } from './core/validator.js';
import { detectSystemLocale } from './i18n/detect.js';
import { initI18n, t } from './i18n/index.js';
import type { PresetName, TechStackInfo } from './types/config.js';
import type { Preset } from './types/preset.js';
import { PRESET_NAMES } from './utils/constants.js';
import { detectTechStack } from './utils/detect.js';

export const VERSION = '0.4.0';

async function resolvePresetForDiff(nameOrPath: string): Promise<Preset> {
  if ((PRESET_NAMES as readonly string[]).includes(nameOrPath)) {
    return loadPreset(nameOrPath as PresetName);
  }
  const configDir = dirname(resolve(nameOrPath));
  const { preset } = await loadConfigFile(configDir);
  return preset;
}

interface ResolvedPreset {
  preset: Preset;
  projectName: string;
  shouldRunClaude: boolean;
  basePresetName: PresetName | undefined;
}

async function resolveFromPrompts(
  args: Partial<ParsedArgs>,
  detectedTechStack: TechStackInfo,
): Promise<ResolvedPreset> {
  const result = await runInteractivePrompts(args, detectedTechStack);
  const shouldRunClaude = !args.noRun && result.shouldRunClaude;
  const preset = result.customPreset ?? (await loadPreset(result.preset));
  const basePresetName = result.customPreset ? 'custom' : result.preset;

  return { preset, projectName: result.projectName, shouldRunClaude, basePresetName };
}

async function handleAdd(args: ParsedArgs, targetDir: string): Promise<never> {
  clack.intro(`create-agent-system v${VERSION}`);
  const result = await installFromRegistry(args.addNames as string[], {
    targetDir,
    type: args.registryType,
    force: args.force,
    yes: args.yes,
    onConflict: promptConflictResolution,
    onDependencies: promptDependencyInstall,
  });
  displayInstallResults(result);
  clack.outro(t('display.done'));
  process.exit(result.installed.length > 0 ? 0 : 1);
}

async function handleSearch(args: ParsedArgs): Promise<never> {
  clack.intro(`create-agent-system v${VERSION}`);
  const index = await fetchRegistryIndex();
  const results = searchRegistry(index, args.searchQuery as string, {
    type: args.registryType,
    tag: args.tag,
  });
  displaySearchResults(results);
  clack.outro('');
  process.exit(0);
}

async function handleList(args: ParsedArgs): Promise<never> {
  clack.intro(`create-agent-system v${VERSION}`);
  const index = await fetchRegistryIndex();
  const results = listRegistry(index, { type: args.registryType });
  displayRegistryList(results);
  clack.outro('');
  process.exit(0);
}

async function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    initI18n(args.lang ?? detectSystemLocale());
    const targetDir = args.target ?? resolve('.');

    if (args.command === 'validate') {
      const result = await validate(targetDir);
      if (!args.quiet || !result.valid || result.warnings.length > 0) {
        displayValidationResults(result);
      }
      process.exit(result.valid ? 0 : 1);
    }

    if (args.command === 'diff') {
      const [a, b] = args.diffArgs as [string, string];
      const presetA = await resolvePresetForDiff(a);
      const presetB = await resolvePresetForDiff(b);
      const diff = diffPresets(presetA, presetB);
      displayDiff(diff);
      process.exit(0);
    }

    if (args.command === 'add') await handleAdd(args, targetDir);
    if (args.command === 'search') await handleSearch(args);
    if (args.command === 'list') await handleList(args);

    // Scaffold flow
    const detectedTechStack = await detectTechStack(targetDir);

    let preset: Preset;
    let projectName: string;
    let shouldRunClaude = false;
    let basePresetName: PresetName | undefined;

    const configDir = args.config ? dirname(resolve(args.config)) : targetDir;

    if (args.yes && args.preset) {
      // Non-interactive mode
      if (args.preset === 'custom') {
        throw new Error('--yes cannot be used with --preset custom (requires interactive input)');
      }
      preset = await loadPreset(args.preset);
      projectName = args.projectName ?? basename(targetDir);
      shouldRunClaude = false;
    } else if (!args.ignoreConfig && !args.yes && (await detectConfigFile(configDir))) {
      // Config file auto-detect
      const loaded = await loadConfigFile(configDir);
      preset = loaded.preset;
      projectName = loaded.projectName;
      clack.intro(`create-agent-system v${VERSION}`);
      clack.log.info(t('display.config_loaded'));
      clack.log.info(`Project: ${projectName}, Base: ${preset.name}`);

      const useConfig = await clack.confirm({
        message: t('prompt.use_config'),
        initialValue: true,
      });
      if (clack.isCancel(useConfig)) {
        clack.cancel(t('prompt.cancel'));
        process.exit(0);
      }

      if (!useConfig) {
        ({ preset, projectName, shouldRunClaude, basePresetName } = await resolveFromPrompts(
          args,
          detectedTechStack,
        ));
      } else {
        // Ask about Claude Code launch
        if (!args.noRun) {
          const launch = await clack.confirm({
            message: t('prompt.start_claude'),
            initialValue: true,
          });
          if (clack.isCancel(launch)) {
            clack.cancel(t('prompt.cancel'));
            process.exit(0);
          }
          shouldRunClaude = launch as boolean;
        }
      }
    } else {
      // Interactive mode
      ({ preset, projectName, shouldRunClaude, basePresetName } = await resolveFromPrompts(
        args,
        detectedTechStack,
      ));
    }

    // Run scaffolder
    if (args.dryRun) {
      clack.log.info(t('display.dry_run'));
    }

    const result = await scaffold({
      preset,
      projectName,
      targetDir,
      techStack: detectedTechStack,
      dryRun: args.dryRun,
      overwrite: false,
    });

    displayResults(result.files, result.warnings);

    // Run validation on generated output
    if (!args.dryRun) {
      const validationResult = await validate(targetDir);
      displayValidationResults(validationResult);
    }

    // Save config file if requested
    if (args.saveConfig && !args.dryRun) {
      const configPath = await saveConfigFile(targetDir, preset, projectName, basePresetName);
      clack.log.success(t('display.config_saved', { path: configPath }));
    }

    // Optionally launch Claude Code
    if (shouldRunClaude && !args.dryRun) {
      await runClaudeCode(targetDir);
    }

    clack.outro(t('display.done'));
  } catch (error) {
    if (error instanceof Error) {
      clack.log.error(error.message);
    }
    process.exit(1);
  }
}

main();
