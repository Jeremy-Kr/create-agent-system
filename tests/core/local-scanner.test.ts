import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { listLocalItems } from '../../src/core/local-scanner.js';

const TEST_DIR = join(import.meta.dirname, '__local-scanner-fixture__');

beforeEach(async () => {
  await rm(TEST_DIR, { recursive: true, force: true });
});

afterEach(async () => {
  await rm(TEST_DIR, { recursive: true, force: true });
});

async function writeAgent(name: string, content: string) {
  const dir = join(TEST_DIR, '.claude', 'agents');
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, `${name}.md`), content, 'utf-8');
}

async function writeSkill(name: string, content: string) {
  const dir = join(TEST_DIR, '.claude', 'skills', name);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'SKILL.md'), content, 'utf-8');
}

describe('listLocalItems', () => {
  it('should scan agent files', async () => {
    await writeAgent('test-agent', '---\nname: test-agent\ndescription: A test agent\n---\nBody');
    const results = await listLocalItems(TEST_DIR);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('test-agent');
    expect(results[0].description).toBe('A test agent');
    expect(results[0].type).toBe('agent');
  });

  it('should scan skill files', async () => {
    await writeSkill('my-skill', '---\nname: my-skill\ndescription: A test skill\n---\nBody');
    const results = await listLocalItems(TEST_DIR);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('my-skill');
    expect(results[0].description).toBe('A test skill');
    expect(results[0].type).toBe('skill');
  });

  it('should scan both agents and skills', async () => {
    await writeAgent('agent-a', '---\nname: agent-a\ndescription: Agent A\n---\n');
    await writeSkill('skill-b', '---\nname: skill-b\ndescription: Skill B\n---\n');
    const results = await listLocalItems(TEST_DIR);
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.type)).toContain('agent');
    expect(results.map((r) => r.type)).toContain('skill');
  });

  it('should filter by type=agent', async () => {
    await writeAgent('agent-a', '---\nname: agent-a\ndescription: Agent A\n---\n');
    await writeSkill('skill-b', '---\nname: skill-b\ndescription: Skill B\n---\n');
    const results = await listLocalItems(TEST_DIR, 'agent');
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('agent');
  });

  it('should filter by type=skill', async () => {
    await writeAgent('agent-a', '---\nname: agent-a\ndescription: Agent A\n---\n');
    await writeSkill('skill-b', '---\nname: skill-b\ndescription: Skill B\n---\n');
    const results = await listLocalItems(TEST_DIR, 'skill');
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('skill');
  });

  it('should return empty for nonexistent directory', async () => {
    const results = await listLocalItems(join(TEST_DIR, 'nonexistent'));
    expect(results).toEqual([]);
  });

  it('should return empty for directory without .claude/', async () => {
    await mkdir(TEST_DIR, { recursive: true });
    const results = await listLocalItems(TEST_DIR);
    expect(results).toEqual([]);
  });

  it('should skip files without valid frontmatter', async () => {
    await writeAgent('bad-agent', 'No frontmatter here');
    const results = await listLocalItems(TEST_DIR);
    expect(results).toEqual([]);
  });

  it('should skip agent files without name field', async () => {
    await writeAgent('no-name', '---\ndescription: Missing name\n---\nBody');
    const results = await listLocalItems(TEST_DIR);
    expect(results).toEqual([]);
  });
});
