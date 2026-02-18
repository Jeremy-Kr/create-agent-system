import type { RegistryEntry, RegistryIndex, RegistryItemType } from '../types/registry.js';

export interface SearchOptions {
  type?: RegistryItemType;
  tag?: string;
}

export interface SearchResult extends RegistryEntry {
  type: RegistryItemType;
  /** Relevance score (higher = better match) */
  score: number;
}

const REGISTRY_ITEM_TYPES: readonly RegistryItemType[] = ['agent', 'skill', 'preset'];

const TYPE_TO_KEY: Record<
  RegistryItemType,
  keyof Pick<RegistryIndex, 'agents' | 'skills' | 'presets'>
> = {
  agent: 'agents',
  skill: 'skills',
  preset: 'presets',
};

function getEntriesByType(
  index: RegistryIndex,
  type?: RegistryItemType,
): Array<{ entry: RegistryEntry; type: RegistryItemType }> {
  const types = type ? [type] : REGISTRY_ITEM_TYPES;
  return types.flatMap((t) => index[TYPE_TO_KEY[t]].map((entry) => ({ entry, type: t })));
}

function scoreMatch(entry: RegistryEntry, query: string): number {
  const q = query.toLowerCase();
  let score = 0;

  // Exact name match
  if (entry.name.toLowerCase() === q) return 100;

  // Name starts with query
  if (entry.name.toLowerCase().startsWith(q)) score += 50;
  // Name contains query
  else if (entry.name.toLowerCase().includes(q)) score += 30;

  // Description contains query
  if (entry.description.toLowerCase().includes(q)) score += 20;

  // Tag match
  for (const tag of entry.tags) {
    if (tag.toLowerCase() === q) score += 40;
    else if (tag.toLowerCase().includes(q)) score += 15;
  }

  return score;
}

export function searchRegistry(
  index: RegistryIndex,
  query: string,
  options?: SearchOptions,
): SearchResult[] {
  const entries = getEntriesByType(index, options?.type);
  const results: SearchResult[] = [];

  for (const { entry, type } of entries) {
    // Tag filter
    if (options?.tag) {
      const tag = options.tag;
      const hasTag = entry.tags.some((t) => t.toLowerCase() === tag.toLowerCase());
      if (!hasTag) continue;
    }

    const score = scoreMatch(entry, query);
    if (score > 0) {
      results.push({ ...entry, type, score });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

export function listRegistry(
  index: RegistryIndex,
  options?: { type?: RegistryItemType },
): SearchResult[] {
  const entries = getEntriesByType(index, options?.type);
  return entries
    .map(({ entry, type }) => ({ ...entry, type, score: 0 }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function findEntry(
  index: RegistryIndex,
  name: string,
  type?: RegistryItemType,
): { entry: RegistryEntry; type: RegistryItemType } | null {
  const entries = getEntriesByType(index, type);
  const match = entries.find(({ entry }) => entry.name === name);
  return match ?? null;
}
