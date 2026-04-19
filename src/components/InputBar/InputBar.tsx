import React, { useCallback, useEffect, useId, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import type { ChatTheme } from '../../js/types';
import { useInputFieldStore, type InputType } from '../../lib/inputFieldStore';
import { Button } from '../ui/button';

const CONFIRMATION_PENDING_PLACEHOLDER =
  'Choose a confirmation option to continue.';

/**
 * Props for the shared chat input bar.
 *
 * @property onSend Called when the user submits the current input value.
 * @property theme Theme tokens used to style the input area and send button.
 * @property isInputBlocked Whether visible transcript actions are temporarily blocking free-form input.
 */
interface InputBarProps {
  readonly onSend: (message: string) => boolean;
  readonly theme: ChatTheme;
  readonly isInputBlocked: boolean;
}

type ChatInputElement = HTMLInputElement | HTMLTextAreaElement;

function isMultilineInputType(inputType: InputType): boolean {
  return inputType === 'textarea';
}

function syncTextareaHeight(element: ChatInputElement | null): void {
  if (!element || element.tagName !== 'TEXTAREA') {
    return;
  }

  element.style.height = '0px';
  element.style.height = `${Math.min(element.scrollHeight, 160)}px`;
  element.style.overflowY = element.scrollHeight > 160 ? 'auto' : 'hidden';
}

/**
 * Renders the shared chat input bar and submit button.
 *
 * @param props The `InputBarProps` object.
 */
export function InputBar({
  onSend,
  theme,
  isInputBlocked,
}: InputBarProps): React.JSX.Element {
  const inputRef = useRef<ChatInputElement>(null);
  const handleSendRef = useRef<() => void>(() => {});
  const inputDescriptionId = useId();
  const {
    getInputFieldDescription,
    getInputFieldDisabled,
    getInputFieldDisabledPlaceholder,
    getInputFieldPlaceholder,
    getInputFieldType,
    getInputFieldValue,
    setInputFieldParams,
    setInputFieldValue,
  } = useInputFieldStore();

  const inputType = getInputFieldType();
  const inputPlaceholder = getInputFieldPlaceholder();
  const inputDisabled = getInputFieldDisabled();
  const inputDisabledPlaceholder = getInputFieldDisabledPlaceholder();
  const inputValue = getInputFieldValue();
  const inputDescription = getInputFieldDescription();
  const inputIsDisabled = inputDisabled || isInputBlocked;
  const usesMultilineInput = isMultilineInputType(inputType);
  const displayedPlaceholder = inputDisabled
    ? inputDisabledPlaceholder
    : isInputBlocked
      ? CONFIRMATION_PENDING_PLACEHOLDER
      : inputPlaceholder;

  const handleSend = useCallback((): void => {
    if (inputIsDisabled || inputValue.trim() === '') {
      return;
    }

    const didSend = onSend(inputValue);
    if (didSend) {
      setInputFieldValue('');
    }
  }, [inputIsDisabled, inputValue, onSend, setInputFieldValue]);
  handleSendRef.current = handleSend;

  const submitInput = useCallback((): void => {
    handleSendRef.current();
  }, []);

  useEffect(() => {
    if (inputRef.current) {
      setInputFieldParams({
        element: inputRef.current,
      });
      syncTextareaHeight(inputRef.current);
    }

    setInputFieldParams({
      submitFunc: submitInput,
    });

    return () => {
      setInputFieldParams({
        element: null,
        submitFunc: null,
      });
    };
  }, [displayedPlaceholder, inputType, setInputFieldParams, submitInput]);

  useEffect(() => {
    syncTextareaHeight(inputRef.current);
  }, [inputValue, inputType]);

  const handleKeyPress = (event: KeyboardEvent<ChatInputElement>): void => {
    if (inputIsDisabled) {
      return;
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
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
      {inputDescription ? (
        <div
          id={inputDescriptionId}
          className='mb-3 text-sm font-medium'
          style={{ color: `${theme.textColor}cc` }}
        >
          {inputDescription}
        </div>
      ) : null}
      <div className='flex items-stretch gap-3'>
        {usesMultilineInput ? (
          <textarea
            ref={inputRef as React.Ref<HTMLTextAreaElement>}
            value={inputValue}
            onChange={event => setInputFieldValue(event.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={displayedPlaceholder}
            disabled={inputIsDisabled}
            rows={1}
            aria-label='Chat input'
            aria-describedby={inputDescription ? inputDescriptionId : undefined}
            data-asc-role='chat-input'
            className='placeholder:text-opacity-50 min-h-[52px] flex-1 resize-none rounded-lg px-4 py-3 focus:ring-1 focus:outline-none'
            style={{
              backgroundColor: `${theme.inputBackgroundColor}80`,
              borderColor: 'transparent',
              border: 'none',
              color: theme.inputTextColor,
            }}
          />
        ) : (
          <input
            ref={inputRef as React.Ref<HTMLInputElement>}
            type={inputType}
            value={inputValue}
            onChange={event => setInputFieldValue(event.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={displayedPlaceholder}
            disabled={inputIsDisabled}
            aria-label='Chat input'
            aria-describedby={inputDescription ? inputDescriptionId : undefined}
            data-asc-role='chat-input'
            className='placeholder:text-opacity-50 flex-1 rounded-lg px-4 py-3 focus:ring-1 focus:outline-none'
            style={{
              backgroundColor: `${theme.inputBackgroundColor}80`,
              borderColor: 'transparent',
              border: 'none',
              color: theme.inputTextColor,
            }}
          />
        )}
        <Button
          onClick={handleSend}
          disabled={inputIsDisabled || inputValue.trim() === ''}
          aria-label='Send message'
          className='h-auto shrink-0 rounded-lg px-4 py-3 disabled:opacity-40'
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
