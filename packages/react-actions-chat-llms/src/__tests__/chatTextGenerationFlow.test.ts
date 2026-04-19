import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createTextPart,
  useChatStore,
  type InputMessage,
} from 'react-actions-chat';
import { createChatTextGenerationFlow } from 'react-actions-chat-llms';

function createInputMessage(
  text: string,
  message: Omit<InputMessage, 'parts'>
): InputMessage {
  return {
    ...message,
    parts: [createTextPart(text)],
  };
}

function getLastMessageText(): string {
  const message = useChatStore.getState().getPreviousMessage();
  const firstPart = message?.parts[0];

  if (!firstPart || firstPart.type !== 'text') {
    return '';
  }

  return firstPart.text;
}

describe('createChatTextGenerationFlow', () => {
  beforeEach(() => {
    useChatStore.getState().clearMessages();
    useChatStore.getState().clearLoading();
  });

  it('builds LLM messages from the transcript and appends the assistant reply', async () => {
    const generateText = vi.fn(() =>
      Promise.resolve({
        text: 'Annual billing saves 15% compared with paying monthly.',
      })
    );
    const flow = createChatTextGenerationFlow({
      generator: {
        generateText,
      },
      systemPrompt: 'Answer with concise Northstar support guidance.',
    });

    await flow.respondToMessages([
      createInputMessage('Welcome to Northstar support.', {
        type: 'other',
      }),
      createInputMessage('Do you offer a yearly billing discount?', {
        type: 'self',
        rawContent: 'Do you offer a yearly billing discount?',
      }),
      createInputMessage('Loading...', {
        type: 'other',
        isLoading: true,
      }),
    ]);

    expect(generateText).toHaveBeenCalledWith({
      messages: [
        {
          role: 'system',
          content: 'Answer with concise Northstar support guidance.',
        },
        {
          role: 'assistant',
          content: 'Welcome to Northstar support.',
        },
        {
          role: 'user',
          content: 'Do you offer a yearly billing discount?',
        },
      ],
    });
    expect(getLastMessageText()).toBe(
      'Annual billing saves 15% compared with paying monthly.'
    );
    expect(useChatStore.getState().isLoading).toBe(false);
  });

  it('adds the configured error message when generation fails', async () => {
    const flow = createChatTextGenerationFlow({
      generator: {
        generateText: () => Promise.reject(new Error('Backend is unavailable')),
      },
      createErrorMessage: error => ({
        type: 'other',
        parts: [
          createTextPart(
            error instanceof Error ? error.message : 'Unknown error'
          ),
        ],
      }),
    });

    await expect(
      flow.respondToMessages([
        createInputMessage('Need help with exports.', {
          type: 'self',
        }),
      ])
    ).resolves.toBeNull();

    expect(getLastMessageText()).toBe('Backend is unavailable');
    expect(useChatStore.getState().isLoading).toBe(false);
  });
});
