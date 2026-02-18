import * as clack from '@clack/prompts';
import type { InstallResult } from '../core/registry-installer.js';
import type { SearchResult } from '../core/registry-search.js';
import type { RegistryItemType } from '../types/registry.js';

const TYPE_LABELS: Record<RegistryItemType, string> = {
  agent: '[agent]',
  skill: '[skill]',
  preset: '[preset]',
};

export async function promptConflictResolution(filePath: string): Promise<'overwrite' | 'skip'> {
  const result = await clack.select({
    message: `File already exists: ${filePath}`,
    options: [
      { value: 'overwrite', label: 'Overwrite' },
      { value: 'skip', label: 'Skip' },
    ],
  });
  if (clack.isCancel(result)) {
    clack.cancel('Operation cancelled.');
    process.exit(0);
  }
  return result as 'overwrite' | 'skip';
}

export async function promptDependencyInstall(deps: string[]): Promise<boolean> {
  const result = await clack.confirm({
    message: `Install dependencies? ${deps.join(', ')}`,
    initialValue: true,
  });
  if (clack.isCancel(result)) {
    clack.cancel('Operation cancelled.');
    process.exit(0);
  }
  return result as boolean;
}

function formatItem(item: SearchResult, showTags: boolean): string {
  const label = TYPE_LABELS[item.type];
  const tags = showTags && item.tags.length > 0 ? ` (${item.tags.join(', ')})` : '';
  return `  ${label} ${item.name} — ${item.description}${tags}`;
}

export function displaySearchResults(results: SearchResult[]): void {
  if (results.length === 0) {
    clack.log.warn('No results found.');
    return;
  }

  clack.log.info(`Found ${results.length} result(s):`);
  for (const item of results) {
    clack.log.message(formatItem(item, false));
  }
}

export function displayRegistryList(results: SearchResult[]): void {
  if (results.length === 0) {
    clack.log.warn('No items found.');
    return;
  }

  clack.log.info(`${results.length} item(s):`);
  for (const item of results) {
    clack.log.message(formatItem(item, true));
  }
}

export function displayInstallResults(result: InstallResult): void {
  for (const item of result.installed) {
    const label = TYPE_LABELS[item.type];
    clack.log.success(`  ${label} ${item.name} -> ${item.path}`);
  }

  for (const item of result.skipped) {
    clack.log.warn(`  ~ ${item.name} — ${item.reason}`);
  }

  for (const warning of result.warnings) {
    clack.log.warn(warning);
  }

  if (result.installed.length > 0) {
    clack.log.success(`Installed ${result.installed.length} item(s).`);
  } else {
    clack.log.info('No items installed.');
  }
}
