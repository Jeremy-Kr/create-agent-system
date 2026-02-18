import * as clack from '@clack/prompts';
import { deriveScale, loadPreset } from '../core/preset-loader.js';
import type {
  AgentConfig,
  AgentName,
  PresetName,
  SkillName,
  WorkflowConfig,
} from '../types/config.js';
import type { Preset } from '../types/preset.js';
import {
  AGENT_DESCRIPTIONS,
  AGENT_DISPLAY_NAMES,
  AGENT_NAMES,
  SKILL_DESCRIPTIONS,
  SKILL_NAMES,
} from '../utils/constants.js';

export { deriveScale };

function cancelGuard<T>(value: T | symbol): T {
  if (clack.isCancel(value)) {
    clack.cancel('Operation cancelled.');
    process.exit(0);
  }
  return value as T;
}

export async function runCustomPresetPrompts(): Promise<Preset> {
  // Step 1: Base preset selection
  const basePresetName = cancelGuard(
    await clack.select({
      message: 'Base preset to start from:',
      options: [
        { value: 'solo-dev', label: 'Solo Dev', hint: 'minimal, 5 agents' },
        { value: 'small-team', label: 'Small Team', hint: 'standard, 8 agents' },
        { value: 'full-team', label: 'Full Team', hint: 'full process, strict QA' },
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
      message: 'Enable agents:',
      options: AGENT_NAMES.map((name) => ({
        value: name,
        label: `${AGENT_DISPLAY_NAMES[name]} — ${AGENT_DESCRIPTIONS[name]}`,
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
      message: 'Max review rounds (0 = skip):',
      initialValue: String(base.workflow.reviewMaxRounds),
      validate: (v) => {
        const n = Number(v);
        if (Number.isNaN(n) || n < 0 || !Number.isInteger(n))
          return 'Enter a non-negative integer.';
      },
    }),
  ) as string;

  const qaMode = cancelGuard(
    await clack.select({
      message: 'QA mode:',
      options: [
        { value: 'lite', label: 'Lite', hint: 'unit tests + code review only' },
        { value: 'standard', label: 'Standard', hint: 'full QA with E2E' },
      ],
      initialValue: base.workflow.qaMode,
    }),
  ) as 'lite' | 'standard';

  const visualQaLevel = cancelGuard(
    await clack.select({
      message: 'Visual QA level:',
      options: [
        { value: 0, label: 'None', hint: 'no visual checks' },
        { value: 1, label: 'Spot Check', hint: 'basic visual validation' },
        { value: 2, label: 'Standard', hint: 'thorough visual QA' },
        { value: 3, label: 'Strict', hint: 'pixel-level checks' },
      ],
      initialValue: base.workflow.visualQaLevel,
    }),
  ) as 0 | 1 | 2 | 3;

  const epicBased = cancelGuard(
    await clack.confirm({
      message: 'Use EPIC-based development?',
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
      message: 'Enable skills:',
      options: SKILL_NAMES.map((name) => ({
        value: name,
        label: `${name} — ${SKILL_DESCRIPTIONS[name]}`,
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
