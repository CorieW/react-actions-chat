import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createFilePart, createTextPart } from '../index';
import { useChatStore } from '../lib/chatStore';
import { usePersistentButtonStore } from '../lib/persistentButtonStore';
import type { InputMessage, Message } from '../js/types';

function createInputMessage(
  text: string,
  message: Omit<InputMessage, 'parts'>
): InputMessage {
  return {
    ...message,
    parts: [createTextPart(text)],
  };
}

function createStoredMessage(
  text: string,
  message: Omit<Message, 'parts' | 'rawContent'>
): Message {
  return {
    ...message,
    parts: [createTextPart(text)],
    rawContent: text,
  };
}

function createStoredFileMessage(
  url: string,
  fileName: string,
  message: Omit<Message, 'parts' | 'rawContent'>
): Message {
  return {
    ...message,
    parts: [
      createFilePart(url, {
        fileName,
      }),
    ],
    rawContent: fileName,
  };
}

function getMessageText(message: Message | undefined): string {
  const firstPart = message?.parts[0];
  if (!firstPart || firstPart.type !== 'text') {
    return '';
  }

  return firstPart.text;
}

describe('Chat Store Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    // Clear store before each test
    useChatStore.getState().clearMessages();
    usePersistentButtonStore.getState().clearButtons();
  });

  describe('addMessage', () => {
    it('should add message with id and timestamp', () => {
      const store = useChatStore.getState();

      store.addMessage(
        createInputMessage('Hello', {
          type: 'self',
        })
      );

      const messages = store.getMessages();
      expect(messages).toHaveLength(1);
      expect(messages[0]).toMatchObject({
        id: 1,
        type: 'self',
        rawContent: 'Hello',
      });
      expect(getMessageText(messages[0])).toBe('Hello');
      expect(messages[0]?.timestamp).toBeInstanceOf(Date);
    });

    it('should increment id for each message', () => {
      const store = useChatStore.getState();

      store.addMessage(createInputMessage('First', { type: 'self' }));
      store.addMessage(createInputMessage('Second', { type: 'other' }));
      store.addMessage(createInputMessage('Third', { type: 'self' }));

      const messages = store.getMessages();
      expect(messages).toHaveLength(3);
      expect(messages[0]?.id).toBe(1);
      expect(messages[1]?.id).toBe(2);
      expect(messages[2]?.id).toBe(3);
    });

    it('should clear buttons from previous messages when adding new message', () => {
      const store = useChatStore.getState();

      store.addMessage(
        createInputMessage('First message', {
          type: 'other',
          buttons: [{ label: 'Button 1' }],
        })
      );

      expect(store.getMessages()[0]?.buttons).toHaveLength(1);

      store.addMessage(
        createInputMessage('Second message', {
          type: 'self',
        })
      );

      const messages = store.getMessages();
      expect(messages).toHaveLength(2);
      expect(messages[0]?.buttons).toEqual([]);
      expect(messages[1]?.buttons).toBeUndefined();
    });

    it('should remove abort button from persistent buttons', () => {
      const persistentStore = usePersistentButtonStore.getState();
      persistentStore.addButton({
        id: 'input-request-abort',
        label: 'Abort',
        onClick: () => {},
      });

      expect(persistentStore.getButtons()).toHaveLength(1);

      const chatStore = useChatStore.getState();
      chatStore.addMessage(
        createInputMessage('New message', {
          type: 'self',
        })
      );

      expect(persistentStore.getButtons()).toHaveLength(0);
    });
  });

  describe('addMessages', () => {
    it('should add multiple messages at once', () => {
      const store = useChatStore.getState();

      const messages: InputMessage[] = [
        createInputMessage('First', {
          id: 1,
          type: 'other',
          timestamp: new Date(),
        }),
        createInputMessage('Second', {
          id: 2,
          type: 'self',
          timestamp: new Date(),
        }),
      ];

      store.addMessages(messages);

      expect(store.getMessages()).toHaveLength(2);
      expect(getMessageText(store.getMessages()[0])).toBe('First');
      expect(getMessageText(store.getMessages()[1])).toBe('Second');
    });

    it('should append to existing messages', () => {
      const store = useChatStore.getState();

      store.addMessage(createInputMessage('Existing', { type: 'self' }));

      const newMessages: InputMessage[] = [
        createInputMessage('New', {
          id: 2,
          type: 'other',
          timestamp: new Date(),
        }),
      ];

      store.addMessages(newMessages);

      expect(store.getMessages()).toHaveLength(2);
    });
  });

  describe('setMessages', () => {
    it('should replace all messages', () => {
      const store = useChatStore.getState();

      store.addMessage(createInputMessage('First', { type: 'self' }));
      store.addMessage(createInputMessage('Second', { type: 'other' }));

      expect(store.getMessages()).toHaveLength(2);

      const newMessages: Message[] = [
        createStoredMessage('Replaced', {
          id: 10,
          type: 'other',
          timestamp: new Date(),
        }),
      ];

      store.setMessages(newMessages);

      const messages = store.getMessages();
      expect(messages).toHaveLength(1);
      expect(getMessageText(messages[0])).toBe('Replaced');
      expect(messages[0]?.id).toBe(10);
    });

    it('should handle empty array', () => {
      const store = useChatStore.getState();

      store.addMessage(createInputMessage('Test', { type: 'self' }));
      store.setMessages([]);

      expect(store.getMessages()).toHaveLength(0);
    });

    it('should preserve blob upload URLs when the same uploaded message stays in the transcript', () => {
      const store = useChatStore.getState();
      const revokeSpy = vi
        .spyOn(URL, 'revokeObjectURL')
        .mockImplementation(() => {});

      store.setMessages([
        createStoredFileMessage('blob:upload-1', 'invoice.pdf', {
          id: 1,
          type: 'self',
          timestamp: new Date(),
          buttons: [{ label: 'Download' }],
        }),
      ]);

      revokeSpy.mockClear();

      store.setMessages(
        store.getMessages().map(message => ({
          ...message,
          buttons: [],
        }))
      );

      expect(revokeSpy).not.toHaveBeenCalled();
      const nextMessage = store.getMessages()[0];
      expect(nextMessage?.parts[0]).toMatchObject({
        type: 'file',
        url: 'blob:upload-1',
      });
    });
  });

  describe('setChatState', () => {
    it('should update multiple chat params in one call', () => {
      const store = useChatStore.getState();
      const messages: Message[] = [
        createStoredMessage('Ready', {
          id: 1,
          type: 'other',
          timestamp: new Date(),
        }),
      ];

      store.setChatState({
        messages,
        isLoading: true,
      });

      expect(store.getMessages()).toEqual(messages);
      expect(useChatStore.getState().isLoading).toBe(true);
    });

    it('should only change the provided chat params', () => {
      const store = useChatStore.getState();

      store.addMessage(createInputMessage('Keep me', { type: 'self' }));
      store.setChatState({ isLoading: true });

      expect(store.getMessages()).toHaveLength(1);
      expect(getMessageText(store.getMessages()[0])).toBe('Keep me');
      expect(useChatStore.getState().isLoading).toBe(true);
    });
  });

  describe('getMessages', () => {
    it('should return current messages', () => {
      const store = useChatStore.getState();

      store.addMessage(createInputMessage('Test', { type: 'self' }));
      const messages = store.getMessages();

      expect(messages).toHaveLength(1);
      expect(getMessageText(messages[0])).toBe('Test');
    });

    it('should return empty array when no messages', () => {
      const store = useChatStore.getState();
      expect(store.getMessages()).toEqual([]);
    });
  });

  describe('getPreviousMessage', () => {
    it('should return last message', () => {
      const store = useChatStore.getState();

      store.addMessage(createInputMessage('First', { type: 'self' }));
      store.addMessage(createInputMessage('Last', { type: 'other' }));

      const previousMessage = store.getPreviousMessage();
      expect(getMessageText(previousMessage)).toBe('Last');
    });

    it('should return undefined when no messages', () => {
      const store = useChatStore.getState();
      expect(store.getPreviousMessage()).toBeUndefined();
    });
  });

  describe('clearMessages', () => {
    it('should remove all messages', () => {
      const store = useChatStore.getState();

      store.addMessage(createInputMessage('First', { type: 'self' }));
      store.addMessage(createInputMessage('Second', { type: 'other' }));

      expect(store.getMessages()).toHaveLength(2);

      store.clearMessages();

      expect(store.getMessages()).toEqual([]);
    });

    it('should clear loading state', () => {
      const store = useChatStore.getState();

      store.setLoading(true);
      store.clearMessages();

      expect(useChatStore.getState().isLoading).toBe(false);
    });

    it('should revoke blob upload URLs when uploaded messages are removed', () => {
      const store = useChatStore.getState();
      const revokeSpy = vi
        .spyOn(URL, 'revokeObjectURL')
        .mockImplementation(() => {});

      store.setMessages([
        createStoredFileMessage('blob:upload-1', 'invoice.pdf', {
          id: 1,
          type: 'self',
          timestamp: new Date(),
        }),
      ]);

      revokeSpy.mockClear();

      store.clearMessages();

      expect(revokeSpy).toHaveBeenCalledWith('blob:upload-1');
      expect(store.getMessages()).toEqual([]);
    });
  });

  describe('loading state', () => {
    it('should set and clear loading state', () => {
      const store = useChatStore.getState();

      store.setLoading(true);

      expect(useChatStore.getState().isLoading).toBe(true);

      store.clearLoading();

      expect(useChatStore.getState().isLoading).toBe(false);
    });
  });

  describe('clearButtons', () => {
    it('should remove buttons from all messages', () => {
      const store = useChatStore.getState();

      store.setMessages([
        createStoredMessage('First', {
          id: 1,
          type: 'other',
          timestamp: new Date(),
          buttons: [{ label: 'Button 1' }],
        }),
        createStoredMessage('Second', {
          id: 2,
          type: 'other',
          timestamp: new Date(),
          buttons: [{ label: 'Button 2' }],
        }),
      ]);

      store.clearButtons();

      const messages = store.getMessages();
      expect(messages[0]?.buttons).toEqual([]);
      expect(messages[1]?.buttons).toEqual([]);
    });

    it('should work with messages that have no buttons', () => {
      const store = useChatStore.getState();

      store.addMessage(createInputMessage('No buttons', { type: 'self' }));
      store.clearButtons();

      expect(store.getMessages()[0]?.buttons).toEqual([]);
    });
  });

  describe('clearPreviousMessageButtons', () => {
    it('should remove buttons from last message only', () => {
      const store = useChatStore.getState();

      store.setMessages([
        createStoredMessage('First', {
          id: 1,
          type: 'other',
          timestamp: new Date(),
          buttons: [{ label: 'Button 1' }],
        }),
        createStoredMessage('Second', {
          id: 2,
          type: 'other',
          timestamp: new Date(),
          buttons: [{ label: 'Button 2' }],
        }),
      ]);

      store.clearPreviousMessageButtons();

      const messages = store.getMessages();
      expect(messages[0]?.buttons).toHaveLength(1);
      expect(messages[1]?.buttons).toEqual([]);
    });

    it('should do nothing when no messages', () => {
      const store = useChatStore.getState();
      expect(() => store.clearPreviousMessageButtons()).not.toThrow();
    });
  });

  describe('clearPreviousMessageCallback', () => {
    it('should remove callback from last message', () => {
      const store = useChatStore.getState();
      const callback = vi.fn();

      store.setMessages([
        createStoredMessage('Message', {
          id: 1,
          type: 'other',
          timestamp: new Date(),
          userResponseCallback: callback,
        }),
      ]);

      expect(store.getPreviousMessage()?.userResponseCallback).toBe(callback);

      store.clearPreviousMessageCallback();

      expect(store.getPreviousMessage()?.userResponseCallback).toBeUndefined();
    });

    it('should only remove callback from last message', () => {
      const store = useChatStore.getState();
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      store.setMessages([
        createStoredMessage('First', {
          id: 1,
          type: 'other',
          timestamp: new Date(),
          userResponseCallback: callback1,
        }),
        createStoredMessage('Second', {
          id: 2,
          type: 'other',
          timestamp: new Date(),
          userResponseCallback: callback2,
        }),
      ]);

      store.clearPreviousMessageCallback();

      const messages = store.getMessages();
      expect(messages[0]?.userResponseCallback).toBe(callback1);
      expect(messages[1]?.userResponseCallback).toBeUndefined();
    });

    it('should do nothing when no messages', () => {
      const store = useChatStore.getState();
      expect(() => store.clearPreviousMessageCallback()).not.toThrow();
    });
  });
});
