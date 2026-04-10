import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Chat } from '../components/Chat';
import { useChatStore } from '../lib/chatStore';
import { useInputFieldStore } from '../lib/inputFieldStore';
import { usePersistentButtonStore } from '../lib/persistentButtonStore';
import type { InputMessage } from '../js/types';

describe('Chat integration tests', () => {
  beforeEach(() => {
    useChatStore.getState().clearMessages();
    usePersistentButtonStore.getState().clearButtons();

    const inputFieldStore = useInputFieldStore.getState();
    inputFieldStore.resetInputField();
    inputFieldStore.resetInputFieldValue();
    inputFieldStore.resetInputFieldDescription();
    inputFieldStore.resetInputFieldType();
    inputFieldStore.resetInputFieldPlaceholder();
    inputFieldStore.resetInputFieldValidator();
  });

  it('renders initial messages and the input field', () => {
    const initialMessages: InputMessage[] = [
      {
        type: 'other',
        content: 'Hello!',
        timestamp: new Date(),
      },
      {
        type: 'self',
        content: 'Hi there!',
        timestamp: new Date(),
      },
    ];

    render(<Chat initialMessages={initialMessages} />);

    expect(screen.getByText('Hello!')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Type your message...')
    ).toBeInTheDocument();
  });

  it('sends a message from the input and clears the field', async () => {
    const user = userEvent.setup();
    render(<Chat />);

    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, 'Test message{Enter}');

    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    expect(input).toHaveValue('');
  });

  it('masks password input in chat while keeping raw content', async () => {
    const user = userEvent.setup();
    useInputFieldStore.getState().setInputFieldType('password');
    render(<Chat />);

    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, 'secret{Enter}');

    const maskedContent = '\u2022'.repeat('secret'.length);
    await waitFor(() => {
      expect(screen.getByText(maskedContent)).toBeInTheDocument();
    });

    const latestMessage = useChatStore.getState().getPreviousMessage();
    expect(latestMessage?.rawContent).toBe('secret');
    expect(latestMessage?.content).toBe(maskedContent);
  });

  it('calls userResponseCallback for the previous other message', async () => {
    const user = userEvent.setup();
    const callback = vi.fn();

    const initialMessages: InputMessage[] = [
      {
        type: 'other',
        content: 'Please respond',
        timestamp: new Date(),
        userResponseCallback: callback,
      },
    ];

    render(<Chat initialMessages={initialMessages} />);

    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, 'My response{Enter}');

    await waitFor(() => {
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  it('does not call userResponseCallback for the previous self message', async () => {
    const user = userEvent.setup();
    const callback = vi.fn();

    const initialMessages: InputMessage[] = [
      {
        type: 'self',
        content: 'My own message',
        timestamp: new Date(),
        userResponseCallback: callback,
      },
    ];

    render(<Chat initialMessages={initialMessages} />);

    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, 'Another message{Enter}');

    await waitFor(() => {
      expect(screen.getByText('Another message')).toBeInTheDocument();
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('renders message buttons and invokes button handlers', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    const initialMessages: InputMessage[] = [
      {
        type: 'other',
        content: 'Click the button',
        timestamp: new Date(),
        buttons: [{ label: 'Click Me', onClick }],
      },
    ];

    render(<Chat initialMessages={initialMessages} />);

    const button = screen.getByRole('button', { name: 'Click Me' });
    await user.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('clears previous message buttons once the user sends a new message', async () => {
    const user = userEvent.setup();

    const initialMessages: InputMessage[] = [
      {
        type: 'other',
        content: 'Choose an option',
        timestamp: new Date(),
        buttons: [{ label: 'Option 1' }],
      },
    ];

    render(<Chat initialMessages={initialMessages} />);

    expect(screen.getByText('Option 1')).toBeInTheDocument();

    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, 'Next{Enter}');

    await waitFor(() => {
      expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
    });
  });

  it('does not send blank messages and applies custom theme styles', async () => {
    const user = userEvent.setup();
    const customTheme = {
      backgroundColor: '#ff0000',
      textColor: '#00ff00',
      primaryColor: '#0000ff',
    };

    render(<Chat theme={customTheme} />);

    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, '   {Enter}');

    const container = screen.getByTestId('chat-container');
    expect(container).toHaveStyle({
      backgroundColor: customTheme.backgroundColor,
      color: customTheme.textColor,
    });
    expect(useChatStore.getState().getMessages()).toHaveLength(0);
  });
});
