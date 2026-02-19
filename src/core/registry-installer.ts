import { join } from 'node:path';
import type { ItemManifest, RegistryIndex, RegistryItemType } from '../types/registry.js';
import { AGENTS_DIR, SKILLS_DIR } from '../utils/constants.js';
import { fileExists, writeFileSafe } from '../utils/fs.js';
import { fetchItemContent, fetchItemManifest, fetchRegistryIndex } from './registry-client.js';
import { findEntry } from './registry-search.js';

export interface InstallOptions {
  targetDir: string;
  type?: RegistryItemType;
  force?: boolean;
  yes?: boolean;
  /** Callback for conflict resolution when not in --yes mode */
  onConflict?: (filePath: string) => Promise<'overwrite' | 'skip'>;
  /** Callback for dependency installation confirmation */
  onDependencies?: (deps: string[]) => Promise<boolean>;
  /** Template variables for .hbs rendering */
  templateVars?: Record<string, unknown>;
}

export interface InstallResult {
  installed: Array<{ name: string; type: RegistryItemType; path: string }>;
  skipped: Array<{ name: string; reason: string }>;
  warnings: string[];
}

/** Resolve the content filename based on item type */
function getContentFilename(type: RegistryItemType, name: string): string[] {
  switch (type) {
    case 'agent':
      return [`${name}.md.hbs`, `${name}.md`, 'agent.md.hbs', 'agent.md'];
    case 'skill':
      return ['SKILL.md.hbs', 'SKILL.md'];
    case 'preset':
      return ['preset.yaml'];
  }
}

/** Try fetching content with fallback filenames */
async function fetchContent(
  itemPath: string,
  filenames: string[],
): Promise<{ content: string; filename: string }> {
  for (const filename of filenames) {
    try {
      const content = await fetchItemContent(itemPath, filename);
      return { content, filename };
    } catch {}
  }
  throw new Error(`No content file found at "${itemPath}" (tried: ${filenames.join(', ')})`);
}

/** Get the target file path for installation */
function getTargetPath(targetDir: string, type: RegistryItemType, name: string): string {
  switch (type) {
    case 'agent':
      return join(targetDir, AGENTS_DIR, `${name}.md`);
    case 'skill':
      return join(targetDir, SKILLS_DIR, name, 'SKILL.md');
    case 'preset':
      return join(targetDir, `${name}.preset.yaml`);
  }
}

/** Render Handlebars template if applicable, otherwise return raw content */
async function processContent(
  content: string,
  filename: string,
  templateVars?: Record<string, unknown>,
): Promise<string> {
  if (!filename.endsWith('.hbs')) return content;

  const Handlebars = await import('handlebars');
  const compiled = Handlebars.default.compile(content);
  return compiled(templateVars ?? {});
}

export async function installFromRegistry(
  names: string[],
  options: InstallOptions,
): Promise<InstallResult> {
  const result: InstallResult = { installed: [], skipped: [], warnings: [] };

  const index = await fetchRegistryIndex();

  for (const name of names) {
    try {
      await installSingleItem(name, index, options, result);
    } catch (error) {
      result.skipped.push({
        name,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

async function handleDependencies(
  manifest: ItemManifest,
  options: InstallOptions,
  result: InstallResult,
  name: string,
  index: RegistryIndex,
): Promise<void> {
  const missingDeps = await findMissingDependencies(manifest, options.targetDir, index);
  if (missingDeps.length === 0) return;

  const shouldInstall = options.yes || (await options.onDependencies?.(missingDeps)) || false;
  if (shouldInstall) {
    await installFromRegistry(missingDeps, options);
  } else {
    result.warnings.push(`Skipped dependencies for "${name}": ${missingDeps.join(', ')}`);
  }
}

async function handleConflictAndWrite(
  targetPath: string,
  processed: string,
  options: InstallOptions,
  result: InstallResult,
  name: string,
  type: RegistryItemType,
): Promise<void> {
  const exists = await fileExists(targetPath);
  if (exists && !options.force) {
    const resolution = options.yes ? 'skip' : ((await options.onConflict?.(targetPath)) ?? 'skip');
    if (resolution === 'skip') {
      result.skipped.push({ name, reason: 'File already exists' });
      return;
    }
  }

  const shouldOverwrite = options.force || exists;
  const { written } = await writeFileSafe(targetPath, processed, shouldOverwrite);
  if (written) {
    result.installed.push({ name, type, path: targetPath });
  } else {
    result.skipped.push({ name, reason: 'File already exists' });
  }
}

async function installSingleItem(
  name: string,
  index: RegistryIndex,
  options: InstallOptions,
  result: InstallResult,
): Promise<void> {
  const found = findEntry(index, name, options.type);
  if (!found) {
    const typeHint = options.type ? ` (type: ${options.type})` : '';
    throw new Error(`"${name}" not found in registry${typeHint}`);
  }

  const { entry, type } = found;
  const manifest = await fetchItemManifest(entry.path);

  if (manifest.minCliVersion) {
    result.warnings.push(`"${name}" recommends CLI version >=${manifest.minCliVersion}`);
  }

  await handleDependencies(manifest, options, result, name, index);

  const filenames = getContentFilename(type, name);
  const { content, filename } = await fetchContent(entry.path, filenames);
  const processed = await processContent(content, filename, options.templateVars);
  const targetPath = getTargetPath(options.targetDir, type, name);

  await handleConflictAndWrite(targetPath, processed, options, result, name, type);
}

async function findMissingItems(
  items: string[] | undefined,
  index: RegistryIndex,
  type: RegistryItemType,
  pathFn: (name: string) => string,
): Promise<string[]> {
  if (!items) return [];
  const missing: string[] = [];
  for (const name of items) {
    if (!(await fileExists(pathFn(name)))) {
      if (findEntry(index, name, type)) {
        missing.push(name);
      }
    }
  }
  return missing;
}

async function findMissingDependencies(
  manifest: ItemManifest,
  targetDir: string,
  index: RegistryIndex,
): Promise<string[]> {
  const missingSkills = await findMissingItems(
    manifest.dependencies?.skills,
    index,
    'skill',
    (name) => join(targetDir, SKILLS_DIR, name, 'SKILL.md'),
  );
  const missingAgents = await findMissingItems(
    manifest.dependencies?.agents,
    index,
    'agent',
    (name) => join(targetDir, AGENTS_DIR, `${name}.md`),
  );
  return [...missingSkills, ...missingAgents];
}
