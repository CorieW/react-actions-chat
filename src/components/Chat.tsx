import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import type { ChatProps } from '../js/types';
import { Button } from './ui/button';
import { Avatar } from './ui/avatar';
import { useChatStore } from '../lib/chatStore';

export function Chat({ initialMessages = [], theme }: ChatProps): React.JSX.Element {
  const { messages, addMessage, setMessages, getPreviousMessage } = useChatStore();
  const [inputValue, setInputValue] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize messages with initialMessages if provided
  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages, setMessages]);

  // Generate CSS custom properties from theme
  const getThemeStyles = (): React.CSSProperties => {
    if (!theme) return {};
    
    return {
      '--chat-primary-color': theme.primaryColor,
      '--chat-secondary-color': theme.secondaryColor,
      '--chat-background-color': theme.backgroundColor,
      '--chat-text-color': theme.textColor,
      '--chat-border-color': theme.borderColor,
      '--chat-input-background-color': theme.inputBackgroundColor,
      '--chat-input-text-color': theme.inputTextColor,
      '--chat-button-color': theme.buttonColor,
      '--chat-button-text-color': theme.buttonTextColor,
    } as React.CSSProperties;
  };

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
    <div 
      className="flex flex-col h-screen"
      style={{
        ...getThemeStyles(),
        backgroundColor: theme?.backgroundColor || 'var(--background)',
        color: theme?.textColor || 'var(--foreground)',
      }}
    >
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
                <div 
                  className="h-full w-full flex items-center justify-center text-sm font-medium"
                  style={{
                    backgroundColor: message.type === 'user' 
                      ? (theme?.primaryColor || 'var(--primary)')
                      : (theme?.secondaryColor || 'var(--secondary)'),
                    color: message.type === 'user' 
                      ? (theme?.buttonTextColor || 'var(--primary-foreground)')
                      : (theme?.textColor || 'var(--secondary-foreground)'),
                  }}
                >
                  {message.type === 'user' ? 'U' : 'A'}
                </div>
              </Avatar>
            </div>

            {/* Message Bubble */}
            <div
              className="max-w-[70%] rounded-lg p-3"
              style={{
                backgroundColor: message.type === 'user'
                  ? (theme?.primaryColor || 'var(--primary)')
                  : (theme?.secondaryColor || 'var(--card)'),
                color: message.type === 'user'
                  ? (theme?.buttonTextColor || 'var(--primary-foreground)')
                  : (theme?.textColor || 'var(--card-foreground)'),
              }}
            >
              <p className="text-sm wrap-break-words">{message.content}</p>
              <span 
                className="text-xs mt-1 block"
                style={{
                  color: message.type === 'user' 
                    ? (theme?.buttonTextColor ? `${theme.buttonTextColor}70` : 'var(--primary-foreground)')
                    : (theme?.textColor ? `${theme.textColor}70` : 'var(--muted-foreground)'),
                }}
              >
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
      <div 
        className="p-4 border-t"
        style={{
          borderColor: theme?.borderColor || 'var(--border)',
          backgroundColor: theme?.secondaryColor || 'var(--card)',
        }}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            style={{
              backgroundColor: theme?.inputBackgroundColor || 'var(--background)',
              borderColor: theme?.borderColor || 'var(--input)',
              color: theme?.inputTextColor || 'var(--foreground)',
            }}
          />
          <Button
            onClick={handleSend}
            disabled={inputValue.trim() === ''}
            className="px-4"
            style={{
              backgroundColor: theme?.buttonColor || undefined,
              color: theme?.buttonTextColor || undefined,
            }}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

