import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Chat } from '../components/Chat';
import { useChatStore } from '../lib/chatStore';
import { usePersistentButtonStore } from '../lib/persistentButtonStore';
import type { InputMessage } from '../js/types';
import { LIGHT_THEME, DARK_THEME } from '../lib/themes';

describe('Chat Component Integration Tests', () => {
  beforeEach(() => {
    // Clear stores before each test
    useChatStore.getState().clearMessages();
    usePersistentButtonStore.getState().clearButtons();
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

  it('should apply light theme', () => {
    const { container } = render(<Chat theme='light' />);

    const chatContainer = container.firstChild as HTMLElement;
    expect(chatContainer).toHaveStyle({
      backgroundColor: LIGHT_THEME.backgroundColor,
      color: LIGHT_THEME.textColor,
    });
  });

  it('should apply dark theme', () => {
    const { container } = render(<Chat theme='dark' />);

    const chatContainer = container.firstChild as HTMLElement;
    expect(chatContainer).toHaveStyle({
      backgroundColor: DARK_THEME.backgroundColor,
      color: DARK_THEME.textColor,
    });
  });

  it('should apply custom theme', () => {
    const customTheme = {
      backgroundColor: '#ff0000',
      textColor: '#00ff00',
      primaryColor: '#0000ff',
    };

    const { container } = render(<Chat theme={customTheme} />);

    const chatContainer = container.firstChild as HTMLElement;
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
