# [EPIC-07] Integration Testing & Documentation

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

**EPIC Dependencies**: EPIC-06 (complete CLI)
**EPIC Summary**: Write integration tests that exercise the full scaffolding pipeline for all 3 presets, and create the README.md and LICENSE files for the open-source release.

---

## TICKET-018: Integration Tests

- **User Story**: As a project maintainer, I want integration tests that exercise the complete scaffolding pipeline end-to-end for each preset, so that I can confidently ship releases knowing the CLI works correctly for all supported configurations.

- **Acceptance Criteria**:

  **Test infrastructure:**
  - [ ] Integration tests are in `tests/integration/` directory (separate from unit tests)
  - [ ] Each test uses a temporary directory (`tmp`) created before and cleaned up after each test
  - [ ] Tests do NOT make network calls (skill-installer is mocked at the child_process level)
  - [ ] Tests use the real scaffolder, template-renderer, and validator (not mocked)

  **Preset: solo-dev:**
  - [ ] Test: `scaffold with solo-dev preset produces correct files`
    - Scaffolds with `solo-dev` preset into a temp directory
    - Verifies exactly these files are created:
      - `CLAUDE.md`
      - `.claude/agents/po-pm.md`
      - `.claude/agents/test-writer.md`
      - `.claude/agents/frontend-dev.md`
      - `.claude/agents/backend-dev.md`
      - `.claude/agents/qa-reviewer.md`
      - `.claude/settings.json`
    - Verifies these files are NOT created:
      - `.claude/agents/architect.md`
      - `.claude/agents/cto.md`
      - `.claude/agents/designer.md`
  - [ ] Test: `solo-dev agents have correct frontmatter`
    - Parses YAML frontmatter of each generated agent file
    - Verifies `model: opus` in all agents
    - Verifies `po-pm.md` has `skills: scoring, ticket-writing, cr-process`
    - Verifies `test-writer.md` has `skills: tdd-workflow, scoring`
    - Verifies `frontend-dev.md` has `skills: scoring` (visual-qa excluded because not in preset)
    - Verifies `backend-dev.md` has `skills: scoring`
    - Verifies `qa-reviewer.md` has `skills: scoring` (visual-qa excluded)
  - [ ] Test: `solo-dev CLAUDE.md does not contain EPIC section`
    - Reads generated `CLAUDE.md`
    - Verifies it does NOT contain "EPIC" dependency management section
    - Verifies it DOES contain failure modes and recovery section
  - [ ] Test: `solo-dev validation passes`
    - Runs validator on the scaffolded output
    - Verifies `valid: true`, `errors: []`
    - Verifies `stats.agentCount === 5`

  **Preset: small-team:**
  - [ ] Test: `scaffold with small-team preset produces all 8 agent files`
    - Verifies all 8 agent files are created
    - Verifies `.claude/settings.json` has `agentTeams.enabled: true`
  - [ ] Test: `small-team agents have correct skills (full intersection)`
    - `designer.md` has `skills: design-system, visual-qa, scoring`
    - `frontend-dev.md` has `skills: visual-qa, scoring`
    - `qa-reviewer.md` has `skills: visual-qa, scoring`
  - [ ] Test: `small-team CLAUDE.md contains EPIC section`
    - EPIC dependency management section is present
    - Visual QA reference with "Level 2" is present
    - All 8 agents appear in the context rules table
  - [ ] Test: `small-team validation passes`
    - `valid: true`, `stats.agentCount === 8`

  **Preset: full-team:**
  - [ ] Test: `scaffold with full-team preset produces same structure as small-team`
    - Same 8 agent files, same skills
  - [ ] Test: `full-team CLAUDE.md has visual QA Level 3`
    - CLAUDE.md contains "Level 3" in the visual QA reference
  - [ ] Test: `full-team validation passes`
    - `valid: true`, `stats.agentCount === 8`

  **Cross-cutting integration tests:**
  - [ ] Test: `dry-run mode does not create any files`
    - Scaffold with `dryRun: true`
    - Verify temp directory is empty after scaffolding
    - Verify `ScaffoldResult.files` array is not empty (records what would be done)
  - [ ] Test: `existing files are not overwritten by default`
    - Pre-create a `CLAUDE.md` with custom content in the temp directory
    - Scaffold without `overwrite: true`
    - Verify `CLAUDE.md` still has the original custom content
    - Verify `ScaffoldResult.files` shows `CLAUDE.md` as `skipped`
  - [ ] Test: `existing files are overwritten when overwrite is true`
    - Pre-create a `CLAUDE.md` in the temp directory
    - Scaffold with `overwrite: true`
    - Verify `CLAUDE.md` has been replaced with the generated content
  - [ ] Test: `settings.json merge with existing config`
    - Pre-create `.claude/settings.json` with `{ "permissions": { "allow": ["Read"] } }`
    - Scaffold
    - Verify settings.json has both `permissions.allow` and `agentTeams.enabled`
  - [ ] Test: `validate command detects invalid setup`
    - Create a `.claude/agents/bad-agent.md` with invalid frontmatter
    - Run validator
    - Verify `valid: false` and errors include YAML parse error
  - [ ] Test: `validate command detects missing skill reference`
    - Create an agent file with `skills: nonexistent-skill`
    - Run validator
    - Verify error E006 is reported

  **Performance:**
  - [ ] All integration tests complete within 30 seconds total
  - [ ] No test depends on external network calls

