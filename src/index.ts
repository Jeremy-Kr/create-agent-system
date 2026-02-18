#!/usr/bin/env node

import { basename, resolve } from 'node:path';
import * as clack from '@clack/prompts';
import { parseArgs } from './cli/args.js';
import { displayResults, displayValidationResults, runInteractivePrompts } from './cli/prompts.js';
import { runClaudeCode } from './cli/runner.js';
import { loadPreset } from './core/preset-loader.js';
import { scaffold } from './core/scaffolder.js';
import { validate } from './core/validator.js';
import { detectTechStack } from './utils/detect.js';

export const VERSION = '0.1.0';

async function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    const targetDir = args.target ?? resolve('.');

    if (args.command === 'validate') {
      // Validate flow
      const result = await validate(targetDir);
      displayValidationResults(result);
      process.exit(result.valid ? 0 : 1);
    }

    // Scaffold flow
    const detectedTechStack = await detectTechStack(targetDir);

    let preset: Awaited<ReturnType<typeof loadPreset>>;
    let projectName: string;
    let shouldRunClaude = false;

    if (args.yes && args.preset) {
      // Non-interactive mode
      preset = await loadPreset(args.preset);
      projectName = args.projectName ?? basename(targetDir);
      shouldRunClaude = false;
    } else {
      // Interactive mode
      const promptResult = await runInteractivePrompts(args, detectedTechStack);
      preset = await loadPreset(promptResult.preset);
      projectName = promptResult.projectName;
      shouldRunClaude = !args.noRun && promptResult.shouldRunClaude;
    }

    // Run scaffolder
    if (args.dryRun) {
      clack.log.info('[DRY RUN] The following files would be created:');
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

    // Optionally launch Claude Code
    if (shouldRunClaude && !args.dryRun) {
      await runClaudeCode(targetDir);
    }

    clack.outro('Done! Happy coding.');
  } catch (error) {
    if (error instanceof Error) {
      clack.log.error(error.message);
    }
    process.exit(1);
  }
}

main();
