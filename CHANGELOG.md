# Changelog

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.

## [0.2.0] - 2026-02-24

Context Engineering & Philosophy Integration release.

### Added

- **context-engineering skill**: New skill covering context budget, Progressive Disclosure (L1→L2→L3), compression strategies, inter-agent communication
- **Progressive Disclosure**: 3-layer context loading model (L1 Metadata → L2 Module → L3 Data) in CLAUDE.md and context-engineering skill
- **Extended Thinking**: architect (`ultrathink`) and cto (`think hard`) agent templates now include extended thinking guidance
- **Common Rules**: 6 new rules in CLAUDE.md template — simplicity first, precise edits, explore→plan→code→commit workflow, security, parallel processing, SSOT principle
- **Context layer scaffolding**: `scaffold()` now creates `.claude/context/`, `mailbox/`, `logs/`, `scratch-pad.md`, `decisions.jsonl`
- **Compression techniques**: Anchored summarization, probe-based evaluation, tokens-per-task budgeting

### Changed

- **CLAUDE.md Context Engineering section**: Simplified from 12 lines to 9 lines — detailed content delegated to context-engineering skill (Tool Consolidation principle)
- **Hooks**: All Stop hooks now include code simplification reminder; Write|Edit hooks include `.env`/secret detection; medium Task hook prevents Telephone Game
- **Skill templates**: All 8 skills enhanced with "When to Activate", "Guidelines", "Integration" sections per Agent Skills spec
- **sync-spec skill**: Strengthened SSOT principle — "official docs win, always"
- **Presets**: All 3 presets now include context-engineering skill

## [0.1.0] - 2026-02-19

Initial release.

### Added

- **CLI core**: Commander-based argument parser + Clack interactive prompts
- **Presets**: 3 YAML presets — solo-dev, small-team, full-team
- **Scaffolding engine**: Handlebars-based template rendering for agents, skills, and CLAUDE.md
- **Agent templates**: 8 types — po-pm, architect, cto, designer, test-writer, frontend-dev, backend-dev, qa-reviewer
- **Skill templates**: 8 packages — scoring, visual-qa, tdd-workflow, adr-writing, ticket-writing, design-system, cr-process, sync-spec
- **Validation engine**: YAML frontmatter parsing, required/supported fields, skill references, @import path checks
- **Claude Code integration**: `--permission-mode plan` + automatic Agent Teams env var setup
- **Conflict handling**: `--overwrite` flag for existing projects
- **Custom preset**: Interactive agent/workflow/skill selection
- **Config file**: `agent-system.config.yaml` support
- **Preset diff**: Side-by-side preset comparison
- **Community registry**: Agent/skill search and install (`add`, `search`, `list` commands)
- **list command**: `--installed` for local agents/skills, `--registry` for registry listing
- **edit subcommand**: Edit existing agent system configuration
- **Migration tool**: Settings upgrade between versions
- **i18n**: Korean/English support (`--lang` option, auto-detection)
- **Claude Code plugin wrapper**: Plugin package structure

### Changed

- **DocSpec SSOT architecture**: Hardcoded constants.ts → derived from doc-spec.ts
- **sync-spec**: Changed from CLI subcommand to Claude Code skill
- **Agent templates**: Added `<example>` blocks to descriptions (official Claude format)

### Fixed

- **Bundle path resolution**: Fixed `import.meta.url` relative paths breaking in `dist/` bundles
- **Handlebars noEscape**: Fixed HTML tags being escaped in templates
