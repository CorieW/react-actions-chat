import { useEffect } from 'react';
import type { ChatPropsWithFlexibleTheme } from '../js/types';
import {
  useChatStore,
  getResolvedTheme,
  getThemeStyles,
  useInputFieldStore,
} from '../lib';
import { MessagesList, ChatInput, PersistentButtons } from './';

export function Chat({
  initialMessages = [],
  theme,
}: ChatPropsWithFlexibleTheme): React.JSX.Element {
  const { messages, addMessage, setMessages, getPreviousMessage } =
    useChatStore();
  const { getInputFieldType } = useInputFieldStore();

  // Resolved theme based on string or object or undefined
  const mergedTheme = getResolvedTheme(theme);

  // Initialize messages with initialMessages if provided
  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages, setMessages]);

  const handleSend = (messageContent: string): void => {
    // Get the previous message (before sending the self message)
    const previousMessage = getPreviousMessage();

    let displayedContent = messageContent;
    if (getInputFieldType() === 'password') {
      displayedContent = '•'.repeat(messageContent.length);
    }

    // Add the self message
    addMessage({
      type: 'self',
      content: displayedContent,
      rawContent: messageContent,
    });

    // If the previous message is an other message and has a userResponseCallback, call it
    const isPreviousMessageOther = previousMessage?.type === 'other';
    const hasUserResponseCallback = previousMessage?.userResponseCallback;
    if (isPreviousMessageOther && hasUserResponseCallback) {
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
      <PersistentButtons theme={mergedTheme} />
      <ChatInput onSend={handleSend} theme={mergedTheme} />
    </div>
  );
}
