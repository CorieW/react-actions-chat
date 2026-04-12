import React, { useEffect } from 'react';
import type { ChatPropsWithFlexibleTheme } from '../js/types';
import {
  useChatStore,
  getResolvedTheme,
  getThemeStyles,
  useInputFieldStore,
} from '../lib';
import { MessagesList, ChatInput, PersistentButtons } from './';

/**
 * Renders the chat UI and wires user input into the shared chat state.
 *
 * @param props The chat component props.
 */
export function Chat({
  initialMessages = [],
  theme,
}: ChatPropsWithFlexibleTheme): React.JSX.Element {
  const {
    messages,
    isLoading,
    addMessage,
    addMessages,
    getPreviousMessage,
    clearMessages,
  } = useChatStore();
  const { getInputFieldType } = useInputFieldStore();

  // Resolved theme based on string or object or undefined
  const mergedTheme = getResolvedTheme(theme);

  // Initialize messages with initialMessages if provided (only once)
  useEffect(() => {
    if (initialMessages.length > 0) {
      clearMessages();
      addMessages(initialMessages);
    }
  }, [initialMessages, addMessages, clearMessages]);

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
    <div className='asc-chat-wrapper'>
      <div
        className='flex h-screen flex-col'
        style={{
          ...getThemeStyles(mergedTheme),
          backgroundColor: mergedTheme.backgroundColor,
          color: mergedTheme.textColor,
        }}
      >
        <MessagesList
          messages={messages}
          isLoading={isLoading}
          theme={mergedTheme}
        />
        <PersistentButtons theme={mergedTheme} />
        <ChatInput onSend={handleSend} theme={mergedTheme} />
      </div>
    </div>
  );
}
