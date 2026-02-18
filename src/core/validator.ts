import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { parse as parseYaml } from 'yaml';
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
      message: "Agent directory .claude/agents/ not found. Run 'create-agent-system' to scaffold.",
    });
  }

  if (!(await fileExists(claudeMdPath))) {
    errors.push({
      rule: 'STRUCTURE',
      file: 'CLAUDE.md',
      message: "CLAUDE.md not found in project root. Run 'create-agent-system' to scaffold.",
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
    for (const dir of skillDirs) {
      if (await fileExists(join(skillsDir, dir, 'SKILL.md'))) {
        skillCount++;
        fileCount++;
      }
    }
  }

  // Count CLAUDE.md
  fileCount++;

  // Validate each agent file
  for (const agentFile of agentFiles) {
    const filePath = join(agentsDir, agentFile);
    const relPath = relative(targetDir, filePath);
    const content = await readFile(filePath, 'utf-8');

    // Parse frontmatter
    let parsed: ReturnType<typeof parseFrontmatter>;
    try {
      parsed = parseFrontmatter(content);
    } catch {
      errors.push({
        rule: 'YAML_PARSE_ERROR',
        file: relPath,
        message: `Failed to parse YAML frontmatter in ${relPath}`,
      });
      continue;
    }

    if (!parsed) {
      errors.push({
        rule: 'YAML_PARSE_ERROR',
        file: relPath,
        message: `Failed to parse YAML frontmatter in ${relPath}: no frontmatter delimiters found`,
      });
      continue;
    }

    const { data, body } = parsed;

    // E002: MISSING_NAME
    if (!data.name) {
      errors.push({
        rule: 'MISSING_NAME',
        file: relPath,
        message: `Missing required field 'name' in ${relPath}`,
      });
    }

    // E003: MISSING_DESCRIPTION
    if (!data.description) {
      errors.push({
        rule: 'MISSING_DESCRIPTION',
        file: relPath,
        message: `Missing required field 'description' in ${relPath}`,
      });
    }

    // E004: UNSUPPORTED_FIELD
    for (const key of Object.keys(data)) {
      if (!(SUPPORTED_FRONTMATTER_FIELDS as readonly string[]).includes(key)) {
        errors.push({
          rule: 'UNSUPPORTED_FIELD',
          file: relPath,
          message: `Unsupported frontmatter field '${key}' in ${relPath}. Supported fields: ${SUPPORTED_FRONTMATTER_FIELDS.join(', ')}`,
        });
      }
    }

    // E005: INVALID_MODEL
    if (data.model && !(VALID_MODEL_VALUES as readonly string[]).includes(data.model as string)) {
      errors.push({
        rule: 'INVALID_MODEL',
        file: relPath,
        message: `Invalid model value '${data.model}' in ${relPath}. Valid values: ${VALID_MODEL_VALUES.join(', ')}`,
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
            message: `Skill '${skillName}' referenced in ${relPath} but .claude/skills/${skillName}/SKILL.md does not exist`,
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
        message: `Description in ${relPath} is very short (${desc.length} chars). Consider adding more detail (recommended: 20+ chars)`,
      });
    }

    // W002: LONG_DESCRIPTION
    if (desc && desc.length > 1024) {
      warnings.push({
        rule: 'LONG_DESCRIPTION',
        file: relPath,
        message: `Description in ${relPath} is very long (${desc.length} chars). Consider shortening (recommended: under 1024 chars)`,
      });
    }

    // W003: MISSING_TOOLS
    if (!data.tools) {
      warnings.push({
        rule: 'MISSING_TOOLS',
        file: relPath,
        message: `No 'tools' field in ${relPath}. All tools will be inherited. If intentional, this is fine.`,
      });
    }

    // W004: DUPLICATE_CONTENT
    for (const keyword of DUPLICATE_CONTENT_KEYWORDS) {
      if (body.includes(keyword)) {
        warnings.push({
          rule: 'DUPLICATE_CONTENT',
          file: relPath,
          message: `Agent definition ${relPath} appears to contain '${keyword}' which should be in CLAUDE.md only (SSOT principle)`,
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
        message: `Import path '@${importPath}' in CLAUDE.md references nonexistent file`,
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
