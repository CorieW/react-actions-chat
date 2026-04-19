import { create } from 'zustand';
import type { RequestInputRateLimit } from '../components/RequestInputButton';
import type { InputType, InputValidator } from './inputFieldStore';

/**
 * Global defaults applied to input-request flows created inside a Chat.
 *
 * Explicit button config still wins over these defaults.
 */
export interface RequestInputGlobalDefaults {
  readonly abortLabel?: string | undefined;
  readonly cooldownMessage?: string | undefined;
  readonly cooldownMs?: number | undefined;
  readonly inputDescription?: string | undefined;
  readonly inputTimeoutMessage?: string | undefined;
  readonly inputTimeoutMs?: number | undefined;
  readonly inputType?: InputType | undefined;
  readonly minMessageLength?: number | undefined;
  readonly minMessageLengthMessage?: string | undefined;
  readonly placeholder?: string | undefined;
  readonly rateLimit?: RequestInputRateLimit | undefined;
  readonly showAbort?: boolean | undefined;
  readonly shouldWaitForTurn?: boolean | undefined;
  readonly suppressValidationFailureMessage?: boolean | undefined;
  readonly validator?: InputValidator | undefined;
}

/**
 * Global Chat-level defaults for supported flow helpers.
 */
export interface ChatGlobals {
  readonly requestInputDefaults?: RequestInputGlobalDefaults | undefined;
}

interface ChatGlobalsState {
  readonly chatGlobals: ChatGlobals;
  readonly getChatGlobals: () => ChatGlobals;
  readonly setChatGlobals: (globals: ChatGlobals) => void;
  readonly resetChatGlobals: () => void;
}

const EMPTY_CHAT_GLOBALS: ChatGlobals = {};

/**
 * Shared store that tracks Chat-level defaults for helper flows.
 */
export const useChatGlobalsStore = create<ChatGlobalsState>((set, get) => ({
  chatGlobals: EMPTY_CHAT_GLOBALS,

  getChatGlobals: () => {
    return get().chatGlobals;
  },

  setChatGlobals: globals => {
    set({ chatGlobals: globals });
  },

  resetChatGlobals: () => {
    set({ chatGlobals: EMPTY_CHAT_GLOBALS });
  },
}));
