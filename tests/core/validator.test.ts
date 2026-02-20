import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BUNDLED_DOC_SPEC, type DocSpec } from '../../src/core/doc-spec.js';
import { validate } from '../../src/core/validator.js';

describe('Validator (TICKET-013)', () => {
  let targetDir: string;

  beforeEach(async () => {
    targetDir = join(
      tmpdir(),
      `validator-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await mkdir(targetDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(targetDir, { recursive: true, force: true });
  });

  // Helper to set up a minimal valid agent system
  async function setupValidSystem() {
    const agentsDir = join(targetDir, '.claude', 'agents');
    const skillsDir = join(targetDir, '.claude', 'skills', 'scoring');
    await mkdir(agentsDir, { recursive: true });
    await mkdir(skillsDir, { recursive: true });

    await writeFile(
      join(agentsDir, 'backend-dev.md'),
      '---\nname: backend-dev\ndescription: "Backend developer. Implements APIs and services. <example>Context: Test. user: Implement API. assistant: Delegating.</example>"\ntools: Read, Write, Edit, Grep, Glob, Bash\nmodel: opus\nskills: scoring\n---\n\nYou are a backend developer.\n',
      'utf-8',
    );

    await writeFile(join(skillsDir, 'SKILL.md'), '# Scoring\nContent here.', 'utf-8');

    await writeFile(
      join(targetDir, 'CLAUDE.md'),
      '# Project Memory\n\n## Overview\nTest project.',
      'utf-8',
    );
  }

  // --- Happy path ---

  describe('valid system', () => {
    it('should return valid: true with no errors or warnings', async () => {
      await setupValidSystem();
      const result = await validate(targetDir);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should return correct stats', async () => {
      await setupValidSystem();
      const result = await validate(targetDir);
      expect(result.stats.agentCount).toBe(1);
      expect(result.stats.skillCount).toBe(1);
      expect(result.stats.fileCount).toBeGreaterThanOrEqual(3); // agent + skill + CLAUDE.md
    });
  });

  // --- E001: YAML_PARSE_ERROR ---

  describe('E001: YAML_PARSE_ERROR', () => {
    it('should error on malformed YAML frontmatter', async () => {
      await setupValidSystem();
      await writeFile(
        join(targetDir, '.claude', 'agents', 'bad-agent.md'),
        `---
name: "unclosed
description: test
---
Body content.
`,
        'utf-8',
      );
      const result = await validate(targetDir);
      const err = result.errors.find((e) => e.rule === 'YAML_PARSE_ERROR');
      expect(err).toBeDefined();
      expect(err?.file).toContain('bad-agent.md');
    });

    it('should error on missing frontmatter delimiters', async () => {
      await setupValidSystem();
      await writeFile(
        join(targetDir, '.claude', 'agents', 'no-frontmatter.md'),
        'Just plain markdown without frontmatter.',
        'utf-8',
      );
      const result = await validate(targetDir);
      const err = result.errors.find(
        (e) => e.rule === 'YAML_PARSE_ERROR' && e.file.includes('no-frontmatter.md'),
      );
      expect(err).toBeDefined();
    });

    it('should NOT error on valid YAML frontmatter', async () => {
      await setupValidSystem();
      const result = await validate(targetDir);
      const yamlErrors = result.errors.filter((e) => e.rule === 'YAML_PARSE_ERROR');
      expect(yamlErrors).toHaveLength(0);
    });
  });

  // --- E002: MISSING_NAME ---

  describe('E002: MISSING_NAME', () => {
    it('should error when name field is missing', async () => {
      await setupValidSystem();
      await writeFile(
        join(targetDir, '.claude', 'agents', 'no-name.md'),
        `---
description: "Has description but no name"
tools: Read, Write
model: opus
---
Body.
`,
        'utf-8',
      );
      const result = await validate(targetDir);
      const err = result.errors.find(
        (e) => e.rule === 'MISSING_NAME' && e.file.includes('no-name.md'),
      );
      expect(err).toBeDefined();
    });

    it('should NOT error when name is present', async () => {
      await setupValidSystem();
      const result = await validate(targetDir);
      const nameErrors = result.errors.filter((e) => e.rule === 'MISSING_NAME');
      expect(nameErrors).toHaveLength(0);
    });
  });

  // --- E003: MISSING_DESCRIPTION ---

  describe('E003: MISSING_DESCRIPTION', () => {
    it('should error when description field is missing', async () => {
      await setupValidSystem();
      await writeFile(
        join(targetDir, '.claude', 'agents', 'no-desc.md'),
        `---
name: no-desc
tools: Read
model: opus
---
Body.
`,
        'utf-8',
      );
      const result = await validate(targetDir);
      const err = result.errors.find(
        (e) => e.rule === 'MISSING_DESCRIPTION' && e.file.includes('no-desc.md'),
      );
      expect(err).toBeDefined();
    });

    it('should NOT error when description is present', async () => {
      await setupValidSystem();
      const result = await validate(targetDir);
      expect(result.errors.filter((e) => e.rule === 'MISSING_DESCRIPTION')).toHaveLength(0);
    });
  });

  // --- E004: UNSUPPORTED_FIELD ---

  describe('E004: UNSUPPORTED_FIELD', () => {
    it('should error on unsupported frontmatter fields', async () => {
      await setupValidSystem();
      await writeFile(
        join(targetDir, '.claude', 'agents', 'extra-field.md'),
        `---
name: extra
description: "Agent with extra field"
tools: Read
model: opus
context: "some value"
---
Body.
`,
        'utf-8',
      );
      const result = await validate(targetDir);
      const err = result.errors.find((e) => e.rule === 'UNSUPPORTED_FIELD');
      expect(err).toBeDefined();
      expect(err?.message).toContain('context');
    });

    it('should NOT error on supported fields only', async () => {
      await setupValidSystem();
      const result = await validate(targetDir);
      expect(result.errors.filter((e) => e.rule === 'UNSUPPORTED_FIELD')).toHaveLength(0);
    });
  });

  // --- E005: INVALID_MODEL ---

  describe('E005: INVALID_MODEL', () => {
    it('should error on invalid model value', async () => {
      await setupValidSystem();
      await writeFile(
        join(targetDir, '.claude', 'agents', 'bad-model.md'),
        `---
name: bad-model
description: "Agent with invalid model"
tools: Read
model: gpt-4
---
Body.
`,
        'utf-8',
      );
      const result = await validate(targetDir);
      const err = result.errors.find((e) => e.rule === 'INVALID_MODEL');
      expect(err).toBeDefined();
      expect(err?.message).toContain('gpt-4');
    });

    it('should accept valid model values', async () => {
      await setupValidSystem();
      // backend-dev.md already has model: opus
      const result = await validate(targetDir);
      expect(result.errors.filter((e) => e.rule === 'INVALID_MODEL')).toHaveLength(0);
    });
  });

  // --- E006: INVALID_SKILL_REFERENCE ---

  describe('E006: INVALID_SKILL_REFERENCE', () => {
    it('should error when skills reference nonexistent skill directory', async () => {
      await setupValidSystem();
      await writeFile(
        join(targetDir, '.claude', 'agents', 'bad-skills.md'),
        `---
name: bad-skills
description: "Agent referencing nonexistent skill"
tools: Read
model: opus
skills: scoring, nonexistent-skill
---
Body.
`,
        'utf-8',
      );
      const result = await validate(targetDir);
      const err = result.errors.find((e) => e.rule === 'INVALID_SKILL_REFERENCE');
      expect(err).toBeDefined();
      expect(err?.message).toContain('nonexistent-skill');
    });

    it('should NOT error when all referenced skills exist', async () => {
      await setupValidSystem();
      // Update agent to reference scoring skill (which exists)
      await writeFile(
        join(targetDir, '.claude', 'agents', 'backend-dev.md'),
        `---
name: backend-dev
description: "Backend developer. Implements APIs and services."
tools: Read, Write, Edit, Grep, Glob, Bash
model: opus
skills: scoring
---
You are a backend developer.
`,
        'utf-8',
      );
      const result = await validate(targetDir);
      expect(result.errors.filter((e) => e.rule === 'INVALID_SKILL_REFERENCE')).toHaveLength(0);
    });
  });

  // --- E007: INVALID_IMPORT_PATH ---

  describe('E007: INVALID_IMPORT_PATH', () => {
    it('should error on @import paths to nonexistent files', async () => {
      await setupValidSystem();
      await writeFile(
        join(targetDir, 'CLAUDE.md'),
        '# Project Memory\n\n- Spec: @docs/nonexistent.md\n',
        'utf-8',
      );
      const result = await validate(targetDir);
      const err = result.errors.find((e) => e.rule === 'INVALID_IMPORT_PATH');
      expect(err).toBeDefined();
      expect(err?.message).toContain('docs/nonexistent.md');
    });

    it('should NOT error when @import paths exist', async () => {
      await setupValidSystem();
      await mkdir(join(targetDir, 'docs'), { recursive: true });
      await writeFile(join(targetDir, 'docs', 'spec.md'), '# Spec', 'utf-8');
      await writeFile(
        join(targetDir, 'CLAUDE.md'),
        '# Project Memory\n\n- Spec: @docs/spec.md\n',
        'utf-8',
      );
      const result = await validate(targetDir);
      expect(result.errors.filter((e) => e.rule === 'INVALID_IMPORT_PATH')).toHaveLength(0);
    });

    it('should ignore @paths inside code blocks', async () => {
      await setupValidSystem();
      await writeFile(
        join(targetDir, 'CLAUDE.md'),
        '# Project\n\n```\n@types/node is used\n```\n',
        'utf-8',
      );
      const result = await validate(targetDir);
      expect(result.errors.filter((e) => e.rule === 'INVALID_IMPORT_PATH')).toHaveLength(0);
    });
  });

  // --- W001: SHORT_DESCRIPTION ---

  describe('W001: SHORT_DESCRIPTION', () => {
    it('should warn when description is too short', async () => {
      await setupValidSystem();
      await writeFile(
        join(targetDir, '.claude', 'agents', 'short.md'),
        `---
name: short
description: "test"
tools: Read
model: opus
---
Body.
`,
        'utf-8',
      );
      const result = await validate(targetDir);
      const warn = result.warnings.find(
        (w) => w.rule === 'SHORT_DESCRIPTION' && w.file.includes('short.md'),
      );
      expect(warn).toBeDefined();
    });

    it('should NOT warn when description is adequate', async () => {
      await setupValidSystem();
      const result = await validate(targetDir);
      expect(result.warnings.filter((w) => w.rule === 'SHORT_DESCRIPTION')).toHaveLength(0);
    });
  });

  // --- W002: LONG_DESCRIPTION ---

  describe('W002: LONG_DESCRIPTION', () => {
    it('should warn when description exceeds 1024 chars', async () => {
      await setupValidSystem();
      const longDesc = 'A'.repeat(1100);
      await writeFile(
        join(targetDir, '.claude', 'agents', 'verbose.md'),
        `---
name: verbose
description: "${longDesc}"
tools: Read
model: opus
---
Body.
`,
        'utf-8',
      );
      const result = await validate(targetDir);
      const warn = result.warnings.find(
        (w) => w.rule === 'LONG_DESCRIPTION' && w.file.includes('verbose.md'),
      );
      expect(warn).toBeDefined();
    });

    it('should NOT warn when description is within bounds', async () => {
      await setupValidSystem();
      const result = await validate(targetDir);
      expect(result.warnings.filter((w) => w.rule === 'LONG_DESCRIPTION')).toHaveLength(0);
    });
  });

  // --- W003: MISSING_TOOLS ---

  describe('W003: MISSING_TOOLS', () => {
    it('should warn when tools field is missing', async () => {
      await setupValidSystem();
      await writeFile(
        join(targetDir, '.claude', 'agents', 'no-tools.md'),
        `---
name: no-tools
description: "Agent without tools specified"
model: opus
---
Body.
`,
        'utf-8',
      );
      const result = await validate(targetDir);
      const warn = result.warnings.find(
        (w) => w.rule === 'MISSING_TOOLS' && w.file.includes('no-tools.md'),
      );
      expect(warn).toBeDefined();
    });

    it('should NOT warn when tools is present', async () => {
      await setupValidSystem();
      const result = await validate(targetDir);
      expect(result.warnings.filter((w) => w.rule === 'MISSING_TOOLS')).toHaveLength(0);
    });
  });

  // --- W004: DUPLICATE_CONTENT ---

  describe('W004: DUPLICATE_CONTENT', () => {
    it('should warn when agent body contains CLAUDE.md-specific sections', async () => {
      await setupValidSystem();
      await writeFile(
        join(targetDir, '.claude', 'agents', 'dup-content.md'),
        `---
name: dup-content
description: "Agent with duplicated CLAUDE.md content"
tools: Read
model: opus
---

## File Ownership
This section should be in CLAUDE.md only.
`,
        'utf-8',
      );
      const result = await validate(targetDir);
      const warn = result.warnings.find(
        (w) => w.rule === 'DUPLICATE_CONTENT' && w.file.includes('dup-content.md'),
      );
      expect(warn).toBeDefined();
      expect(warn?.message).toContain('File Ownership');
    });

    it('should NOT warn on normal agent body content', async () => {
      await setupValidSystem();
      const result = await validate(targetDir);
      expect(result.warnings.filter((w) => w.rule === 'DUPLICATE_CONTENT')).toHaveLength(0);
    });
  });

  // --- Structure errors ---

  describe('missing .claude/agents/ directory', () => {
    it('should error when .claude/agents/ does not exist', async () => {
      await writeFile(join(targetDir, 'CLAUDE.md'), '# Project', 'utf-8');
      const result = await validate(targetDir);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('agents'))).toBe(true);
    });
  });

  describe('missing CLAUDE.md', () => {
    it('should error when CLAUDE.md does not exist', async () => {
      await mkdir(join(targetDir, '.claude', 'agents'), { recursive: true });
      const result = await validate(targetDir);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('CLAUDE.md'))).toBe(true);
    });
  });

  // --- Mixed errors and warnings ---

  describe('mixed errors and warnings', () => {
    it('should report both errors and warnings', async () => {
      await setupValidSystem();
      // Agent with short description (warning) + unsupported field (error)
      await writeFile(
        join(targetDir, '.claude', 'agents', 'mixed.md'),
        `---
name: mixed
description: "hi"
model: opus
context: "bad"
---
Body.
`,
        'utf-8',
      );
      const result = await validate(targetDir);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.valid).toBe(false); // has errors
    });
  });

  // --- DocSpec parameter ---

  describe('DocSpec parameter', () => {
    it('should use BUNDLED_DOC_SPEC by default (color field is supported)', async () => {
      await setupValidSystem();
      await writeFile(
        join(targetDir, '.claude', 'agents', 'colored.md'),
        `---
name: colored
description: "Agent with color field, should be supported"
tools: Read, Write
model: opus
color: blue
---
Body.
`,
        'utf-8',
      );
      const result = await validate(targetDir);
      const unsupported = result.errors.filter(
        (e) => e.rule === 'UNSUPPORTED_FIELD' && e.file.includes('colored.md'),
      );
      expect(unsupported).toHaveLength(0);
    });

    it('should validate against custom spec when provided', async () => {
      await setupValidSystem();
      // Custom spec that only supports name and description
      const customSpec: DocSpec = {
        ...BUNDLED_DOC_SPEC,
        agent: {
          ...BUNDLED_DOC_SPEC.agent,
          requiredFields: ['name', 'description'],
          optionalFields: ['tools'], // Only tools is optional
        },
      };
      const result = await validate(targetDir, customSpec);
      // backend-dev.md has model, skills fields which are not in customSpec
      const unsupported = result.errors.filter((e) => e.rule === 'UNSUPPORTED_FIELD');
      expect(unsupported.length).toBeGreaterThan(0);
    });
  });
});
