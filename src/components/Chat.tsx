import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import type { ChatProps, ChatTheme } from '../js/types';
import { Button } from './ui/button';
import { Avatar } from './ui/avatar';
import { useChatStore } from '../lib/chatStore';

// Preset light and dark themes
const LIGHT_THEME: ChatTheme = {
  primaryColor: '#3b82f6',           // Blue for user messages
  secondaryColor: '#e5e7eb',         // Light gray for agent messages
  backgroundColor: '#f3f4f6',        // Light background
  textColor: '#111827',              // Very dark text
  borderColor: '#e5e7eb',            // Light gray borders
  inputBackgroundColor: '#fff',      // White input
  inputTextColor: '#111827',         // Dark text input
  buttonColor: '#3b82f6',            // Blue button
  buttonTextColor: '#ffffff',        // White button text
};

const DARK_THEME: ChatTheme = {
  primaryColor: '#3b82f6',           // User message background (blue)
  secondaryColor: '#374151',         // Agent message background (gray-700)
  backgroundColor: '#111827',        // Chat container background (gray-900)
  textColor: '#f9fafb',              // Primary text (gray-50)
  borderColor: '#4b5563',            // Border (gray-600)
  inputBackgroundColor: '#1f2937',   // Input background (gray-800)
  inputTextColor: '#f9fafb',         // Input text (gray-50)
  buttonColor: '#3b82f6',            // Button (blue-600)
  buttonTextColor: '#ffffff',        // Button text (white)
};

type ThemeInput = 'light' | 'dark' | ChatTheme | undefined;

function getResolvedTheme(theme: ThemeInput): ChatTheme {
  if (!theme || theme === 'dark') return { ...DARK_THEME };
  if (theme === 'light') return { ...LIGHT_THEME };
  // custom object: merge it over dark as base (to retain all properties)
  return { ...DARK_THEME, ...theme };
}

export type ChatPropsWithFlexibleTheme = Omit<ChatProps, 'theme'> & {
  theme?: ThemeInput;
};

export function Chat({
  initialMessages = [],
  theme,
}: ChatPropsWithFlexibleTheme): React.JSX.Element {
  const { messages, addMessage, setMessages, getPreviousMessage } = useChatStore();
  const [inputValue, setInputValue] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Resolved theme based on string or object or undefined
  const mergedTheme = getResolvedTheme(theme);

  // Initialize messages with initialMessages if provided
  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages, setMessages]);

  // Generate CSS custom properties from mergedTheme
  const getThemeStyles = (): React.CSSProperties => {
    return {
      '--chat-primary-color': mergedTheme.primaryColor,
      '--chat-secondary-color': mergedTheme.secondaryColor,
      '--chat-background-color': mergedTheme.backgroundColor,
      '--chat-text-color': mergedTheme.textColor,
      '--chat-border-color': mergedTheme.borderColor,
      '--chat-input-background-color': mergedTheme.inputBackgroundColor,
      '--chat-input-text-color': mergedTheme.inputTextColor,
      '--chat-button-color': mergedTheme.buttonColor,
      '--chat-button-text-color': mergedTheme.buttonTextColor,
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
        backgroundColor: mergedTheme.backgroundColor,
        color: mergedTheme.textColor,
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
                  className="flex items-center justify-center w-full h-full text-sm font-medium"
                  style={{
                    backgroundColor: message.type === 'user' 
                      ? mergedTheme.primaryColor
                      : mergedTheme.secondaryColor,
                    color: message.type === 'user' 
                      ? mergedTheme.buttonTextColor
                      : mergedTheme.textColor,
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
                  ? mergedTheme.primaryColor
                  : mergedTheme.secondaryColor,
                color: message.type === 'user'
                  ? mergedTheme.buttonTextColor
                  : mergedTheme.textColor,
              }}
            >
              <p className="text-sm wrap-break-words">{message.content}</p>
              <span 
                className="block mt-1 text-xs"
                style={{
                  color: message.type === 'user' 
                    ? `${mergedTheme.buttonTextColor}70`
                    : `${mergedTheme.textColor}70`,
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
          borderColor: mergedTheme.borderColor,
          backgroundColor: mergedTheme.secondaryColor,
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
              backgroundColor: mergedTheme.inputBackgroundColor,
              borderColor: mergedTheme.borderColor,
              color: mergedTheme.inputTextColor,
            }}
          />
          <Button
            onClick={handleSend}
            disabled={inputValue.trim() === ''}
            className="px-4"
            style={{
              backgroundColor: mergedTheme.buttonColor,
              color: mergedTheme.buttonTextColor,
            }}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
