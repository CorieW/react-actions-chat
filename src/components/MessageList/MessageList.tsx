import React, { useEffect, useRef } from 'react';
import type { ChatTheme, Message as ChatMessage } from '../../js/types';
import { Message } from '../Message/Message';
import { renderPart } from './parts/renderPart';

/**
 * Props for the chat transcript list.
 *
 * @property messages Messages to render in the chat transcript.
 * @property isLoading Shows the loading indicator below the transcript when true.
 * @property theme Theme tokens used to style message surfaces.
 */
interface MessageListProps {
  readonly messages: readonly ChatMessage[];
  readonly isLoading?: boolean | undefined;
  readonly theme: ChatTheme;
}

/**
 * Renders the chat transcript and keeps the latest content in view.
 *
 * @param props The `MessageListProps` object.
 */
export function MessageList({
  messages,
  isLoading = false,
  theme,
}: MessageListProps): React.JSX.Element {
  const messageListRef = useRef<HTMLDivElement>(null);
  const hasAutoScrolledRef = useRef(false);
  const loadingIndicatorMessage: ChatMessage = {
    id: -1,
    type: 'other',
    parts: [],
    rawContent: '',
    timestamp: new Date(0),
    isLoading: true,
  };

  useEffect(() => {
    const messageList = messageListRef.current;
    if (!messageList) {
      return;
    }

    const nextScrollTop = messageList.scrollHeight;
    const scrollBehavior = hasAutoScrolledRef.current ? 'smooth' : 'auto';
    messageList.scrollTo({
      top: nextScrollTop,
      behavior: scrollBehavior,
    });
    hasAutoScrolledRef.current = true;
  }, [isLoading, messages]);

  return (
    <div
      ref={messageListRef}
      className='flex-1 space-y-5 overflow-y-auto scroll-smooth p-6'
      role='log'
      aria-label='Chat transcript'
      aria-live='polite'
      aria-relevant='additions text'
      data-asc-region='transcript'
    >
      {messages.map(message => (
        <Message
          key={message.id}
          message={message}
          theme={theme}
          renderPart={(part, index, currentMessage) =>
            renderPart(part, index, currentMessage, theme)
          }
        />
      ))}
      {isLoading ? (
        <Message
          message={loadingIndicatorMessage}
          theme={theme}
          renderPart={(part, index, currentMessage) =>
            renderPart(part, index, currentMessage, theme)
          }
        />
      ) : null}
    </div>
  );
}
