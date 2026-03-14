/**
 * @fileoverview
 * This file contains the store, used for interacting and managing the chat.
 */

import { create } from 'zustand';
import type {
  ChatFlow,
  InputMessage,
  Message,
  TriggerFlowOptions,
} from '../js/types';
import { usePersistentButtonStore } from './persistentButtonStore';

const ABORT_BUTTON_ID = 'input-request-abort';

function toMessages(
  messages: readonly InputMessage[],
  startId: number
): Message[] {
  let nextId = startId;
  const now = new Date();

  return messages.map(messageData => {
    const msg: Message = {
      id: nextId++,
      timestamp: messageData.timestamp ?? now,
      rawContent: messageData.rawContent ?? messageData.content ?? '',
      ...messageData,
    };
    return msg;
  });
}

function getInitialFlowMessages(flow: ChatFlow): readonly InputMessage[] {
  if (flow.initialMessages && flow.initialMessages.length > 0) {
    return flow.initialMessages;
  }

  return flow.initialMessage ? [flow.initialMessage] : [];
}

interface ChatState {
  readonly messages: readonly Message[];
  readonly activeFlow: ChatFlow | undefined;
  readonly getMessages: () => readonly Message[];
  readonly getActiveFlow: () => ChatFlow | undefined;
  readonly getPreviousMessage: () => Message | undefined;
  readonly addMessage: (message: InputMessage) => void;
  readonly addMessages: (messages: readonly InputMessage[]) => void;
  readonly setMessages: (messages: readonly Message[]) => void;
  readonly startFlow: (flow: ChatFlow, options?: TriggerFlowOptions) => void;
  readonly clearActiveFlow: () => void;
  readonly clearMessages: () => void;
  readonly clearButtons: () => void;
  readonly clearPreviousMessageButtons: () => void;
  readonly clearPreviousMessageCallback: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  activeFlow: undefined,

  getMessages: () => {
    return get().messages;
  },

  getActiveFlow: () => {
    return get().activeFlow;
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
      const newMessages = toMessages(messages, currentMessages.length + 1);
      return {
        messages: [...currentMessages, ...newMessages],
      };
    });
  },

  setMessages: newMessages => {
    set({ messages: newMessages });
  },

  startFlow: (flow, options) => {
    const previousActiveFlow = get().getActiveFlow();
    previousActiveFlow?.onExit?.();

    const { clearButtons, removeButton } = usePersistentButtonStore.getState();
    removeButton(ABORT_BUTTON_ID);
    if (options?.clearPersistentButtons ?? true) {
      clearButtons();
    }

    const shouldClearMessages = options?.clearMessages ?? true;
    const baseMessages = shouldClearMessages ? [] : get().messages;
    const flowMessages = toMessages(
      getInitialFlowMessages(flow),
      baseMessages.length + 1
    );

    set({
      messages: [...baseMessages, ...flowMessages],
      activeFlow: flow,
    });

    flow.onEnter?.();
  },

  clearActiveFlow: () => {
    const previousActiveFlow = get().getActiveFlow();
    previousActiveFlow?.onExit?.();
    set({ activeFlow: undefined });
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
