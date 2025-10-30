import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import type { ChatProps } from '../js/types';
import { Button } from './ui/button';
import { Avatar } from './ui/avatar';
import { useChatStore } from '../lib/chatStore';

export function Chat({ initialMessages = [] }: ChatProps): React.JSX.Element {
  const { messages, addMessage, setMessages, getPreviousMessage } = useChatStore();
  const [inputValue, setInputValue] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize messages with initialMessages if provided
  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages, setMessages]);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (): void => {
    if (inputValue.trim() === '') return;

    // Get the previous message (before sending the user message)
    const previousMessage = getPreviousMessage();

    // Add the user message
    addMessage({
      type: 'user',
      content: inputValue,
    });

    // If the previous message is an agent message and has a userResponseCallback, call it
    const isPreviousMessageAgent = previousMessage?.type === 'agent';
    const hasUserResponseCallback = previousMessage?.userResponseCallback;
    if (isPreviousMessageAgent && hasUserResponseCallback) {
      previousMessage.userResponseCallback();
    }

    // Clear the input value
    setInputValue('');
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Chat Messages Area */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div className="shrink-0">
              <Avatar className="w-8 h-8">
                <div className={`h-full w-full flex items-center justify-center text-sm font-medium ${
                  message.type === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-secondary-foreground'
                }`}>
                  {message.type === 'user' ? 'U' : 'A'}
                </div>
              </Avatar>
            </div>

            {/* Message Bubble */}
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-card-foreground'
              }`}
            >
              <p className="text-sm wrap-break-words">{message.content}</p>
              <span className={`text-xs mt-1 block ${
                message.type === 'user' 
                  ? 'text-primary-foreground/70' 
                  : 'text-muted-foreground'
              }`}>
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border rounded-lg bg-background border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            onClick={handleSend}
            disabled={inputValue.trim() === ''}
            className="px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

