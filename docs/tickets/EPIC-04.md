# [EPIC-04] Scaffolding Engine

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

**EPIC Dependencies**: EPIC-02 (preset-loader), EPIC-03 (template-renderer, skill-installer)
**EPIC Summary**: Implement the core scaffolding engine that orchestrates the entire file generation process -- loading presets, computing per-agent skills, rendering templates, installing skills, generating settings.json, and handling file conflicts.

---

## TICKET-011: Scaffolder Core Logic

- **User Story**: As a CLI user, I want the scaffolding engine to generate all required files in my project directory based on my selected preset, so that my Claude Code Agent Teams environment is fully configured.

- **Acceptance Criteria**:
  - [ ] `src/core/scaffolder.ts` exports:
    - `scaffold(config: ScaffoldConfig): Promise<ScaffoldResult>` — main entry point
    - `ScaffoldConfig` type:
      ```typescript
      interface ScaffoldConfig {
        preset: Preset;
        projectName: string;
        targetDir: string;         // absolute path to project root
        techStack: TechStackInfo;
        dryRun?: boolean;          // if true, only print what would be done
        overwrite?: boolean;       // if true, overwrite existing files
      }
      ```
    - `ScaffoldResult` type:
      ```typescript
      interface ScaffoldResult {
        files: Array<{ path: string; action: 'created' | 'skipped' | 'overwritten' }>;
        skills: SkillInstallResult[];
        warnings: string[];
      }
      ```
  - [ ] The `scaffold` function performs these steps in order:
    1. Create `.claude/agents/` directory
    2. Create `.claude/skills/` directory
    3. For each **enabled** agent in the preset:
       a. Compute the agent's skills using `computeAgentSkills()` (TICKET-012)
       b. Compose template data (model, skills string, packageManager, visualQa, epicBased)
       c. Render the agent template
       d. Write the rendered file to `.claude/agents/{agentName}.md`
    4. Compose CLAUDE.md template data (TICKET-012)
    5. Render and write `CLAUDE.md`
    6. Install skills via skill-installer (for all preset skills)
    7. Generate and write `.claude/settings.json` with Agent Teams enabled:
       ```json
       {
         "permissions": {
           "allow": [],
           "deny": []
         },
         "agentTeams": {
           "enabled": true
         }
       }
       ```
  - [ ] **Disabled agents are NOT generated** -- only agents with `enabled: true` in the preset have their template files written
  - [ ] File writing uses `writeFileSafe` from utils:
    - If a file already exists and `overwrite` is false, it is skipped (not overwritten)
    - The `ScaffoldResult.files` array records the action taken for each file
  - [ ] **`--dry-run` mode**: When `dryRun: true`:
    - No files are written to disk
    - No skills are installed
    - Returns a `ScaffoldResult` with all files marked as what `would` happen
    - Logs the list of files that would be created and skills that would be installed
  - [ ] **Error handling**: If directory creation fails (permissions), throw with a descriptive error
  - [ ] **Error handling**: Skill installation failures are collected as warnings (non-blocking)
  - [ ] **Edge case**: If `.claude/` directory already exists, do not error -- create subdirectories inside it
  - [ ] **Edge case**: If `CLAUDE.md` already exists and `overwrite` is false, skip it and add to warnings
  - [ ] **Edge case**: If `.claude/settings.json` already exists, merge `agentTeams.enabled: true` into existing config (do not overwrite other settings)
  - [ ] **Edge case**: `solo-dev` preset generates only 5 agent files (po-pm, test-writer, frontend-dev, backend-dev, qa-reviewer) and 4 skill directories
  - [ ] **Edge case**: `full-team` preset generates all 8 agent files and 7 skill directories
  - [ ] Unit tests exist for:
    - Scaffolding with solo-dev preset (verify correct file count)
    - Scaffolding with full-team preset (verify all files generated)
    - Dry-run mode (verify no files written)
    - Existing file skip behavior
    - Settings.json merge behavior

- **Estimated Effort**: 2h
- **Dependencies**: TICKET-005 (preset-loader), TICKET-006 (template-renderer), TICKET-009 (skill-installer), TICKET-003 (utils)
- **EPIC**: EPIC-04

---

