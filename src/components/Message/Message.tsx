import React from 'react';
import type {
  ChatTheme,
  Message as ChatMessage,
  MessagePart,
} from '../../js/types';
import { LoadingIndicator } from './LoadingIndicator';
import { MessageButtons } from './MessageButtons';

/**
 * Props for a single chat message bubble.
 *
 * @property message Message data to render, including parts, metadata, and actions.
 * @property theme Theme tokens used to style the bubble and text colors.
 * @property renderPart Renders an individual message part.
 */
interface MessageProps {
  readonly message: ChatMessage;
  readonly theme: ChatTheme;
  readonly renderPart: (
    part: MessagePart,
    index: number,
    message: ChatMessage
  ) => React.JSX.Element | null;
}

/**
 * Renders a single chat message bubble with its timestamp and optional actions.
 *
 * @param props The `MessageProps` object.
 */
export function Message({
  message,
  theme,
  renderPart,
}: MessageProps): React.JSX.Element {
  const isLoadingMessage = message.isLoading === true;

  return (
    <div
      className={`mb-1 flex gap-3 ${
        message.type === 'self' ? 'flex-row-reverse' : 'flex-row'
      }`}
      role='article'
      aria-label={
        message.type === 'self' ? 'User message' : 'Assistant message'
      }
      data-asc-message-id={String(message.id)}
      data-asc-message-type={message.type}
      data-asc-message-loading={isLoadingMessage ? 'true' : 'false'}
    >
      <div className='max-w-[85%]'>
        <div
          className={`rounded-lg px-4 py-3 shadow-sm ${
            message.type === 'self' ? 'ml-auto' : 'mr-auto'
          }`}
          style={{
            background:
              message.type === 'self'
                ? `${theme.primaryColor}ee`
                : `${theme.secondaryColor}f5`,
            color:
              message.type === 'self' ? theme.buttonTextColor : theme.textColor,
            maxWidth: message.type === 'self' ? 'fit-content' : '100%',
          }}
        >
          {isLoadingMessage ? (
            <LoadingIndicator theme={theme} />
          ) : (
            <>
              <div className='space-y-3'>
                {message.parts.map((part, index) =>
                  renderPart(part, index, message)
                )}
              </div>
              <span
                className='mt-1.5 block text-xs'
                style={{
                  color:
                    message.type === 'self'
                      ? `${theme.buttonTextColor}70`
                      : `${theme.textColor}60`,
                }}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </>
          )}
        </div>
        <MessageButtons
          buttons={message.buttons}
          messageType={message.type}
          theme={theme}
        />
      </div>
    </div>
  );
}
