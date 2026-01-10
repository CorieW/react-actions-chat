import { useRef, useEffect } from 'react';
import type { ChatTheme, Message } from '../js/types';
import { MessageBubble } from './';

interface MessagesListProps {
  readonly messages: readonly Message[];
  readonly theme: ChatTheme;
}

export function MessagesList({
  messages,
  theme,
}: MessagesListProps): React.JSX.Element {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className='flex-1 p-4 space-y-4 overflow-y-auto'>
      {messages.map(message => (
        <MessageBubble key={message.id} message={message} theme={theme} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
