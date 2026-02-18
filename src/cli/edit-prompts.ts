import * as clack from '@clack/prompts';
import { presetToConfigUpdate } from '../core/config-editor.js';
import { detectConfigFile, loadConfigFile, saveConfigFile } from '../core/config-file-loader.js';
import { diffPresets, displayDiff } from '../core/preset-differ.js';
import { deriveScale } from '../core/preset-loader.js';
import { scaffold } from '../core/scaffolder.js';
import { t } from '../i18n/index.js';
import type { AgentConfig, AgentName, SkillName } from '../types/config.js';
import type { Preset } from '../types/preset.js';
import { AGENT_DISPLAY_NAMES, AGENT_NAMES } from '../utils/constants.js';
import { detectTechStack } from '../utils/detect.js';
import { promptAgentSelection, promptSkillSelection, promptWorkflow } from './custom-prompts.js';

type EditSection = 'agents' | 'workflow' | 'skills' | 'all';

function cancelGuard<T>(value: T | symbol): T {
  if (clack.isCancel(value)) {
    clack.cancel(t('prompt.cancel'));
    process.exit(0);
  }
  return value as T;
}

function displaySummary(preset: Preset, projectName: string): void {
  clack.log.info(t('edit.current_summary'));
  const enabledAgents = AGENT_NAMES.filter((n) => preset.agents[n].enabled);
  const agentList = enabledAgents.map((n) => AGENT_DISPLAY_NAMES[n]).join(', ');
  clack.log.message(`  Project: ${projectName}`);
  clack.log.message(`  Scale: ${preset.scale}`);
  clack.log.message(`  Agents: ${agentList}`);
  clack.log.message(
    `  Workflow: qaMode=${preset.workflow.qaMode}, reviewMaxRounds=${preset.workflow.reviewMaxRounds}, visualQa=${preset.workflow.visualQaLevel}, epic=${preset.workflow.epicBased}`,
  );
  clack.log.message(`  Skills: ${preset.skills.join(', ') || '(none)'}`);
}

async function chooseSection(): Promise<EditSection> {
  return cancelGuard(
    await clack.select({
      message: t('edit.choose_section'),
      options: [
        { value: 'agents' as const, label: t('edit.section_agents') },
        { value: 'workflow' as const, label: t('edit.section_workflow') },
        { value: 'skills' as const, label: t('edit.section_skills') },
        { value: 'all' as const, label: t('edit.section_all') },
      ],
    }),
  ) as EditSection;
}

async function editPreset(preset: Preset, section: EditSection): Promise<Preset> {
  let agents = preset.agents;
  let workflow = preset.workflow;
  let skills = preset.skills;

  if (section === 'agents' || section === 'all') {
    const currentEnabled = AGENT_NAMES.filter((n) => preset.agents[n].enabled) as AgentName[];
    const selectedAgents = await promptAgentSelection(currentEnabled);
    agents = {} as Record<AgentName, AgentConfig>;
    for (const name of AGENT_NAMES) {
      agents[name] = {
        enabled: selectedAgents.includes(name),
        model: preset.agents[name].model,
      };
    }
  }

  if (section === 'workflow' || section === 'all') {
    workflow = await promptWorkflow(preset.workflow);
  }

  if (section === 'skills' || section === 'all') {
    skills = await promptSkillSelection(preset.skills as SkillName[]);
  }

  const scale = deriveScale(workflow);

  return {
    ...preset,
    agents,
    workflow,
    skills,
    scale,
  };
}

type SaveMethod = 'config_only' | 'config_and_scaffold' | 'cancel';

async function chooseSaveMethod(): Promise<SaveMethod> {
  return cancelGuard(
    await clack.select({
      message: t('edit.save_method'),
      options: [
        { value: 'config_only' as const, label: t('edit.save_config_only') },
        { value: 'config_and_scaffold' as const, label: t('edit.save_and_scaffold') },
        { value: 'cancel' as const, label: t('edit.save_cancel') },
      ],
    }),
  ) as SaveMethod;
}

export async function runEditFlow(targetDir: string): Promise<void> {
  // 1. Check config exists
  const hasConfig = await detectConfigFile(targetDir);
  if (!hasConfig) {
    clack.log.error(t('edit.no_config'));
    return;
  }

  // 2. Load config
  const { preset: originalPreset, projectName, language } = await loadConfigFile(targetDir);

  // 3. Display summary
  displaySummary(originalPreset, projectName);

  // 4. Choose section
  const section = await chooseSection();

  // 5. Edit
  const editedPreset = await editPreset(originalPreset, section);

  // 6. Show diff
  const diff = diffPresets(originalPreset, editedPreset);
  displayDiff(diff);

  // 7. Choose save method
  const saveMethod = await chooseSaveMethod();

  if (saveMethod === 'cancel') {
    return;
  }

  // 8. Save config
  const configUpdate = presetToConfigUpdate(
    {
      version: '0.2',
      projectName,
      description: originalPreset.description,
      basePreset: originalPreset.name === 'custom' ? undefined : originalPreset.name,
      agents: originalPreset.agents,
      workflow: originalPreset.workflow,
      skills: originalPreset.skills,
      language,
    },
    editedPreset,
  );

  await saveConfigFile(
    targetDir,
    editedPreset,
    configUpdate.projectName,
    configUpdate.basePreset,
    configUpdate.language,
  );

  // 9. Re-scaffold if requested
  if (saveMethod === 'config_and_scaffold') {
    const techStack = await detectTechStack(targetDir);
    await scaffold({
      preset: editedPreset,
      projectName,
      targetDir,
      techStack,
      dryRun: false,
      overwrite: true,
    });
  }

  clack.log.success(t('edit.saved'));
}
