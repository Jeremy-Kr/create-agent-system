import { BUNDLED_DOC_SPEC } from '../core/doc-spec.js';

const ALL_HOOK_EVENTS = [
  ...BUNDLED_DOC_SPEC.hooks.validEvents,
  ...BUNDLED_DOC_SPEC.hooks.extensionEvents,
] as const;

export type HookEventName = (typeof ALL_HOOK_EVENTS)[number];

export type HookType = 'command' | 'prompt' | 'agent';

export interface HookAction {
  type: HookType;
  command?: string;
  prompt?: string;
  timeout?: number;
  statusMessage?: string;
  async?: boolean;
  model?: string;
}

export interface HookEntry {
  matcher: string;
  hooks: HookAction[];
}

export type HooksConfig = Partial<Record<HookEventName, HookEntry[]>>;
