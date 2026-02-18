import type { Messages } from './types.js';

export const ko: Messages = {
  // === CLI 프롬프트 ===
  'prompt.choose_preset': '\ud504\ub9ac\uc14b\uc744 \uc120\ud0dd\ud558\uc138\uc694:',
  'prompt.project_name': '\ud504\ub85c\uc81d\ud2b8 \uc774\ub984:',
  'prompt.project_name.placeholder': 'my-project',
  'prompt.project_name.invalid':
    '\uc798\ubabb\ub41c \uc774\ub984\uc785\ub2c8\ub2e4. \uc18c\ubb38\uc790, \ud558\uc774\ud508, \uacf5\ubc31 \uc5c6\uc774 \uc785\ub825\ud558\uc138\uc694.',
  'prompt.tech_stack_confirm': '\uac10\uc9c0\ub428: {stack}. \ub9de\ub098\uc694?',
  'prompt.start_claude': 'Claude Code\ub97c plan mode\ub85c \uc2dc\uc791\ud560\uae4c\uc694?',
  'prompt.use_config': '\uc774 \uc124\uc815\uc744 \uc0ac\uc6a9\ud560\uae4c\uc694?',
  'prompt.cancel': '\uc791\uc5c5\uc774 \ucde8\uc18c\ub418\uc5c8\uc2b5\ub2c8\ub2e4.',

  // === \ud504\ub9ac\uc14b \uc635\uc158 ===
  'preset.solo_dev': 'Solo Dev',
  'preset.solo_dev.hint': '1\uc778 \uac1c\ubc1c, \ucd95\uc57d \uc6cc\ud06c\ud50c\ub85c\uc6b0',
  'preset.small_team': 'Small Team',
  'preset.small_team.hint': '\ud45c\uc900 \uc6cc\ud06c\ud50c\ub85c\uc6b0, EPIC \uae30\ubc18',
  'preset.full_team': 'Full Team',
  'preset.full_team.hint': '\ud480 \ud504\ub85c\uc138\uc2a4, Strict QA',
  'preset.custom': 'Custom',
  'preset.custom.hint':
    '\uc5d0\uc774\uc804\ud2b8, \uc6cc\ud06c\ud50c\ub85c\uc6b0, \uc2a4\ud0ac \uc9c1\uc811 \uad6c\uc131',

  // === \ucee4\uc2a4\ud140 \ud504\ub86c\ud504\ud2b8 ===
  'custom.base_preset': '\uae30\ubc18 \ud504\ub9ac\uc14b:',
  'custom.enable_agents': '\ud65c\uc131\ud654\ud560 \uc5d0\uc774\uc804\ud2b8:',
  'custom.review_rounds': '\ucd5c\ub300 \ub9ac\ubdf0 \ud69f\uc218 (0 = \uac74\ub108\ub6f0\uae30):',
  'custom.review_rounds.invalid':
    '0 \uc774\uc0c1\uc758 \uc815\uc218\ub97c \uc785\ub825\ud558\uc138\uc694.',
  'custom.qa_mode': 'QA \ubaa8\ub4dc:',
  'custom.qa_lite': 'Lite',
  'custom.qa_lite.hint': '\uc720\ub2db \ud14c\uc2a4\ud2b8 + \ucf54\ub4dc \ub9ac\ubdf0\ub9cc',
  'custom.qa_standard': 'Standard',
  'custom.qa_standard.hint': 'E2E \ud3ec\ud568 \ud480 QA',
  'custom.visual_qa': '\uc2dc\uac01\uc801 QA \ub808\ubca8:',
  'custom.visual_none': '\uc5c6\uc74c',
  'custom.visual_none.hint': '\uc2dc\uac01\uc801 \uac80\uc0ac \uc5c6\uc74c',
  'custom.visual_spot': 'Spot Check',
  'custom.visual_spot.hint': '\uae30\ubcf8 \uc2dc\uac01\uc801 \uac80\uc99d',
  'custom.visual_standard': 'Standard',
  'custom.visual_standard.hint': '\ucca0\uc800\ud55c \uc2dc\uac01\uc801 QA',
  'custom.visual_strict': 'Strict',
  'custom.visual_strict.hint': '\ud53d\uc140 \ub2e8\uc704 \uac80\uc0ac',
  'custom.epic_based': 'EPIC \uae30\ubc18 \uac1c\ubc1c\uc744 \uc0ac\uc6a9\ud560\uae4c\uc694?',
  'custom.enable_skills': '\ud65c\uc131\ud654\ud560 \uc2a4\ud0ac:',

  // === \ub808\uc9c0\uc2a4\ud2b8\ub9ac \ud504\ub86c\ud504\ud2b8 ===
  'registry.conflict': '\ud30c\uc77c\uc774 \uc774\ubbf8 \uc874\uc7ac\ud569\ub2c8\ub2e4: {path}',
  'registry.overwrite': '\ub36e\uc5b4\uc4f0\uae30',
  'registry.skip': '\uac74\ub108\ub6f0\uae30',
  'registry.install_deps': '\uc758\uc874\uc131\uc744 \uc124\uce58\ud560\uae4c\uc694? {deps}',
  'registry.no_results': '\uac80\uc0c9 \uacb0\uacfc\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.',
  'registry.found_results':
    '{count}\uac1c\uc758 \uacb0\uacfc\ub97c \ucc3e\uc558\uc2b5\ub2c8\ub2e4:',
  'registry.no_items': '\ud56d\ubaa9\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.',
  'registry.items_count': '{count}\uac1c \ud56d\ubaa9:',
  'registry.installed_count':
    '{count}\uac1c \ud56d\ubaa9\uc774 \uc124\uce58\ub418\uc5c8\uc2b5\ub2c8\ub2e4.',
  'registry.no_installed': '\uc124\uce58\ub41c \ud56d\ubaa9\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.',

  // === \ud45c\uc2dc \uba54\uc2dc\uc9c0 ===
  'display.scaffolding_complete': '\uc2a4\uce90\ud3f4\ub529 \uc644\ub8cc!',
  'display.file_created': '  + {path}',
  'display.file_skipped': '  ~ {path} (\uac74\ub108\ub6f4)',
  'display.validation_stats':
    '{files}\uac1c \ud30c\uc77c, {agents}\uac1c \uc5d0\uc774\uc804\ud2b8, {skills}\uac1c \uc2a4\ud0ac',
  'display.validation_passed': '\uac80\uc99d \ud1b5\uacfc!',
  'display.validation_failed': '\uac80\uc99d \uc2e4\ud328: {count}\uac1c \uc624\ub958.',
  'display.no_differences': '\ucc28\uc774\uc810\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.',
  'display.differences_count':
    '{count}\uac1c\uc758 \ucc28\uc774\uc810\uc774 \uc788\uc2b5\ub2c8\ub2e4.',
  'display.dry_run': '[DRY RUN] \ub2e4\uc74c \ud30c\uc77c\uc774 \uc0dd\uc131\ub429\ub2c8\ub2e4:',
  'display.config_loaded':
    'agent-system.config.yaml\uc5d0\uc11c \uc124\uc815\uc744 \ub85c\ub4dc\ud588\uc2b5\ub2c8\ub2e4',
  'display.config_saved': '\uc124\uc815 \uc800\uc7a5\ub428: {path}',
  'display.done': '\uc644\ub8cc! \uc990\uac70\uc6b4 \ucf54\ub529 \ub418\uc138\uc694.',

  // === \uac80\uc99d\uae30 \uba54\uc2dc\uc9c0 ===
  'validator.missing_agents_dir':
    "\uc5d0\uc774\uc804\ud2b8 \ub514\ub809\ud1a0\ub9ac .claude/agents/\ub97c \ucc3e\uc744 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4. 'create-agent-system'\uc744 \uc2e4\ud589\ud558\uc5ec \uc2a4\uce90\ud3f4\ub529\ud558\uc138\uc694.",
  'validator.missing_claude_md':
    "\ud504\ub85c\uc81d\ud2b8 \ub8e8\ud2b8\uc5d0 CLAUDE.md\ub97c \ucc3e\uc744 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4. 'create-agent-system'\uc744 \uc2e4\ud589\ud558\uc5ec \uc2a4\uce90\ud3f4\ub529\ud558\uc138\uc694.",
  'validator.yaml_parse_error': '{file}\uc758 YAML frontmatter \ud30c\uc2f1 \uc2e4\ud328',
  'validator.yaml_no_frontmatter':
    '{file}\uc758 YAML frontmatter \ud30c\uc2f1 \uc2e4\ud328: frontmatter \uad6c\ubd84\uc790\uac00 \uc5c6\uc2b5\ub2c8\ub2e4',
  'validator.missing_name':
    "{file}\uc5d0 \ud544\uc218 \ud544\ub4dc 'name'\uc774 \uc5c6\uc2b5\ub2c8\ub2e4",
  'validator.missing_description':
    "{file}\uc5d0 \ud544\uc218 \ud544\ub4dc 'description'\uc774 \uc5c6\uc2b5\ub2c8\ub2e4",
  'validator.unsupported_field':
    "{file}\uc5d0 \uc9c0\uc6d0\ub418\uc9c0 \uc54a\ub294 frontmatter \ud544\ub4dc '{field}'. \uc9c0\uc6d0 \ud544\ub4dc: {supported}",
  'validator.invalid_model':
    "{file}\uc5d0 \uc798\ubabb\ub41c model \uac12 '{model}'. \uc720\ud6a8\ud55c \uac12: {valid}",
  'validator.invalid_skill_ref':
    "{file}\uc5d0\uc11c \ucc38\uc870\ud55c \uc2a4\ud0ac '{skill}'\uc774 .claude/skills/{skill}/SKILL.md\uc5d0 \uc874\uc7ac\ud558\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4",
  'validator.invalid_import':
    "CLAUDE.md\uc758 import \uacbd\ub85c '@{path}'\uac00 \uc874\uc7ac\ud558\uc9c0 \uc54a\ub294 \ud30c\uc77c\uc744 \ucc38\uc870\ud569\ub2c8\ub2e4",
  'validator.short_description':
    '{file}\uc758 description\uc774 \ub108\ubb34 \uc9e7\uc2b5\ub2c8\ub2e4 ({length}\uc790). 20\uc790 \uc774\uc0c1 \uad8c\uc7a5',
  'validator.long_description':
    '{file}\uc758 description\uc774 \ub108\ubb34 \uae41\ub2c8\ub2e4 ({length}\uc790). 1024\uc790 \uc774\ud558 \uad8c\uc7a5',
  'validator.missing_tools':
    "{file}\uc5d0 'tools' \ud544\ub4dc\uac00 \uc5c6\uc2b5\ub2c8\ub2e4. \ubaa8\ub4e0 \ub3c4\uad6c\uac00 \uc0c1\uc18d\ub429\ub2c8\ub2e4. \uc758\ub3c4\uc801\uc774\ub77c\uba74 \ubb38\uc81c\uc5c6\uc2b5\ub2c8\ub2e4.",
  'validator.duplicate_content':
    "\uc5d0\uc774\uc804\ud2b8 \uc815\uc758 {file}\uc5d0 '{keyword}'\uc774 \ud3ec\ud568\ub418\uc5b4 \uc788\uc2b5\ub2c8\ub2e4. CLAUDE.md\uc5d0\ub9cc \uc788\uc5b4\uc57c \ud569\ub2c8\ub2e4 (SSOT \uc6d0\uce59)",

  // === Differ \uba54\uc2dc\uc9c0 ===
  'differ.comparing': '\ube44\uad50: {a} \u2194 {b}',
  'differ.scale': '\uaddc\ubaa8: {a} \u2192 {b}',
  'differ.agents': '\uc5d0\uc774\uc804\ud2b8:',
  'differ.agents_identical': '\uc5d0\uc774\uc804\ud2b8: \ub3d9\uc77c',
  'differ.workflow': '\uc6cc\ud06c\ud50c\ub85c\uc6b0:',
  'differ.workflow_identical': '\uc6cc\ud06c\ud50c\ub85c\uc6b0: \ub3d9\uc77c',
  'differ.skills': '\uc2a4\ud0ac:',
  'differ.skills_identical': '\uc2a4\ud0ac: \ub3d9\uc77c',
  'differ.only_in': '{skill} ({preset}\uc5d0\ub9cc \uc788\uc74c)',
  'differ.common': '{skills} (\uacf5\ud1b5)',

  // === \uc5d0\uc774\uc804\ud2b8 \uc124\uba85 ===
  'agent.po_pm': '\uc2a4\ud399/\ud2f0\ucf13 \uad00\ub9ac, \ubcc0\uacbd \uc694\uccad \ucc98\ub9ac',
  'agent.architect': '\uc544\ud0a4\ud14d\ucc98 \uc124\uacc4, ADR \uc791\uc131',
  'agent.cto': '\uae30\uc220 \uac80\uc99d, \uc624\ubc84\uc5d4\uc9c0\ub2c8\uc5b4\ub9c1 \ubc29\uc9c0',
  'agent.designer': '\ub514\uc790\uc778 \uc2dc\uc2a4\ud15c, \uc2dc\uac01\uc801 QA',
  'agent.test_writer': 'TDD \uae30\ubc18 \ud14c\uc2a4\ud2b8 \uc791\uc131',
  'agent.frontend_dev': '\ud504\ub860\ud2b8\uc5d4\ub4dc \uad6c\ud604',
  'agent.backend_dev': '\ubc31\uc5d4\ub4dc/CLI/\uc720\ud2f8\ub9ac\ud2f0 \uad6c\ud604',
  'agent.qa_reviewer': '\ucf54\ub4dc \ub9ac\ubdf0, \ud488\uc9c8 \uac80\uc99d',

  // === \uc2a4\ud0ac \uc124\uba85 ===
  'skill.scoring': '100\uc810 \ub9cc\uc810 \ucc44\uc810 \ud504\ub85c\ud1a0\ucf5c',
  'skill.visual_qa': '\uc2dc\uac01\uc801 QA \uac80\uc99d',
  'skill.tdd_workflow': 'TDD \uc6cc\ud06c\ud50c\ub85c\uc6b0',
  'skill.adr_writing': 'ADR \uc791\uc131 \uac00\uc774\ub4dc',
  'skill.ticket_writing': '\uc720\uc800 \uc2a4\ud1a0\ub9ac \uae30\ubc18 \ud2f0\ucf13 \uc791\uc131',
  'skill.design_system': '\ub514\uc790\uc778 \uc2dc\uc2a4\ud15c \uad00\ub9ac',
  'skill.cr_process': '\ubcc0\uacbd \uc694\uccad \ud504\ub85c\uc138\uc2a4',

  // === \ud15c\ud50c\ub9bf \uc81c\ubaa9 ===
  'heading.project_memory': 'Project Memory',
  'heading.project_overview': '\ud504\ub85c\uc81d\ud2b8 \uac1c\uc694',
  'heading.common_rules': '\uacf5\ud1b5 \uaddc\uce59',
  'heading.build_commands': '\ube4c\ub4dc & \ud14c\uc2a4\ud2b8 \uba85\ub839\uc5b4',
  'heading.code_style': '\ucf54\ub4dc \uc2a4\ud0c0\uc77c',
  'heading.agent_context_rules':
    '\uc5d0\uc774\uc804\ud2b8\ubcc4 \ucee8\ud14d\uc2a4\ud2b8 \uaddc\uce59',
  'heading.file_ownership': '\ud30c\uc77c \uc18c\uc720\uad8c',
  'heading.exclusive_ownership': '\uc804\uc6a9 \uc18c\uc720',
  'heading.shared_file_rules': '\uacf5\uc720 \ud30c\uc77c \uaddc\uce59',
  'heading.failure_modes': '\uc2e4\ud328 \ubaa8\ub4dc & \ubcf5\uad6c',
  'heading.detection_criteria': '\uac10\uc9c0 \uae30\uc900',
  'heading.escalation_rules': '\uc5d0\uc2a4\uceec\ub808\uc774\uc158 \uaddc\uce59',
  'heading.epic_dependency': 'EPIC \uac04 \uc758\uc874\uc131 \uad00\ub9ac',
  'heading.model_config': '\ubaa8\ub378 \uc124\uc815',

  // === \ub9c8\uc774\uadf8\ub808\uc774\uc158 \uba54\uc2dc\uc9c0 (EPIC-20) ===
  'migrate.detected': '\ub9c8\uc774\uadf8\ub808\uc774\uc158 \uac10\uc9c0: {current} -> {target}',
  'migrate.no_changes':
    '\ub9c8\uc774\uadf8\ub808\uc774\uc158 \ubcc0\uacbd\uc0ac\ud56d\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.',
  'migrate.changes': '\ub9c8\uc774\uadf8\ub808\uc774\uc158 \ubcc0\uacbd\uc0ac\ud56d:',
  'migrate.apply_confirm':
    '\ub9c8\uc774\uadf8\ub808\uc774\uc158\uc744 \uc801\uc6a9\ud560\uae4c\uc694?',
  'migrate.complete': '\ub9c8\uc774\uadf8\ub808\uc774\uc158 \uc644\ub8cc.',
  'migrate.dry_run': '[DRY RUN] \ub9c8\uc774\uadf8\ub808\uc774\uc158 \ubbf8\ub9ac\ubcf4\uae30:',
  'migrate.error_no_project':
    '\uc5d0\uc774\uc804\ud2b8 \uc2dc\uc2a4\ud15c \ud504\ub85c\uc81d\ud2b8\ub97c \ucc3e\uc744 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.',

  // === \uc5d0\ub514\ud130 \uba54\uc2dc\uc9c0 (EPIC-21) ===
  'edit.no_config':
    '\uc124\uc815 \ud30c\uc77c\uc744 \ucc3e\uc744 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4. \uba3c\uc800 scaffold\ub97c \uc2e4\ud589\ud558\uc138\uc694.',
  'edit.current_summary': '\ud604\uc7ac \uc124\uc815:',
  'edit.choose_section': '\ud3b8\uc9d1\ud560 \uc139\uc158\uc744 \uc120\ud0dd\ud558\uc138\uc694:',
  'edit.section_agents': '\uc5d0\uc774\uc804\ud2b8',
  'edit.section_workflow': '\uc6cc\ud06c\ud50c\ub85c\uc6b0',
  'edit.section_skills': '\uc2a4\ud0ac',
  'edit.section_all': '\uc804\uccb4 \uc139\uc158',
  'edit.save_method': '\uc800\uc7a5 \ubc29\ubc95:',
  'edit.save_config_only': '\uc124\uc815\ub9cc \uc800\uc7a5',
  'edit.save_and_scaffold': '\uc800\uc7a5 \ud6c4 \uc2a4\uce90\ud3f4\ub529',
  'edit.save_cancel': '\ucde8\uc18c',
  'edit.saved': '\uc124\uc815\uc774 \uc800\uc7a5\ub418\uc5c8\uc2b5\ub2c8\ub2e4.',
};