## TICKET-012: Per-Agent Skill Computation + CLAUDE.md Data Composition

- **User Story**: As the scaffolder, I want to compute which skills each agent should have and compose the full CLAUDE.md template data, so that agent definitions and the project memory file are generated with accurate, preset-specific content.

- **Acceptance Criteria**:
  - [ ] `src/core/scaffolder.ts` (or a helper module) exports:
    - `computeAgentSkills(agentName: AgentName, presetSkills: SkillName[]): SkillName[]`
    - `composeAgentTemplateData(agentName: AgentName, preset: Preset, techStack: TechStackInfo): AgentTemplateData`
    - `composeClaudeMdData(preset: Preset, projectName: string, techStack: TechStackInfo): ClaudeMdTemplateData`
  - [ ] `computeAgentSkills` implements the intersection logic:
    - Formula: `AGENT_DEFAULT_SKILLS[agentName] intersection preset.skills`
    - Uses the `AGENT_DEFAULT_SKILLS` mapping from `src/utils/constants.ts`
    - Example for `designer` in `solo-dev`: `['design-system', 'visual-qa', 'scoring'] intersection ['scoring', 'tdd-workflow', 'ticket-writing', 'cr-process']` = `['scoring']`
    - Example for `designer` in `full-team`: `['design-system', 'visual-qa', 'scoring'] intersection [all 7]` = `['design-system', 'visual-qa', 'scoring']`
  - [ ] `AGENT_DEFAULT_SKILLS` must match the v2.3 agent definitions:
    - `po-pm`: `['scoring', 'ticket-writing', 'cr-process']`
    - `architect`: `['scoring', 'adr-writing']`
    - `cto`: `['scoring']`
    - `designer`: `['design-system', 'visual-qa', 'scoring']`
    - `test-writer`: `['tdd-workflow', 'scoring']`
    - `frontend-dev`: `['visual-qa', 'scoring']`
    - `backend-dev`: `['scoring']`
    - `qa-reviewer`: `['visual-qa', 'scoring']`
  - [ ] `composeAgentTemplateData` returns:
    - `model`: from `preset.agents[agentName].model`
    - `skills`: comma-separated string of computed skills (e.g., `"scoring, visual-qa"`) or `undefined` if empty
    - `packageManager`: from `techStack.packageManager` or `'pnpm'` as default
    - `visualQa`: `true` if `preset.workflow.visualQaLevel > 0` AND `'visual-qa'` is in the computed skills
    - `visualQaLevel`: `preset.workflow.visualQaLevel`
    - `epicBased`: `preset.workflow.epicBased`
  - [ ] `composeClaudeMdData` returns:
    - `projectName`: as provided
    - `projectDescription`: from config or a default
    - `packageManager`: from `techStack.packageManager` or `'pnpm'`
    - `visualQa`: `true` if `preset.workflow.visualQaLevel > 0`
    - `visualQaLevel`: `preset.workflow.visualQaLevel`
    - `epicBased`: `preset.workflow.epicBased`
    - `activeAgents`: array of enabled agents with their context rules (displayName, alwaysRead, onDemand, exclude) -- derived from a hardcoded context rules mapping
    - `fileOwnership`: array of file ownership entries -- derived from a hardcoded ownership mapping
  - [ ] **Edge case**: An agent with no computed skills (empty intersection) should have `skills: undefined` in template data, resulting in no `skills:` line in the frontmatter
  - [ ] **Edge case**: `visualQa` is `false` for frontend-dev in solo-dev because `visual-qa` is not in the preset's skill list, even though `visualQaLevel` is 1
  - [ ] **Edge case**: `computeAgentSkills` for a disabled agent still works correctly (though it won't be called in normal flow)
  - [ ] Unit tests exist for:
    - `computeAgentSkills` with solo-dev (partial intersection)
    - `computeAgentSkills` with full-team (full intersection)
    - `computeAgentSkills` with an agent whose default skills are all excluded (empty result)
    - `composeAgentTemplateData` produces correct visualQa flag
    - `composeClaudeMdData` produces correct activeAgents (only enabled agents)

- **Estimated Effort**: 1.5h
- **Dependencies**: TICKET-002 (types), TICKET-003 (constants), TICKET-006 (template data types)
- **EPIC**: EPIC-04
