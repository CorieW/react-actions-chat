/**
 * @fileoverview
 * This file contains the store, used for interacting and managing the chat.
 */

import { create } from 'zustand';
import type { InputMessage, Message } from '../js/types';
import { usePersistentButtonStore } from './persistentButtonStore';

const ABORT_BUTTON_ID = 'input-request-abort';

interface ChatState {
  readonly messages: readonly Message[];
  readonly isLoading: boolean;
  readonly loadingMessage?: string | undefined;
  readonly getMessages: () => readonly Message[];
  readonly getPreviousMessage: () => Message | undefined;
  readonly addMessage: (message: InputMessage) => void;
  readonly addMessages: (messages: readonly InputMessage[]) => void;
  readonly setMessages: (messages: readonly Message[]) => void;
  readonly setLoading: (isLoading: boolean, message?: string) => void;
  readonly clearLoading: () => void;
  readonly clearMessages: () => void;
  readonly clearButtons: () => void;
  readonly clearPreviousMessageButtons: () => void;
  readonly clearPreviousMessageCallback: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  loadingMessage: undefined,

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
      rawContent: messageData.rawContent ?? messageData.content,
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
          rawContent: messageData.rawContent ?? messageData.content ?? '',
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
    set({ messages: newMessages });
  },

  setLoading: (isLoading, message) => {
    set({
      isLoading,
      ...(isLoading
        ? { loadingMessage: message }
        : { loadingMessage: undefined }),
    });
  },

  clearLoading: () => {
    set({
      isLoading: false,
      loadingMessage: undefined,
    });
  },

  clearMessages: () => {
    set({
      messages: [],
      isLoading: false,
      loadingMessage: undefined,
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