- **Estimated Effort**: 2h
- **Dependencies**: TICKET-017 (full flow must be complete)
- **EPIC**: EPIC-07

---

## TICKET-019: README.md and LICENSE

- **User Story**: As a potential user discovering create-agent-system on npm or GitHub, I want clear documentation explaining what the tool does, how to install it, and how to use it, so that I can quickly evaluate and adopt it.

- **Acceptance Criteria**:

  **README.md:**
  - [ ] `README.md` exists in the project root
  - [ ] Contains the following sections (in order):
    1. **Title + badges**: Package name, npm version badge, license badge
    2. **One-line description**: "Scaffold Claude Code Agent Teams into your project"
    3. **Features**: Bullet list of key features
       - 3 built-in presets (Solo Dev, Small Team, Full Team)
       - 8 agent types (PO/PM, Architect, CTO, Designer, Test Writer, Frontend Dev, Backend Dev, QA Reviewer)
       - 7 skill packages (scoring, visual-qa, tdd-workflow, adr-writing, ticket-writing, design-system, cr-process)
       - Interactive and non-interactive modes
       - Built-in validation
       - Claude Code integration (auto-launch with Agent Teams)
    4. **Quick Start**: Minimal usage example
       ```bash
       npx create-agent-system
       ```
    5. **Presets**: Table comparing the 3 presets
       - Columns: Preset, Scale, Agents, Skills, QA Mode, Visual QA Level, EPIC-based
       - solo-dev: small, 5 agents, 4 skills, lite, Level 1, No
       - small-team: medium, 8 agents, 7 skills, standard, Level 2, Yes
       - full-team: large, 8 agents, 7 skills, standard, Level 3, Yes
    6. **Usage**: Detailed CLI usage
       - Interactive mode (default)
       - Non-interactive mode: `npx create-agent-system --preset solo-dev --project-name my-app --yes`
       - Dry run: `--dry-run`
       - Validate: `npx create-agent-system validate`
       - Target directory: `--target ./path/to/project`
    7. **Generated Files**: Directory structure of what gets created
       ```
       your-project/
       ├── CLAUDE.md
       └── .claude/
           ├── agents/
           │   ├── po-pm.md
           │   ├── ...
           │   └── qa-reviewer.md
           ├── skills/
           │   ├── scoring/SKILL.md
           │   └── ...
           └── settings.json
       ```
    8. **CLI Reference**: Full list of all flags and subcommands with descriptions
    9. **Requirements**: Node.js 20+, pnpm (recommended)
    10. **Contributing**: Link to CONTRIBUTING.md
    11. **License**: MIT

  - [ ] README is written in English (open-source project)
  - [ ] All code examples are tested (they match actual CLI behavior)
  - [ ] No broken links

  **LICENSE:**
  - [ ] `LICENSE` file exists in the project root
  - [ ] Contains the MIT license text
  - [ ] Copyright year: 2025 (project inception year)
  - [ ] Copyright holder: as specified by project owner

  - [ ] **Edge case**: README renders correctly on both GitHub and npm
  - [ ] **Edge case**: Badge URLs use shields.io or equivalent reliable CDN

- **Estimated Effort**: 1.5h
- **Dependencies**: TICKET-017 (CLI must be finalized to document accurately)
- **EPIC**: EPIC-07
