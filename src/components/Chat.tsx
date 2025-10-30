import { useEffect } from 'react';
import type { ChatPropsWithFlexibleTheme } from '../js/types';
import { useChatStore, getResolvedTheme, getThemeStyles } from '../lib';
import { MessagesList, ChatInput } from './';

export function Chat({
  initialMessages = [],
  theme,
}: ChatPropsWithFlexibleTheme): React.JSX.Element {
  const { messages, addMessage, setMessages, getPreviousMessage } =
    useChatStore();

  // Resolved theme based on string or object or undefined
  const mergedTheme = getResolvedTheme(theme);

  // Initialize messages with initialMessages if provided
  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages, setMessages]);

  const handleSend = (messageContent: string): void => {
    // Get the previous message (before sending the user message)
    const previousMessage = getPreviousMessage();

    // Add the user message
    addMessage({
      type: 'user',
      content: messageContent,
    });

    // If the previous message is an agent message and has a userResponseCallback, call it
    const isPreviousMessageAgent = previousMessage?.type === 'agent';
    const hasUserResponseCallback = previousMessage?.userResponseCallback;
    if (isPreviousMessageAgent && hasUserResponseCallback) {
      previousMessage.userResponseCallback();
    }
  };

  return (
    <div
      className='flex flex-col h-screen'
      style={{
        ...getThemeStyles(mergedTheme),
        backgroundColor: mergedTheme.backgroundColor,
        color: mergedTheme.textColor,
      }}
    >
      <MessagesList messages={messages} theme={mergedTheme} />
      <ChatInput onSend={handleSend} theme={mergedTheme} />
    </div>
  );
}
