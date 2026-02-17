# [EPIC-05] Validation Engine

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

**EPIC Dependencies**: EPIC-04 (scaffolder, to validate scaffolded output)
**EPIC Summary**: Implement the validation engine that checks the generated (or existing) agent system files for correctness, including YAML frontmatter validation, required fields, skill references, and CLAUDE.md import paths.

---

## TICKET-013: Validator Implementation

- **User Story**: As a CLI user, I want to validate my Claude Code Agent Teams setup (either freshly generated or existing) and see clear error/warning messages, so that I can fix any configuration issues before running Claude Code.

- **Acceptance Criteria**:
  - [ ] `src/core/validator.ts` exports:
    - `validate(targetDir: string): Promise<ValidationResult>` — validates the agent system at the given directory
    - `ValidationResult` type:
      ```typescript
      interface ValidationResult {
        valid: boolean;            // true if no errors (warnings are OK)
        errors: ValidationIssue[];
        warnings: ValidationIssue[];
        stats: {
          agentCount: number;
          skillCount: number;
          fileCount: number;
        };
      }

      interface ValidationIssue {
        rule: string;              // e.g., "YAML_PARSE_ERROR", "MISSING_NAME"
        file: string;              // relative path from targetDir
        message: string;           // human-readable description
      }
      ```

  **Error Rules (block execution):**

  - [ ] **E001: YAML_PARSE_ERROR** — Agent `.md` file has invalid YAML frontmatter
    - Parser: use `yaml` npm package to parse the frontmatter between `---` delimiters
    - Test: create an agent file with malformed YAML (e.g., unclosed quotes)
    - Message: `"Failed to parse YAML frontmatter in {file}: {parseError}"`

  - [ ] **E002: MISSING_NAME** — Agent file is missing the required `name` field in frontmatter
    - Test: create an agent file with frontmatter that has `description` but no `name`
    - Message: `"Missing required field 'name' in {file}"`

  - [ ] **E003: MISSING_DESCRIPTION** — Agent file is missing the required `description` field in frontmatter
    - Test: create an agent file with frontmatter that has `name` but no `description`
    - Message: `"Missing required field 'description' in {file}"`

  - [ ] **E004: UNSUPPORTED_FIELD** — Agent file uses a frontmatter field not in the supported list
    - Supported fields: `name`, `description`, `tools`, `model`, `permissionMode`, `skills`
    - Must detect fields like `context`, `model-review-override`, or any other unsupported key
    - Test: create an agent file with `context: "some value"` in frontmatter
    - Message: `"Unsupported frontmatter field '{fieldName}' in {file}. Supported fields: name, description, tools, model, permissionMode, skills"`

  - [ ] **E005: INVALID_MODEL** — The `model` field contains an invalid value
    - Valid values: `opus`, `sonnet`, `haiku`, `inherit`
    - Test: create an agent file with `model: gpt-4`
    - Message: `"Invalid model value '{value}' in {file}. Valid values: opus, sonnet, haiku, inherit"`

  - [ ] **E006: INVALID_SKILL_REFERENCE** — Agent's `skills` field references a skill that has no corresponding directory
    - Check: for each skill in the comma-separated `skills` field, verify that `.claude/skills/{skillName}/SKILL.md` exists
    - Test: create an agent file with `skills: scoring, nonexistent-skill`
    - Message: `"Skill '{skillName}' referenced in {file} but .claude/skills/{skillName}/SKILL.md does not exist"`

  - [ ] **E007: INVALID_IMPORT_PATH** — CLAUDE.md uses `@path/to/file` import that points to a nonexistent file
    - Parse CLAUDE.md for `@path/to/file` patterns (regex: `@([^\s,)]+)`)
    - Verify each referenced file exists relative to `targetDir`
    - Exclude obvious non-path `@` usages (e.g., `@types/node` in code blocks)
    - Test: create a CLAUDE.md with `@docs/nonexistent.md`
    - Message: `"Import path '@{path}' in CLAUDE.md references nonexistent file"`

  **Warning Rules (non-blocking, improvement suggestions):**

  - [ ] **W001: SHORT_DESCRIPTION** — Agent description is too short (< 20 characters)
    - Test: create an agent file with `description: "test"`
    - Message: `"Description in {file} is very short ({length} chars). Consider adding more detail (recommended: 20+ chars)"`

  - [ ] **W002: LONG_DESCRIPTION** — Agent description is too long (> 1024 characters)
    - Test: create an agent file with a 1100-character description
    - Message: `"Description in {file} is very long ({length} chars). Consider shortening (recommended: under 1024 chars)"`

  - [ ] **W003: MISSING_TOOLS** — Agent file has no `tools` field
    - This means all tools are inherited (which may be intentional)
    - Test: create an agent file without a `tools` field
    - Message: `"No 'tools' field in {file}. All tools will be inherited. If intentional, this is fine."`

  - [ ] **W004: DUPLICATE_CONTENT** — Agent definition contains content that should only be in CLAUDE.md
    - Detect keywords: "File Ownership", "Context Rules", "Shared File" in agent body (not frontmatter)
    - Test: create an agent file with "## File Ownership" in the body
    - Message: `"Agent definition {file} appears to contain '{section}' which should be in CLAUDE.md only (SSOT principle)"`

  - [ ] **W005: DISABLED_AGENT_FILE_EXISTS** — An agent file exists for an agent that is disabled in the preset
    - Requires knowing which preset was used (can be inferred from settings or passed as parameter)
    - Test: have a `designer.md` file when the preset has `designer: { enabled: false }`
    - Message: `"Agent file {file} exists but agent is disabled in the current preset. Consider removing to avoid confusion."`
    - NOTE: This warning only applies when preset information is available (e.g., during post-scaffold validation). When running `validate` as a standalone command without preset context, this check is skipped.

  **Implementation details:**

  - [ ] The validator scans:
    1. All `.md` files in `.claude/agents/` directory
    2. `CLAUDE.md` in the project root
    3. All `SKILL.md` files in `.claude/skills/*/` directories
  - [ ] `valid` is `true` only when `errors.length === 0`
  - [ ] `stats` counts are accurate:
    - `agentCount`: number of `.md` files in `.claude/agents/`
    - `skillCount`: number of directories in `.claude/skills/` that contain `SKILL.md`
    - `fileCount`: total files scanned (agents + skills + CLAUDE.md + settings.json)

  - [ ] **Error handling**: If `.claude/agents/` directory does not exist, return an error (not crash):
    - Message: `"Agent directory .claude/agents/ not found. Run 'create-agent-system' to scaffold."`

  - [ ] **Error handling**: If `CLAUDE.md` does not exist, return an error:
    - Message: `"CLAUDE.md not found in project root. Run 'create-agent-system' to scaffold."`

  - [ ] **Edge case**: Empty `.claude/agents/` directory produces a warning, not an error
  - [ ] **Edge case**: YAML frontmatter with extra whitespace or trailing newlines is parsed correctly
  - [ ] **Edge case**: Agent files without frontmatter (no `---` delimiters) trigger E001
  - [ ] **Edge case**: `@import` validation in CLAUDE.md ignores paths inside code blocks (triple backtick blocks)
  - [ ] **Edge case**: Multiple errors/warnings per file are all reported (not just the first one)

  - [ ] Unit tests exist for every error rule (E001-E007) with at least 2 test cases each (positive + negative)
  - [ ] Unit tests exist for every warning rule (W001-W005) with at least 2 test cases each
  - [ ] Unit test for a fully valid agent system (returns `valid: true`, no errors, no warnings)
  - [ ] Unit test for a system with mixed errors and warnings (both are reported)

- **Estimated Effort**: 2h
- **Dependencies**: TICKET-002 (types), TICKET-003 (constants for supported fields/models)
- **EPIC**: EPIC-05
