import React from 'react';
import type { ChatTheme, Message } from '../js/types';
import { LoadingIndicator } from './LoadingIndicator';
import { MessageButtons } from './MessageButtons';

/**
 * Props for a single chat bubble.
 *
 * @property message Message data to render, including content, metadata, and actions.
 * @property theme Theme tokens used to style the bubble and text colors.
 */
interface MessageBubbleProps {
  readonly message: Message;
  readonly theme: ChatTheme;
}

/**
 * Renders a single chat bubble with its timestamp and optional actions.
 *
 * @param props The message bubble props.
 */
export function MessageBubble({
  message,
  theme,
}: MessageBubbleProps): React.JSX.Element {
  const isLoadingMessage = message.isLoading === true;

  return (
    <div
      className={`mb-1 flex gap-3 ${
        message.type === 'self' ? 'flex-row-reverse' : 'flex-row'
      }`}
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
              <p className='wrap-break-words text-sm leading-relaxed'>
                {message.content}
              </p>
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
        {/* Message Buttons */}
        <MessageButtons
          buttons={message.buttons}
          messageType={message.type}
          theme={theme}
        />
      </div>
    </div>
  );
}
