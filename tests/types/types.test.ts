import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  AgentConfig,
  AgentFrontmatter,
  AgentName,
  AgentSystemConfig,
  Preset,
  PresetName,
  SkillName,
  TechStackInfo,
  WorkflowConfig,
} from '../../src/types/index.js';

describe('Core Type Definitions (TICKET-002)', () => {
  describe('AgentConfig', () => {
    it('should accept valid AgentConfig', () => {
      const config: AgentConfig = { enabled: true, model: 'opus' };
      expect(config.enabled).toBe(true);
      expect(config.model).toBe('opus');
    });

    it('should accept all valid model values', () => {
      const opus: AgentConfig = { enabled: true, model: 'opus' };
      const sonnet: AgentConfig = { enabled: true, model: 'sonnet' };
      const haiku: AgentConfig = { enabled: false, model: 'haiku' };
      expect(opus.model).toBe('opus');
      expect(sonnet.model).toBe('sonnet');
      expect(haiku.model).toBe('haiku');
    });
  });

  describe('WorkflowConfig', () => {
    it('should accept valid WorkflowConfig', () => {
      const workflow: WorkflowConfig = {
        reviewMaxRounds: 5,
        qaMode: 'standard',
        visualQaLevel: 2,
        epicBased: true,
      };
      expect(workflow.reviewMaxRounds).toBe(5);
      expect(workflow.qaMode).toBe('standard');
      expect(workflow.visualQaLevel).toBe(2);
      expect(workflow.epicBased).toBe(true);
    });

    it('should accept visualQaLevel values 0, 1, 2, 3 only', () => {
      const level0: WorkflowConfig = {
        reviewMaxRounds: 0,
        qaMode: 'lite',
        visualQaLevel: 0,
        epicBased: false,
      };
      const level1: WorkflowConfig = {
        reviewMaxRounds: 0,
        qaMode: 'lite',
        visualQaLevel: 1,
        epicBased: false,
      };
      const level2: WorkflowConfig = {
        reviewMaxRounds: 0,
        qaMode: 'lite',
        visualQaLevel: 2,
        epicBased: false,
      };
      const level3: WorkflowConfig = {
        reviewMaxRounds: 0,
        qaMode: 'lite',
        visualQaLevel: 3,
        epicBased: false,
      };
      expect([
        level0.visualQaLevel,
        level1.visualQaLevel,
        level2.visualQaLevel,
        level3.visualQaLevel,
      ]).toEqual([0, 1, 2, 3]);
    });

    it('should accept qaMode "lite" and "standard"', () => {
      const lite: WorkflowConfig = {
        reviewMaxRounds: 0,
        qaMode: 'lite',
        visualQaLevel: 0,
        epicBased: false,
      };
      const standard: WorkflowConfig = {
        reviewMaxRounds: 5,
        qaMode: 'standard',
        visualQaLevel: 2,
        epicBased: true,
      };
      expect(lite.qaMode).toBe('lite');
      expect(standard.qaMode).toBe('standard');
    });
  });

  describe('PresetName', () => {
    it('should accept all 4 preset values', () => {
      const presets: PresetName[] = ['solo-dev', 'small-team', 'full-team', 'custom'];
      expect(presets).toHaveLength(4);
    });
  });

  describe('AgentName', () => {
    it('should accept all 8 agent names', () => {
      const agents: AgentName[] = [
        'po-pm',
        'architect',
        'cto',
        'designer',
        'test-writer',
        'frontend-dev',
        'backend-dev',
        'qa-reviewer',
      ];
      expect(agents).toHaveLength(8);
    });
  });

  describe('SkillName', () => {
    it('should accept all 7 skill names', () => {
      const skills: SkillName[] = [
        'scoring',
        'visual-qa',
        'tdd-workflow',
        'adr-writing',
        'ticket-writing',
        'design-system',
        'cr-process',
      ];
      expect(skills).toHaveLength(7);
    });
  });

  describe('TechStackInfo', () => {
    it('should accept valid TechStackInfo with optional fields', () => {
      const techStack: TechStackInfo = {
        framework: 'next',
        language: 'typescript',
        packageManager: 'pnpm',
        cssFramework: 'tailwindcss',
      };
      expect(techStack.framework).toBe('next');
    });

    it('should accept TechStackInfo with all fields undefined', () => {
      const empty: TechStackInfo = {};
      expect(empty).toBeDefined();
    });
  });

  describe('AgentSystemConfig', () => {
    it('should accept a fully valid AgentSystemConfig', () => {
      const config: AgentSystemConfig = {
        preset: 'solo-dev',
        projectName: 'my-app',
        scale: 'small',
        agents: {
          'po-pm': { enabled: true, model: 'opus' },
          architect: { enabled: false, model: 'opus' },
          cto: { enabled: false, model: 'opus' },
          designer: { enabled: false, model: 'opus' },
          'test-writer': { enabled: true, model: 'opus' },
          'frontend-dev': { enabled: true, model: 'opus' },
          'backend-dev': { enabled: true, model: 'opus' },
          'qa-reviewer': { enabled: true, model: 'opus' },
        },
        workflow: {
          reviewMaxRounds: 0,
          qaMode: 'lite',
          visualQaLevel: 1,
          epicBased: false,
        },
        skills: ['scoring', 'tdd-workflow', 'ticket-writing', 'cr-process'],
      };
      expect(config.preset).toBe('solo-dev');
      expect(config.projectName).toBe('my-app');
      expect(config.scale).toBe('small');
    });

    it('should accept optional techStack field', () => {
      const config: AgentSystemConfig = {
        preset: 'full-team',
        projectName: 'big-app',
        scale: 'large',
        agents: {
          'po-pm': { enabled: true, model: 'opus' },
          architect: { enabled: true, model: 'opus' },
          cto: { enabled: true, model: 'opus' },
          designer: { enabled: true, model: 'opus' },
          'test-writer': { enabled: true, model: 'opus' },
          'frontend-dev': { enabled: true, model: 'opus' },
          'backend-dev': { enabled: true, model: 'opus' },
          'qa-reviewer': { enabled: true, model: 'opus' },
        },
        workflow: {
          reviewMaxRounds: 5,
          qaMode: 'standard',
          visualQaLevel: 3,
          epicBased: true,
        },
        skills: [
          'scoring',
          'visual-qa',
          'tdd-workflow',
          'adr-writing',
          'ticket-writing',
          'design-system',
          'cr-process',
        ],
        techStack: {
          framework: 'next',
          language: 'typescript',
          packageManager: 'pnpm',
        },
      };
      expect(config.techStack).toBeDefined();
      expect(config.techStack?.framework).toBe('next');
    });
  });

  describe('Preset', () => {
    it('should accept a valid Preset', () => {
      const preset: Preset = {
        name: 'small-team',
        description: 'Small team preset',
        scale: 'medium',
        agents: {
          'po-pm': { enabled: true, model: 'opus' },
          architect: { enabled: true, model: 'opus' },
          cto: { enabled: true, model: 'opus' },
          designer: { enabled: true, model: 'opus' },
          'test-writer': { enabled: true, model: 'opus' },
          'frontend-dev': { enabled: true, model: 'opus' },
          'backend-dev': { enabled: true, model: 'opus' },
          'qa-reviewer': { enabled: true, model: 'opus' },
        },
        workflow: {
          reviewMaxRounds: 5,
          qaMode: 'standard',
          visualQaLevel: 2,
          epicBased: true,
        },
        skills: [
          'scoring',
          'visual-qa',
          'tdd-workflow',
          'adr-writing',
          'ticket-writing',
          'design-system',
          'cr-process',
        ],
      };
      expect(preset.name).toBe('small-team');
      expect(preset.scale).toBe('medium');
    });
  });

  describe('AgentFrontmatter', () => {
    it('should accept a valid AgentFrontmatter with required fields only', () => {
      const frontmatter: AgentFrontmatter = {
        name: 'backend-dev',
        description: 'Backend developer agent',
      };
      expect(frontmatter.name).toBe('backend-dev');
      expect(frontmatter.description).toBe('Backend developer agent');
    });

    it('should accept all optional fields', () => {
      const frontmatter: AgentFrontmatter = {
        name: 'frontend-dev',
        description: 'Frontend developer agent',
        tools: 'Read, Write, Edit, Grep, Glob, Bash',
        model: 'opus',
        permissionMode: 'plan',
        skills: 'visual-qa, scoring',
      };
      expect(frontmatter.tools).toBeDefined();
      expect(frontmatter.model).toBe('opus');
      expect(frontmatter.permissionMode).toBe('plan');
      expect(frontmatter.skills).toBe('visual-qa, scoring');
    });

    it('should accept model value "inherit"', () => {
      const frontmatter: AgentFrontmatter = {
        name: 'test',
        description: 'test agent',
        model: 'inherit',
      };
      expect(frontmatter.model).toBe('inherit');
    });

    it('should accept all permissionMode values', () => {
      const modes: Array<AgentFrontmatter['permissionMode']> = [
        'default',
        'acceptEdits',
        'bypassPermissions',
        'plan',
        'ignore',
      ];
      expect(modes).toHaveLength(5);
    });
  });
});
