import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { stringify as stringifyYaml } from 'yaml';
import { AGENT_NAMES, SKILL_NAMES } from '../../utils/constants.js';
import { dirExists, fileExists, writeFileSafe } from '../../utils/fs.js';
import type { MigrationContext, MigrationResult, MigrationStep } from '../migrator.js';

async function scanAgents(targetDir: string): Promise<string[]> {
  const agentsDir = join(targetDir, '.claude', 'agents');
  if (!(await dirExists(agentsDir))) return [];

  const files = await readdir(agentsDir);
  return files
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''))
    .filter((name) => (AGENT_NAMES as readonly string[]).includes(name));
}

async function scanSkills(targetDir: string): Promise<string[]> {
  const skillsDir = join(targetDir, '.claude', 'skills');
  if (!(await dirExists(skillsDir))) return [];

  const dirs = await readdir(skillsDir);
  const found: string[] = [];
  for (const dir of dirs) {
    if (
      (SKILL_NAMES as readonly string[]).includes(dir) &&
      (await fileExists(join(skillsDir, dir, 'SKILL.md')))
    ) {
      found.push(dir);
    }
  }
  return found;
}

function detectPreset(agentNames: string[]): string {
  const enabledCount = agentNames.length;
  if (enabledCount <= 5) return 'solo-dev';
  if (enabledCount <= 7) return 'small-team';
  return 'full-team';
}

export const v01ToV02: MigrationStep = {
  from: '0.1',
  to: '0.2',
  description: 'Generate agent-system.config.yaml from existing agent files',

  async migrate(ctx: MigrationContext): Promise<MigrationResult> {
    const { targetDir, dryRun } = ctx;
    const changes: MigrationResult['changes'] = [];
    const warnings: string[] = [];

    const foundAgents = await scanAgents(targetDir);
    const foundSkills = await scanSkills(targetDir);
    const presetName = detectPreset(foundAgents);

    const agents: Record<string, { enabled: boolean; model: string }> = {};
    for (const name of AGENT_NAMES) {
      agents[name] = {
        enabled: foundAgents.includes(name),
        model: 'opus',
      };
    }

    const yamlObj: Record<string, unknown> = {
      version: '0.2',
      project_name: 'my-project',
      base_preset: presetName,
      agents,
      workflow: {
        review_max_rounds: presetName === 'solo-dev' ? 0 : 5,
        qa_mode: presetName === 'solo-dev' ? 'lite' : 'standard',
        visual_qa_level: presetName === 'full-team' ? 3 : presetName === 'small-team' ? 2 : 1,
        epic_based: presetName !== 'solo-dev',
      },
      skills: foundSkills,
    };

    const configPath = join(targetDir, 'agent-system.config.yaml');

    if (!dryRun) {
      const yamlContent = stringifyYaml(yamlObj, { lineWidth: 120 });
      await writeFileSafe(configPath, yamlContent, true);
    }

    changes.push({
      file: 'agent-system.config.yaml',
      action: 'created',
      description: `Config generated from ${foundAgents.length} agents, ${foundSkills.length} skills`,
    });

    return { changes, warnings };
  },
};
