import * as clack from '@clack/prompts';
import { deriveScale, loadPreset } from '../core/preset-loader.js';
import { t } from '../i18n/index.js';
import type {
  AgentConfig,
  AgentName,
  PresetName,
  SkillName,
  WorkflowConfig,
} from '../types/config.js';
import type { Preset } from '../types/preset.js';
import {
  AGENT_DISPLAY_NAMES,
  AGENT_NAMES,
  getAgentDescription,
  getSkillDescription,
  SKILL_NAMES,
} from '../utils/constants.js';
import { cancelGuard } from './clack-utils.js';

export { deriveScale };

export async function promptAgentSelection(initial?: AgentName[]): Promise<AgentName[]> {
  const defaultAgents = initial ?? (AGENT_NAMES as unknown as AgentName[]);

  const selectedAgents = cancelGuard(
    await clack.multiselect({
      message: t('custom.enable_agents'),
      options: AGENT_NAMES.map((name) => ({
        value: name,
        label: `${AGENT_DISPLAY_NAMES[name]} — ${getAgentDescription(name)}`,
      })),
      initialValues: defaultAgents,
      required: true,
    }),
  ) as AgentName[];

  return selectedAgents;
}

export async function promptWorkflow(initial?: Partial<WorkflowConfig>): Promise<WorkflowConfig> {
  const defaults: WorkflowConfig = {
    reviewMaxRounds: initial?.reviewMaxRounds ?? 0,
    qaMode: initial?.qaMode ?? 'lite',
    visualQaLevel: initial?.visualQaLevel ?? 0,
    epicBased: initial?.epicBased ?? false,
  };

  const reviewMaxRoundsStr = cancelGuard(
    await clack.text({
      message: t('custom.review_rounds'),
      initialValue: String(defaults.reviewMaxRounds),
      validate: (v) => {
        const n = Number(v);
        if (Number.isNaN(n) || n < 0 || !Number.isInteger(n))
          return t('custom.review_rounds.invalid');
      },
    }),
  ) as string;

  const qaMode = cancelGuard(
    await clack.select({
      message: t('custom.qa_mode'),
      options: [
        { value: 'lite', label: t('custom.qa_lite'), hint: t('custom.qa_lite.hint') },
        { value: 'standard', label: t('custom.qa_standard'), hint: t('custom.qa_standard.hint') },
      ],
      initialValue: defaults.qaMode,
    }),
  ) as 'lite' | 'standard';

  const visualQaLevel = cancelGuard(
    await clack.select({
      message: t('custom.visual_qa'),
      options: [
        { value: 0, label: t('custom.visual_none'), hint: t('custom.visual_none.hint') },
        { value: 1, label: t('custom.visual_spot'), hint: t('custom.visual_spot.hint') },
        { value: 2, label: t('custom.visual_standard'), hint: t('custom.visual_standard.hint') },
        { value: 3, label: t('custom.visual_strict'), hint: t('custom.visual_strict.hint') },
      ],
      initialValue: defaults.visualQaLevel,
    }),
  ) as 0 | 1 | 2 | 3;

  const epicBased = cancelGuard(
    await clack.confirm({
      message: t('custom.epic_based'),
      initialValue: defaults.epicBased,
    }),
  ) as boolean;

  return {
    reviewMaxRounds: Number(reviewMaxRoundsStr),
    qaMode,
    visualQaLevel,
    epicBased,
  };
}

export async function promptSkillSelection(initial?: SkillName[]): Promise<SkillName[]> {
  const defaultSkills = initial ?? [];

  const selectedSkills = cancelGuard(
    await clack.multiselect({
      message: t('custom.enable_skills'),
      options: SKILL_NAMES.map((name) => ({
        value: name,
        label: `${name} — ${getSkillDescription(name)}`,
      })),
      initialValues: defaultSkills,
      required: false,
    }),
  ) as SkillName[];

  return selectedSkills;
}

export async function runCustomPresetPrompts(): Promise<Preset> {
  // Step 1: Base preset selection
  const basePresetName = cancelGuard(
    await clack.select({
      message: t('custom.base_preset'),
      options: [
        { value: 'solo-dev', label: `${t('preset.solo_dev')}`, hint: `minimal, 5 agents` },
        { value: 'small-team', label: `${t('preset.small_team')}`, hint: `standard, 8 agents` },
        { value: 'full-team', label: `${t('preset.full_team')}`, hint: `full process, strict QA` },
      ],
    }),
  ) as PresetName;

  const base = await loadPreset(basePresetName);

  // Step 2: Agent toggle
  const enabledAgentNames = Object.entries(base.agents)
    .filter(([, config]) => config.enabled)
    .map(([name]) => name) as AgentName[];

  const selectedAgents = await promptAgentSelection(enabledAgentNames);

  const agents = {} as Record<AgentName, AgentConfig>;
  for (const name of AGENT_NAMES) {
    agents[name] = {
      enabled: selectedAgents.includes(name),
      model: base.agents[name].model,
    };
  }

  // Step 3: Workflow settings
  const workflow = await promptWorkflow(base.workflow);

  // Step 4: Skills selection
  const selectedSkills = await promptSkillSelection(base.skills as SkillName[]);

  const scale = deriveScale(workflow);

  return {
    name: 'custom',
    description: `Custom preset based on ${basePresetName}`,
    scale,
    agents,
    workflow,
    skills: selectedSkills,
  };
}
