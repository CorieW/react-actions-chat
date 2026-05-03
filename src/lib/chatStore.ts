/**
 * @fileoverview
 * This file contains the store, used for interacting and managing the chat.
 */

import { create } from 'zustand';
import type { InputMessage, Message } from '../js/types';
import { getMessageRawText, revokeMessagePartUploadUrls } from './messageParts';
import { usePersistentButtonStore } from './persistentButtonStore';

/**
 * Shared abort button ID value used by this module.
 */
const ABORT_BUTTON_ID = 'input-request-abort';

/**
 * Partial chat store updates applied in one store call.
 *
 * Only the provided properties are changed.
 */
export interface ChatStateParams {
  /**
   * Whether loading is true.
   */
  readonly isLoading?: boolean | undefined;
  /**
   * Messages associated with the transcript or support record.
   */
  readonly messages?: readonly Message[] | undefined;
}

/**
 * Internal partial state patch applied to the chat store.
 */
type ChatStatePatch = {
  /**
   * Whether loading is true.
   */
  isLoading?: boolean;
  /**
   * Monotonic counter for loading-state writes.
   */
  loadingMutationId?: number;
  /**
   * Messages associated with the transcript or support record.
   */
  messages?: readonly Message[];
};

/**
 * Internal chat store shape.
 *
 * @property messages Current chat transcript.
 * @property isLoading Whether the chat is currently waiting on async work.
 * @property loadingMutationId Monotonic counter for loading-state writes.
 * @property getMessages Returns the current chat transcript.
 * @property getPreviousMessage Returns the latest message in the transcript.
 * @property addMessage Adds one message to the transcript.
 * @property addMessages Adds multiple messages to the transcript.
 * @property setMessages Replaces the transcript with a new message list.
 * @property setLoading Sets the loading state.
 * @property setChatState Applies multiple chat state updates in one call.
 * @property clearLoading Clears the loading state.
 * @property clearMessages Clears the transcript and loading state.
 * @property clearButtons Removes buttons from all messages.
 * @property clearPreviousMessageButtons Removes buttons from the latest message.
 * @property clearPreviousMessageCallback Removes the latest message callback.
 */
interface ChatState {
  /**
   * Messages associated with the transcript or support record.
   */
  readonly messages: readonly Message[];
  /**
   * Whether loading is true.
   */
  readonly isLoading: boolean;
  /**
   * Monotonic counter incremented whenever loading state is explicitly written.
   */
  readonly loadingMutationId: number;
  /**
   * Returns the messages.
   */
  readonly getMessages: () => readonly Message[];
  /**
   * Returns the previous message.
   */
  readonly getPreviousMessage: () => Message | undefined;
  /**
   * Adds one message to the transcript.
   *
   * @param message - Message to add, inspect, or render.
   */
  readonly addMessage: (message: InputMessage) => void;
  /**
   * Adds multiple messages to the transcript.
   *
   * @param messages - Messages to process.
   */
  readonly addMessages: (messages: readonly InputMessage[]) => void;
  /**
   * Replaces the transcript.
   *
   * @param messages - Messages to process.
   */
  readonly setMessages: (messages: readonly Message[]) => void;
  /**
   * Sets loading.
   *
   * @param isLoading - Loading state to apply.
   */
  readonly setLoading: (isLoading: boolean) => void;
  /**
   * Applies a partial chat state update.
   *
   * @param params - Partial state parameters to apply.
   */
  readonly setChatState: (params: ChatStateParams) => void;
  /**
   * Clears the loading.
   */
  readonly clearLoading: () => void;
  /**
   * Clears the messages.
   */
  readonly clearMessages: () => void;
  /**
   * Clears the buttons.
   */
  readonly clearButtons: () => void;
  /**
   * Clears the previous message buttons.
   */
  readonly clearPreviousMessageButtons: () => void;
  /**
   * Clears the previous message callback.
   */
  readonly clearPreviousMessageCallback: () => void;
}

/**
 * Shared chat state store for messages and loading state.
 */
export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  loadingMutationId: 0,

  getMessages: () => {
    return get().messages;
  },

  getPreviousMessage: () => {
    const messages = get().messages;
    return messages.length > 0 ? messages[messages.length - 1] : undefined;
  },

  addMessage: messageData => {
    const currentMessages = get().messages;
    const newMessage: Message = {
      id: currentMessages.length + 1,
      timestamp: new Date(),
      rawContent:
        messageData.rawContent ?? getMessageRawText(messageData.parts),
      ...messageData,
    };

    // Clear the abort button from persistent buttons when a new message appears
    const { removeButton } = usePersistentButtonStore.getState();
    removeButton(ABORT_BUTTON_ID);

    set(state => ({
      // Clear buttons from all previous messages before adding the new one
      messages: [
        ...state.messages.map(message => ({ ...message, buttons: [] })),
        newMessage,
      ],
    }));
  },

  addMessages: messages => {
    set(state => {
      const currentMessages = state.messages;
      let nextId = currentMessages.length + 1;
      const now = new Date();
      const newMessages: Message[] = messages.map(messageData => {
        const msg: Message = {
          id: nextId++,
          timestamp: now,
          rawContent:
            messageData.rawContent ?? getMessageRawText(messageData.parts),
          ...messageData,
        };
        return msg;
      });
      return {
        messages: [...currentMessages, ...newMessages],
      };
    });
  },

  setMessages: newMessages => {
    get().setChatState({ messages: newMessages });
  },

  setLoading: isLoading => {
    get().setChatState({ isLoading });
  },

  setChatState: params => {
    const nextState: ChatStatePatch = {};

    if (params.messages !== undefined) {
      if (params.messages !== get().messages) {
        revokeMessagePartUploadUrls(get().messages, params.messages);
      }
      nextState.messages = params.messages;
    }

    if (params.isLoading !== undefined) {
      nextState.isLoading = params.isLoading;
      nextState.loadingMutationId = get().loadingMutationId + 1;
    }

    set(nextState);
  },

  clearLoading: () => {
    get().setChatState({ isLoading: false });
  },

  clearMessages: () => {
    get().setChatState({
      messages: [],
      isLoading: false,
    });
  },

  clearButtons: () => {
    set(state => ({
      messages: state.messages.map(message => ({
        ...message,
        buttons: [],
      })),
    }));
  },

  clearPreviousMessageButtons: () => {
    const previousMessage = get().getPreviousMessage();
    if (previousMessage) {
      set(state => ({
        messages: state.messages.map(message =>
          message.id === previousMessage.id
            ? { ...message, buttons: [] }
            : message
        ),
      }));
    }
  },

  clearPreviousMessageCallback: () => {
    const previousMessage = get().getPreviousMessage();
    if (previousMessage) {
      set(state => ({
        messages: state.messages.map(message => {
          if (message.id === previousMessage.id) {
            const { userResponseCallback: _userResponseCallback, ...rest } =
              message;
            return rest;
          }
          return message;
        }),
      }));
    }
  },
}));
