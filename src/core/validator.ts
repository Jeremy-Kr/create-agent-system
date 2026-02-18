import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { t } from '../i18n/index.js';
import { SUPPORTED_FRONTMATTER_FIELDS, VALID_MODEL_VALUES } from '../utils/constants.js';
import { dirExists, fileExists } from '../utils/fs.js';

export interface ValidationIssue {
  rule: string;
  file: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  stats: {
    agentCount: number;
    skillCount: number;
    fileCount: number;
  };
}

function parseFrontmatter(content: string): { data: Record<string, unknown>; body: string } | null {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return null;

  const data = parseYaml(match[1]) as Record<string, unknown>;
  return { data, body: match[2] };
}

const DUPLICATE_CONTENT_KEYWORDS = ['File Ownership', 'Context Rules', 'Shared File'];

export async function validate(targetDir: string): Promise<ValidationResult> {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  let agentCount = 0;
  let skillCount = 0;
  let fileCount = 0;

  const agentsDir = join(targetDir, '.claude', 'agents');
  const skillsDir = join(targetDir, '.claude', 'skills');
  const claudeMdPath = join(targetDir, 'CLAUDE.md');

  // Check structural requirements
  if (!(await dirExists(agentsDir))) {
    errors.push({
      rule: 'STRUCTURE',
      file: '.claude/agents/',
      message: t('validator.missing_agents_dir'),
    });
  }

  if (!(await fileExists(claudeMdPath))) {
    errors.push({
      rule: 'STRUCTURE',
      file: 'CLAUDE.md',
      message: t('validator.missing_claude_md'),
    });
  }

  // If critical structure is missing, return early
  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      warnings,
      stats: { agentCount: 0, skillCount: 0, fileCount: 0 },
    };
  }

  // Scan agent files
  const agentFiles = (await readdir(agentsDir)).filter((f) => f.endsWith('.md'));
  agentCount = agentFiles.length;
  fileCount += agentCount;

  // Scan skill directories
  if (await dirExists(skillsDir)) {
    const skillDirs = await readdir(skillsDir);
    const skillChecks = await Promise.all(
      skillDirs.map((dir) => fileExists(join(skillsDir, dir, 'SKILL.md'))),
    );
    for (const exists of skillChecks) {
      if (exists) {
        skillCount++;
        fileCount++;
      }
    }
  }

  // Count CLAUDE.md
  fileCount++;

  // Validate each agent file
  const agentContents = await Promise.all(
    agentFiles.map(async (agentFile) => {
      const filePath = join(agentsDir, agentFile);
      const relPath = relative(targetDir, filePath);
      const content = await readFile(filePath, 'utf-8');
      return { agentFile, filePath, relPath, content };
    }),
  );

  for (const { relPath, content } of agentContents) {
    // Parse frontmatter
    let parsed: ReturnType<typeof parseFrontmatter>;
    try {
      parsed = parseFrontmatter(content);
    } catch {
      errors.push({
        rule: 'YAML_PARSE_ERROR',
        file: relPath,
        message: t('validator.yaml_parse_error', { file: relPath }),
      });
      continue;
    }

    if (!parsed) {
      errors.push({
        rule: 'YAML_PARSE_ERROR',
        file: relPath,
        message: t('validator.yaml_no_frontmatter', { file: relPath }),
      });
      continue;
    }

    const { data, body } = parsed;

    // E002: MISSING_NAME
    if (!data.name) {
      errors.push({
        rule: 'MISSING_NAME',
        file: relPath,
        message: t('validator.missing_name', { file: relPath }),
      });
    }

    // E003: MISSING_DESCRIPTION
    if (!data.description) {
      errors.push({
        rule: 'MISSING_DESCRIPTION',
        file: relPath,
        message: t('validator.missing_description', { file: relPath }),
      });
    }

    // E004: UNSUPPORTED_FIELD
    for (const key of Object.keys(data)) {
      if (!(SUPPORTED_FRONTMATTER_FIELDS as readonly string[]).includes(key)) {
        errors.push({
          rule: 'UNSUPPORTED_FIELD',
          file: relPath,
          message: t('validator.unsupported_field', {
            file: relPath,
            field: key,
            supported: SUPPORTED_FRONTMATTER_FIELDS.join(', '),
          }),
        });
      }
    }

    // E005: INVALID_MODEL
    if (data.model && !(VALID_MODEL_VALUES as readonly string[]).includes(data.model as string)) {
      errors.push({
        rule: 'INVALID_MODEL',
        file: relPath,
        message: t('validator.invalid_model', {
          file: relPath,
          model: String(data.model),
          valid: VALID_MODEL_VALUES.join(', '),
        }),
      });
    }

    // E006: INVALID_SKILL_REFERENCE
    if (data.skills && typeof data.skills === 'string') {
      const skillNames = data.skills.split(',').map((s: string) => s.trim());
      for (const skillName of skillNames) {
        if (!skillName) continue;
        const skillPath = join(skillsDir, skillName, 'SKILL.md');
        if (!(await fileExists(skillPath))) {
          errors.push({
            rule: 'INVALID_SKILL_REFERENCE',
            file: relPath,
            message: t('validator.invalid_skill_ref', { file: relPath, skill: skillName }),
          });
        }
      }
    }

    // W001: SHORT_DESCRIPTION
    const desc = data.description as string | undefined;
    if (desc && desc.length < 20) {
      warnings.push({
        rule: 'SHORT_DESCRIPTION',
        file: relPath,
        message: t('validator.short_description', { file: relPath, length: desc.length }),
      });
    }

    // W002: LONG_DESCRIPTION
    if (desc && desc.length > 1024) {
      warnings.push({
        rule: 'LONG_DESCRIPTION',
        file: relPath,
        message: t('validator.long_description', { file: relPath, length: desc.length }),
      });
    }

    // W003: MISSING_TOOLS
    if (!data.tools) {
      warnings.push({
        rule: 'MISSING_TOOLS',
        file: relPath,
        message: t('validator.missing_tools', { file: relPath }),
      });
    }

    // W004: DUPLICATE_CONTENT
    for (const keyword of DUPLICATE_CONTENT_KEYWORDS) {
      if (body.includes(keyword)) {
        warnings.push({
          rule: 'DUPLICATE_CONTENT',
          file: relPath,
          message: t('validator.duplicate_content', { file: relPath, keyword }),
        });
        break; // One warning per file
      }
    }
  }

  // E007: INVALID_IMPORT_PATH (in CLAUDE.md)
  const claudeMdContent = await readFile(claudeMdPath, 'utf-8');
  const importPaths = extractImportPaths(claudeMdContent);
  for (const importPath of importPaths) {
    if (!(await fileExists(join(targetDir, importPath)))) {
      errors.push({
        rule: 'INVALID_IMPORT_PATH',
        file: 'CLAUDE.md',
        message: t('validator.invalid_import', { path: importPath }),
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: { agentCount, skillCount, fileCount },
  };
}

function extractImportPaths(content: string): string[] {
  // Remove code blocks first
  const withoutCodeBlocks = content.replace(/```[\s\S]*?```/g, '');

  const paths: string[] = [];
  const regex = /@([^\s,)]+)/g;
  for (const match of withoutCodeBlocks.matchAll(regex)) {
    const path = match[1];
    // Skip obvious non-paths like @types/node, @anthropic/skills
    if (path.includes('/') && !path.startsWith('types/') && !path.startsWith('anthropic/')) {
      paths.push(path);
    }
  }
  return paths;
}
