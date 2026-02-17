# [EPIC-06] CLI Interface

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

**EPIC Dependencies**: EPIC-04 (scaffolder), EPIC-05 (validator)
**EPIC Summary**: Build the CLI layer that connects all core modules -- argument parsing with commander, interactive prompts with clack, Claude Code execution integration, and the entry point that wires everything together.

---

## TICKET-014: CLI Argument Parsing (Commander)

- **User Story**: As a CLI user, I want to pass command-line arguments to `create-agent-system` for non-interactive usage and CI/CD pipelines, so that I can automate the scaffolding process.

- **Acceptance Criteria**:
  - [ ] `src/cli/args.ts` exports:
    - `parseArgs(argv?: string[]): ParsedArgs` — parses CLI arguments using commander
    - `ParsedArgs` type:
      ```typescript
      interface ParsedArgs {
        command: 'scaffold' | 'validate';  // default: 'scaffold'
        preset?: PresetName;
        projectName?: string;
        target?: string;          // --target, default: process.cwd()
        noRun?: boolean;          // --no-run, skip Claude Code launch
        yes?: boolean;            // --yes, skip all prompts (non-interactive)
        dryRun?: boolean;         // --dry-run, print what would be done
      }
      ```
  - [ ] Commander program configuration:
    - Program name: `create-agent-system`
    - Version: read from `package.json`
    - Description: `"Scaffold Claude Code Agent Teams into your project"`
  - [ ] Main command (default, no subcommand = scaffold):
    - `--preset <name>` / `-p <name>` — preset name (solo-dev, small-team, full-team)
    - `--project-name <name>` / `-n <name>` — project name
    - `--target <path>` / `-t <path>` — target directory (default: `process.cwd()`)
    - `--no-run` — skip Claude Code launch after scaffolding
    - `--yes` / `-y` — skip interactive prompts, use defaults
    - `--dry-run` — only print what would be done, don't create files
  - [ ] `validate` subcommand:
    - `create-agent-system validate [target]`
    - Optional positional argument: target directory (default: `process.cwd()`)
    - No other options needed
  - [ ] `--preset` validation:
    - If provided, must be one of: `solo-dev`, `small-team`, `full-team`
    - If invalid, commander exits with error message listing valid options
  - [ ] `--target` validation:
    - If provided, must be an existing directory
    - If not an existing directory, exit with error: `"Target directory does not exist: {path}"`
  - [ ] `--yes` mode requires `--preset` to be provided (otherwise there's no default preset):
    - If `--yes` without `--preset`, exit with error: `"--yes requires --preset to be specified"`
  - [ ] **Error handling**: Unknown flags produce a clear error message (commander default behavior)
  - [ ] **Error handling**: `--help` displays all options with descriptions
  - [ ] **Edge case**: Running with no arguments enters interactive mode (all ParsedArgs fields are undefined except `command: 'scaffold'`)
  - [ ] **Edge case**: `create-agent-system validate` sets `command: 'validate'`
  - [ ] **Edge case**: `--target ./relative/path` is resolved to an absolute path
  - [ ] Unit tests exist for:
    - Parsing `--preset solo-dev --project-name my-app --yes`
    - Parsing `validate` subcommand
    - Parsing `--dry-run` flag
    - Invalid `--preset` value rejection
    - `--yes` without `--preset` rejection
    - Default values when no arguments are provided
    - `--target` resolution to absolute path

- **Estimated Effort**: 1h
- **Dependencies**: TICKET-001 (commander dependency), TICKET-002 (PresetName type)
- **EPIC**: EPIC-06

---

## TICKET-015: Interactive Prompts (Clack)

- **User Story**: As a CLI user running create-agent-system interactively, I want a beautiful and intuitive prompt flow that guides me through preset selection, project naming, and tech stack confirmation, so that I can quickly set up my agent system.

- **Acceptance Criteria**:
  - [ ] `src/cli/prompts.ts` exports:
    - `runInteractivePrompts(partialArgs: Partial<ParsedArgs>, detectedTechStack: TechStackInfo): Promise<PromptResult>`
    - `PromptResult` type:
      ```typescript
      interface PromptResult {
        preset: PresetName;
        projectName: string;
        techStack: TechStackInfo;
        shouldRunClaude: boolean;
      }
      ```
  - [ ] Uses `@clack/prompts` for all interactive prompts
  - [ ] Prompt flow (in order):
    1. **Intro**: `clack.intro("create-agent-system v0.1.0")`
    2. **Preset selection** (if not provided via `--preset`):
       - `clack.select()` with options:
         - `solo-dev`: "Solo Dev (1-person, abbreviated workflow)"
         - `small-team`: "Small Team (standard workflow, EPIC-based)"
         - `full-team`: "Full Team (full process, Strict QA)"
       - Selected value maps to `PresetName`
    3. **Project name** (if not provided via `--project-name`):
       - `clack.text()` with placeholder derived from the current directory name
       - Validation: non-empty, valid npm package name characters (lowercase, hyphens, no spaces)
    4. **Tech stack confirmation** (if tech stack was auto-detected):
       - Display detected stack (e.g., "Next.js 15 + TypeScript + Tailwind CSS + pnpm")
       - `clack.confirm()` — "Is this correct?"
       - If rejected, allow manual override (future: for MVP, just use detected values)
    5. **Claude Code launch** (if `--no-run` was not passed):
       - `clack.confirm()` — "Start Claude Code in plan mode?"
       - Default: yes
    6. **Outro**: `clack.outro("Done! Happy coding.")`
  - [ ] Prompts are SKIPPED for any value already provided via CLI arguments:
    - If `--preset solo-dev` is passed, skip the preset selection prompt
    - If `--project-name my-app` is passed, skip the project name prompt
    - If `--no-run` is passed, skip the Claude Code launch prompt (assume no)
    - If `--yes` is passed, skip ALL prompts (use defaults/provided values)
  - [ ] Progress spinner during scaffolding:
    - `clack.spinner()` with message "Generating files..."
    - Update spinner message for each file created
    - Stop spinner with success/failure
  - [ ] File creation feedback:
    - After scaffolding, display list of created files with checkmarks
    - Display list of skipped files (if any) with warning icon
    - Display skill installation results
  - [ ] Validation result display (used by both scaffold and validate commands):
    - Show each passed check with checkmark
    - Show errors with X icon
    - Show warnings with warning icon
    - Show summary: `"{fileCount} files, {agentCount} agents, {skillCount} skills"`
  - [ ] **Error handling**: If user cancels a prompt (Ctrl+C), exit gracefully with `clack.cancel()` and process.exit(0)
  - [ ] **Error handling**: Invalid project name input shows inline validation error, re-prompts
  - [ ] **Edge case**: If no tech stack is detected (empty directory), skip tech stack confirmation
  - [ ] **Edge case**: If `--yes` is used, all prompts are skipped and defaults are used:
    - `shouldRunClaude: false` (safe default in non-interactive mode)
    - `projectName`: derived from directory name or `--project-name`
  - [ ] **Edge case**: Terminal width < 80 characters still renders prompts correctly
  - [ ] Unit tests exist for:
    - Prompt skipping logic (when CLI args are provided)
    - Project name validation function (valid/invalid names)
    - PromptResult composition from mixed CLI args + prompt answers

- **Estimated Effort**: 2h
- **Dependencies**: TICKET-014 (ParsedArgs type), TICKET-003 (detect utilities)
- **EPIC**: EPIC-06

---

## TICKET-016: Claude Code Launch Integration

- **User Story**: As a CLI user, I want create-agent-system to optionally launch Claude Code with Agent Teams enabled in plan mode after scaffolding, so that I can immediately start working with my agent system.

- **Acceptance Criteria**:
  - [ ] `src/cli/runner.ts` exports:
    - `runClaudeCode(targetDir: string): Promise<void>` — launches Claude Code
    - `isClaudeCodeInstalled(): Promise<boolean>` — checks if `claude` CLI is available
  - [ ] `runClaudeCode` launches the following command:
    ```
    claude --permission-mode plan
    ```
    with environment variable `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
  - [ ] Implementation:
    - Uses `child_process.spawn` with `{ stdio: 'inherit' }` to pass through Claude Code's interactive I/O
    - Sets `cwd` to `targetDir`
    - Sets `env` with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` merged with `process.env`
    - `--permission-mode plan` starts Claude in plan mode
  - [ ] `isClaudeCodeInstalled` checks if the `claude` command is available:
    - Tries to run `claude --version` using `execFile`
    - Returns `true` if exit code 0, `false` otherwise
  - [ ] **Error handling**: If `claude` is not installed, display a helpful message:
    - `"Claude Code CLI not found. Install it from https://docs.anthropic.com/en/docs/claude-code and try again."`
    - Do NOT throw -- the scaffolding result is still valid even without Claude Code
  - [ ] **Error handling**: If Claude Code exits with non-zero code, display the exit code but do not throw
  - [ ] **Error handling**: If the user terminates Claude Code (Ctrl+C), handle gracefully (no unhandled error)
  - [ ] **Edge case**: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` environment variable is set even if other env vars exist (merge, not replace)
  - [ ] **Edge case**: Works on macOS, Linux, and Windows (use appropriate spawn options)
  - [ ] Unit tests exist (with mocked child_process):
    - Successful launch with correct env vars and args
    - `claude` not installed detection
    - Graceful handling of non-zero exit code

- **Estimated Effort**: 1h
- **Dependencies**: TICKET-001 (project setup)
- **EPIC**: EPIC-06

---

## TICKET-017: Entry Point Full Flow Connection

- **User Story**: As a CLI user, I want a single entry point that wires together argument parsing, interactive prompts, scaffolding, validation, and Claude Code launch into a seamless end-to-end flow, so that running `npx create-agent-system` just works.

- **Acceptance Criteria**:
  - [ ] `src/index.ts` implements the main CLI entry point with a `#!/usr/bin/env node` shebang
  - [ ] The entry point orchestrates the full flow:
    ```
    1. Parse CLI arguments (args.ts)
    2. Branch by command:
       a. "scaffold" flow:
          i.   Detect target directory (--target or cwd)
          ii.  Detect tech stack (detect.ts)
          iii. Run interactive prompts for missing values (prompts.ts)
          iv.  Load preset (preset-loader.ts)
          v.   Run scaffolder (scaffolder.ts)
          vi.  Run validator on generated output (validator.ts)
          vii. Display results (prompts.ts display helpers)
          viii. Optionally launch Claude Code (runner.ts)
       b. "validate" flow:
          i.   Detect target directory
          ii.  Run validator (validator.ts)
          iii. Display results
          iv.  Exit with code 1 if errors found, 0 otherwise
    ```
  - [ ] **Scaffold flow details**:
    - After scaffolding, automatically runs validation
    - Displays file creation summary, validation results, and skill install status
    - If `--yes` flag, entire flow is non-interactive
    - If `--dry-run`, shows what would be created without actually creating files
  - [ ] **Validate flow details**:
    - Runs standalone validation on an existing project
    - Displays all errors and warnings
    - `process.exit(1)` if any errors, `process.exit(0)` if only warnings or clean
  - [ ] **Non-interactive mode** (`--yes`):
    - Requires `--preset` (validated in args.ts)
    - `projectName` defaults to directory name if not provided
    - `shouldRunClaude` defaults to `false`
    - No prompts are displayed
    - Still shows output (file list, validation results)
  - [ ] **Dry-run mode** (`--dry-run`):
    - Compatible with both interactive and non-interactive modes
    - Shows "[DRY RUN]" prefix in output
    - Lists files that would be created
    - Lists skills that would be installed
    - Does NOT write any files or install skills
    - Still runs validation on existing files (if any)
  - [ ] **Error handling**: Top-level try-catch wraps the entire flow
    - Unexpected errors are caught and displayed with `clack.cancel()` or similar
    - Stack traces are only shown in verbose/debug mode (not in production)
    - Process exits with code 1 on unhandled errors
  - [ ] **Error handling**: Graceful Ctrl+C handling at any point in the flow
  - [ ] **Edge case**: Running in a directory with no package.json (fresh project) works -- tech stack detection returns defaults
  - [ ] **Edge case**: Running in a directory that already has `.claude/` shows existing file skip messages
  - [ ] **Edge case**: The `--target` flag works with both absolute and relative paths
  - [ ] **Edge case**: `npx create-agent-system` (no args) enters full interactive mode
  - [ ] **Edge case**: `npx create-agent-system --preset solo-dev --project-name my-app --yes --no-run` runs completely non-interactively
  - [ ] Integration-level test (can be in EPIC-07) verifying the full flow from entry point to file output
  - [ ] The built output (`dist/index.js`) is runnable with `node dist/index.js`

- **Estimated Effort**: 2h
- **Dependencies**: TICKET-014 (args), TICKET-015 (prompts), TICKET-016 (runner), TICKET-011 (scaffolder), TICKET-013 (validator)
- **EPIC**: EPIC-06
