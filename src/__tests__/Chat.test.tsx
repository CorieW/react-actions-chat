import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Chat } from '../components/Chat';
import { createButton, createRequestInputButtonDef } from '../index';
import { useChatStore } from '../lib/chatStore';
import { useInputFieldStore } from '../lib/inputFieldStore';
import { usePersistentButtonStore } from '../lib/persistentButtonStore';
import type { InputMessage } from '../js/types';

function getScrollToOptions(
  value: unknown[] | undefined
): Record<string, unknown> | null {
  if (value?.length !== 1) {
    return null;
  }

  const [firstArg] = value;
  if (typeof firstArg !== 'object' || firstArg === null) {
    return null;
  }

  return firstArg as Record<string, unknown>;
}

describe('Chat Component Integration Tests', () => {
  beforeEach(() => {
    // Clear stores before each test
    useChatStore.getState().clearMessages();
    usePersistentButtonStore.getState().clearButtons();
    useInputFieldStore.getState().resetInputFieldValue();
    useInputFieldStore.getState().resetInputFieldDescription();
    useInputFieldStore.getState().resetInputFieldType();
    useInputFieldStore.getState().resetInputFieldPlaceholder();
    useInputFieldStore.getState().resetInputFieldValidator();
    useInputFieldStore.getState().resetInputFieldSubmitGuard();
    useInputFieldStore.getState().resetInputFieldDisabled();
  });

  it('should render empty chat', () => {
    render(<Chat />);

    // Should have input field
    expect(
      screen.getByPlaceholderText('Type your message...')
    ).toBeInTheDocument();
  });

  it('should render with initial messages', () => {
    const initialMessages: InputMessage[] = [
      {
        id: 1,
        type: 'other',
        content: 'Hello!',
        timestamp: new Date(),
      },
      {
        id: 2,
        type: 'self',
        content: 'Hi there!',
        timestamp: new Date(),
      },
    ];

    render(<Chat initialMessages={initialMessages} />);

    expect(screen.getByText('Hello!')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('should allow long unbroken message content to wrap inside the bubble', () => {
    const longWord = 'a'.repeat(200);

    render(
      <Chat
        initialMessages={[
          {
            id: 1,
            type: 'other',
            content: longWord,
            timestamp: new Date(),
          },
        ]}
      />
    );

    expect(screen.getByText(longWord)).toHaveStyle({
      overflowWrap: 'anywhere',
    });
  });

  it('should auto-scroll the message list without scrolling the page', () => {
    const scrollIntoViewSpy = vi.spyOn(Element.prototype, 'scrollIntoView');
    const scrollToSpy = vi.spyOn(HTMLElement.prototype, 'scrollTo');

    render(
      <Chat
        initialMessages={[
          {
            id: 1,
            type: 'other',
            content: 'Welcome to the chat',
            timestamp: new Date(),
          },
        ]}
      />
    );

    expect(scrollIntoViewSpy).not.toHaveBeenCalled();
    expect(scrollToSpy).toHaveBeenCalled();

    const scrollOptions =
      scrollToSpy.mock.calls
        .map(call => getScrollToOptions(call as unknown[]))
        .find(options => options?.behavior === 'auto') ?? null;

    expect(scrollOptions).not.toBeNull();

    if (!scrollOptions) {
      throw new Error(
        'Expected scrollTo to be called with ScrollToOptions using auto behavior.'
      );
    }

    expect(scrollOptions.behavior).toBe('auto');
    expect(typeof scrollOptions.top).toBe('number');

    scrollIntoViewSpy.mockRestore();
    scrollToSpy.mockRestore();
  });

  it('should send message via ChatInput', async () => {
    const user = userEvent.setup();
    render(<Chat />);

    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, 'Test message');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    // Input should be cleared
    expect(input).toHaveValue('');
  });

  it('should keep the input disabled while waiting for an async response', async () => {
    const user = userEvent.setup();
    let resolveInput: (() => void) | undefined;
    const onValidInput = vi.fn(
      () =>
        new Promise<void>(resolve => {
          resolveInput = resolve;
        })
    );

    render(
      <Chat
        initialMessages={[
          {
            type: 'other',
            content: 'Start the async flow.',
            buttons: [
              createButton(
                createRequestInputButtonDef({
                  initialLabel: 'Begin',
                  inputPromptMessage: 'Tell me what changed.',
                  shouldWaitForTurn: true,
                }),
                {
                  onValidInput,
                }
              ),
            ],
          },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Begin' }));

    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, 'Change email');
    await user.keyboard('{Enter}');

    expect(onValidInput).toHaveBeenCalledWith('Change email');
    expect(input).toBeDisabled();
    expect(useInputFieldStore.getState().getInputFieldDisabled()).toBe(true);

    resolveInput?.();

    await waitFor(() => {
      expect(input).not.toBeDisabled();
      expect(useInputFieldStore.getState().getInputFieldDisabled()).toBe(false);
    });
  });

  it('should block an over-limit message before adding it to the transcript', async () => {
    const user = userEvent.setup();

    render(
      <Chat
        initialMessages={[
          {
            type: 'other',
            content: 'Open the guarded flow.',
            buttons: [
              createButton(
                createRequestInputButtonDef({
                  initialLabel: 'Guard input',
                  inputPromptMessage: 'Share a short update.',
                  rateLimit: {
                    maxMessages: 2,
                    windowMs: 10_000,
                    maxMessageLength: 5,
                    tooLongMessageMessage: 'Keep it under six characters.',
                  },
                })
              ),
            ],
          },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Guard input' }));

    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, 'Too long');
    await user.keyboard('{Enter}');

    expect(
      await screen.findByText('Keep it under six characters.')
    ).toBeInTheDocument();
    expect(screen.queryByText('Too long')).not.toBeInTheDocument();
    expect(input).toHaveValue('Too long');
  });

  it('should block a message that is shorter than the configured minimum length', async () => {
    const user = userEvent.setup();

    render(
      <Chat
        initialMessages={[
          {
            type: 'other',
            content: 'Open the guarded flow.',
            buttons: [
              createButton(
                createRequestInputButtonDef({
                  initialLabel: 'Require detail',
                  inputPromptMessage: 'Share a fuller update.',
                  minMessageLength: 5,
                  minMessageLengthMessage:
                    'Please enter at least five characters.',
                })
              ),
            ],
          },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Require detail' }));

    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, 'hey');
    await user.keyboard('{Enter}');

    expect(
      await screen.findByText('Please enter at least five characters.')
    ).toBeInTheDocument();
    expect(screen.queryByText('hey')).not.toBeInTheDocument();
    expect(input).toHaveValue('hey');
  });

  it('should enforce a cooldown between retry attempts in the same input flow', async () => {
    const user = userEvent.setup();

    render(
      <Chat
        initialMessages={[
          {
            type: 'other',
            content: 'Open the guarded flow.',
            buttons: [
              createButton(
                createRequestInputButtonDef({
                  initialLabel: 'Throttle retries',
                  inputPromptMessage: 'Try a short code.',
                  cooldownMs: 10_000,
                  cooldownMessage: 'Please wait before trying again.',
                  validator: () => 'That code did not match.',
                })
              ),
            ],
          },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Throttle retries' }));

    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, 'alpha');
    await user.keyboard('{Enter}');

    expect(
      await screen.findByText('That code did not match.')
    ).toBeInTheDocument();

    await user.type(input, 'beta');
    await user.keyboard('{Enter}');

    expect(
      await screen.findByText('Please wait before trying again.')
    ).toBeInTheDocument();
    expect(
      useChatStore
        .getState()
        .getMessages()
        .filter(message => message.type === 'self')
    ).toHaveLength(1);
    expect(input).toHaveValue('beta');
  });

  it('should apply light theme', () => {
    const { container } = render(<Chat theme='light' />);

    // The styles are applied to the inner div, not the wrapper
    const chatContainer = container.querySelector(
      '.flex.flex-col'
    ) as HTMLElement;
    // Check that theme styles are applied (without checking specific values)
    expect(chatContainer).toBeInTheDocument();
    expect(chatContainer.style.backgroundColor).toBeTruthy();
    expect(chatContainer.style.color).toBeTruthy();
  });

  it('should apply dark theme', () => {
    const { container } = render(<Chat theme='dark' />);

    // The styles are applied to the inner div, not the wrapper
    const chatContainer = container.querySelector(
      '.flex.flex-col'
    ) as HTMLElement;
    // Check that theme styles are applied (without checking specific values)
    expect(chatContainer).toBeInTheDocument();
    expect(chatContainer.style.backgroundColor).toBeTruthy();
    expect(chatContainer.style.color).toBeTruthy();
  });

  it('should apply custom theme', () => {
    const customTheme = {
      backgroundColor: '#ff0000',
      textColor: '#00ff00',
      primaryColor: '#0000ff',
    };

    const { container } = render(<Chat theme={customTheme} />);

    // The styles are applied to the inner div, not the wrapper
    const chatContainer = container.querySelector(
      '.flex.flex-col'
    ) as HTMLElement;
    expect(chatContainer).toHaveStyle({
      backgroundColor: customTheme.backgroundColor,
      color: customTheme.textColor,
    });
  });

  it('should trigger userResponseCallback when user replies', async () => {
    const user = userEvent.setup();
    const callback = vi.fn();

    const initialMessages: InputMessage[] = [
      {
        id: 1,
        type: 'other',
        content: 'Please respond',
        timestamp: new Date(),
        userResponseCallback: callback,
      },
    ];

    render(<Chat initialMessages={initialMessages} />);

    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, 'My response');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  it('should not trigger callback on self message', async () => {
    const user = userEvent.setup();
    const callback = vi.fn();

    const initialMessages: InputMessage[] = [
      {
        id: 1,
        type: 'self',
        content: 'My message',
        timestamp: new Date(),
        userResponseCallback: callback,
      },
    ];

    render(<Chat initialMessages={initialMessages} />);

    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, 'Another message');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('Another message')).toBeInTheDocument();
    });

    // Callback should not be called for self messages
    expect(callback).not.toHaveBeenCalled();
  });

  it('should display message buttons', () => {
    const initialMessages: InputMessage[] = [
      {
        id: 1,
        type: 'other',
        content: 'Choose an option',
        timestamp: new Date(),
        buttons: [
          { label: 'Option 1', onClick: () => {} },
          { label: 'Option 2', onClick: () => {} },
        ],
      },
    ];

    render(<Chat initialMessages={initialMessages} />);

    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('should display a loading indicator from the chat store', () => {
    useChatStore.getState().setLoading(true);

    render(<Chat />);

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('should render a loading assistant message in the message list', () => {
    render(
      <Chat
        initialMessages={[
          {
            type: 'other',
            content: '',
            isLoading: true,
          },
        ]}
      />
    );

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('should handle button clicks', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    const initialMessages: InputMessage[] = [
      {
        id: 1,
        type: 'other',
        content: 'Click the button',
        timestamp: new Date(),
        buttons: [{ label: 'Click Me', onClick }],
      },
    ];

    render(<Chat initialMessages={initialMessages} />);

    const button = screen.getByText('Click Me');
    await user.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should clear previous message buttons when new message is sent', async () => {
    const user = userEvent.setup();

    const initialMessages: InputMessage[] = [
      {
        id: 1,
        type: 'other',
        content: 'Message with buttons',
        timestamp: new Date(),
        buttons: [{ label: 'Button 1' }],
      },
    ];

    render(<Chat initialMessages={initialMessages} />);

    expect(screen.getByText('Button 1')).toBeInTheDocument();

    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, 'New message');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.queryByText('Button 1')).not.toBeInTheDocument();
    });
  });

  it('should not send empty messages', async () => {
    const user = userEvent.setup();
    render(<Chat />);

    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, '   ');
    await user.keyboard('{Enter}');

    // No message should be added
    const messages = useChatStore.getState().getMessages();
    expect(messages.length).toBe(0);
  });
});
