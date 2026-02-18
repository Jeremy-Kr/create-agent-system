import { resolve } from 'node:path';
import { Command } from 'commander';
import type { PresetName } from '../types/config.js';
import { PRESET_NAMES } from '../utils/constants.js';

export interface ParsedArgs {
  command: 'scaffold' | 'validate';
  preset?: PresetName;
  projectName?: string;
  target?: string;
  noRun?: boolean;
  yes?: boolean;
  dryRun?: boolean;
}

export function parseArgs(argv: string[]): ParsedArgs {
  // Handle validate subcommand manually to avoid commander conflicts
  if (argv[0] === 'validate') {
    const target = argv[1];
    return {
      command: 'validate',
      target: target ? resolve(target) : undefined,
    };
  }

  const program = new Command()
    .name('create-agent-system')
    .description('Scaffold Claude Code Agent Teams into your project')
    .option('-p, --preset <name>', `preset name (${PRESET_NAMES.join(', ')})`)
    .option('-n, --project-name <name>', 'project name')
    .option('-t, --target <path>', 'target directory')
    .option('--no-run', 'skip Claude Code launch')
    .option('-y, --yes', 'skip interactive prompts')
    .option('--dry-run', 'print what would be done without creating files')
    .exitOverride()
    .configureOutput({ writeOut: () => {}, writeErr: () => {} });

  program.parse(argv, { from: 'user' });
  const opts = program.opts();

  const result: ParsedArgs = {
    command: 'scaffold',
    preset: opts.preset as PresetName | undefined,
    projectName: opts.projectName as string | undefined,
    noRun: opts.run === false,
    yes: opts.yes ?? false,
    dryRun: opts.dryRun ?? false,
  };

  if (opts.target) {
    result.target = resolve(opts.target as string);
  }

  // Validation: --yes requires --preset
  if (result.yes && !result.preset) {
    throw new Error('--yes requires --preset to be specified');
  }

  return result;
}
