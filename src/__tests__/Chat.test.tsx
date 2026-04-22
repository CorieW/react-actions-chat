import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Chat,
  createButton,
  createMarkdownTextPart,
  createRequestConfirmationButtonDef,
  createRequestInputButtonDef,
  createTextPart,
  useChatGlobalsStore,
  type InputMessage,
} from '../index';
import { useChatStore } from '../lib/chatStore';
import { useInputFieldStore } from '../lib/inputFieldStore';
import { usePersistentButtonStore } from '../lib/persistentButtonStore';

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

function createInputMessage(
  text: string,
  message: Omit<InputMessage, 'parts'>
): InputMessage {
  return {
    ...message,
    parts: [createTextPart(text)],
  };
}

describe('Chat Component Integration Tests', () => {
  beforeEach(() => {
    // Clear stores before each test
    useChatStore.getState().clearMessages();
    usePersistentButtonStore.getState().clearButtons();
    useChatGlobalsStore.getState().resetChatGlobals();
    useInputFieldStore.getState().resetInputFieldValue();
    useInputFieldStore.getState().resetInputFieldDescription();
    useInputFieldStore.getState().resetInputFieldType();
    useInputFieldStore.getState().resetInputFieldPlaceholder();
    useInputFieldStore.getState().resetInputFieldDisabledPlaceholder();
    useInputFieldStore.getState().resetInputFieldValidator();
    useInputFieldStore.getState().resetInputFieldSubmitGuard();
    useInputFieldStore.getState().resetInputFieldFiles();
    useInputFieldStore.getState().resetInputFieldFileUploadEnabled();
    useInputFieldStore.getState().resetInputFieldDisabledDefault();
    useInputFieldStore.getState().resetInputFieldDisabledPlaceholderDefault();
    useInputFieldStore.getState().resetInputFieldDisabled();
  });

  it('should render empty chat', () => {
    render(<Chat />);

    const input = screen.getByRole('textbox');

    expect(input).toBeDisabled();
    expect(input).toHaveAttribute('placeholder', 'Input disabled.');
  });

  it('should render with initial messages', () => {
    const initialMessages: InputMessage[] = [
      createInputMessage('Hello!', {
        id: 1,
        type: 'other',
        timestamp: new Date(),
      }),
      createInputMessage('Hi there!', {
        id: 2,
        type: 'self',
        timestamp: new Date(),
      }),
    ];

    render(
      <Chat
        initialMessages={initialMessages}
        allowFreeTextInput
      />
    );

    expect(screen.getByText('Hello!')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('should allow long unbroken message content to wrap inside the bubble', () => {
    const longWord = 'a'.repeat(200);

    render(
      <Chat
        initialMessages={[
          createInputMessage(longWord, {
            id: 1,
            type: 'other',
            timestamp: new Date(),
          }),
        ]}
      />
    );

    expect(screen.getByText(longWord)).toHaveStyle({
      overflowWrap: 'anywhere',
    });
  });

  it('should render markdown text parts inside the chat transcript', () => {
    render(
      <Chat
        initialMessages={[
          {
            id: 1,
            type: 'other',
            parts: [
              createMarkdownTextPart(
                [
                  '## Suggested fix',
                  '',
                  '- Add a null guard',
                  '',
                  '`npm test`',
                ].join('\n')
              ),
            ],
            timestamp: new Date(),
          },
        ]}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Suggested fix' })
    ).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getByText('npm test')).toHaveProperty('tagName', 'CODE');
  });

  it('should auto-scroll the message list without scrolling the page', () => {
    const scrollIntoViewSpy = vi.spyOn(Element.prototype, 'scrollIntoView');
    const scrollToSpy = vi.spyOn(HTMLElement.prototype, 'scrollTo');

    render(
      <Chat
        initialMessages={[
          createInputMessage('Welcome to the chat', {
            id: 1,
            type: 'other',
            timestamp: new Date(),
          }),
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

  it('should send message via InputBar', async () => {
    const user = userEvent.setup();
    render(<Chat allowFreeTextInput />);

    const input = screen.getByPlaceholderText('Type your message...');
    expect(input.tagName).toBe('TEXTAREA');
    await user.type(input, 'Test message');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    // Input should be cleared
    expect(input).toHaveValue('');
  });

  it('keeps file uploads disabled by default', () => {
    render(<Chat allowFreeTextInput />);

    expect(
      screen.queryByRole('button', { name: 'Upload files' })
    ).not.toBeInTheDocument();
  });

  it('supports upload-enabled request-input flows with file validation', async () => {
    const user = userEvent.setup();
    const onValidInput = vi.fn();

    render(
      <Chat
        initialMessages={[
          createInputMessage('Share proof of the issue.', {
            type: 'other',
            buttons: [
              createButton(
                createRequestInputButtonDef({
                  initialLabel: 'Upload screenshot',
                  inputPromptMessage: 'Upload a screenshot for review.',
                  allowFileUpload: true,
                  validator: (_value, submission) => {
                    return (
                      (submission?.files.length ?? 0) > 0 ||
                      'Please upload a screenshot.'
                    );
                  },
                  fileValidator: file => {
                    return (
                      file.type.startsWith('image/') ||
                      'Only image files are allowed.'
                    );
                  },
                }),
                {
                  onValidInput,
                }
              ),
            ],
          }),
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Upload screenshot' }));

    expect(screen.getByRole('button', { name: 'Upload files' })).toBeVisible();

    const fileInput = screen.getByLabelText('Chat file upload');
    const invalidFile = new File(['plain text'], 'notes.txt', {
      type: 'text/plain',
    });

    await user.upload(fileInput, invalidFile);

    expect(
      await screen.findByText('Only image files are allowed.')
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Remove notes.txt' })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
    expect(onValidInput).not.toHaveBeenCalled();

    const validFile = new File(['image data'], 'layout.png', {
      type: 'image/png',
    });

    await user.upload(fileInput, validFile);
    await waitFor(() => {
      expect(
        screen.queryByText('Only image files are allowed.')
      ).not.toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    await waitFor(() => {
      expect(onValidInput).toHaveBeenCalledWith('', {
        text: '',
        files: [validFile],
      });
    });

    expect(screen.getByRole('img', { name: 'layout.png' })).toBeInTheDocument();
  });

  it('should keep shift-enter as a newline in multiline input and submit on enter', async () => {
    const user = userEvent.setup();

    render(<Chat allowFreeTextInput />);

    const input = screen.getByRole('textbox', { name: 'Chat input' });
    const transcript = screen.getByRole('log', { name: 'Chat transcript' });
    await user.type(input, 'const value = 1;');
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    await user.type(input, 'console.log(value);');

    expect(input).toHaveValue('const value = 1;\nconsole.log(value);');

    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(
        within(transcript).getByText((_, element) => {
          return (
            element?.tagName === 'P' &&
            element.textContent === 'const value = 1;\nconsole.log(value);'
          );
        })
      ).toBeInTheDocument();
    });

    expect(input).toHaveValue('');
  });

  it('should disable the input while confirmation buttons are visible', async () => {
    const user = userEvent.setup();
    const onReject = vi.fn();

    render(
      <Chat
        allowFreeTextInput
        initialMessages={[
          createInputMessage('Choose an action.', {
            type: 'other',
            buttons: [
              createButton(
                createRequestConfirmationButtonDef({
                  initialLabel: 'Delete draft',
                  confirmationMessage: 'Delete this draft?',
                  confirmLabel: 'Delete',
                  rejectLabel: 'Keep it',
                }),
                {
                  onReject,
                }
              ),
            ],
          }),
        ]}
      />
    );

    const input = screen.getByPlaceholderText('Type your message...');
    expect(input).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Delete draft' }));

    expect(await screen.findByText('Delete this draft?')).toBeInTheDocument();
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute(
      'placeholder',
      'Choose a confirmation option to continue.'
    );

    await user.click(screen.getByRole('button', { name: 'Keep it' }));

    expect(onReject).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(input).toBeEnabled();
      expect(
        screen.queryByRole('button', { name: 'Keep it' })
      ).not.toBeInTheDocument();
    });

    expect(input).toHaveAttribute('placeholder', 'Type your message...');
  });

  it('should keep the input available by default while an async response is pending', async () => {
    const user = userEvent.setup();
    const onValidInput = vi.fn(
      () =>
        new Promise<void>(() => {
          // Keep the async turn pending so the test can assert the default input state.
        })
    );

    render(
      <Chat
        allowFreeTextInput
        initialMessages={[
          createInputMessage('Start the async flow.', {
            type: 'other',
            buttons: [
              createButton(
                createRequestInputButtonDef({
                  initialLabel: 'Begin',
                  inputPromptMessage: 'Tell me what changed.',
                }),
                {
                  onValidInput,
                }
              ),
            ],
          }),
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Begin' }));

    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, 'Change email');
    await user.keyboard('{Enter}');

    expect(onValidInput).toHaveBeenCalledWith('Change email', {
      text: 'Change email',
      files: [],
    });
    expect(input).toBeEnabled();
    expect(useInputFieldStore.getState().getInputFieldDisabled()).toBe(false);
    expect(input).toHaveAttribute('placeholder', 'Type your message...');
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
          createInputMessage('Start the async flow.', {
            type: 'other',
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
          }),
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Begin' }));

    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, 'Change email');
    await user.keyboard('{Enter}');

    expect(onValidInput).toHaveBeenCalledWith('Change email', {
      text: 'Change email',
      files: [],
    });
    expect(input).toBeDisabled();
    expect(useInputFieldStore.getState().getInputFieldDisabled()).toBe(true);
    expect(input).toHaveAttribute('placeholder', 'Waiting for a response...');

    resolveInput?.();

    await waitFor(() => {
      expect(input).toBeDisabled();
      expect(useInputFieldStore.getState().getInputFieldDisabled()).toBe(true);
      expect(input).toHaveAttribute('placeholder', 'Input disabled.');
    });
  });

  it('should apply global request-input defaults for shouldWaitForTurn', async () => {
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
        globals={{
          requestInputDefaults: {
            shouldWaitForTurn: true,
          },
        }}
        initialMessages={[
          createInputMessage('Open the global flow.', {
            type: 'other',
            buttons: [
              createButton(
                createRequestInputButtonDef({
                  initialLabel: 'Begin',
                  inputPromptMessage: 'Tell me what changed.',
                }),
                {
                  onValidInput,
                }
              ),
            ],
          }),
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Begin' }));

    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, 'Change email');
    await user.keyboard('{Enter}');

    expect(onValidInput).toHaveBeenCalledWith('Change email', {
      text: 'Change email',
      files: [],
    });
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute('placeholder', 'Waiting for a response...');

    resolveInput?.();

    await waitFor(() => {
      expect(input).toBeDisabled();
      expect(input).toHaveAttribute('placeholder', 'Input disabled.');
    });
  });

  it('should apply global request-input rate limits', async () => {
    const user = userEvent.setup();

    render(
      <Chat
        globals={{
          requestInputDefaults: {
            rateLimit: {
              maxMessages: 1,
              windowMs: 10_000,
              maxMessageLength: 5,
              tooLongMessageMessage: 'Global limit reached.',
            },
          },
        }}
        initialMessages={[
          createInputMessage('Open the global flow.', {
            type: 'other',
            buttons: [
              createButton(
                createRequestInputButtonDef({
                  initialLabel: 'Guard input',
                  inputPromptMessage: 'Share a short update.',
                })
              ),
            ],
          }),
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Guard input' }));

    const input = screen.getByPlaceholderText('Type your message...');
    const transcript = screen.getByRole('log', { name: 'Chat transcript' });
    await user.type(input, 'Too long');
    await user.keyboard('{Enter}');

    expect(
      await screen.findByText('Global limit reached.')
    ).toBeInTheDocument();
    expect(within(transcript).queryByText('Too long')).not.toBeInTheDocument();
    expect(input).toHaveValue('Too long');
  });

  it('should block an over-limit message before adding it to the transcript', async () => {
    const user = userEvent.setup();

    render(
      <Chat
        initialMessages={[
          createInputMessage('Open the guarded flow.', {
            type: 'other',
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
          }),
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Guard input' }));

    const input = screen.getByPlaceholderText('Type your message...');
    const transcript = screen.getByRole('log', { name: 'Chat transcript' });
    await user.type(input, 'Too long');
    await user.keyboard('{Enter}');

    expect(
      await screen.findByText('Keep it under six characters.')
    ).toBeInTheDocument();
    expect(within(transcript).queryByText('Too long')).not.toBeInTheDocument();
    expect(input).toHaveValue('Too long');
  });

  it('should block a message that is shorter than the configured minimum length', async () => {
    const user = userEvent.setup();

    render(
      <Chat
        initialMessages={[
          createInputMessage('Open the guarded flow.', {
            type: 'other',
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
          }),
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Require detail' }));

    const input = screen.getByPlaceholderText('Type your message...');
    const transcript = screen.getByRole('log', { name: 'Chat transcript' });
    await user.type(input, 'hey');
    await user.keyboard('{Enter}');

    expect(
      await screen.findByText('Please enter at least five characters.')
    ).toBeInTheDocument();
    expect(within(transcript).queryByText('hey')).not.toBeInTheDocument();
    expect(input).toHaveValue('hey');
  });

  it('should enforce a cooldown between retry attempts in the same input flow', async () => {
    const user = userEvent.setup();

    render(
      <Chat
        initialMessages={[
          createInputMessage('Open the guarded flow.', {
            type: 'other',
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
          }),
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
    const { container } = render(
      <Chat
        theme='light'
        allowFreeTextInput
      />
    );

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
    const { container } = render(
      <Chat
        theme='dark'
        allowFreeTextInput
      />
    );

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

    const { container } = render(
      <Chat
        theme={customTheme}
        allowFreeTextInput
      />
    );

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
      createInputMessage('Please respond', {
        id: 1,
        type: 'other',
        timestamp: new Date(),
        userResponseCallback: callback,
      }),
    ];

    render(
      <Chat
        initialMessages={initialMessages}
        allowFreeTextInput
      />
    );

    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, 'My response');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(callback).toHaveBeenCalledWith({
        text: 'My response',
        files: [],
      });
    });
  });

  it('should not trigger callback on self message', async () => {
    const user = userEvent.setup();
    const callback = vi.fn();

    const initialMessages: InputMessage[] = [
      createInputMessage('My message', {
        id: 1,
        type: 'self',
        timestamp: new Date(),
        userResponseCallback: callback,
      }),
    ];

    render(
      <Chat
        initialMessages={initialMessages}
        allowFreeTextInput
      />
    );

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
      createInputMessage('Choose an option', {
        id: 1,
        type: 'other',
        timestamp: new Date(),
        buttons: [
          { label: 'Option 1', onClick: () => {} },
          { label: 'Option 2', onClick: () => {} },
        ],
      }),
    ];

    render(
      <Chat
        initialMessages={initialMessages}
        allowFreeTextInput
      />
    );

    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('should display a loading indicator from the chat store', () => {
    useChatStore.getState().setLoading(true);

    render(<Chat allowFreeTextInput />);

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('should render a loading assistant message in the message list', () => {
    render(
      <Chat
        initialMessages={[
          {
            type: 'other',
            parts: [],
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
      createInputMessage('Click the button', {
        id: 1,
        type: 'other',
        timestamp: new Date(),
        buttons: [{ label: 'Click Me', onClick }],
      }),
    ];

    render(
      <Chat
        initialMessages={initialMessages}
        allowFreeTextInput
      />
    );

    const button = screen.getByText('Click Me');
    await user.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should clear previous message buttons when new message is sent', async () => {
    const user = userEvent.setup();

    const initialMessages: InputMessage[] = [
      createInputMessage('Message with buttons', {
        id: 1,
        type: 'other',
        timestamp: new Date(),
        buttons: [{ label: 'Button 1' }],
      }),
    ];

    render(
      <Chat
        initialMessages={initialMessages}
        allowFreeTextInput
      />
    );

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
    render(<Chat allowFreeTextInput />);

    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, '   ');
    await user.keyboard('{Enter}');

    // No message should be added
    const messages = useChatStore.getState().getMessages();
    expect(messages.length).toBe(0);
  });
});
