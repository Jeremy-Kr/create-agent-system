# [EPIC-03] Template System + Skills Repository

## EPIC Dependency Map
```
EPIC-01 (Foundation) → None
EPIC-02 (Preset System) → EPIC-01
EPIC-03 (Template + Skills) → EPIC-01
EPIC-04 (Scaffolding Engine) → EPIC-02, EPIC-03
EPIC-05 (Validation Engine) → EPIC-04
EPIC-06 (CLI Interface) → EPIC-04, EPIC-05
EPIC-07 (Integration & Docs) → EPIC-06
```

**EPIC Dependencies**: EPIC-01 (types, constants)
**EPIC Summary**: Implement the Handlebars template renderer, write all 8 agent templates + CLAUDE.md template, and implement the skill-installer module. Also documents the external `agent-dev-skills` repo dependency.

---

## TICKET-006: Template Renderer Implementation

- **User Story**: As the scaffolding engine, I want a template renderer that takes Handlebars templates and data, and produces rendered markdown files, so that agent definitions and CLAUDE.md are dynamically generated from presets.

- **Acceptance Criteria**:
  - [ ] `src/core/template-renderer.ts` exports:
    - `renderTemplate(templatePath: string, data: Record<string, unknown>): Promise<string>` — reads a `.hbs` file and renders it with the provided data
    - `renderAgentTemplate(agentName: AgentName, data: AgentTemplateData): Promise<string>` — convenience function for agent templates
    - `renderClaudeMdTemplate(data: ClaudeMdTemplateData): Promise<string>` — convenience function for CLAUDE.md
  - [ ] Uses `handlebars` npm package for template rendering
  - [ ] Uses `import.meta.url` to resolve the `templates/` directory path (same pattern as preset-loader)
  - [ ] Supports all required Handlebars variables:
    - `{{model}}` — agent model (opus, sonnet, haiku)
    - `{{skills}}` — comma-separated skill list for agent frontmatter
    - `{{packageManager}}` — detected package manager (npm, yarn, pnpm, bun)
    - `{{projectName}}` — project name
    - `{{projectDescription}}` — project description
  - [ ] Supports all required Handlebars conditionals:
    - `{{#if visualQa}}` / `{{#unless visualQa}}` — toggles visual QA sections
    - `{{#if epicBased}}` — toggles EPIC-related sections
    - `{{#if skills}}` — toggles skills frontmatter line
    - `{{#if specPath}}` / `{{#if adrPath}}` — toggles reference paths
  - [ ] Supports Handlebars `{{#each}}` iteration:
    - `{{#each activeAgents}}` — iterates over active agents for context rules table
    - `{{#each fileOwnership}}` — iterates over file ownership entries
  - [ ] `AgentTemplateData` type is defined with at minimum:
    - `model: string`
    - `skills?: string` (comma-separated)
    - `packageManager: string`
    - `visualQa: boolean`
    - `visualQaLevel?: number`
    - `epicBased: boolean`
  - [ ] `ClaudeMdTemplateData` type is defined with at minimum:
    - `projectName: string`
    - `projectDescription?: string`
    - `packageManager: string`
    - `visualQa: boolean`
    - `visualQaLevel?: number`
    - `epicBased: boolean`
    - `specPath?: string`
    - `adrPath?: string`
    - `activeAgents: Array<{ displayName, alwaysRead, onDemand, exclude }>`
    - `fileOwnership: Array<{ path, owner }>`
  - [ ] **Error handling**: Throws a descriptive error if the template file does not exist
    - Example: `Template not found: templates/agents/unknown-agent.md.hbs`
  - [ ] **Error handling**: Throws if Handlebars compilation fails (malformed template)
  - [ ] **Edge case**: Templates with no `skills` data render the frontmatter without the `skills:` line (not an empty `skills:` line)
  - [ ] **Edge case**: `visualQa: false` correctly hides all visual QA sections and shows the alternative text in `{{#unless visualQa}}`
  - [ ] **Edge case**: Rendered output has no trailing whitespace on lines where conditionals are false (clean output)
  - [ ] Unit tests exist for:
    - Rendering a simple template with variables
    - Conditional blocks (`{{#if}}`, `{{#unless}}`)
    - Each loops
    - Missing template file error
    - Empty/undefined optional variables

- **Estimated Effort**: 1.5h
- **Dependencies**: TICKET-001 (handlebars dependency), TICKET-002 (types)
- **EPIC**: EPIC-03

---

## TICKET-007: Write 8 Agent Templates

- **User Story**: As the scaffolding engine, I want Handlebars templates for all 8 agent types, so that each agent definition file is correctly generated with the right frontmatter, system prompt, and conditional sections.

