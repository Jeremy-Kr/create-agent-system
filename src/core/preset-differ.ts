import * as clack from '@clack/prompts';
import { t } from '../i18n/index.js';
import type { SkillName } from '../types/config.js';
import type { AgentDiff, PresetDiffResult, SkillDiff, WorkflowDiff } from '../types/diff.js';
import type { Preset } from '../types/preset.js';
import { AGENT_DISPLAY_NAMES, AGENT_NAMES } from '../utils/constants.js';

export function diffPresets(presetA: Preset, presetB: Preset): PresetDiffResult {
  const agents: AgentDiff[] = [];
  for (const name of AGENT_NAMES) {
    const a = presetA.agents[name];
    const b = presetB.agents[name];
    if (a.enabled !== b.enabled) {
      agents.push({ agent: name, field: 'enabled', a: a.enabled, b: b.enabled });
    }
    if (a.model !== b.model) {
      agents.push({ agent: name, field: 'model', a: a.model, b: b.model });
    }
  }

  const workflow: WorkflowDiff[] = [];
  const workflowFields = ['reviewMaxRounds', 'qaMode', 'visualQaLevel', 'epicBased'] as const;
  for (const field of workflowFields) {
    const aVal = presetA.workflow[field];
    const bVal = presetB.workflow[field];
    if (aVal !== bVal) {
      workflow.push({ field, a: aVal, b: bVal });
    }
  }

  const skillsA = new Set<SkillName>(presetA.skills);
  const skillsB = new Set<SkillName>(presetB.skills);
  const skills: SkillDiff = {
    onlyInA: presetA.skills.filter((s) => !skillsB.has(s)),
    onlyInB: presetB.skills.filter((s) => !skillsA.has(s)),
    common: presetA.skills.filter((s) => skillsB.has(s)),
  };

  return {
    nameA: presetA.name,
    nameB: presetB.name,
    agents,
    workflow,
    skills,
    scaleChanged: presetA.scale !== presetB.scale,
    scaleA: presetA.scale,
    scaleB: presetB.scale,
  };
}

function displayScaleDiff(diff: PresetDiffResult): void {
  if (diff.scaleChanged) {
    clack.log.step(t('differ.scale', { a: diff.scaleA ?? '', b: diff.scaleB ?? '' }));
  }
}

function displayAgentsDiff(diff: PresetDiffResult): void {
  if (diff.agents.length > 0) {
    clack.log.step(t('differ.agents'));
    for (const d of diff.agents) {
      const name = AGENT_DISPLAY_NAMES[d.agent] || d.agent;
      clack.log.message(`  ${name}.${d.field}: ${String(d.a)} → ${String(d.b)}`);
    }
  } else {
    clack.log.step(t('differ.agents_identical'));
  }
}

function displayWorkflowDiff(diff: PresetDiffResult): void {
  if (diff.workflow.length > 0) {
    clack.log.step(t('differ.workflow'));
    for (const d of diff.workflow) {
      clack.log.message(`  ${d.field}: ${String(d.a)} → ${String(d.b)}`);
    }
  } else {
    clack.log.step(t('differ.workflow_identical'));
  }
}

function displaySkillsDiff(diff: PresetDiffResult): void {
  const hasSkillDiff = diff.skills.onlyInA.length > 0 || diff.skills.onlyInB.length > 0;
  if (hasSkillDiff) {
    clack.log.step(t('differ.skills'));
    for (const s of diff.skills.onlyInA) {
      clack.log.message(`  - ${t('differ.only_in', { skill: s, preset: diff.nameA })}`);
    }
    for (const s of diff.skills.onlyInB) {
      clack.log.message(`  + ${t('differ.only_in', { skill: s, preset: diff.nameB })}`);
    }
    if (diff.skills.common.length > 0) {
      clack.log.message(`  = ${t('differ.common', { skills: diff.skills.common.join(', ') })}`);
    }
  } else {
    clack.log.step(t('differ.skills_identical'));
  }
}

function displayDiffSummary(diff: PresetDiffResult): void {
  const totalChanges =
    diff.agents.length +
    diff.workflow.length +
    diff.skills.onlyInA.length +
    diff.skills.onlyInB.length +
    (diff.scaleChanged ? 1 : 0);

  if (totalChanges === 0) {
    clack.log.success(t('display.no_differences'));
  } else {
    clack.log.info(t('display.differences_count', { count: totalChanges }));
  }
}

export function displayDiff(diff: PresetDiffResult): void {
  clack.log.info(t('differ.comparing', { a: diff.nameA, b: diff.nameB }));
  displayScaleDiff(diff);
  displayAgentsDiff(diff);
  displayWorkflowDiff(diff);
  displaySkillsDiff(diff);
  displayDiffSummary(diff);
}
