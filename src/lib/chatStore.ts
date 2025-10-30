import { create } from 'zustand';
import type { Message } from '../js/types';

interface ChatState {
  readonly messages: readonly Message[];
  readonly getMessages: () => readonly Message[];
  readonly getPreviousMessage: () => Message | undefined;
  readonly addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  readonly addMessages: (messages: readonly Message[]) => void;
  readonly setMessages: (messages: readonly Message[]) => void;
  readonly clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],

  getMessages: () => {
    return get().messages;
  },

  getPreviousMessage: () => {
    const messages = get().messages;
    return messages.length > 0 ? messages[messages.length - 1] : undefined;
  },

  addMessage: (messageData) => {
    const currentMessages = get().messages;
    const newMessage: Message = {
      id: currentMessages.length + 1,
      timestamp: new Date(),
      ...messageData,
    };

    set((state) => ({
      messages: [...state.messages, newMessage],
    }));
  },

  addMessages: (messages: readonly Message[]) => {
    set((state) => ({
      messages: [...state.messages, ...messages],
    }));
  },

  setMessages: (newMessages) => {
    set({ messages: newMessages });
  },

  clearMessages: () => {
    set({ messages: [] });
  },
}));
