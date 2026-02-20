# create-agent-system

[![npm version](https://img.shields.io/npm/v/create-agent-system.svg)](https://www.npmjs.com/package/create-agent-system)
[![license](https://img.shields.io/npm/l/create-agent-system.svg)](LICENSE)

Scaffold Claude Code Agent Teams into your project.

## Features

- **3 built-in presets** — Solo Dev, Small Team, Full Team
- **8 agent types** — PO/PM, Architect, CTO, Designer, Test Writer, Frontend Dev, Backend Dev, QA Reviewer
- **8 skill packages** — scoring, visual-qa, tdd-workflow, adr-writing, ticket-writing, design-system, cr-process, sync-spec
- **Interactive and non-interactive modes**
- **Built-in validation** — checks frontmatter, skills references, and project structure
- **Claude Code integration** — auto-launch with Agent Teams enabled

## Quick Start

```bash
npx create-agent-system
```

## Presets

| Preset | Scale | Agents | Skills | QA Mode | Visual QA | EPIC-based |
|--------|-------|--------|--------|---------|-----------|------------|
| solo-dev | small | 5 | 5 | lite | Level 1 | No |
| small-team | medium | 8 | 8 | standard | Level 2 | Yes |
| full-team | large | 8 | 8 | standard | Level 3 | Yes |

## Usage

### Interactive mode (default)

```bash
npx create-agent-system
```

Prompts you to select a preset, project name, and whether to launch Claude Code.

### Non-interactive mode

```bash
npx create-agent-system --preset solo-dev --project-name my-app --yes
```

### Dry run

```bash
npx create-agent-system --dry-run
```

Preview what files would be created without writing anything.

### Validate existing setup

```bash
npx create-agent-system validate
```

Check your agent configuration for errors and warnings.

### Sync with official spec

After scaffolding, use the `/sync-spec` skill in Claude Code to verify your configuration
against the latest official Claude Code documentation:

```bash
claude
> /sync-spec
```

This skill uses Context7 MCP to fetch the latest spec and compare it with your bundled configuration.

### Target a specific directory

```bash
npx create-agent-system --target ./path/to/project
```

## Generated Files

```
your-project/
├── CLAUDE.md
└── .claude/
    ├── agents/
    │   ├── po-pm.md
    │   ├── architect.md
    │   ├── cto.md
    │   ├── designer.md
    │   ├── test-writer.md
    │   ├── frontend-dev.md
    │   ├── backend-dev.md
    │   └── qa-reviewer.md
    ├── skills/
    │   ├── scoring/SKILL.md
    │   ├── visual-qa/SKILL.md
    │   ├── tdd-workflow/SKILL.md
    │   ├── adr-writing/SKILL.md
    │   ├── ticket-writing/SKILL.md
    │   ├── design-system/SKILL.md
    │   ├── cr-process/SKILL.md
    │   └── sync-spec/SKILL.md
    └── settings.json
```

Files vary by preset. For example, `solo-dev` generates 5 agents instead of 8.

## CLI Reference

```
create-agent-system [options]
create-agent-system validate [path]
```

| Flag | Description |
|------|-------------|
| `-p, --preset <name>` | Preset name (`solo-dev`, `small-team`, `full-team`) |
| `-n, --project-name <name>` | Project name |
| `-t, --target <path>` | Target directory (default: current directory) |
| `--no-run` | Skip Claude Code launch prompt |
| `-y, --yes` | Skip interactive prompts (requires `--preset`) |
| `--dry-run` | Preview without creating files |

## Requirements

- Node.js 20+
- pnpm (recommended) or npm/yarn

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

[MIT](LICENSE)
