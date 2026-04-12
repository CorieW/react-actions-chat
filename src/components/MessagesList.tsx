import React, { useRef, useEffect } from 'react';
import type { ChatTheme, Message } from '../js/types';
import { MessageBubble } from './';

/**
 * Props for the chat transcript list.
 *
 * @property messages Messages to render in the chat transcript.
 * @property isLoading Shows the loading indicator below the transcript when true.
 * @property theme Theme tokens used to style message surfaces.
 */
interface MessagesListProps {
  readonly messages: readonly Message[];
  readonly isLoading?: boolean | undefined;
  readonly theme: ChatTheme;
}

/**
 * Renders the chat transcript and keeps the latest content in view.
 *
 * @param props The message list props.
 */
export function MessagesList({
  messages,
  isLoading = false,
  theme,
}: MessagesListProps): React.JSX.Element {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadingIndicatorBubble: Message = {
    id: -1,
    type: 'other',
    content: '',
    rawContent: '',
    timestamp: new Date(0),
    isLoading: true,
  };

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [isLoading, messages]);

  return (
    <div className='flex-1 space-y-5 overflow-y-auto scroll-smooth p-6'>
      {messages.map(message => (
        <MessageBubble key={message.id} message={message} theme={theme} />
      ))}
      {isLoading ? (
        <MessageBubble message={loadingIndicatorBubble} theme={theme} />
      ) : null}
      <div ref={messagesEndRef} />
    </div>
  );
}
