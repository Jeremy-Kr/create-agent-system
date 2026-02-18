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

async function installSingleItem(
  name: string,
  index: RegistryIndex,
  options: InstallOptions,
  result: InstallResult,
): Promise<void> {
  // Find entry in registry
  const found = findEntry(index, name, options.type);
  if (!found) {
    const typeHint = options.type ? ` (type: ${options.type})` : '';
    throw new Error(`"${name}" not found in registry${typeHint}`);
  }

  const { entry, type } = found;

  // Fetch manifest for dependencies and metadata
  const manifest = await fetchItemManifest(entry.path);

  // Check CLI version compatibility
  if (manifest.minCliVersion) {
    result.warnings.push(`"${name}" recommends CLI version >=${manifest.minCliVersion}`);
  }

  // Handle dependencies
  const missingDeps = await findMissingDependencies(manifest, options.targetDir, index);
  if (missingDeps.length > 0) {
    const shouldInstall = options.yes || (await options.onDependencies?.(missingDeps)) || false;
    if (shouldInstall) {
      await installFromRegistry(missingDeps, options);
    } else {
      result.warnings.push(`Skipped dependencies for "${name}": ${missingDeps.join(', ')}`);
    }
  }

  // Fetch content
  const filenames = getContentFilename(type, name);
  const { content, filename } = await fetchContent(entry.path, filenames);

  // Process content (render template if needed)
  const processed = await processContent(content, filename, options.templateVars);

  // Determine target path
  const targetPath = getTargetPath(options.targetDir, type, name);

  // Handle conflicts
  const exists = await fileExists(targetPath);
  if (exists && !options.force) {
    const resolution = options.yes ? 'skip' : ((await options.onConflict?.(targetPath)) ?? 'skip');

    if (resolution === 'skip') {
      result.skipped.push({ name, reason: 'File already exists' });
      return;
    }
  }

  // Write file (overwrite if forced or user chose to overwrite)
  const shouldOverwrite = options.force || exists;
  const { written } = await writeFileSafe(targetPath, processed, shouldOverwrite);
  if (written) {
    result.installed.push({ name, type, path: targetPath });
  } else {
    result.skipped.push({ name, reason: 'File already exists' });
  }
}

async function findMissingDependencies(
  manifest: ItemManifest,
  targetDir: string,
  index: RegistryIndex,
): Promise<string[]> {
  const missing: string[] = [];

  if (manifest.dependencies?.skills) {
    for (const skillName of manifest.dependencies.skills) {
      const skillPath = join(targetDir, SKILLS_DIR, skillName, 'SKILL.md');
      if (!(await fileExists(skillPath))) {
        // Only add if it exists in registry
        if (findEntry(index, skillName, 'skill')) {
          missing.push(skillName);
        }
      }
    }
  }

  if (manifest.dependencies?.agents) {
    for (const agentName of manifest.dependencies.agents) {
      const agentPath = join(targetDir, AGENTS_DIR, `${agentName}.md`);
      if (!(await fileExists(agentPath))) {
        if (findEntry(index, agentName, 'agent')) {
          missing.push(agentName);
        }
      }
    }
  }

  return missing;
}
