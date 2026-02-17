# [EPIC-01] Foundation: Project Init + Types + Utils

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

**EPIC Dependencies**: None
**EPIC Summary**: Bootstrap the project with all configuration files, define the core TypeScript types that every other module depends on, and implement shared utility functions.

---

## TICKET-001: Project Initialization

- **User Story**: As a developer contributing to create-agent-system, I want a properly configured TypeScript project with build, test, lint, and formatting tooling, so that I can immediately start writing code with confidence.

- **Acceptance Criteria**:
  - [ ] `package.json` exists with the following properties:
    - `name`: `"create-agent-system"`
    - `version`: `"0.1.0"`
    - `type`: `"module"` (ESM)
    - `bin` field: `{ "create-agent-system": "./dist/index.js" }`
    - `scripts` must include: `build`, `dev`, `test`, `lint`, `typecheck`
    - `engines`: `{ "node": ">=20" }`
    - `license`: `"MIT"`
  - [ ] Dependencies installed (`dependencies` section):
    - `commander` (CLI argument parsing)
    - `@clack/prompts` (interactive prompts)
    - `handlebars` (template engine)
    - `yaml` (YAML parsing)
    - `fs-extra` (file system utilities)
  - [ ] Dev dependencies installed (`devDependencies` section):
    - `typescript`
    - `tsup` (bundler)
    - `vitest` (test runner)
    - `@biomejs/biome` (linter/formatter)
    - `@types/fs-extra`
    - `@types/node`
  - [ ] `tsconfig.json` exists with:
    - `strict: true`
    - `target`: `"ES2022"` or later
    - `module`: `"ESNext"` or `"NodeNext"`
    - `moduleResolution`: `"bundler"` or `"NodeNext"`
    - `outDir`: `"./dist"`
    - `rootDir`: `"./src"`
    - Path aliases configured if needed (e.g., `@/` -> `src/`)
  - [ ] `tsup.config.ts` exists with:
    - Entry point: `src/index.ts`
    - Format: `["esm"]`
    - `dts: true` (type declarations)
    - `clean: true`
    - `shims: true` (for `__dirname` / `import.meta.url` compatibility)
  - [ ] `vitest.config.ts` exists with sensible defaults (e.g., globals, include pattern)
  - [ ] `biome.json` exists with formatting (2-space indent) and linting rules configured
  - [ ] `src/index.ts` exists as a placeholder entry point (can be an empty export or minimal CLI bootstrap)
  - [ ] Running `pnpm build` succeeds without errors
  - [ ] Running `pnpm test` runs vitest (even with no tests yet, exits cleanly)
  - [ ] Running `pnpm lint` runs biome check without errors
  - [ ] Running `pnpm typecheck` runs `tsc --noEmit` without errors
  - [ ] `.gitignore` includes `node_modules/`, `dist/`, `.env`
  - [ ] **Edge case**: `pnpm build` produces a valid `dist/index.js` that can be executed with `node dist/index.js` without import errors

- **Estimated Effort**: 1h
- **Dependencies**: None
- **EPIC**: EPIC-01

---

## TICKET-002: Core Type Definitions

- **User Story**: As a developer building the scaffolding engine, I want well-defined TypeScript types for configs, presets, and agents, so that all modules share a consistent contract and benefit from type safety.

- **Acceptance Criteria**:
  - [ ] `src/types/config.ts` exports the following types exactly as specified:
    ```typescript
    export interface AgentSystemConfig {
      preset: PresetName;
      projectName: string;
      scale: 'small' | 'medium' | 'large';
      agents: Record<AgentName, AgentConfig>;
      workflow: WorkflowConfig;
      skills: SkillName[];
      techStack?: TechStackInfo;
    }

    export interface AgentConfig {
      enabled: boolean;
      model: 'opus' | 'sonnet' | 'haiku';
    }

    export interface WorkflowConfig {
      reviewMaxRounds: number;
      qaMode: 'lite' | 'standard';
      visualQaLevel: 0 | 1 | 2 | 3;
      epicBased: boolean;
    }

    export type PresetName = 'solo-dev' | 'small-team' | 'full-team' | 'custom';
    export type AgentName = 'po-pm' | 'architect' | 'cto' | 'designer'
                           | 'test-writer' | 'frontend-dev' | 'backend-dev' | 'qa-reviewer';
    export type SkillName = 'scoring' | 'visual-qa' | 'tdd-workflow' | 'adr-writing'
                           | 'ticket-writing' | 'design-system' | 'cr-process';
    ```
  - [ ] `TechStackInfo` interface is defined (at minimum: `framework?: string`, `language?: string`, `packageManager?: string`, `cssFramework?: string`)
  - [ ] `src/types/preset.ts` exports:
    ```typescript
    export interface Preset {
      name: PresetName;
      description: string;
      scale: 'small' | 'medium' | 'large';
      agents: Record<AgentName, AgentConfig>;
      workflow: WorkflowConfig;
      skills: SkillName[];
    }
    ```
  - [ ] `src/types/agent.ts` exports:
    ```typescript
    export interface AgentFrontmatter {
      name: string;
      description: string;
      tools?: string;
      model?: 'opus' | 'sonnet' | 'haiku' | 'inherit';
      permissionMode?: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan' | 'ignore';
      skills?: string;  // comma-separated
    }
    ```
  - [ ] All types use `export` (named exports, not default exports)
  - [ ] A barrel file `src/types/index.ts` re-exports all types from the above modules
  - [ ] `pnpm typecheck` passes with no errors
  - [ ] **Edge case**: Ensure `AgentName` and `SkillName` union types are exhaustive (match the spec exactly -- 8 agents, 7 skills)
  - [ ] **Edge case**: `WorkflowConfig.visualQaLevel` is restricted to literal union `0 | 1 | 2 | 3`, not `number`

