import { resolve } from 'node:path';
import { Command } from 'commander';
import type { Locale } from '../i18n/types.js';
import type { PresetName } from '../types/config.js';
import type { RegistryItemType } from '../types/registry.js';
import { isRegistryItemType } from '../types/registry.js';
import { PRESET_NAMES } from '../utils/constants.js';

export interface ParsedArgs {
  command:
    | 'scaffold'
    | 'validate'
    | 'diff'
    | 'add'
    | 'search'
    | 'list'
    | 'migrate'
    | 'edit'
    | 'sync-spec';
  preset?: PresetName;
  projectName?: string;
  target?: string;
  noRun?: boolean;
  yes?: boolean;
  dryRun?: boolean;
  overwrite?: boolean;
  saveConfig?: boolean;
  config?: string;
  ignoreConfig?: boolean;
  diffArgs?: [string, string];
  addNames?: string[];
  searchQuery?: string;
  registryType?: RegistryItemType;
  tag?: string;
  force?: boolean;
  installed?: boolean;
  quiet?: boolean;
  lang?: Locale;
  targetVersion?: string;
  noDocCheck?: boolean;
}

function routeSubcommand(argv: string[]): ParsedArgs | null {
  const rest = argv.slice(1);
  switch (argv[0]) {
    case 'validate':
      return parseValidateArgs(rest);
    case 'diff':
      return parseDiffArgs(rest);
    case 'add':
      return parseAddArgs(rest);
    case 'search':
      return parseSearchArgs(rest);
    case 'list':
      return parseListArgs(rest);
    case 'migrate':
      return parseMigrateArgs(rest);
    case 'edit':
      return parseEditArgs(rest);
    case 'sync-spec':
      return { command: 'sync-spec' };
    default:
      return null;
  }
}

function parseValidateArgs(args: string[]): ParsedArgs {
  const quiet = args.includes('--quiet') || args.includes('-q');
  const positional = args.filter((a) => a !== '--quiet' && a !== '-q');
  const target = positional[0];
  return {
    command: 'validate',
    target: target ? resolve(target) : undefined,
    quiet,
  };
}

function parseDiffArgs(args: string[]): ParsedArgs {
  const a = args[0];
  const b = args[1];
  if (!a || !b) {
    throw new Error('Usage: create-agent-system diff <preset-a> <preset-b>');
  }
  return { command: 'diff', diffArgs: [a, b] };
}

function parseScaffoldOptions(argv: string[]): ParsedArgs {
  const program = new Command()
    .name('create-agent-system')
    .description('Scaffold Claude Code Agent Teams into your project')
    .option('-p, --preset <name>', `preset name (${PRESET_NAMES.join(', ')}, custom)`)
    .option('-n, --project-name <name>', 'project name')
    .option('-t, --target <path>', 'target directory')
    .option('--no-run', 'skip Claude Code launch')
    .option('-y, --yes', 'skip interactive prompts')
    .option('--dry-run', 'print what would be done without creating files')
    .option('--save-config', 'save current config to agent-system.config.yaml')
    .option('--config <path>', 'path to config file')
    .option('--ignore-config', 'ignore existing config file')
    .option('--overwrite', 'overwrite existing files')
    .option('--no-doc-check', 'skip doc-spec validation (offline/CI)')
    .option('-l, --lang <locale>', 'language (ko, en)')
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
    saveConfig: opts.saveConfig ?? false,
    config: opts.config as string | undefined,
    ignoreConfig: opts.ignoreConfig ?? false,
    overwrite: opts.overwrite ?? false,
    noDocCheck: opts.docCheck === false,
  };

  if (opts.lang) {
    const lang = opts.lang as string;
    if (lang !== 'ko' && lang !== 'en') {
      throw new Error('--lang must be "ko" or "en"');
    }
    result.lang = lang;
  }

  if (opts.target) {
    result.target = resolve(opts.target as string);
  }

  if (result.yes && !result.preset) {
    throw new Error('--yes requires --preset to be specified');
  }

  return result;
}

export function parseArgs(argv: string[]): ParsedArgs {
  return routeSubcommand(argv) ?? parseScaffoldOptions(argv);
}

function parseRegistryType(args: string[]): RegistryItemType | undefined {
  const value = parseFlagValue(args, '--type');
  if (value === undefined) return undefined;
  if (isRegistryItemType(value)) return value;
  throw new Error(`Invalid --type value: "${value}". Must be agent, skill, or preset.`);
}

function parseFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

function parseFlagValue(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}

/** Collect positional args (not starting with --) */
function collectPositional(args: string[]): string[] {
  const result: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      // Skip flag and its value if applicable
      if (args[i] === '--type' || args[i] === '--tag') i++;
      continue;
    }
    if (args[i].startsWith('-')) continue;
    result.push(args[i]);
  }
  return result;
}

function parseAddArgs(args: string[]): ParsedArgs {
  const names = collectPositional(args);
  if (names.length === 0) {
    throw new Error(
      'Usage: create-agent-system add <names...> [--type agent|skill|preset] [--force] [--yes]',
    );
  }
  return {
    command: 'add',
    addNames: names,
    registryType: parseRegistryType(args),
    force: parseFlag(args, '--force'),
    yes: parseFlag(args, '--yes') || parseFlag(args, '-y'),
  };
}

function parseSearchArgs(args: string[]): ParsedArgs {
  const positional = collectPositional(args);
  if (positional.length === 0) {
    throw new Error(
      'Usage: create-agent-system search <query> [--type agent|skill|preset] [--tag <tag>]',
    );
  }
  return {
    command: 'search',
    searchQuery: positional.join(' '),
    registryType: parseRegistryType(args),
    tag: parseFlagValue(args, '--tag'),
  };
}

function parseListArgs(args: string[]): ParsedArgs {
  return {
    command: 'list',
    registryType: parseRegistryType(args),
    installed: parseFlag(args, '--installed'),
  };
}

function parseEditArgs(args: string[]): ParsedArgs {
  return {
    command: 'edit',
    target: parseFlagValue(args, '--target'),
  };
}

function parseMigrateArgs(args: string[]): ParsedArgs {
  return {
    command: 'migrate',
    dryRun: parseFlag(args, '--dry-run'),
    targetVersion: parseFlagValue(args, '--target-version'),
    yes: parseFlag(args, '--yes') || parseFlag(args, '-y'),
    target: parseFlagValue(args, '--target'),
  };
}