- **Acceptance Criteria**:
  - [ ] The following template files exist under `templates/agents/`:
    1. `po-pm.md.hbs`
    2. `architect.md.hbs`
    3. `cto.md.hbs`
    4. `designer.md.hbs`
    5. `test-writer.md.hbs`
    6. `frontend-dev.md.hbs`
    7. `backend-dev.md.hbs`
    8. `qa-reviewer.md.hbs`
  - [ ] Each template has valid YAML frontmatter with:
    - `name`: hardcoded agent name (e.g., `po-pm`)
    - `description`: hardcoded agent description matching the v2.3 spec
    - `tools`: `Read, Write, Edit, Grep, Glob, Bash` (all agents)
    - `model`: `{{model}}` (dynamic)
    - `{{#if skills}}skills: {{skills}}{{/if}}` (conditional, only if agent has skills)
  - [ ] Each template has a system prompt body that includes:
    - Role description
    - `## References` section pointing to CLAUDE.md and relevant skills
    - `## Core Responsibilities` section
    - Conditional visual QA section: `{{#if visualQa}}...{{/if}}`
    - Package manager references using `{{packageManager}}` (e.g., `{{packageManager}} test`)
  - [ ] `frontend-dev.md.hbs` matches the spec example (lines 431-460):
    - Visual QA conditional in Core Responsibilities
    - `{{#unless visualQa}}` alternative for non-visual-qa mode
    - Implementation Protocol with `{{packageManager}} test`
    - Visual QA step conditional in Implementation Protocol
  - [ ] `designer.md.hbs` includes references to `design-system`, `visual-qa`, and `scoring` skills
  - [ ] `test-writer.md.hbs` includes references to `tdd-workflow` and `scoring` skills
  - [ ] `qa-reviewer.md.hbs` includes QA Mode sections:
    - Standard mode (Medium/Large) with full QA checklist
    - Lite mode (Small) with abbreviated QA
    - Visual QA conditional
  - [ ] `po-pm.md.hbs` includes:
    - Test Sanity Check gate description
    - CR Process description
    - References to `scoring`, `ticket-writing`, `cr-process` skills
  - [ ] `architect.md.hbs` includes references to `scoring` and `adr-writing` skills
  - [ ] `cto.md.hbs` includes the Over-Engineering Checklist (5 items)
  - [ ] `backend-dev.md.hbs` includes Shared Types Protocol section
  - [ ] **Edge case**: Agents that are always disabled in solo-dev (architect, cto, designer) must still have valid templates -- they are used in small-team and full-team presets
  - [ ] **Edge case**: All templates produce valid markdown when rendered with any combination of `visualQa: true/false` and `epicBased: true/false`
  - [ ] Templates render cleanly without orphan blank lines from disabled conditionals

- **Estimated Effort**: 2h
- **Dependencies**: TICKET-006 (template renderer must be implemented to test rendering)
- **EPIC**: EPIC-03

---

## TICKET-008: Write CLAUDE.md Template

- **User Story**: As the scaffolding engine, I want a Handlebars template for CLAUDE.md, so that the project memory file is dynamically generated with the correct project name, active agents, workflow settings, and file ownership rules.

- **Acceptance Criteria**:
  - [ ] `templates/claude-md.hbs` exists and matches the spec example (lines 464-536)
  - [ ] Template includes these dynamic sections:
    - Project overview: `{{projectName}}`, `{{projectDescription}}`
    - Optional spec/ADR references: `{{#if specPath}}`, `{{#if adrPath}}`
    - Common rules with visual QA conditional: `{{#if visualQa}}`
    - Build & test commands using `{{packageManager}}`
    - Code style section (TypeScript strict, named exports, 2-space indent)
    - Agent context rules table using `{{#each activeAgents}}`
    - File ownership table using `{{#each fileOwnership}}`
    - Shared file rules (hardcoded defaults for shared.ts and common.ts patterns)
    - Failure modes & recovery (hardcoded scoring thresholds: <60 fail, 60-69 one chance)
    - Escalation rules (2 consecutive failures -> Human escalation)
    - EPIC dependency management: `{{#if epicBased}}`
    - Model configuration section
  - [ ] The `activeAgents` each block produces a table row with columns: Agent Name, Always Read, On Demand, Exclude
  - [ ] The `fileOwnership` each block produces a table row with columns: Path, Owner
  - [ ] `{{#if epicBased}}` wraps the entire EPIC dependency management section
  - [ ] `{{#if visualQa}}` wraps visual QA references in common rules
  - [ ] Visual QA level is displayed: `(default: Level {{visualQaLevel}})`
  - [ ] **Edge case**: When `epicBased: false` (solo-dev), the EPIC section is completely omitted
  - [ ] **Edge case**: When `visualQa: false` (solo-dev with level 0), visual QA lines in common rules are omitted
  - [ ] **Edge case**: `activeAgents` only contains enabled agents -- disabled agents should not appear in the context rules table
  - [ ] Rendered output is valid markdown with proper table formatting
  - [ ] Unit test verifies rendering with solo-dev data (fewer agents, no EPIC, visual QA level 1)
  - [ ] Unit test verifies rendering with full-team data (all agents, EPIC, visual QA level 3)

- **Estimated Effort**: 1.5h
- **Dependencies**: TICKET-006 (template renderer), TICKET-002 (types)
- **EPIC**: EPIC-03

---

## TICKET-009: Skill Installer Implementation

