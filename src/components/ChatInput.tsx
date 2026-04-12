import React, { useCallback, useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import type { ChatTheme } from '../js/types';
import { Button } from './ui/button';
import { useInputFieldStore } from '../lib/inputFieldStore';

/**
 * Props for the shared chat input field.
 *
 * @property onSend Called when the user submits the current input value.
 * @property theme Theme tokens used to style the input area and send button.
 */
interface ChatInputProps {
  readonly onSend: (message: string) => void;
  readonly theme: ChatTheme;
}

/**
 * Renders the shared chat input field and submit button.
 *
 * @param props The `ChatInputProps` object.
 */
export function ChatInput({
  onSend,
  theme,
}: ChatInputProps): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleSendRef = useRef<() => void>(() => {});
  const {
    setInputFieldValue,
    setInputFieldElement,
    setInputFieldSubmitFunc,
    getInputFieldValue,
    getInputFieldDescription,
    getInputFieldType,
    getInputFieldPlaceholder,
  } = useInputFieldStore();

  const inputType = getInputFieldType();
  const inputPlaceholder = getInputFieldPlaceholder();

  const handleSend = useCallback((): void => {
    if (getInputFieldValue().trim() === '') return;

    // Note: Validation is handled in the userResponseCallback of the requesting message
    // We allow sending here to enable error messages to be displayed when validation fails
    onSend(getInputFieldValue());
    setInputFieldValue('');
  }, [getInputFieldValue, onSend, setInputFieldValue]);
  handleSendRef.current = handleSend;

  const submitInput = useCallback((): void => {
    handleSendRef.current();
  }, []);

  // Register the input element and submit function with the store
  useEffect(() => {
    if (inputRef.current) {
      setInputFieldElement(inputRef.current);
      // Sync initial type
      inputRef.current.type = inputType;
    }

    setInputFieldSubmitFunc(submitInput);

    return () => {
      setInputFieldElement(null);
      setInputFieldSubmitFunc(null);
    };
  }, [setInputFieldElement, setInputFieldSubmitFunc, submitInput, inputType]);

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

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitInput();
    }
  };

  return (
    <div
      className='border-t p-4'
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
      <div className='flex items-center gap-3'>
        <input
          ref={inputRef}
          type={inputType}
          value={getInputFieldValue()}
          onChange={e => setInputFieldValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={inputPlaceholder}
          className='placeholder:text-opacity-50 flex-1 rounded-lg px-4 py-3 focus:ring-1 focus:outline-none'
          style={{
            backgroundColor: `${theme.inputBackgroundColor}80`,
            borderColor: 'transparent',
            border: 'none',
            color: theme.inputTextColor,
          }}
        />
        <Button
          onClick={handleSend}
          disabled={getInputFieldValue().trim() === ''}
          className='rounded-lg px-4 py-3 disabled:opacity-40'
          style={{
            backgroundColor: theme.buttonColor,
            color: theme.buttonTextColor,
          }}
        >
          <Send className='h-5 w-5' />
        </Button>
      </div>
    </div>
  );
}
