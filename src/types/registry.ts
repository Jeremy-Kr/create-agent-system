/** Registry item types */
export type RegistryItemType = 'agent' | 'skill' | 'preset';

/** Entry in registry.json index */
export interface RegistryEntry {
  name: string;
  description: string;
  author: string;
  version: string;
  tags: string[];
  path: string;
}

/** Full registry index (registry.json) */
export interface RegistryIndex {
  version: number;
  updatedAt: string;
  agents: RegistryEntry[];
  skills: RegistryEntry[];
  presets: RegistryEntry[];
}

/** Individual item manifest (manifest.json) */
export interface ItemManifest {
  name: string;
  displayName: string;
  description: string;
  author: string;
  version: string;
  tags: string[];
  type: RegistryItemType;
  minCliVersion?: string;
  dependencies?: {
    skills?: string[];
    agents?: string[];
  };
  templateVars?: string[];
}

/** Cache metadata */
export interface CacheMeta {
  fetchedAt: number;
  etag?: string;
}

// Type guards

export function isRegistryItemType(value: string): value is RegistryItemType {
  return value === 'agent' || value === 'skill' || value === 'preset';
}

export function isRegistryIndex(value: unknown): value is RegistryIndex {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.version === 'number' &&
    typeof obj.updatedAt === 'string' &&
    Array.isArray(obj.agents) &&
    Array.isArray(obj.skills) &&
    Array.isArray(obj.presets)
  );
}

export function isRegistryEntry(value: unknown): value is RegistryEntry {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.name === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.author === 'string' &&
    typeof obj.version === 'string' &&
    Array.isArray(obj.tags) &&
    typeof obj.path === 'string'
  );
}

export function isItemManifest(value: unknown): value is ItemManifest {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.name === 'string' &&
    typeof obj.displayName === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.type === 'string' &&
    isRegistryItemType(obj.type)
  );
}
