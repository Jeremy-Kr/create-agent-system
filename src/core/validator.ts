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

// --- Rule functions ---

function checkYamlParsing(
  relPath: string,
  content: string,
):
  | { parsed: { data: Record<string, unknown>; body: string }; issues: never[] }
  | { parsed: null; issues: ValidationIssue[] } {
  let parsed: ReturnType<typeof parseFrontmatter>;
  try {
    parsed = parseFrontmatter(content);
  } catch {
    return {
      parsed: null,
      issues: [
        {
          rule: 'YAML_PARSE_ERROR',
          file: relPath,
          message: t('validator.yaml_parse_error', { file: relPath }),
        },
      ],
    };
  }

  if (!parsed) {
    return {
      parsed: null,
      issues: [
        {
          rule: 'YAML_PARSE_ERROR',
          file: relPath,
          message: t('validator.yaml_no_frontmatter', { file: relPath }),
        },
      ],
    };
  }

  return { parsed, issues: [] };
}

function checkMissingName(relPath: string, data: Record<string, unknown>): ValidationIssue | null {
  if (!data.name) {
    return {
      rule: 'MISSING_NAME',
      file: relPath,
      message: t('validator.missing_name', { file: relPath }),
    };
  }
  return null;
}

function checkMissingDescription(
  relPath: string,
  data: Record<string, unknown>,
): ValidationIssue | null {
  if (!data.description) {
    return {
      rule: 'MISSING_DESCRIPTION',
      file: relPath,
      message: t('validator.missing_description', { file: relPath }),
    };
  }
  return null;
}

function checkUnsupportedFields(relPath: string, data: Record<string, unknown>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const key of Object.keys(data)) {
    if (!(SUPPORTED_FRONTMATTER_FIELDS as readonly string[]).includes(key)) {
      issues.push({
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
  return issues;
}

function checkInvalidModel(relPath: string, data: Record<string, unknown>): ValidationIssue | null {
  if (data.model && !(VALID_MODEL_VALUES as readonly string[]).includes(data.model as string)) {
    return {
      rule: 'INVALID_MODEL',
      file: relPath,
      message: t('validator.invalid_model', {
        file: relPath,
        model: String(data.model),
        valid: VALID_MODEL_VALUES.join(', '),
      }),
    };
  }
  return null;
}

async function checkInvalidSkillRef(
  relPath: string,
  data: Record<string, unknown>,
  skillsDir: string,
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  if (data.skills && typeof data.skills === 'string') {
    const skillNames = data.skills.split(',').map((s: string) => s.trim());
    for (const skillName of skillNames) {
      if (!skillName) continue;
      const skillPath = join(skillsDir, skillName, 'SKILL.md');
      if (!(await fileExists(skillPath))) {
        issues.push({
          rule: 'INVALID_SKILL_REFERENCE',
          file: relPath,
          message: t('validator.invalid_skill_ref', { file: relPath, skill: skillName }),
        });
      }
    }
  }
  return issues;
}

function checkShortDescription(
  relPath: string,
  data: Record<string, unknown>,
): ValidationIssue | null {
  const desc = data.description as string | undefined;
  if (desc && desc.length < 20) {
    return {
      rule: 'SHORT_DESCRIPTION',
      file: relPath,
      message: t('validator.short_description', { file: relPath, length: desc.length }),
    };
  }
  return null;
}

function checkLongDescription(
  relPath: string,
  data: Record<string, unknown>,
): ValidationIssue | null {
  const desc = data.description as string | undefined;
  if (desc && desc.length > 1024) {
    return {
      rule: 'LONG_DESCRIPTION',
      file: relPath,
      message: t('validator.long_description', { file: relPath, length: desc.length }),
    };
  }
  return null;
}

function checkMissingTools(relPath: string, data: Record<string, unknown>): ValidationIssue | null {
  if (!data.tools) {
    return {
      rule: 'MISSING_TOOLS',
      file: relPath,
      message: t('validator.missing_tools', { file: relPath }),
    };
  }
  return null;
}

function checkDuplicateContent(relPath: string, body: string): ValidationIssue | null {
  for (const keyword of DUPLICATE_CONTENT_KEYWORDS) {
    if (body.includes(keyword)) {
      return {
        rule: 'DUPLICATE_CONTENT',
        file: relPath,
        message: t('validator.duplicate_content', { file: relPath, keyword }),
      };
    }
  }
  return null;
}

async function checkImportPaths(content: string, targetDir: string): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const importPaths = extractImportPaths(content);
  for (const importPath of importPaths) {
    if (!(await fileExists(join(targetDir, importPath)))) {
      issues.push({
        rule: 'INVALID_IMPORT_PATH',
        file: 'CLAUDE.md',
        message: t('validator.invalid_import', { path: importPath }),
      });
    }
  }
  return issues;
}

// --- Main validate function ---

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

  fileCount++;

  // Validate each agent file
  const agentContents = await Promise.all(
    agentFiles.map(async (agentFile) => {
      const filePath = join(agentsDir, agentFile);
      const relPath = relative(targetDir, filePath);
      const content = await readFile(filePath, 'utf-8');
      return { relPath, content };
    }),
  );

  for (const { relPath, content } of agentContents) {
    const yamlResult = checkYamlParsing(relPath, content);
    if (!yamlResult.parsed) {
      errors.push(...yamlResult.issues);
      continue;
    }

    const { data, body } = yamlResult.parsed;

    // Error rules
    const nameIssue = checkMissingName(relPath, data);
    if (nameIssue) errors.push(nameIssue);

    const descIssue = checkMissingDescription(relPath, data);
    if (descIssue) errors.push(descIssue);

    errors.push(...checkUnsupportedFields(relPath, data));

    const modelIssue = checkInvalidModel(relPath, data);
    if (modelIssue) errors.push(modelIssue);

    errors.push(...(await checkInvalidSkillRef(relPath, data, skillsDir)));

    // Warning rules
    const shortDesc = checkShortDescription(relPath, data);
    if (shortDesc) warnings.push(shortDesc);

    const longDesc = checkLongDescription(relPath, data);
    if (longDesc) warnings.push(longDesc);

    const missingTools = checkMissingTools(relPath, data);
    if (missingTools) warnings.push(missingTools);

    const duplicateContent = checkDuplicateContent(relPath, body);
    if (duplicateContent) warnings.push(duplicateContent);
  }

  // E007: CLAUDE.md import paths
  const claudeMdContent = await readFile(claudeMdPath, 'utf-8');
  errors.push(...(await checkImportPaths(claudeMdContent, targetDir)));

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: { agentCount, skillCount, fileCount },
  };
}

function extractImportPaths(content: string): string[] {
  const withoutCodeBlocks = content.replace(/```[\s\S]*?```/g, '');

  const paths: string[] = [];
  const regex = /@([^\s,)]+)/g;
  for (const match of withoutCodeBlocks.matchAll(regex)) {
    const path = match[1];
    if (path.includes('/') && !path.startsWith('types/') && !path.startsWith('anthropic/')) {
      paths.push(path);
    }
  }
  return paths;
}
