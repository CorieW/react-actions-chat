import React, { useEffect } from 'react';
import {
  createTextPart,
  type ChatPropsWithFlexibleTheme,
  type ChatStyleProperties,
  type MessagePart,
} from '../../js/types';
import {
  getResolvedTheme,
  getThemeStyles,
  useChatStore,
  useChatGlobalsStore,
  useInputFieldStore,
} from '../../lib';
import { createMessagePartsFromFiles } from '../../lib/messageParts';
import type { InputSubmission } from '../../lib/inputFieldStore';
import { hasInputBlockingButtons } from '../../lib/messageButtons';
import { cn } from '../../lib/utils';
import { InputBar } from '../InputBar/InputBar';
import { MessageList } from '../MessageList/MessageList';
import { PersistentButtons } from './PersistentButtons';

/**
 * Converts React numeric length props into CSS-variable-safe pixel values.
 *
 * @param value - Length value supplied through the Chat sizing props.
 */
function toCssLengthVariableValue(
  value: React.CSSProperties['height']
): React.CSSProperties['height'] {
  if (typeof value === 'number') {
    return `${value}px`;
  }

  return value;
}

/**
 * Renders the chat UI and wires user input into the shared chat state.
 *
 * @param props - The `ChatPropsWithFlexibleTheme` object.
 */
export function Chat({
  allowFreeTextInput = false,
  className,
  containerClassName,
  contentClassName,
  globals = {},
  height,
  initialMessages = [],
  layout = 'viewport',
  minHeight,
  style,
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
  const {
    getInputFieldDisabled,
    getInputFieldFiles,
    getInputFieldSubmitGuard,
    getInputFieldType,
  } = useInputFieldStore();

  const mergedTheme = getResolvedTheme(theme);
  const inputBlockedByVisibleButtons = hasInputBlockingButtons(messages);
  const rootStyle: ChatStyleProperties = { ...style };
  const rootClassName = cn('asc-chat-wrapper', className);
  const chatContainerClassName = cn(
    'asc-chat-container flex min-h-0 flex-col',
    layout === 'fill' ? 'h-full' : undefined,
    containerClassName
  );

  if (height !== undefined) {
    rootStyle['--asc-chat-height'] = toCssLengthVariableValue(height);
  }

  if (minHeight !== undefined) {
    rootStyle['--asc-chat-min-height'] = toCssLengthVariableValue(minHeight);
  }

  useEffect(() => {
    const inputFieldStore = useInputFieldStore.getState();
    inputFieldStore.setInputFieldParams({
      disabledDefault: !allowFreeTextInput,
      fileUploadEnabled: false,
      files: [],
    });
    inputFieldStore.resetInputFieldDisabled();

    return () => {
      inputFieldStore.resetInputFieldFiles();
      inputFieldStore.resetInputFieldFileUploadEnabled();
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

  const handleSend = (
    messageContent: string,
    submission?: InputSubmission
  ): boolean => {
    if (getInputFieldDisabled() || inputBlockedByVisibleButtons) {
      return false;
    }

    const resolvedSubmission: InputSubmission = submission ?? {
      text: messageContent,
      files: getInputFieldFiles(),
    };
    const submitGuard = getInputFieldSubmitGuard();
    if (submitGuard && !submitGuard(messageContent, resolvedSubmission)) {
      return false;
    }

    const previousMessage = getPreviousMessage();
    const inputType = getInputFieldType();
    const displayedContent =
      inputType === 'password'
        ? '•'.repeat(resolvedSubmission.text.length)
        : resolvedSubmission.text;
    const parts: MessagePart[] = [];

    if (displayedContent.length > 0) {
      parts.push(createTextPart(displayedContent));
    }

    parts.push(...createMessagePartsFromFiles(resolvedSubmission.files));

    if (parts.length === 0) {
      return false;
    }

    addMessage({
      type: 'self',
      parts,
      rawContent: resolvedSubmission.text,
    });

    const isPreviousMessageOther = previousMessage?.type === 'other';
    const hasUserResponseCallback = previousMessage?.userResponseCallback;
    if (isPreviousMessageOther && hasUserResponseCallback) {
      previousMessage.userResponseCallback(resolvedSubmission);
    }

    return true;
  };

  return (
    <div
      className={rootClassName}
      data-asc-region='root'
      style={Object.keys(rootStyle).length > 0 ? rootStyle : undefined}
    >
      <div
        className={chatContainerClassName}
        data-asc-layout={layout}
        data-asc-region='container'
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
          className={contentClassName}
        />
        <div
          className='shrink-0'
          data-asc-region='input'
        >
          <PersistentButtons theme={mergedTheme} />
          <InputBar
            onSend={handleSend}
            theme={mergedTheme}
            isInputBlocked={inputBlockedByVisibleButtons}
          />
        </div>
      </div>
    </div>
  );
}
