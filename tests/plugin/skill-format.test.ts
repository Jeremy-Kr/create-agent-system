import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SKILLS_DIR = resolve(import.meta.dirname, '../../plugin/skills');
const SKILL_NAMES = ['scaffold', 'add', 'search', 'validate'] as const;

function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) throw new Error('No YAML frontmatter found');
  const result: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();
    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

describe('Skill SKILL.md Format (TICKET-061)', () => {
  for (const skillName of SKILL_NAMES) {
    describe(`${skillName} skill`, () => {
      const skillPath = resolve(SKILLS_DIR, skillName, 'SKILL.md');

      it('should exist', () => {
        const content = readFileSync(skillPath, 'utf-8');
        expect(content).toBeTruthy();
      });

      it('should have valid YAML frontmatter', () => {
        const content = readFileSync(skillPath, 'utf-8');
        expect(() => parseFrontmatter(content)).not.toThrow();
      });

      it('should have required fields: name, description, user-invocable, allowed-tools', () => {
        const content = readFileSync(skillPath, 'utf-8');
        const fm = parseFrontmatter(content);
        expect(fm).toHaveProperty('name');
        expect(fm).toHaveProperty('description');
        expect(fm).toHaveProperty('user-invocable');
        expect(fm).toHaveProperty('allowed-tools');
      });

      it('should have user-invocable set to true', () => {
        const content = readFileSync(skillPath, 'utf-8');
        const fm = parseFrontmatter(content);
        expect(fm['user-invocable']).toBe('true');
      });

      it('should include Bash(npx:*) in allowed-tools', () => {
        const content = readFileSync(skillPath, 'utf-8');
        const fm = parseFrontmatter(content);
        expect(fm['allowed-tools']).toContain('Bash(npx:*)');
      });

      it('should have name matching directory name', () => {
        const content = readFileSync(skillPath, 'utf-8');
        const fm = parseFrontmatter(content);
        expect(fm.name).toBe(skillName);
      });
    });
  }
});
