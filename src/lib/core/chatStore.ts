import { createStore } from 'zustand/vanilla';
import type { Message } from '../../js/types';
import { persistentButtonStore } from './persistentButtonStore';

const ABORT_BUTTON_ID = 'input-request-abort';

export interface ChatStoreState {
  readonly messages: readonly Message[];
}

export interface ChatStoreActions {
  readonly getMessages: () => readonly Message[];
  readonly getPreviousMessage: () => Message | undefined;
  readonly addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  readonly addMessages: (messages: readonly Message[]) => void;
  readonly setMessages: (messages: readonly Message[]) => void;
  readonly clearMessages: () => void;
  readonly clearButtons: () => void;
  readonly clearPreviousMessageButtons: () => void;
  readonly clearPreviousMessageCallback: () => void;
}

export type ChatStore = ChatStoreState & ChatStoreActions;

/**
 * Creates a vanilla Zustand store for managing chat messages.
 * This is framework-agnostic and can be used with any framework or vanilla JS.
 *
 * @param persistentButtonStoreInstance - Optional custom persistent button store instance.
 *        Defaults to the singleton persistentButtonStore.
 */
export const createChatStore = (
  persistentButtonStoreInstance = persistentButtonStore
) =>
  createStore<ChatStore>((set, get) => ({
    messages: [],

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
        ...messageData,
      };

      // Clear the abort button from persistent buttons when a new message appears
      const { removeButton } = persistentButtonStoreInstance.getState();
      removeButton(ABORT_BUTTON_ID);

      set(state => ({
        // Clear buttons from all previous messages before adding the new one
        messages: [
          ...state.messages.map(message => ({ ...message, buttons: [] })),
          newMessage,
        ],
      }));
    },

    addMessages: (messages: readonly Message[]) => {
      set(state => ({
        messages: [...state.messages, ...messages],
      }));
    },

    setMessages: newMessages => {
      set({ messages: newMessages });
    },

    clearMessages: () => {
      set({ messages: [] });
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
              const { userResponseCallback, ...rest } = message;
              return rest;
            }
            return message;
          }),
        }));
      }
    },
  }));

/**
 * Default singleton instance of the chat store.
 * Use this for simple cases where a single store is needed.
 */
export const chatStore = createChatStore();
