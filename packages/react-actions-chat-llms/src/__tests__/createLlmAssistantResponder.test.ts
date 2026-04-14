import type { Message } from 'react-actions-chat';
import { useChatStore } from 'react-actions-chat';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildLlmMessagesFromChatMessages,
  createLlmAssistantResponder,
  type TextGenerator,
} from 'react-actions-chat-llms';

function createMessage(
  id: number,
  type: Message['type'],
  content: string,
  overrides: Partial<Message> = {}
): Message {
  return {
    id,
    type,
    content,
    rawContent: content,
    timestamp: new Date(`2026-01-0${id}T00:00:00.000Z`),
    ...overrides,
  };
}

afterEach(() => {
  useChatStore.getState().clearMessages();
});

describe('createLlmAssistantResponder', () => {
  it('builds LLM messages from transcript content', () => {
    expect(
      buildLlmMessagesFromChatMessages([
        createMessage(1, 'other', 'Welcome!'),
        createMessage(2, 'self', '  My password is hidden  ', {
          rawContent: '  reset my password  ',
        }),
        createMessage(3, 'other', '', {
          isLoading: true,
        }),
      ])
    ).toEqual([
      {
        role: 'assistant',
        content: 'Welcome!',
      },
      {
        role: 'user',
        content: 'reset my password',
      },
    ]);
  });

  it('calls the generator with the current transcript and appends the reply', async () => {
    useChatStore
      .getState()
      .setMessages([
        createMessage(1, 'other', 'How can I help?'),
        createMessage(2, 'self', 'I need billing help'),
      ]);

    const generateText = vi.fn(() =>
      Promise.resolve({
        text: 'I can help with billing.',
        finishReason: 'stop',
      })
    );
    const responder = createLlmAssistantResponder({
      generator: {
        generateText,
      },
      systemPrompt: 'You are a billing assistant.',
    });

    await expect(responder.respond()).resolves.toEqual({
      text: 'I can help with billing.',
      finishReason: 'stop',
    });

    expect(generateText).toHaveBeenCalledWith({
      messages: [
        {
          role: 'system',
          content: 'You are a billing assistant.',
        },
        {
          role: 'assistant',
          content: 'How can I help?',
        },
        {
          role: 'user',
          content: 'I need billing help',
        },
      ],
    });
    expect(useChatStore.getState().isLoading).toBe(false);
    expect(useChatStore.getState().getPreviousMessage()?.content).toBe(
      'I can help with billing.'
    );
    expect(useChatStore.getState().getPreviousMessage()?.type).toBe('other');
  });

  it('supports a custom assistant message builder', async () => {
    const generateText = vi.fn(() =>
      Promise.resolve({
        text: 'Here is a custom reply.',
      })
    );
    const responder = createLlmAssistantResponder({
      generator: {
        generateText,
      },
      getMessages: () => [createMessage(1, 'self', 'hello')],
      addMessage: useChatStore.getState().addMessage,
      setLoading: useChatStore.getState().setLoading,
      createAssistantMessage: result => ({
        type: 'other',
        content: `Assistant: ${result.text}`,
      }),
    });

    await responder.respond();

    expect(useChatStore.getState().getPreviousMessage()?.content).toBe(
      'Assistant: Here is a custom reply.'
    );
  });

  it('adds a fallback error message and returns null by default', async () => {
    const generator: TextGenerator = {
      generateText: () => Promise.reject(new Error('Provider down')),
    };
    const responder = createLlmAssistantResponder({
      generator,
      getMessages: () => [createMessage(1, 'self', 'hello')],
      addMessage: useChatStore.getState().addMessage,
      setLoading: useChatStore.getState().setLoading,
    });

    await expect(responder.respond()).resolves.toBeNull();
    expect(useChatStore.getState().isLoading).toBe(false);
    expect(useChatStore.getState().getPreviousMessage()?.content).toBe(
      'Something went wrong while contacting the language model. Please try again.'
    );
  });

  it('can rethrow errors when requested', async () => {
    const responder = createLlmAssistantResponder({
      generator: {
        generateText: () => Promise.reject(new Error('Provider down')),
      },
      getMessages: () => [createMessage(1, 'self', 'hello')],
      addMessage: useChatStore.getState().addMessage,
      setLoading: useChatStore.getState().setLoading,
      createErrorMessage: () => null,
      throwOnError: true,
    });

    await expect(responder.respond()).rejects.toThrow('Provider down');
    expect(useChatStore.getState().isLoading).toBe(false);
  });
});
