import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import Handlebars from 'handlebars';
import type { AgentName } from '../types/config.js';
import { TEMPLATES_DIR } from '../utils/paths.js';

const templateCache = new Map<string, ReturnType<typeof Handlebars.compile>>();

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
  let compiled = templateCache.get(templatePath);
  if (!compiled) {
    let content: string;
    try {
      content = await readFile(templatePath, 'utf-8');
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'EACCES') {
        throw new Error(`Template permission denied: ${templatePath}`);
      }
      throw new Error(`Template not found: ${templatePath}`);
    }
    compiled = Handlebars.compile(content, { noEscape: true });
    templateCache.set(templatePath, compiled);
  }
  return compiled(data);
}

export async function renderAgentTemplate(
  agentName: AgentName,
  data: AgentTemplateData,
): Promise<string> {
  const templatePath = join(TEMPLATES_DIR, 'agents', `${agentName}.md.hbs`);
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
  const templatePath = join(TEMPLATES_DIR, 'claude-md.hbs');
  const headings = data.headings ?? DEFAULT_HEADINGS;
  return renderTemplate(templatePath, { ...data, headings });
}
