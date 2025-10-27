import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import type { Message, ChatProps } from '../js/types';
import { Button } from './ui/button';
import { Avatar } from './ui/avatar';

export function Chat({ initialMessages = [] }: ChatProps): React.JSX.Element {
  const [messages, setMessages] = useState<readonly Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (): void => {
    if (inputValue.trim() === '') return;

    const newMessage: Message = {
      id: messages.length + 1,
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages([...messages, newMessage]);
    setInputValue('');

    // Simulate agent response
    setTimeout(() => {
      const agentResponse: Message = {
        id: messages.length + 2,
        type: 'agent',
        content: 'Thanks for your message! An agent will respond to you shortly.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, agentResponse]);
    }, 1000);
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div className="flex-shrink-0">
              <Avatar className="h-8 w-8">
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
              <p className="text-sm break-words">{message.content}</p>
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
      <div className="border-t border-border bg-card p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 bg-background border border-input rounded-lg px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            onClick={handleSend}
            disabled={inputValue.trim() === ''}
            className="px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

