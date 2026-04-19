import React, { useEffect } from 'react';
import {
  createTextPart,
  type ChatPropsWithFlexibleTheme,
} from '../../js/types';
import {
  getResolvedTheme,
  getThemeStyles,
  useChatStore,
  useChatGlobalsStore,
  useInputFieldStore,
} from '../../lib';
import { hasInputBlockingButtons } from '../../lib/messageButtons';
import { InputBar } from '../InputBar/InputBar';
import { MessageList } from '../MessageList/MessageList';
import { PersistentButtons } from './PersistentButtons';

/**
 * Renders the chat UI and wires user input into the shared chat state.
 *
 * @param props The `ChatPropsWithFlexibleTheme` object.
 */
export function Chat({
  allowFreeTextInput = false,
  globals = {},
  initialMessages = [],
  theme,
}: ChatPropsWithFlexibleTheme): React.JSX.Element {
  const {
    addMessage,
    addMessages,
    clearMessages,
    getPreviousMessage,
    isLoading,
    messages,
  } = useChatStore();
  const { getInputFieldDisabled, getInputFieldSubmitGuard, getInputFieldType } =
    useInputFieldStore();

  const mergedTheme = getResolvedTheme(theme);
  const inputBlockedByVisibleButtons = hasInputBlockingButtons(messages);

  useEffect(() => {
    const inputFieldStore = useInputFieldStore.getState();
    inputFieldStore.setInputFieldParams({
      disabledDefault: !allowFreeTextInput,
    });
    inputFieldStore.resetInputFieldDisabled();

    return () => {
      inputFieldStore.resetInputFieldDisabledDefault();
      inputFieldStore.resetInputFieldDisabled();
    };
  }, [allowFreeTextInput]);

  useEffect(() => {
    const chatGlobalsStore = useChatGlobalsStore.getState();
    chatGlobalsStore.setChatGlobals(globals);

    return () => {
      chatGlobalsStore.resetChatGlobals();
    };
  }, [globals]);

  useEffect(() => {
    if (initialMessages.length > 0) {
      clearMessages();
      addMessages(initialMessages);
    }
  }, [initialMessages, addMessages, clearMessages]);

  const handleSend = (messageContent: string): boolean => {
    if (getInputFieldDisabled() || inputBlockedByVisibleButtons) {
      return false;
    }

    const submitGuard = getInputFieldSubmitGuard();
    if (submitGuard && !submitGuard(messageContent)) {
      return false;
    }

    const previousMessage = getPreviousMessage();
    const inputType = getInputFieldType();
    const displayedContent =
      inputType === 'password'
        ? '•'.repeat(messageContent.length)
        : messageContent;

    addMessage({
      type: 'self',
      parts: [createTextPart(displayedContent)],
      rawContent: messageContent,
    });

    const isPreviousMessageOther = previousMessage?.type === 'other';
    const hasUserResponseCallback = previousMessage?.userResponseCallback;
    if (isPreviousMessageOther && hasUserResponseCallback) {
      previousMessage.userResponseCallback();
    }

    return true;
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
        <MessageList
          messages={messages}
          isLoading={isLoading}
          theme={mergedTheme}
        />
        <PersistentButtons theme={mergedTheme} />
        <InputBar
          onSend={handleSend}
          theme={mergedTheme}
          isInputBlocked={inputBlockedByVisibleButtons}
        />
      </div>
    </div>
  );
}
