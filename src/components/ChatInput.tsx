import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import type { ChatTheme } from '../js/types';
import { Button } from './ui/button';

interface ChatInputProps {
  readonly onSend: (message: string) => void;
  readonly theme: ChatTheme;
}

export function ChatInput({ onSend, theme }: ChatInputProps): React.JSX.Element {
  const [inputValue, setInputValue] = useState<string>('');

  const handleSend = (): void => {
    if (inputValue.trim() === '') return;
    
    onSend(inputValue);
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
      className="p-4 border-t"
      style={{
        borderColor: theme.borderColor,
        backgroundColor: theme.secondaryColor,
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
            backgroundColor: theme.inputBackgroundColor,
            borderColor: theme.borderColor,
            color: theme.inputTextColor,
          }}
        />
        <Button
          onClick={handleSend}
          disabled={inputValue.trim() === ''}
          className="px-4"
          style={{
            backgroundColor: theme.buttonColor,
            color: theme.buttonTextColor,
          }}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
