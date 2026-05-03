import { create } from 'zustand';
import type { RequestInputRateLimit } from '../components/RequestInputButton';
import type {
  InputFileValidator,
  InputSelectOption,
  InputType,
  InputValidator,
} from './inputFieldStore';

/**
 * Global defaults applied to input-request flows created inside a Chat.
 *
 * Explicit button config still wins over these defaults.
 */
export interface RequestInputGlobalDefaults {
  /**
   * Label shown for the abort action.
   */
  readonly abortLabel?: string | undefined;
  /**
   * Message shown while the input is in cooldown.
   */
  readonly cooldownMessage?: string | undefined;
  /**
   * Cooldown duration in milliseconds before another submission is allowed.
   */
  readonly cooldownMs?: number | undefined;
  /**
   * Validator applied to uploaded files.
   */
  readonly fileValidator?: InputFileValidator | undefined;
  /**
   * Description shown alongside the request input.
   */
  readonly inputDescription?: string | undefined;
  /**
   * Select options shown by the request input.
   */
  readonly inputOptions?: readonly InputSelectOption[] | undefined;
  /**
   * Message shown when the input times out.
   */
  readonly inputTimeoutMessage?: string | undefined;
  /**
   * Timeout in milliseconds before the request input expires.
   */
  readonly inputTimeoutMs?: number | undefined;
  /**
   * Input mode used when collecting user input.
   */
  readonly inputType?: InputType | undefined;
  /**
   * Whether file uploads are allowed for the input.
   */
  readonly allowFileUpload?: boolean | undefined;
  /**
   * Minimum number of characters required for submission.
   */
  readonly minMessageLength?: number | undefined;
  /**
   * Validation message shown when the submission is too short.
   */
  readonly minMessageLengthMessage?: string | undefined;
  /**
   * Placeholder text shown by the input.
   */
  readonly placeholder?: string | undefined;
  /**
   * Rate-limit settings applied to request-input submissions.
   */
  readonly rateLimit?: RequestInputRateLimit | undefined;
  /**
   * Whether the abort action is shown while collecting input.
   */
  readonly showAbort?: boolean | undefined;
  /**
   * Whether submissions wait for the current assistant turn to finish.
   */
  readonly shouldWaitForTurn?: boolean | undefined;
  /**
   * Whether validation failure messages are suppressed.
   */
  readonly suppressValidationFailureMessage?: boolean | undefined;
  /**
   * Validator applied to text submissions.
   */
  readonly validator?: InputValidator | undefined;
}

/**
 * Global Chat-level defaults for supported flow helpers.
 */
export interface ChatGlobals {
  /**
   * Global defaults applied to request-input buttons.
   */
  readonly requestInputDefaults?: RequestInputGlobalDefaults | undefined;
}

/**
 * Shape for chat globals state.
 */
interface ChatGlobalsState {
  /**
   * Current global chat configuration state.
   */
  readonly chatGlobals: ChatGlobals;
  /**
   * Returns the chat globals.
   */
  readonly getChatGlobals: () => ChatGlobals;
  /**
   * Replaces chat-level global defaults.
   *
   * @param globals - Chat-level global defaults to store.
   */
  readonly setChatGlobals: (globals: ChatGlobals) => void;
  /**
   * Resets the chat globals.
   */
  readonly resetChatGlobals: () => void;
}

/**
 * Shared empty chat globals value used by this module.
 */
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
