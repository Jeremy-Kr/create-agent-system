# Contributing to create-agent-system

## Development Setup

```bash
git clone https://github.com/jeremy-kr/create-agent-system.git
cd create-agent-system
pnpm install
pnpm build
pnpm test
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm build` | Build with tsdown |
| `pnpm dev` | Watch mode build |
| `pnpm test` | Run all tests |
| `pnpm test:watch` | Watch mode tests |
| `pnpm lint` | Check with Biome |
| `pnpm lint:fix` | Auto-fix lint issues |
| `pnpm typecheck` | TypeScript type check |

## Code Style

- **TypeScript** with strict mode enabled
- **Biome** for linting and formatting
- **2-space indentation**
- **ESM** (ES Modules) — all imports use `.js` extensions
- No default exports; prefer named exports

## Project Structure

```
src/
├── cli/          # CLI interface (args, prompts, runner)
├── core/         # Core logic (scaffolder, validator, preset-loader, template-renderer, skill-installer)
├── types/        # TypeScript type definitions
└── utils/        # Utility functions (fs, detect, constants)
templates/        # Handlebars templates for agents and CLAUDE.md
presets/           # YAML preset files
tests/
├── cli/          # CLI unit tests
├── core/         # Core logic unit tests
├── integration/  # End-to-end integration tests
├── types/        # Type assertion tests
└── utils/        # Utility unit tests
```

## Pull Request Process

1. Create a feature branch: `feat/short-description`
2. Follow commit conventions: `type(scope): description`
   - Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`
3. Ensure all checks pass:
   ```bash
   pnpm typecheck && pnpm lint && pnpm test
   ```
4. Open a PR with a clear description of changes

## Adding New Presets

1. Create a YAML file in `presets/` following the existing format
2. Add the preset name to `PRESET_NAMES` in `src/utils/constants.ts`
3. Add the preset name to the `PresetName` type in `src/types/config.ts`
4. Add tests in `tests/core/preset-loader.test.ts`

## Adding New Agents

1. Create a Handlebars template in `templates/agents/`
2. Add the agent name to `ALL_AGENTS` in `src/utils/constants.ts`
3. Add the agent name to the `AgentName` type in `src/types/config.ts`
4. Add default skills in `AGENT_DEFAULT_SKILLS`
5. Add agent entries to all preset YAML files

## Adding New Skills

1. Create a fallback template in `templates/skills/<name>/SKILL.md.hbs`
2. Add the skill name to `SKILL_NAMES` in `src/utils/constants.ts`
3. Add the skill name to the `SkillName` type in `src/types/config.ts`
4. Update `AGENT_DEFAULT_SKILLS` for agents that should use the skill
