export type Locale = 'ko' | 'en';

export interface Messages {
  // === CLI prompts (src/cli/prompts.ts) ===
  'prompt.choose_preset': string;
  'prompt.project_name': string;
  'prompt.project_name.placeholder': string;
  'prompt.project_name.invalid': string;
  'prompt.tech_stack_confirm': string;
  'prompt.start_claude': string;
  'prompt.use_config': string;
  'prompt.cancel': string;

  // === Preset options ===
  'preset.solo_dev': string;
  'preset.solo_dev.hint': string;
  'preset.small_team': string;
  'preset.small_team.hint': string;
  'preset.full_team': string;
  'preset.full_team.hint': string;
  'preset.custom': string;
  'preset.custom.hint': string;

  // === Custom prompts (src/cli/custom-prompts.ts) ===
  'custom.base_preset': string;
  'custom.enable_agents': string;
  'custom.review_rounds': string;
  'custom.review_rounds.invalid': string;
  'custom.qa_mode': string;
  'custom.qa_lite': string;
  'custom.qa_lite.hint': string;
  'custom.qa_standard': string;
  'custom.qa_standard.hint': string;
  'custom.visual_qa': string;
  'custom.visual_none': string;
  'custom.visual_none.hint': string;
  'custom.visual_spot': string;
  'custom.visual_spot.hint': string;
  'custom.visual_standard': string;
  'custom.visual_standard.hint': string;
  'custom.visual_strict': string;
  'custom.visual_strict.hint': string;
  'custom.epic_based': string;
  'custom.enable_skills': string;

  // === Registry prompts (src/cli/registry-prompts.ts) ===
  'registry.conflict': string;
  'registry.overwrite': string;
  'registry.skip': string;
  'registry.install_deps': string;
  'registry.no_results': string;
  'registry.found_results': string;
  'registry.no_items': string;
  'registry.items_count': string;
  'registry.installed_count': string;
  'registry.no_installed': string;
  'registry.local_items_count': string;
  'registry.no_local_items': string;

  // === Display messages ===
  'display.scaffolding_complete': string;
  'display.file_created': string;
  'display.file_skipped': string;
  'display.validation_stats': string;
  'display.validation_passed': string;
  'display.validation_failed': string;
  'display.no_differences': string;
  'display.differences_count': string;
  'display.dry_run': string;
  'display.config_loaded': string;
  'display.config_saved': string;
  'display.done': string;

  // === Validator messages (src/core/validator.ts) ===
  'validator.missing_agents_dir': string;
  'validator.missing_claude_md': string;
  'validator.yaml_parse_error': string;
  'validator.yaml_no_frontmatter': string;
  'validator.missing_name': string;
  'validator.missing_description': string;
  'validator.unsupported_field': string;
  'validator.invalid_model': string;
  'validator.invalid_skill_ref': string;
  'validator.invalid_import': string;
  'validator.short_description': string;
  'validator.long_description': string;
  'validator.missing_tools': string;
  'validator.duplicate_content': string;

  // === Differ messages (src/core/preset-differ.ts) ===
  'differ.comparing': string;
  'differ.scale': string;
  'differ.agents': string;
  'differ.agents_identical': string;
  'differ.workflow': string;
  'differ.workflow_identical': string;
  'differ.skills': string;
  'differ.skills_identical': string;
  'differ.only_in': string;
  'differ.common': string;

  // === Agent descriptions ===
  'agent.po_pm': string;
  'agent.architect': string;
  'agent.cto': string;
  'agent.designer': string;
  'agent.test_writer': string;
  'agent.frontend_dev': string;
  'agent.backend_dev': string;
  'agent.qa_reviewer': string;

  // === Skill descriptions ===
  'skill.scoring': string;
  'skill.visual_qa': string;
  'skill.tdd_workflow': string;
  'skill.adr_writing': string;
  'skill.ticket_writing': string;
  'skill.design_system': string;
  'skill.cr_process': string;

  // === Template headings (claude-md.hbs) ===
  'heading.project_memory': string;
  'heading.project_overview': string;
  'heading.common_rules': string;
  'heading.build_commands': string;
  'heading.code_style': string;
  'heading.agent_context_rules': string;
  'heading.file_ownership': string;
  'heading.exclusive_ownership': string;
  'heading.shared_file_rules': string;
  'heading.failure_modes': string;
  'heading.detection_criteria': string;
  'heading.escalation_rules': string;
  'heading.epic_dependency': string;
  'heading.model_config': string;

  // === Migration messages (EPIC-20) ===
  'migrate.detected': string;
  'migrate.no_changes': string;
  'migrate.changes': string;
  'migrate.apply_confirm': string;
  'migrate.complete': string;
  'migrate.dry_run': string;
  'migrate.error_no_project': string;

  // === Editor messages (EPIC-21) ===
  'edit.no_config': string;
  'edit.current_summary': string;
  'edit.choose_section': string;
  'edit.section_agents': string;
  'edit.section_workflow': string;
  'edit.section_skills': string;
  'edit.section_all': string;
  'edit.save_method': string;
  'edit.save_config_only': string;
  'edit.save_and_scaffold': string;
  'edit.save_cancel': string;
  'edit.saved': string;

  // === Runner messages ===
  'runner.claude_not_found': string;
  'runner.claude_exit_code': string;
}
