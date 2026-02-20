import { BUNDLED_DOC_SPEC, type DocSpec } from './doc-spec.js';

const CONTEXT7_REST_URL = 'https://api.context7.com/v1';
const FETCH_TIMEOUT_MS = 15_000;

export interface SpecDiff {
  path: string;
  type: 'added' | 'removed' | 'changed';
  official: unknown;
  current: unknown;
}

export interface SyncResult {
  libraryId: string;
  fetchedAt: string;
  diffs: SpecDiff[];
  rawResponses: Record<string, string>;
}

interface Context7ResolveResult {
  id: string;
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function resolveLibraryId(): Promise<string> {
  const url = `${CONTEXT7_REST_URL}/resolve-library-id`;
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ libraryName: 'Claude Code' }),
  });

  if (!response.ok) {
    throw new Error(`Failed to resolve library ID: ${response.status}`);
  }

  const data = (await response.json()) as Context7ResolveResult;
  return data.id;
}

async function queryDocs(libraryId: string, topic: string): Promise<string> {
  const url = `${CONTEXT7_REST_URL}/query-docs`;
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ libraryId, topic, tokens: 5000 }),
  });

  if (!response.ok) {
    throw new Error(`Failed to query docs for topic "${topic}": ${response.status}`);
  }

  const data = (await response.json()) as { content: string };
  return data.content;
}

function parseArrayFromText(text: string, keyword: string): string[] {
  const items: string[] = [];
  const regex = new RegExp(`${keyword}[:\\s]*([^\\n]+)`, 'gi');
  for (const match of text.matchAll(regex)) {
    const raw = match[1];
    // Handle comma-separated, pipe-separated, or bullet lists
    const parts = raw.split(/[,|]/).map((s) => s.trim().replace(/^['"`]|['"`]$/g, ''));
    items.push(...parts.filter(Boolean));
  }
  return [...new Set(items)];
}

function compareArrays(path: string, official: string[], current: string[]): SpecDiff[] {
  const diffs: SpecDiff[] = [];

  const added = official.filter((item) => !current.includes(item));
  const removed = current.filter((item) => !official.includes(item));

  if (added.length > 0) {
    diffs.push({ path, type: 'added', official: added, current: null });
  }
  if (removed.length > 0) {
    diffs.push({ path, type: 'removed', official: null, current: removed });
  }

  return diffs;
}

function computeDiffs(rawResponses: Record<string, string>, spec: DocSpec): SpecDiff[] {
  const diffs: SpecDiff[] = [];

  // Parse frontmatter fields from docs
  if (rawResponses.frontmatter) {
    const docFields = parseArrayFromText(rawResponses.frontmatter, 'field');
    if (docFields.length > 0) {
      const currentAll = [...spec.agent.requiredFields, ...spec.agent.optionalFields];
      diffs.push(...compareArrays('agent.allFields', docFields, currentAll));
    }
  }

  // Parse hook events
  if (rawResponses.hooks) {
    const docEvents = parseArrayFromText(rawResponses.hooks, 'event');
    if (docEvents.length > 0) {
      diffs.push(...compareArrays('hooks.validEvents', docEvents, spec.hooks.validEvents));
    }
  }

  // Parse valid models
  if (rawResponses.models) {
    const docModels = parseArrayFromText(rawResponses.models, 'model');
    if (docModels.length > 0) {
      diffs.push(...compareArrays('agent.validModels', docModels, spec.agent.validModels));
    }
  }

  // Parse valid colors
  if (rawResponses.colors) {
    const docColors = parseArrayFromText(rawResponses.colors, 'color');
    if (docColors.length > 0) {
      diffs.push(...compareArrays('agent.validColors', docColors, spec.agent.validColors));
    }
  }

  return diffs;
}

export async function syncSpec(): Promise<SyncResult> {
  const libraryId = await resolveLibraryId();
  const topics = ['frontmatter', 'hooks', 'models', 'colors'];

  const rawResponses: Record<string, string> = {};
  for (const topic of topics) {
    try {
      rawResponses[topic] = await queryDocs(libraryId, `agent ${topic} configuration`);
    } catch {
      rawResponses[topic] = '';
    }
  }

  const diffs = computeDiffs(rawResponses, BUNDLED_DOC_SPEC);

  return {
    libraryId,
    fetchedAt: new Date().toISOString(),
    diffs,
    rawResponses,
  };
}

export function formatSyncDiff(diffs: SpecDiff[]): string {
  if (diffs.length === 0) {
    return 'No differences found between official docs and bundled spec.';
  }

  const lines: string[] = [`Found ${diffs.length} difference(s):\n`];

  for (const diff of diffs) {
    switch (diff.type) {
      case 'added':
        lines.push(
          `  + ${diff.path}: ${JSON.stringify(diff.official)} (in official, missing from bundled)`,
        );
        break;
      case 'removed':
        lines.push(
          `  - ${diff.path}: ${JSON.stringify(diff.current)} (in bundled, not in official)`,
        );
        break;
      case 'changed':
        lines.push(
          `  ~ ${diff.path}: official=${JSON.stringify(diff.official)} current=${JSON.stringify(diff.current)}`,
        );
        break;
    }
  }

  return lines.join('\n');
}
