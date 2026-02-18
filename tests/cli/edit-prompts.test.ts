import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initI18n } from '../../src/i18n/index.js';
import type { Preset } from '../../src/types/preset.js';

// Mock @clack/prompts
vi.mock('@clack/prompts', () => ({
  isCancel: vi.fn(() => false),
  cancel: vi.fn(),
  log: {
    info: vi.fn(),
    message: vi.fn(),
    error: vi.fn(),
    step: vi.fn(),
    success: vi.fn(),
  },
  select: vi.fn(),
  multiselect: vi.fn(),
  text: vi.fn(),
  confirm: vi.fn(),
}));

// Mock config-file-loader
vi.mock('../../src/core/config-file-loader.js', () => ({
  detectConfigFile: vi.fn(),
  loadConfigFile: vi.fn(),
  saveConfigFile: vi.fn(),
}));

// Mock scaffolder
vi.mock('../../src/core/scaffolder.js', () => ({
  scaffold: vi.fn().mockResolvedValue({ files: [], warnings: [] }),
}));

// Mock detect
vi.mock('../../src/utils/detect.js', () => ({
  detectTechStack: vi.fn().mockResolvedValue({}),
}));

import * as clack from '@clack/prompts';
import { runEditFlow } from '../../src/cli/edit-prompts.js';
import {
  detectConfigFile,
  loadConfigFile,
  saveConfigFile,
} from '../../src/core/config-file-loader.js';

const mockPreset: Preset = {
  name: 'small-team',
  description: 'Small Team preset',
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
  skills: ['scoring', 'tdd-workflow', 'ticket-writing'],
};

describe('edit-prompts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    initI18n('en');
  });

  it('should show error when no config exists', async () => {
    vi.mocked(detectConfigFile).mockResolvedValue(false);

    await runEditFlow('/tmp/test');

    expect(clack.log.error).toHaveBeenCalledWith(expect.stringContaining('No config'));
    expect(loadConfigFile).not.toHaveBeenCalled();
  });

  it('should load config and display summary', async () => {
    vi.mocked(detectConfigFile).mockResolvedValue(true);
    vi.mocked(loadConfigFile).mockResolvedValue({
      preset: mockPreset,
      projectName: 'test-proj',
    });
    // Section select → skills, then skill multiselect, save method → cancel
    vi.mocked(clack.select)
      .mockResolvedValueOnce('skills') // chooseSection
      .mockResolvedValueOnce('cancel'); // chooseSaveMethod
    vi.mocked(clack.multiselect).mockResolvedValueOnce(['scoring', 'tdd-workflow']);

    await runEditFlow('/tmp/test');

    expect(clack.log.info).toHaveBeenCalledWith(expect.stringContaining('Current configuration'));
    expect(clack.log.message).toHaveBeenCalledWith(expect.stringContaining('test-proj'));
  });

  it('should save config only when config_only selected', async () => {
    vi.mocked(detectConfigFile).mockResolvedValue(true);
    vi.mocked(loadConfigFile).mockResolvedValue({
      preset: mockPreset,
      projectName: 'test-proj',
    });
    // Section → workflow, then workflow prompts, save → config_only
    vi.mocked(clack.select)
      .mockResolvedValueOnce('workflow') // chooseSection
      .mockResolvedValueOnce('lite') // qaMode
      .mockResolvedValueOnce(1) // visualQaLevel
      .mockResolvedValueOnce('config_only'); // chooseSaveMethod
    vi.mocked(clack.text).mockResolvedValueOnce('3'); // reviewMaxRounds
    vi.mocked(clack.confirm).mockResolvedValueOnce(false); // epicBased

    await runEditFlow('/tmp/test');

    expect(saveConfigFile).toHaveBeenCalled();
    expect(clack.log.success).toHaveBeenCalledWith(expect.stringContaining('saved'));
  });

  it('should cancel without saving when cancel selected', async () => {
    vi.mocked(detectConfigFile).mockResolvedValue(true);
    vi.mocked(loadConfigFile).mockResolvedValue({
      preset: mockPreset,
      projectName: 'test-proj',
    });
    // Section → agents, then agent multiselect, save → cancel
    vi.mocked(clack.select)
      .mockResolvedValueOnce('agents') // chooseSection
      .mockResolvedValueOnce('cancel'); // chooseSaveMethod
    vi.mocked(clack.multiselect).mockResolvedValueOnce(['po-pm', 'backend-dev']);

    await runEditFlow('/tmp/test');

    expect(saveConfigFile).not.toHaveBeenCalled();
  });

  it('should re-scaffold when config_and_scaffold selected', async () => {
    const { scaffold } = await import('../../src/core/scaffolder.js');
    vi.mocked(detectConfigFile).mockResolvedValue(true);
    vi.mocked(loadConfigFile).mockResolvedValue({
      preset: mockPreset,
      projectName: 'test-proj',
    });
    // Section → skills, then skill multiselect, save → config_and_scaffold
    vi.mocked(clack.select)
      .mockResolvedValueOnce('skills') // chooseSection
      .mockResolvedValueOnce('config_and_scaffold'); // chooseSaveMethod
    vi.mocked(clack.multiselect).mockResolvedValueOnce(['scoring']);

    await runEditFlow('/tmp/test');

    expect(saveConfigFile).toHaveBeenCalled();
    expect(scaffold).toHaveBeenCalled();
  });

  it('should handle "all" section edit', async () => {
    vi.mocked(detectConfigFile).mockResolvedValue(true);
    vi.mocked(loadConfigFile).mockResolvedValue({
      preset: mockPreset,
      projectName: 'test-proj',
    });
    // Section → all
    vi.mocked(clack.select)
      .mockResolvedValueOnce('all') // chooseSection
      .mockResolvedValueOnce('lite') // qaMode (workflow)
      .mockResolvedValueOnce(0) // visualQaLevel (workflow)
      .mockResolvedValueOnce('cancel'); // chooseSaveMethod
    vi.mocked(clack.multiselect)
      .mockResolvedValueOnce(['po-pm', 'backend-dev']) // agents
      .mockResolvedValueOnce(['scoring']); // skills
    vi.mocked(clack.text).mockResolvedValueOnce('0'); // reviewMaxRounds
    vi.mocked(clack.confirm).mockResolvedValueOnce(false); // epicBased

    await runEditFlow('/tmp/test');

    // All three sections should have been prompted
    expect(clack.multiselect).toHaveBeenCalledTimes(2); // agents + skills
    expect(clack.text).toHaveBeenCalledTimes(1); // reviewMaxRounds
  });
});
