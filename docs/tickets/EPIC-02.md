# [EPIC-02] Preset System: YAML Files + Loader

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

**EPIC Dependencies**: EPIC-01 (types, constants, utils)
**EPIC Summary**: Create the 3 preset YAML files (solo-dev, small-team, full-team) and implement the preset-loader module that reads, parses, and converts them into typed `Preset` objects.

---

## TICKET-004: Write 3 Preset YAML Files

- **User Story**: As the scaffolding engine, I want preset YAML files that define agent configurations, workflow settings, and skill lists for each project scale, so that users can quickly bootstrap a suitable agent system.

- **Acceptance Criteria**:
  - [ ] `presets/solo-dev.yaml` exists and matches the spec (lines 62-89):
    ```yaml
    name: solo-dev
    description: "1인 개발자용. 축약된 워크플로우, 핵심 에이전트만."
    scale: small
    agents:
      po-pm: { enabled: true, model: opus }
      architect: { enabled: false }
      cto: { enabled: false }
      designer: { enabled: false }
      test-writer: { enabled: true, model: opus }
      frontend-dev: { enabled: true, model: opus }
      backend-dev: { enabled: true, model: opus }
      qa-reviewer: { enabled: true, model: opus }
    workflow:
      review_max_rounds: 0
      qa_mode: lite
      visual_qa_level: 1
      epic_based: false
    skills:
      - scoring
      - tdd-workflow
      - ticket-writing
      - cr-process
    ```
  - [ ] `presets/small-team.yaml` exists and matches the spec (lines 96-124):
    - All 8 agents enabled with `model: opus`
    - `scale: medium`
    - `review_max_rounds: 5`, `qa_mode: standard`, `visual_qa_level: 2`, `epic_based: true`
    - Skills: scoring, visual-qa, tdd-workflow, adr-writing, ticket-writing, design-system, cr-process (all 7)
  - [ ] `presets/full-team.yaml` exists and matches the spec (lines 130-158):
    - All 8 agents enabled with `model: opus`
    - `scale: large`
    - `review_max_rounds: 5`, `qa_mode: standard`, `visual_qa_level: 3`, `epic_based: true`
    - Skills: all 7 (same as small-team)
  - [ ] YAML files are valid and parseable by the `yaml` npm package
  - [ ] YAML uses `snake_case` for workflow keys (e.g., `review_max_rounds`, `qa_mode`, `visual_qa_level`, `epic_based`) -- these will be converted to `camelCase` by the loader
  - [ ] All 8 agent names are present in every preset (even disabled ones use `enabled: false`)
  - [ ] **Edge case**: `solo-dev` has exactly 5 agents enabled (po-pm, test-writer, frontend-dev, backend-dev, qa-reviewer) and 3 disabled (architect, cto, designer) -- verify this matches the spec where qa-reviewer is enabled
  - [ ] **Edge case**: `full-team` and `small-team` differ ONLY in `scale` and `visual_qa_level` (2 vs 3)

- **Estimated Effort**: 0.5h
- **Dependencies**: TICKET-001 (project must exist to place files)
- **EPIC**: EPIC-02

---

## TICKET-005: Preset Loader Implementation

- **User Story**: As the scaffolding engine, I want a preset-loader module that reads a preset YAML file by name and returns a typed `Preset` object, so that I can use preset configurations throughout the application.

- **Acceptance Criteria**:
  - [ ] `src/core/preset-loader.ts` exports:
    - `loadPreset(presetName: PresetName): Promise<Preset>` — loads and returns a typed Preset
    - `listPresets(): PresetName[]` — returns `['solo-dev', 'small-team', 'full-team']`
    - `getPresetPath(presetName: PresetName): string` — returns the absolute path to the YAML file
  - [ ] `loadPreset` reads the YAML file from the `presets/` directory
  - [ ] Uses `import.meta.url` to resolve the `presets/` directory path relative to the source file (not `process.cwd()` or `__dirname`)
    - This is critical for `npx` execution where `process.cwd()` is the user's project, not the package
    - Implementation pattern: `new URL('../../presets/', import.meta.url)`
  - [ ] Performs `snake_case` to `camelCase` conversion for workflow fields:
    - `review_max_rounds` → `reviewMaxRounds`
    - `qa_mode` → `qaMode`
    - `visual_qa_level` → `visualQaLevel`
    - `epic_based` → `epicBased`
  - [ ] Returns a fully typed `Preset` object that satisfies the `Preset` interface from `src/types/preset.ts`
  - [ ] **Error handling**: Throws a descriptive error if the preset name is not one of the valid preset names
    - Error message must include the invalid name and list of valid options
    - Example: `Unknown preset "custom-dev". Valid presets: solo-dev, small-team, full-team`
  - [ ] **Error handling**: Throws a descriptive error if the YAML file is malformed or missing
    - Example: `Failed to load preset "solo-dev": file not found at /path/to/presets/solo-dev.yaml`
  - [ ] **Error handling**: Throws if required fields are missing after parsing (name, description, scale, agents, workflow, skills)
  - [ ] **Edge case**: Loader works correctly when the package is installed globally, locally, or run via `npx` (the `import.meta.url` approach handles all cases)
  - [ ] **Edge case**: The loader handles the bundled output from `tsdown` correctly (presets directory must be accessible relative to the bundled dist file)
    - NOTE: `tsdown` does not copy non-TS assets. The build process must ensure `presets/` is accessible. Document this requirement (e.g., `tsdown` `copy` option or a copy script in `package.json`)
  - [ ] Unit tests exist for `loadPreset`:
    - Successfully loads each of the 3 presets
    - Returns correct camelCase workflow config
    - Throws on invalid preset name
    - Throws on malformed YAML (using a temp file with invalid content)
  - [ ] Unit tests exist for `listPresets` and `getPresetPath`

- **Estimated Effort**: 1.5h
- **Dependencies**: TICKET-002 (types), TICKET-004 (YAML files)
- **EPIC**: EPIC-02
