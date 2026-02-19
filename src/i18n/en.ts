import type { Messages } from './types.js';

export const en: Messages = {
  // === CLI prompts ===
  'prompt.choose_preset': 'Choose a preset:',
  'prompt.project_name': 'Project name:',
  'prompt.project_name.placeholder': 'my-project',
  'prompt.project_name.invalid': 'Invalid name. Use lowercase, hyphens, no spaces.',
  'prompt.tech_stack_confirm': 'Detected: {stack}. Correct?',
  'prompt.start_claude': 'Start Claude Code in plan mode?',
  'prompt.use_config': 'Use this config?',
  'prompt.cancel': 'Operation cancelled.',

  // === Preset options ===
  'preset.solo_dev': 'Solo Dev',
  'preset.solo_dev.hint': '1-person, abbreviated workflow',
  'preset.small_team': 'Small Team',
  'preset.small_team.hint': 'standard workflow, EPIC-based',
  'preset.full_team': 'Full Team',
  'preset.full_team.hint': 'full process, Strict QA',
  'preset.custom': 'Custom',
  'preset.custom.hint': 'configure agents, workflow, skills',

  // === Custom prompts ===
  'custom.base_preset': 'Base preset to start from:',
  'custom.enable_agents': 'Enable agents:',
  'custom.review_rounds': 'Max review rounds (0 = skip):',
  'custom.review_rounds.invalid': 'Enter a non-negative integer.',
  'custom.qa_mode': 'QA mode:',
  'custom.qa_lite': 'Lite',
  'custom.qa_lite.hint': 'unit tests + code review only',
  'custom.qa_standard': 'Standard',
  'custom.qa_standard.hint': 'full QA with E2E',
  'custom.visual_qa': 'Visual QA level:',
  'custom.visual_none': 'None',
  'custom.visual_none.hint': 'no visual checks',
  'custom.visual_spot': 'Spot Check',
  'custom.visual_spot.hint': 'basic visual validation',
  'custom.visual_standard': 'Standard',
  'custom.visual_standard.hint': 'thorough visual QA',
  'custom.visual_strict': 'Strict',
  'custom.visual_strict.hint': 'pixel-level checks',
  'custom.epic_based': 'Use EPIC-based development?',
  'custom.enable_skills': 'Enable skills:',

  // === Registry prompts ===
  'registry.conflict': 'File already exists: {path}',
  'registry.overwrite': 'Overwrite',
  'registry.skip': 'Skip',
  'registry.install_deps': 'Install dependencies? {deps}',
  'registry.no_results': 'No results found.',
  'registry.found_results': 'Found {count} result(s):',
  'registry.no_items': 'No items found.',
  'registry.items_count': '{count} item(s):',
  'registry.installed_count': 'Installed {count} item(s).',
  'registry.no_installed': 'No items installed.',
  'registry.local_items_count': '{count} local item(s) installed:',
  'registry.no_local_items': 'No local items installed.',

  // === Display messages ===
  'display.scaffolding_complete': 'Scaffolding complete!',
  'display.file_created': '  + {path}',
  'display.file_skipped': '  ~ {path} (skipped)',
  'display.validation_stats': '{files} files, {agents} agents, {skills} skills',
  'display.validation_passed': 'Validation passed!',
  'display.validation_failed': 'Validation failed with {count} error(s).',
  'display.no_differences': 'No differences found.',
  'display.differences_count': '{count} difference(s) found.',
  'display.dry_run': '[DRY RUN] The following files would be created:',
  'display.config_loaded': 'Loaded config from agent-system.config.yaml',
  'display.config_saved': 'Config saved: {path}',
  'display.done': 'Done! Happy coding.',

  // === Validator messages ===
  'validator.missing_agents_dir':
    "Agent directory .claude/agents/ not found. Run 'create-agent-system' to scaffold.",
  'validator.missing_claude_md':
    "CLAUDE.md not found in project root. Run 'create-agent-system' to scaffold.",
  'validator.yaml_parse_error': 'Failed to parse YAML frontmatter in {file}',
  'validator.yaml_no_frontmatter':
    'Failed to parse YAML frontmatter in {file}: no frontmatter delimiters found',
  'validator.missing_name': "Missing required field 'name' in {file}",
  'validator.missing_description': "Missing required field 'description' in {file}",
  'validator.unsupported_field':
    "Unsupported frontmatter field '{field}' in {file}. Supported fields: {supported}",
  'validator.invalid_model': "Invalid model value '{model}' in {file}. Valid values: {valid}",
  'validator.invalid_skill_ref':
    "Skill '{skill}' referenced in {file} but .claude/skills/{skill}/SKILL.md does not exist",
  'validator.invalid_import': "Import path '@{path}' in CLAUDE.md references nonexistent file",
  'validator.short_description':
    'Description in {file} is very short ({length} chars). Consider adding more detail (recommended: 20+ chars)',
  'validator.long_description':
    'Description in {file} is very long ({length} chars). Consider shortening (recommended: under 1024 chars)',
  'validator.missing_tools':
    "No 'tools' field in {file}. All tools will be inherited. If intentional, this is fine.",
  'validator.duplicate_content':
    "Agent definition {file} appears to contain '{keyword}' which should be in CLAUDE.md only (SSOT principle)",

  // === Differ messages ===
  'differ.comparing': 'Comparing: {a} \u2194 {b}',
  'differ.scale': 'Scale: {a} \u2192 {b}',
  'differ.agents': 'Agents:',
  'differ.agents_identical': 'Agents: identical',
  'differ.workflow': 'Workflow:',
  'differ.workflow_identical': 'Workflow: identical',
  'differ.skills': 'Skills:',
  'differ.skills_identical': 'Skills: identical',
  'differ.only_in': '{skill} (only in {preset})',
  'differ.common': '{skills} (common)',

  // === Agent descriptions ===
  'agent.po_pm': 'Spec/ticket management, change request processing',
  'agent.architect': 'Architecture design, ADR writing',
  'agent.cto': 'Technical verification, over-engineering prevention',
  'agent.designer': 'Design system, visual QA',
  'agent.test_writer': 'TDD-based test writing',
  'agent.frontend_dev': 'Frontend implementation',
  'agent.backend_dev': 'Backend/CLI/utility implementation',
  'agent.qa_reviewer': 'Code review, quality verification',

  // === Skill descriptions ===
  'skill.scoring': '100-point scoring protocol',
  'skill.visual_qa': 'Visual QA verification',
  'skill.tdd_workflow': 'TDD workflow',
  'skill.adr_writing': 'ADR writing guide',
  'skill.ticket_writing': 'User story-based ticket writing',
  'skill.design_system': 'Design system management',
  'skill.cr_process': 'Change request process',

  // === Template headings ===
  'heading.project_memory': 'Project Memory',
  'heading.project_overview': 'Project Overview',
  'heading.common_rules': 'Common Rules',
  'heading.build_commands': 'Build & Test Commands',
  'heading.code_style': 'Code Style',
  'heading.agent_context_rules': 'Agent Context Rules',
  'heading.file_ownership': 'File Ownership',
  'heading.exclusive_ownership': 'Exclusive Ownership',
  'heading.shared_file_rules': 'Shared File Rules',
  'heading.failure_modes': 'Failure Modes & Recovery',
  'heading.detection_criteria': 'Detection Criteria',
  'heading.escalation_rules': 'Escalation Rules',
  'heading.epic_dependency': 'EPIC Dependency Management',
  'heading.model_config': 'Model Configuration',

  // === Migration messages (EPIC-20) ===
  'migrate.detected': 'Migration detected: {current} -> {target}',
  'migrate.no_changes': 'No migration changes needed.',
  'migrate.changes': 'Migration changes:',
  'migrate.apply_confirm': 'Apply migration?',
  'migrate.complete': 'Migration complete.',
  'migrate.dry_run': '[DRY RUN] Migration preview:',
  'migrate.error_no_project': 'No agent system project found.',

  // === Editor messages (EPIC-21) ===
  'edit.no_config': 'No config file found. Run scaffold first.',
  'edit.current_summary': 'Current configuration:',
  'edit.choose_section': 'Choose section to edit:',
  'edit.section_agents': 'Agents',
  'edit.section_workflow': 'Workflow',
  'edit.section_skills': 'Skills',
  'edit.section_all': 'All sections',
  'edit.save_method': 'How to save?',
  'edit.save_config_only': 'Save config only',
  'edit.save_and_scaffold': 'Save and re-scaffold',
  'edit.save_cancel': 'Cancel',
  'edit.saved': 'Configuration saved.',

  // === Runner messages ===
  'runner.claude_not_found':
    'Claude Code CLI not found. Install it from https://docs.anthropic.com/en/docs/claude-code and try again.',
  'runner.claude_exit_code': 'Claude Code exited with code {code}.',
};
