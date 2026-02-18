import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import type { CacheMeta, ItemManifest, RegistryIndex } from '../types/registry.js';
import { isItemManifest, isRegistryIndex } from '../types/registry.js';
import {
  CACHE_DIR_NAME,
  CACHE_TTL_MS,
  DEFAULT_REGISTRY_BASE_URL,
  REGISTRY_ENV_VAR,
  REGISTRY_INDEX_FILE,
} from '../utils/constants.js';
import { fileExists } from '../utils/fs.js';

export function getRegistryBaseUrl(): string {
  return process.env[REGISTRY_ENV_VAR] || DEFAULT_REGISTRY_BASE_URL;
}

export function getCacheDir(): string {
  return join(homedir(), CACHE_DIR_NAME, 'cache');
}

async function ensureCacheDir(): Promise<string> {
  const dir = getCacheDir();
  await mkdir(dir, { recursive: true });
  return dir;
}

async function readCachedIndex(): Promise<{ index: RegistryIndex; meta: CacheMeta } | null> {
  const cacheDir = getCacheDir();
  const indexPath = join(cacheDir, REGISTRY_INDEX_FILE);
  const metaPath = join(cacheDir, 'registry.meta.json');

  if (!(await fileExists(indexPath)) || !(await fileExists(metaPath))) {
    return null;
  }

  try {
    const [indexRaw, metaRaw] = await Promise.all([
      readFile(indexPath, 'utf-8'),
      readFile(metaPath, 'utf-8'),
    ]);
    const index = JSON.parse(indexRaw) as unknown;
    const meta = JSON.parse(metaRaw) as CacheMeta;

    if (!isRegistryIndex(index)) return null;
    return { index, meta };
  } catch {
    return null;
  }
}

async function writeCachedIndex(index: RegistryIndex, etag?: string): Promise<void> {
  const cacheDir = await ensureCacheDir();
  const meta: CacheMeta = { fetchedAt: Date.now(), etag };

  await Promise.all([
    writeFile(join(cacheDir, REGISTRY_INDEX_FILE), JSON.stringify(index, null, 2), 'utf-8'),
    writeFile(join(cacheDir, 'registry.meta.json'), JSON.stringify(meta), 'utf-8'),
  ]);
}

function isCacheValid(meta: CacheMeta): boolean {
  return Date.now() - meta.fetchedAt < CACHE_TTL_MS;
}

export async function fetchRegistryIndex(options?: {
  skipCache?: boolean;
}): Promise<RegistryIndex> {
  // Try cache first
  if (!options?.skipCache) {
    const cached = await readCachedIndex();
    if (cached && isCacheValid(cached.meta)) {
      return cached.index;
    }
  }

  const url = `${getRegistryBaseUrl()}/${REGISTRY_INDEX_FILE}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as unknown;
    if (!isRegistryIndex(data)) {
      throw new Error('Invalid registry index format');
    }

    const etag = response.headers.get('etag') ?? undefined;
    await writeCachedIndex(data, etag);
    return data;
  } catch (error) {
    // Fallback to stale cache
    const cached = await readCachedIndex();
    if (cached) {
      return cached.index;
    }
    throw new Error(
      `Failed to fetch registry index: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/** Read from file cache, returning null on miss or corruption */
async function readCachedFile(cachePath: string): Promise<string | null> {
  if (!(await fileExists(cachePath))) return null;
  try {
    return await readFile(cachePath, 'utf-8');
  } catch {
    return null;
  }
}

/** Write content to file cache, creating directories as needed */
async function writeCachedFile(cachePath: string, content: string): Promise<void> {
  await mkdir(dirname(cachePath), { recursive: true });
  await writeFile(cachePath, content, 'utf-8');
}

export async function fetchItemManifest(itemPath: string): Promise<ItemManifest> {
  const cachedPath = join(getCacheDir(), itemPath, 'manifest.json');

  const cached = await readCachedFile(cachedPath);
  if (cached) {
    const parsed = JSON.parse(cached) as unknown;
    if (isItemManifest(parsed)) return parsed;
  }

  const url = `${getRegistryBaseUrl()}/${itemPath}/manifest.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch manifest for "${itemPath}": HTTP ${response.status}`);
  }

  const data = (await response.json()) as unknown;
  if (!isItemManifest(data)) {
    throw new Error(`Invalid manifest format for "${itemPath}"`);
  }

  await writeCachedFile(cachedPath, JSON.stringify(data, null, 2));
  return data;
}

export async function fetchItemContent(itemPath: string, filename: string): Promise<string> {
  const cachedPath = join(getCacheDir(), itemPath, filename);

  const cached = await readCachedFile(cachedPath);
  if (cached) return cached;

  const url = `${getRegistryBaseUrl()}/${itemPath}/${filename}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch "${itemPath}/${filename}": HTTP ${response.status}`);
  }

  const content = await response.text();
  await writeCachedFile(cachedPath, content);
  return content;
}

export async function clearCache(): Promise<void> {
  const cacheDir = getCacheDir();
  await rm(cacheDir, { recursive: true, force: true });
}