- **User Story**: As the scaffolding engine, I want a skill-installer module that wraps `npx @anthropic/skills add <skill-name>` to install skills into the target project, so that agent skills are installed from the official registry.

- **Acceptance Criteria**:
  - [ ] `src/core/skill-installer.ts` exports:
    - `installSkill(skillName: SkillName, targetDir: string): Promise<SkillInstallResult>` — installs a single skill
    - `installSkills(skillNames: SkillName[], targetDir: string): Promise<SkillInstallResult[]>` — installs multiple skills sequentially
    - `installFindSkills(targetDir: string): Promise<SkillInstallResult>` — always installs the `find-skills` meta-skill
  - [ ] `SkillInstallResult` type:
    ```typescript
    interface SkillInstallResult {
      skillName: string;
      success: boolean;
      error?: string;
    }
    ```
  - [ ] `installSkill` runs `npx @anthropic/skills add <skillName>` in the target directory
    - Uses `child_process.execFile` (NOT `child_process.exec`) to prevent shell injection vulnerabilities
    - Sets `cwd` to `targetDir`
    - Invokes: `execFile('npx', ['@anthropic/skills', 'add', skillName], { cwd: targetDir })`
  - [ ] `installSkills` always calls `installFindSkills` first before installing other skills
    - `find-skills` is a meta-skill that enables Claude to discover other installed skills
  - [ ] **Error handling**: Network failure during skill installation is a **warning**, not a blocking error
    - Returns `{ success: false, error: "Network error: ..." }` but does NOT throw
    - The scaffolding process continues even if skill installation fails
    - A warning message is logged to the console
  - [ ] **Error handling**: If `npx` is not available, returns a clear error message
  - [ ] **Error handling**: Individual skill failure does not prevent other skills from being attempted
    - `installSkills` processes all skills and collects results, even if some fail
  - [ ] **Edge case**: `installSkill` has a timeout (e.g., 30 seconds per skill) to prevent hanging
  - [ ] **Edge case**: If `targetDir` does not exist, throw an error before attempting installation
  - [ ] **Edge case**: Skill names are validated against `SKILL_NAMES` constant before execution (prevent arbitrary command injection)
  - [ ] Unit tests exist with mocked child_process:
    - Successful installation of a single skill
    - Successful installation of multiple skills (verifies find-skills installed first)
    - Network failure returns warning result (not throw)
    - Timeout scenario
    - Invalid skill name rejection

- **Estimated Effort**: 1.5h
- **Dependencies**: TICKET-002 (types), TICKET-003 (constants)
- **EPIC**: EPIC-03

---

## TICKET-010: Create agent-dev-skills Repository (External Dependency)

- **User Story**: As a user running `create-agent-system`, I want the 7 skills to be available in a public GitHub repository and published to the `npx @anthropic/skills` registry, so that `skill-installer` can fetch them.

- **Acceptance Criteria**:
  - [ ] **NOTE: This is an EXTERNAL DEPENDENCY -- a separate repository task, NOT part of the create-agent-system codebase.**
  - [ ] A public GitHub repository `agent-dev-skills` (or equivalent) exists
  - [ ] The repository contains 7 skill directories, each with a `SKILL.md`:
    1. `scoring/SKILL.md` — 100-point scoring protocol
    2. `visual-qa/SKILL.md` — Playwright MCP-based visual QA with level system
    3. `tdd-workflow/SKILL.md` — TDD workflow guide (Red/Gate/Green/Verify)
    4. `adr-writing/SKILL.md` — ADR writing format and amendment process
    5. `ticket-writing/SKILL.md` — User story ticket writing guide with EPIC format
    6. `design-system/SKILL.md` — Design system construction guide
    7. `cr-process/SKILL.md` — Change Request process and severity levels
  - [ ] Each `SKILL.md` has valid YAML frontmatter with `name` and `description` fields
  - [ ] Skill content matches the v2.3 spec definitions
  - [ ] Skills are published/registered so that `npx @anthropic/skills add <name>` works
  - [ ] **Fallback plan**: If the skills registry is not ready by MVP, the `skill-installer` should be able to fall back to copying bundled skill templates from `templates/skills/` within the create-agent-system package itself
  - [ ] The fallback skill templates exist under `templates/skills/` in create-agent-system:
    - `templates/skills/scoring/SKILL.md.hbs`
    - `templates/skills/visual-qa/SKILL.md.hbs`
    - `templates/skills/tdd-workflow/SKILL.md.hbs`
    - `templates/skills/adr-writing/SKILL.md.hbs`
    - `templates/skills/ticket-writing/SKILL.md.hbs`
    - `templates/skills/design-system/SKILL.md.hbs`
    - `templates/skills/cr-process/SKILL.md.hbs`

- **Estimated Effort**: 2h (external repo setup + publish)
- **Dependencies**: None (parallel work, but TICKET-009 depends on this being available)
- **EPIC**: EPIC-03

> **Implementation Note**: Until the external skills registry is live, TICKET-009's `installSkill` should implement the fallback path: copy from bundled `templates/skills/`. The `npx @anthropic/skills add` path can be enabled later via a feature flag or environment variable.
