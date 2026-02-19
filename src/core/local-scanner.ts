import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { RegistryItemType } from '../types/registry.js';
import { dirExists } from '../utils/fs.js';
import type { SearchResult } from './registry-search.js';

interface FrontmatterData {
  name?: string;
  description?: string;
}

function parseFrontmatter(content: string): FrontmatterData | null {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match?.[1]) return null;
  try {
    return parseYaml(match[1]) as FrontmatterData;
  } catch {
    return null;
  }
}

async function scanAgents(baseDir: string): Promise<SearchResult[]> {
  const agentsDir = join(baseDir, '.claude', 'agents');
  if (!(await dirExists(agentsDir))) return [];

  const files = await readdir(agentsDir);
  const results: SearchResult[] = [];

  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const filePath = join(agentsDir, file);
    const content = await readFile(filePath, 'utf-8');
    const fm = parseFrontmatter(content);
    if (!fm?.name) continue;

    results.push({
      name: fm.name,
      description: fm.description ?? '',
      type: 'agent',
      author: '',
      version: '',
      tags: [],
      path: filePath,
      score: 0,
    });
  }

  return results;
}

async function scanSkills(baseDir: string): Promise<SearchResult[]> {
  const skillsDir = join(baseDir, '.claude', 'skills');
  if (!(await dirExists(skillsDir))) return [];

  const entries = await readdir(skillsDir, { withFileTypes: true });
  const results: SearchResult[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillFile = join(skillsDir, entry.name, 'SKILL.md');
    let content: string;
    try {
      content = await readFile(skillFile, 'utf-8');
    } catch {
      continue;
    }
    const fm = parseFrontmatter(content);
    if (!fm?.name) continue;

    results.push({
      name: fm.name,
      description: fm.description ?? '',
      type: 'skill',
      author: '',
      version: '',
      tags: [],
      path: skillFile,
      score: 0,
    });
  }

  return results;
}

export async function listLocalItems(
  targetDir: string,
  type?: RegistryItemType,
): Promise<SearchResult[]> {
  const [agents, skills] = await Promise.all([
    type === 'skill' ? [] : scanAgents(targetDir),
    type === 'agent' ? [] : scanSkills(targetDir),
  ]);
  return [...agents, ...skills];
}
