/**
 * @fileoverview
 * This file contains the store, used for interacting and managing the chat.
 */

import { create } from 'zustand';
import type { InputMessage, Message } from '../js/types';
import { getMessageRawText, revokeMessagePartUploadUrls } from './messageParts';
import { usePersistentButtonStore } from './persistentButtonStore';

const ABORT_BUTTON_ID = 'input-request-abort';

/**
 * Partial chat store updates applied in one store call.
 *
 * Only the provided properties are changed.
 */
export interface ChatStateParams {
  readonly isLoading?: boolean | undefined;
  readonly messages?: readonly Message[] | undefined;
}

type ChatStatePatch = {
  isLoading?: boolean;
  messages?: readonly Message[];
};

/**
 * Internal chat store shape.
 *
 * @property messages Current chat transcript.
 * @property isLoading Whether the chat is currently waiting on async work.
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
  readonly messages: readonly Message[];
  readonly isLoading: boolean;
  readonly getMessages: () => readonly Message[];
  readonly getPreviousMessage: () => Message | undefined;
  readonly addMessage: (message: InputMessage) => void;
  readonly addMessages: (messages: readonly InputMessage[]) => void;
  readonly setMessages: (messages: readonly Message[]) => void;
  readonly setLoading: (isLoading: boolean) => void;
  readonly setChatState: (params: ChatStateParams) => void;
  readonly clearLoading: () => void;
  readonly clearMessages: () => void;
  readonly clearButtons: () => void;
  readonly clearPreviousMessageButtons: () => void;
  readonly clearPreviousMessageCallback: () => void;
}

/**
 * Shared chat state store for messages and loading state.
 */
export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,

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
