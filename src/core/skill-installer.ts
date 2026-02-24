import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { SkillName } from '../types/config.js';
import { SKILL_NAMES } from '../utils/constants.js';
import { dirExists } from '../utils/fs.js';
import { TEMPLATES_DIR } from '../utils/paths.js';

const SKILL_TIMEOUT = 30_000;

export interface SkillInstallResult {
  skillName: string;
  success: boolean;
  error?: string;
}

async function copyFallbackTemplate(skillName: string, targetDir: string): Promise<void> {
  const templatePath = join(TEMPLATES_DIR, 'skills', skillName, 'SKILL.md.hbs');
  const content = await readFile(templatePath, 'utf-8');
  const skillDir = join(targetDir, '.claude', 'skills', skillName);
  await mkdir(skillDir, { recursive: true });
  await writeFile(join(skillDir, 'SKILL.md'), content, 'utf-8');
}

export async function installSkill(
  skillName: SkillName,
  targetDir: string,
): Promise<SkillInstallResult> {
  if (!(SKILL_NAMES as readonly string[]).includes(skillName)) {
    return {
      skillName,
      success: false,
      error: `Invalid skill name: "${skillName}". Valid skills: ${SKILL_NAMES.join(', ')}`,
    };
  }

  if (!(await dirExists(targetDir))) {
    throw new Error(`Target directory does not exist: ${targetDir}`);
  }

  return new Promise((resolve) => {
    execFile(
      'npx',
      ['skills', 'add', skillName],
      { cwd: targetDir, timeout: SKILL_TIMEOUT },
      async (error) => {
        if (error) {
          try {
            await copyFallbackTemplate(skillName, targetDir);
          } catch (fallbackError) {
            const fallbackMsg =
              fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
            resolve({
              skillName,
              success: false,
              error: `${error.message} (fallback also failed: ${fallbackMsg})`,
            });
            return;
          }
          resolve({ skillName, success: false, error: error.message });
        } else {
          resolve({ skillName, success: true });
        }
      },
    );
  });
}

export async function installFindSkills(targetDir: string): Promise<SkillInstallResult> {
  if (!(await dirExists(targetDir))) {
    throw new Error(`Target directory does not exist: ${targetDir}`);
  }

  return new Promise((resolve) => {
    execFile(
      'npx',
      ['skills', 'add', 'find-skills'],
      { cwd: targetDir, timeout: SKILL_TIMEOUT },
      (error) => {
        if (error) {
          resolve({
            skillName: 'find-skills',
            success: false,
            error: error.message,
          });
        } else {
          resolve({ skillName: 'find-skills', success: true });
        }
      },
    );
  });
}

export async function installSkills(
  skillNames: SkillName[],
  targetDir: string,
): Promise<SkillInstallResult[]> {
  const results: SkillInstallResult[] = [];

  const findResult = await installFindSkills(targetDir);
  results.push(findResult);

  for (const name of skillNames) {
    const result = await installSkill(name, targetDir);
    results.push(result);
  }

  return results;
}
