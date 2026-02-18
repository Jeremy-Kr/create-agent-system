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

export { deriveScale };

function cancelGuard<T>(value: T | symbol): T {
  if (clack.isCancel(value)) {
    clack.cancel(t('prompt.cancel'));
    process.exit(0);
  }
  return value as T;
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
    .map(([name]) => name);

  const selectedAgents = cancelGuard(
    await clack.multiselect({
      message: t('custom.enable_agents'),
      options: AGENT_NAMES.map((name) => ({
        value: name,
        label: `${AGENT_DISPLAY_NAMES[name]} — ${getAgentDescription(name)}`,
      })),
      initialValues: enabledAgentNames as AgentName[],
      required: true,
    }),
  ) as AgentName[];

  const agents = {} as Record<AgentName, AgentConfig>;
  for (const name of AGENT_NAMES) {
    agents[name] = {
      enabled: selectedAgents.includes(name),
      model: base.agents[name].model,
    };
  }

  // Step 3: Workflow settings
  const reviewMaxRoundsStr = cancelGuard(
    await clack.text({
      message: t('custom.review_rounds'),
      initialValue: String(base.workflow.reviewMaxRounds),
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
      initialValue: base.workflow.qaMode,
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
      initialValue: base.workflow.visualQaLevel,
    }),
  ) as 0 | 1 | 2 | 3;

  const epicBased = cancelGuard(
    await clack.confirm({
      message: t('custom.epic_based'),
      initialValue: base.workflow.epicBased,
    }),
  ) as boolean;

  const workflow: WorkflowConfig = {
    reviewMaxRounds: Number(reviewMaxRoundsStr),
    qaMode,
    visualQaLevel,
    epicBased,
  };

  // Step 4: Skills selection
  const selectedSkills = cancelGuard(
    await clack.multiselect({
      message: t('custom.enable_skills'),
      options: SKILL_NAMES.map((name) => ({
        value: name,
        label: `${name} — ${getSkillDescription(name)}`,
      })),
      initialValues: base.skills as SkillName[],
      required: false,
    }),
  ) as SkillName[];

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
