import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Handlebars from 'handlebars';
import type { AgentName } from '../types/config.js';

const templatesDir = fileURLToPath(new URL('../../templates/', import.meta.url));

export interface AgentTemplateData {
  model: string;
  skills?: string;
  packageManager: string;
  visualQa: boolean;
  visualQaLevel?: number;
  epicBased: boolean;
}

export interface ClaudeMdTemplateData {
  projectName: string;
  projectDescription?: string;
  packageManager: string;
  visualQa: boolean;
  visualQaLevel?: number;
  epicBased: boolean;
  specPath?: string;
  adrPath?: string;
  activeAgents: Array<{
    displayName: string;
    alwaysRead: string;
    onDemand: string;
    exclude: string;
  }>;
  fileOwnership: Array<{
    path: string;
    owner: string;
  }>;
  headings?: Record<string, string>;
}

export async function renderTemplate(
  templatePath: string,
  data: Record<string, unknown>,
): Promise<string> {
  let content: string;
  try {
    content = await readFile(templatePath, 'utf-8');
  } catch {
    throw new Error(`Template not found: ${templatePath}`);
  }

  const compiled = Handlebars.compile(content);
  return compiled(data);
}

export async function renderAgentTemplate(
  agentName: AgentName,
  data: AgentTemplateData,
): Promise<string> {
  const templatePath = join(templatesDir, 'agents', `${agentName}.md.hbs`);
  return renderTemplate(templatePath, { ...data });
}

const DEFAULT_HEADINGS: Record<string, string> = {
  projectMemory: 'Project Memory',
  projectOverview: 'Project Overview',
  commonRules: 'Common Rules',
  buildCommands: 'Build & Test Commands',
  codeStyle: 'Code Style',
  agentContextRules: 'Agent Context Rules',
  fileOwnership: 'File Ownership',
  exclusiveOwnership: 'Exclusive Ownership',
  sharedFileRules: 'Shared File Rules',
  failureModes: 'Failure Modes & Recovery',
  detectionCriteria: 'Detection Criteria',
  escalationRules: 'Escalation Rules',
  epicDependency: 'EPIC Dependency Management',
  modelConfig: 'Model Configuration',
};

export async function renderClaudeMdTemplate(data: ClaudeMdTemplateData): Promise<string> {
  const templatePath = join(templatesDir, 'claude-md.hbs');
  const headings = data.headings ?? DEFAULT_HEADINGS;
  return renderTemplate(templatePath, { ...data, headings });
}
