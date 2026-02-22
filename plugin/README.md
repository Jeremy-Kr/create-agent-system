# create-agent-system Plugin

Claude Code Agent Teams scaffolding tool plugin.

## Installation

```bash
claude plugin add create-agent-system
```

## Commands

### /scaffold

Scaffold a Claude Code Agent Teams system into your project.

```
/scaffold                          # Interactive mode
/scaffold --preset solo-dev --yes  # Non-interactive mode
```

Presets:
- **solo-dev** — Solo developer, streamlined workflow
- **small-team** — Small team, EPIC-based
- **full-team** — Large project, full process

### /add

Install agents, skills, or presets from the community registry.

```
/add security-reviewer             # Install agent/skill
/add --type agent security-reviewer
```

### /search

Search the community registry.

```
/search testing                    # Keyword search
/search --type skill testing       # Search skills only
```

### /validate

Validate Agent Teams configuration in the current project.

```
/validate                          # Full validation
/validate --quiet                  # Errors only
```

## License

MIT
