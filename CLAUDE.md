# Project Memory

## Project Overview
- create-agent-system: CLI tool that scaffolds Claude Code Agent Teams-based development systems into projects
- Spec: @docs/create-agent-system-spec.md
- ADR: @docs/adr/

## Common Rules
- All work starts in plan mode
- Do not modify finalized specs without a CR (Change Request)
- All feedback must be scored on a 100-point scale (1-point increments) with specific deduction reasons
- **Always spawn agents as Agent Teams** (TeamCreate → Task with team_name), never as standalone subagents. This enables TaskList-based coordination and mailbox communication between agents.

## Build & Test Commands
- `pnpm build` — tsup build
- `pnpm test` — Vitest unit tests
- `pnpm lint` — Biome lint
- `pnpm typecheck` — TypeScript type check

## Code Style
- TypeScript strict mode
- ESM (type: module)
- Named exports preferred
- 2-space indentation
- Biome formatter/linter

## Agent Context Rules

Each agent follows this table. Agent definitions do not include separate Context Rules.

| Agent | Read on Session Start | Reference as Needed | Do Not Read (unless explicitly requested) |
|-------|----------------------|--------------------|-----------------------------------------|
| PO/PM | docs/create-agent-system-spec.md, docs/tickets/ | docs/adr/ | src/, tests/ |
| Architect | docs/adr/, docs/create-agent-system-spec.md | docs/tickets/, src/types/ | src/core/, src/cli/, tests/ |
| CTO | docs/adr/, docs/create-agent-system-spec.md | docs/tickets/, src/types/ | src/core/, src/cli/, tests/ |
| Test Writer | docs/create-agent-system-spec.md, docs/tickets/ (relevant EPIC) | src/types/, docs/adr/ | src/core/, src/cli/ |
| Backend Dev | docs/adr/, src/types/ | docs/create-agent-system-spec.md, tests/ (relevant ticket) | docs/tickets/ |
| QA Reviewer | docs/create-agent-system-spec.md | docs/adr/, docs/tickets/, src/, tests/ | - |

## File Ownership

### Exclusive Ownership

| Directory/File | Owner Agent |
|---------------|-------------|
| `src/core/`, `src/cli/`, `src/utils/` | backend-dev |
| `src/types/` | backend-dev |
| `templates/`, `presets/` | backend-dev |
| `tests/`, `*.test.ts` | test-writer |
| `docs/spec.md`, `docs/tickets/` | po-pm |
| `docs/adr/` | architect |

### Shared File Rules

| File | Write Access | Read Access | Change Protocol |
|------|-------------|-------------|-----------------|
| `src/types/config.ts` | backend-dev | All (read-only) | backend-dev notifies team after changes |
| `CLAUDE.md` | Orchestrator only | All | Agents request changes via Orchestrator |

## Failure Modes & Recovery

### Detection Criteria
- Score below 60: Immediate failure declaration
- Score 60-69: One revision opportunity, failure if below 70 on re-score

### Escalation Rules
- 2 consecutive failures on the same task: Orchestrator escalates to Human

## EPIC Dependency Management
Orchestrator manages EPIC execution order and dependencies.
1. Execute EPICs with no dependencies first
2. Dependent EPICs start only after predecessor EPICs are complete (QA 90+)
3. Independent EPICs may run in parallel

## Model Configuration
All agents currently use Opus.
