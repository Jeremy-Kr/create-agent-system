import * as clack from '@clack/prompts';
import type { InstallResult } from '../core/registry-installer.js';
import type { SearchResult } from '../core/registry-search.js';
import { t } from '../i18n/index.js';
import type { RegistryItemType } from '../types/registry.js';

const TYPE_LABELS: Record<RegistryItemType, string> = {
  agent: '[agent]',
  skill: '[skill]',
  preset: '[preset]',
};

export async function promptConflictResolution(filePath: string): Promise<'overwrite' | 'skip'> {
  const result = await clack.select({
    message: t('registry.conflict', { path: filePath }),
    options: [
      { value: 'overwrite', label: t('registry.overwrite') },
      { value: 'skip', label: t('registry.skip') },
    ],
  });
  if (clack.isCancel(result)) {
    clack.cancel(t('prompt.cancel'));
    process.exit(0);
  }
  return result as 'overwrite' | 'skip';
}

export async function promptDependencyInstall(deps: string[]): Promise<boolean> {
  const result = await clack.confirm({
    message: t('registry.install_deps', { deps: deps.join(', ') }),
    initialValue: true,
  });
  if (clack.isCancel(result)) {
    clack.cancel(t('prompt.cancel'));
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
    clack.log.warn(t('registry.no_results'));
    return;
  }

  clack.log.info(t('registry.found_results', { count: results.length }));
  for (const item of results) {
    clack.log.message(formatItem(item, false));
  }
}

export function displayRegistryList(results: SearchResult[]): void {
  if (results.length === 0) {
    clack.log.warn(t('registry.no_items'));
    return;
  }

  clack.log.info(t('registry.items_count', { count: results.length }));
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
    clack.log.success(t('registry.installed_count', { count: result.installed.length }));
  } else {
    clack.log.info(t('registry.no_installed'));
  }
}
