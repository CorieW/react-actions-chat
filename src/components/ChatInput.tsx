import { useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import type { ChatTheme } from '../js/types';
import { Button } from './ui/button';
import { useInputFieldStore } from '../lib/inputFieldStore';

interface ChatInputProps {
  readonly onSend: (message: string) => void;
  readonly theme: ChatTheme;
}

export function ChatInput({
  onSend,
  theme,
}: ChatInputProps): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    setInputFieldValue,
    setInputFieldElement,
    setInputFieldSubmitFunc,
    getInputFieldValue,
    getInputFieldSubmitFunc,
    getInputFieldDescription,
    getInputFieldType,
    getInputFieldPlaceholder,
  } = useInputFieldStore();

  const inputType = getInputFieldType();
  const inputPlaceholder = getInputFieldPlaceholder();

  // Register the input element and submit function with the store
  useEffect(() => {
    if (inputRef.current) {
      setInputFieldElement(inputRef.current);
      // Sync initial type
      inputRef.current.type = inputType;
    }

    setInputFieldSubmitFunc(handleSend);

    return () => {
      setInputFieldElement(null);
      setInputFieldSubmitFunc(null);
    };
  }, [
    setInputFieldElement,
    setInputFieldSubmitFunc,
    inputType,
    getInputFieldValue,
  ]);

  // Update input type when it changes in the store
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.type = inputType;
    }
  }, [inputType]);

  // Update input placeholder when it changes in the store
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.placeholder = inputPlaceholder;
    }
  }, [inputPlaceholder]);

  const handleSend = (): void => {
    if (getInputFieldValue().trim() === '') return;

    // Note: Validation is handled in the userResponseCallback of the requesting message
    // We allow sending here to enable error messages to be displayed when validation fails
    onSend(getInputFieldValue());
    setInputFieldValue('');
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      getInputFieldSubmitFunc?.()?.();
    }
  };

  return (
    <div
      className='p-4 border-t'
      style={{
        borderColor: `${theme.borderColor}40`,
        backgroundColor: theme.backgroundColor,
      }}
    >
      {getInputFieldDescription() && (
        <div
          className='mb-3 text-sm font-medium'
          style={{ color: `${theme.textColor}cc` }}
        >
          {getInputFieldDescription()}
        </div>
      )}
      <div className='flex gap-3 items-center'>
        <input
          ref={inputRef}
          type={inputType}
          value={getInputFieldValue()}
          onChange={e => setInputFieldValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={inputPlaceholder}
          className='flex-1 px-4 py-3 rounded-lg focus:outline-none focus:ring-1 placeholder:text-opacity-50'
          style={{
            backgroundColor: `${theme.inputBackgroundColor}80`,
            borderColor: 'transparent',
            border: 'none',
            color: theme.inputTextColor,
          }}
        />
        <Button
          onClick={getInputFieldSubmitFunc?.() ?? (() => {})}
          disabled={getInputFieldValue().trim() === ''}
          className='px-4 py-3 rounded-lg disabled:opacity-40'
          style={{
            backgroundColor: theme.buttonColor,
            color: theme.buttonTextColor,
          }}
        >
          <Send className='w-5 h-5' />
        </Button>
      </div>
    </div>
  );
}
