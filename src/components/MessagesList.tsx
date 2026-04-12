import { useRef, useEffect } from 'react';
import type { ChatTheme, Message } from '../js/types';
import { LoadingIndicator, MessageBubble } from './';

interface MessagesListProps {
  /** Messages to render in the chat transcript. */
  readonly messages: readonly Message[];
  /** Shows the loading indicator below the transcript when true. */
  readonly isLoading?: boolean | undefined;
  /** Optional label announced while the loading indicator is visible. */
  readonly loadingMessage?: string | undefined;
  /** Theme tokens used to style message surfaces. */
  readonly theme: ChatTheme;
}

export function MessagesList({
  messages,
  isLoading = false,
  loadingMessage,
  theme,
}: MessagesListProps): React.JSX.Element {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [isLoading, loadingMessage, messages]);

  return (
    <div className='flex-1 space-y-5 overflow-y-auto scroll-smooth p-6'>
      {messages.map(message => (
        <MessageBubble key={message.id} message={message} theme={theme} />
      ))}
      {isLoading ? (
        <LoadingIndicator label={loadingMessage} theme={theme} />
      ) : null}
      <div ref={messagesEndRef} />
    </div>
  );
}
