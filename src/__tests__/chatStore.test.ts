import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useChatStore } from '../lib/chatStore';
import { usePersistentButtonStore } from '../lib/persistentButtonStore';
import type { ChatFlow, InputMessage, Message } from '../js/types';

describe('Chat Store Unit Tests', () => {
  beforeEach(() => {
    // Clear store before each test
    useChatStore.getState().clearMessages();
    useChatStore.getState().clearActiveFlow();
    usePersistentButtonStore.getState().clearButtons();
  });

  describe('addMessage', () => {
    it('should add message with id and timestamp', () => {
      const store = useChatStore.getState();

      store.addMessage({
        type: 'self',
        content: 'Hello',
      });

      const messages = store.getMessages();
      expect(messages).toHaveLength(1);
      expect(messages[0]).toMatchObject({
        id: 1,
        type: 'self',
        content: 'Hello',
      });
      expect(messages[0]?.timestamp).toBeInstanceOf(Date);
    });

    it('should increment id for each message', () => {
      const store = useChatStore.getState();

      store.addMessage({ type: 'self', content: 'First' });
      store.addMessage({ type: 'other', content: 'Second' });
      store.addMessage({ type: 'self', content: 'Third' });

      const messages = store.getMessages();
      expect(messages).toHaveLength(3);
      expect(messages[0]?.id).toBe(1);
      expect(messages[1]?.id).toBe(2);
      expect(messages[2]?.id).toBe(3);
    });

    it('should clear buttons from previous messages when adding new message', () => {
      const store = useChatStore.getState();

      store.addMessage({
        type: 'other',
        content: 'First message',
        buttons: [{ label: 'Button 1' }],
      });

      expect(store.getMessages()[0]?.buttons).toHaveLength(1);

      store.addMessage({
        type: 'self',
        content: 'Second message',
      });

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
      chatStore.addMessage({
        type: 'self',
        content: 'New message',
      });

      expect(persistentStore.getButtons()).toHaveLength(0);
    });
  });

  describe('addMessages', () => {
    it('should add multiple messages at once', () => {
      const store = useChatStore.getState();

      const messages: InputMessage[] = [
        {
          id: 1,
          type: 'other',
          content: 'First',
          timestamp: new Date(),
        },
        {
          id: 2,
          type: 'self',
          content: 'Second',
          timestamp: new Date(),
        },
      ];

      store.addMessages(messages);

      expect(store.getMessages()).toHaveLength(2);
      expect(store.getMessages()[0]?.content).toBe('First');
      expect(store.getMessages()[1]?.content).toBe('Second');
    });

    it('should append to existing messages', () => {
      const store = useChatStore.getState();

      store.addMessage({ type: 'self', content: 'Existing' });

      const newMessages: InputMessage[] = [
        {
          id: 2,
          type: 'other',
          content: 'New',
          timestamp: new Date(),
        },
      ];

      store.addMessages(newMessages);

      expect(store.getMessages()).toHaveLength(2);
    });
  });

  describe('setMessages', () => {
    it('should replace all messages', () => {
      const store = useChatStore.getState();

      store.addMessage({ type: 'self', content: 'First' });
      store.addMessage({ type: 'other', content: 'Second' });

      expect(store.getMessages()).toHaveLength(2);

      const newMessages: Message[] = [
        {
          id: 10,
          rawContent: 'Replaced',
          type: 'other',
          content: 'Replaced',
          timestamp: new Date(),
        },
      ];

      store.setMessages(newMessages);

      const messages = store.getMessages();
      expect(messages).toHaveLength(1);
      expect(messages[0]?.content).toBe('Replaced');
      expect(messages[0]?.id).toBe(10);
    });

    it('should handle empty array', () => {
      const store = useChatStore.getState();

      store.addMessage({ type: 'self', content: 'Test' });
      store.setMessages([]);

      expect(store.getMessages()).toHaveLength(0);
    });
  });

  describe('getMessages', () => {
    it('should return current messages', () => {
      const store = useChatStore.getState();

      store.addMessage({ type: 'self', content: 'Test' });
      const messages = store.getMessages();

      expect(messages).toHaveLength(1);
      expect(messages[0]?.content).toBe('Test');
    });

    it('should return empty array when no messages', () => {
      const store = useChatStore.getState();
      expect(store.getMessages()).toEqual([]);
    });
  });

  describe('getPreviousMessage', () => {
    it('should return last message', () => {
      const store = useChatStore.getState();

      store.addMessage({ type: 'self', content: 'First' });
      store.addMessage({ type: 'other', content: 'Last' });

      const previousMessage = store.getPreviousMessage();
      expect(previousMessage?.content).toBe('Last');
    });

    it('should return undefined when no messages', () => {
      const store = useChatStore.getState();
      expect(store.getPreviousMessage()).toBeUndefined();
    });
  });

  describe('clearMessages', () => {
    it('should remove all messages', () => {
      const store = useChatStore.getState();

      store.addMessage({ type: 'self', content: 'First' });
      store.addMessage({ type: 'other', content: 'Second' });

      expect(store.getMessages()).toHaveLength(2);

      store.clearMessages();

      expect(store.getMessages()).toEqual([]);
    });
  });

  describe('clearButtons', () => {
    it('should remove buttons from all messages', () => {
      const store = useChatStore.getState();

      store.setMessages([
        {
          id: 1,
          type: 'other',
          content: 'First',
          rawContent: 'First',
          timestamp: new Date(),
          buttons: [{ label: 'Button 1' }],
        },
        {
          id: 2,
          type: 'other',
          content: 'Second',
          rawContent: 'Second',
          timestamp: new Date(),
          buttons: [{ label: 'Button 2' }],
        },
      ]);

      store.clearButtons();

      const messages = store.getMessages();
      expect(messages[0]?.buttons).toEqual([]);
      expect(messages[1]?.buttons).toEqual([]);
    });

    it('should work with messages that have no buttons', () => {
      const store = useChatStore.getState();

      store.addMessage({ type: 'self', content: 'No buttons' });
      store.clearButtons();

      expect(store.getMessages()[0]?.buttons).toEqual([]);
    });
  });

  describe('clearPreviousMessageButtons', () => {
    it('should remove buttons from last message only', () => {
      const store = useChatStore.getState();

      store.setMessages([
        {
          id: 1,
          type: 'other',
          content: 'First',
          rawContent: 'First',
          timestamp: new Date(),
          buttons: [{ label: 'Button 1' }],
        },
        {
          id: 2,
          type: 'other',
          content: 'Second',
          rawContent: 'Second',
          timestamp: new Date(),
          buttons: [{ label: 'Button 2' }],
        },
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
        {
          id: 1,
          type: 'other',
          content: 'Message',
          rawContent: 'Message',
          timestamp: new Date(),
          userResponseCallback: callback,
        },
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
        {
          id: 1,
          type: 'other',
          content: 'First',
          rawContent: 'First',
          timestamp: new Date(),
          userResponseCallback: callback1,
        },
        {
          id: 2,
          type: 'other',
          content: 'Second',
          rawContent: 'Second',
          timestamp: new Date(),
          userResponseCallback: callback2,
        },
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

  describe('Flow Management', () => {
    it('should start a flow and set activeFlow', () => {
      const store = useChatStore.getState();
      const onEnter = vi.fn();
      const flow: ChatFlow = {
        id: 'settings',
        initialMessages: [{ type: 'other', content: 'Settings root' }],
        onEnter,
      };

      store.startFlow(flow);

      expect(useChatStore.getState().activeFlow?.id).toBe('settings');
      expect(store.getMessages()).toHaveLength(1);
      expect(store.getMessages()[0]?.content).toBe('Settings root');
      expect(onEnter).toHaveBeenCalledTimes(1);
    });

    it('should seed flow from initialMessage', () => {
      const store = useChatStore.getState();
      const flow: ChatFlow = {
        id: 'single-message-flow',
        initialMessage: { type: 'other', content: 'Single flow message' },
      };

      store.startFlow(flow);

      expect(store.getMessages()).toHaveLength(1);
      expect(store.getMessages()[0]?.content).toBe('Single flow message');
    });

    it('should allow flow transitions and call onExit', () => {
      const store = useChatStore.getState();
      const firstOnExit = vi.fn();
      const secondOnEnter = vi.fn();

      const firstFlow: ChatFlow = {
        id: 'first',
        initialMessages: [{ type: 'other', content: 'First flow' }],
        onExit: firstOnExit,
      };
      const secondFlow: ChatFlow = {
        id: 'second',
        initialMessages: [{ type: 'other', content: 'Second flow' }],
        onEnter: secondOnEnter,
      };

      store.startFlow(firstFlow);
      store.startFlow(secondFlow);

      expect(firstOnExit).toHaveBeenCalledTimes(1);
      expect(secondOnEnter).toHaveBeenCalledTimes(1);
      expect(useChatStore.getState().activeFlow?.id).toBe('second');
      expect(store.getMessages()[0]?.content).toBe('Second flow');
    });

    it('should append flow messages when clearMessages is false', () => {
      const store = useChatStore.getState();
      store.addMessage({ type: 'self', content: 'Existing message' });

      store.startFlow(
        {
          id: 'append-flow',
          initialMessages: [{ type: 'other', content: 'Flow message' }],
        },
        { clearMessages: false }
      );
      const messages = store.getMessages();

      expect(messages).toHaveLength(2);
      expect(messages[0]?.content).toBe('Existing message');
      expect(messages[1]?.content).toBe('Flow message');
    });

    it('should clear active flow', () => {
      const store = useChatStore.getState();
      const onExit = vi.fn();

      store.startFlow({
        id: 'flow-to-clear',
        initialMessage: { type: 'other', content: 'Flow message' },
        onExit,
      });

      store.clearActiveFlow();

      expect(store.getActiveFlow()).toBeUndefined();
      expect(onExit).toHaveBeenCalledTimes(1);
    });
  });
});