- **Estimated Effort**: 0.5h
- **Dependencies**: TICKET-001
- **EPIC**: EPIC-01

---

## TICKET-003: Utility Functions (fs, detect, constants)

- **User Story**: As a developer building the scaffolding and CLI modules, I want shared utility functions for file system operations, project detection, and constants, so that common logic is centralized and reusable.

- **Acceptance Criteria**:
  - [ ] `src/utils/constants.ts` exports:
    - `AGENT_NAMES`: readonly array of all 8 `AgentName` values
    - `SKILL_NAMES`: readonly array of all 7 `SkillName` values
    - `PRESET_NAMES`: readonly array of `['solo-dev', 'small-team', 'full-team']`
    - `SUPPORTED_FRONTMATTER_FIELDS`: readonly array of `['name', 'description', 'tools', 'model', 'permissionMode', 'skills']`
    - `VALID_MODEL_VALUES`: readonly array of `['opus', 'sonnet', 'haiku', 'inherit']`
    - `AGENTS_DIR`: `'.claude/agents'`
    - `SKILLS_DIR`: `'.claude/skills'`
    - `SETTINGS_FILE`: `'.claude/settings.json'`
    - `CLAUDE_MD_FILE`: `'CLAUDE.md'`
    - `AGENT_DEFAULT_SKILLS`: a mapping of `AgentName` to their default `SkillName[]` (per v2.3 agent definitions, e.g., `'designer': ['design-system', 'visual-qa', 'scoring']`, `'test-writer': ['tdd-workflow', 'scoring']`, etc.)
  - [ ] `src/utils/fs.ts` exports:
    - `fileExists(filePath: string): Promise<boolean>` — checks if a file exists
    - `dirExists(dirPath: string): Promise<boolean>` — checks if a directory exists
    - `ensureDir(dirPath: string): Promise<void>` — creates directory recursively if it doesn't exist
    - `writeFileSafe(filePath: string, content: string, overwrite?: boolean): Promise<{ written: boolean; skipped: boolean }>` — writes file, returns `skipped: true` if file exists and `overwrite` is false
    - All functions use `fs-extra` under the hood
  - [ ] `src/utils/detect.ts` exports:
    - `detectPackageManager(targetDir: string): Promise<'npm' | 'yarn' | 'pnpm' | 'bun'>` — detects package manager by checking lock files (`pnpm-lock.yaml` -> pnpm, `yarn.lock` -> yarn, `bun.lockb` -> bun, fallback: npm)
    - `detectTechStack(targetDir: string): Promise<TechStackInfo>` — reads `package.json` dependencies to detect framework (next, react, vue, etc.), language (typescript if tsconfig exists), CSS framework (tailwindcss), and package manager
    - `isExistingProject(targetDir: string): Promise<boolean>` — returns true if `package.json` or `.git` exists in target
  - [ ] A barrel file `src/utils/index.ts` re-exports all utilities
  - [ ] **Error handling**: `detectTechStack` returns a default/empty `TechStackInfo` if `package.json` doesn't exist (does not throw)
  - [ ] **Error handling**: `writeFileSafe` does not throw if file already exists and `overwrite` is false; it returns `{ written: false, skipped: true }`
  - [ ] **Edge case**: `detectPackageManager` checks lock files in priority order (pnpm > yarn > bun > npm), returns `'npm'` as fallback
  - [ ] **Edge case**: `ensureDir` is idempotent -- calling it on an existing directory does not throw
  - [ ] Unit tests exist for all utility functions covering happy paths and edge cases

- **Estimated Effort**: 1.5h
- **Dependencies**: TICKET-002
- **EPIC**: EPIC-01
