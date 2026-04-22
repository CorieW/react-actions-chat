import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { Paperclip, Send, X } from 'lucide-react';
import type { ChatTheme } from '../../js/types';
import {
  useInputFieldStore,
  type InputSubmission,
  type InputType,
} from '../../lib/inputFieldStore';
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
  readonly onSend: (message: string, submission?: InputSubmission) => boolean;
  readonly theme: ChatTheme;
  readonly isInputBlocked: boolean;
}

type ChatInputElement = HTMLInputElement | HTMLTextAreaElement;

function formatFileSize(sizeBytes: number): string {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function mergeSelectedFiles(
  currentFiles: readonly File[],
  nextFiles: readonly File[]
): readonly File[] {
  const mergedFiles = [...currentFiles];

  nextFiles.forEach(file => {
    const alreadySelected = mergedFiles.some(candidate => {
      return (
        candidate.name === file.name &&
        candidate.size === file.size &&
        candidate.lastModified === file.lastModified &&
        candidate.type === file.type
      );
    });

    if (!alreadySelected) {
      mergedFiles.push(file);
    }
  });

  return mergedFiles;
}

function isMultilineInputType(inputType: InputType): boolean {
  return inputType === 'textarea';
}

function resolveInvalidFileMessage(fileCount: number): string {
  return `Please choose a valid file${fileCount === 1 ? '' : 's'} and try again.`;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleSendRef = useRef<() => void>(() => {});
  const inputDescriptionId = useId();
  const fileValidationMessageId = useId();
  const [fileValidationMessage, setFileValidationMessage] = useState<
    string | null
  >(null);
  const {
    getInputFieldDescription,
    getInputFieldDisabled,
    getInputFieldDisabledPlaceholder,
    getInputFieldFiles,
    getInputFieldFileValidator,
    getInputFieldFileUploadEnabled,
    getInputFieldPlaceholder,
    getInputFieldType,
    getInputFieldValue,
    setInputFieldParams,
    setInputFieldFiles,
    setInputFieldValue,
  } = useInputFieldStore();

  const inputType = getInputFieldType();
  const inputPlaceholder = getInputFieldPlaceholder();
  const inputDisabled = getInputFieldDisabled();
  const inputDisabledPlaceholder = getInputFieldDisabledPlaceholder();
  const inputFiles = getInputFieldFiles();
  const inputFileValidator = getInputFieldFileValidator();
  const fileUploadEnabled = getInputFieldFileUploadEnabled();
  const inputValue = getInputFieldValue();
  const inputDescription = getInputFieldDescription();
  const inputIsDisabled = inputDisabled || isInputBlocked;
  const usesMultilineInput = isMultilineInputType(inputType);
  const hasPendingSubmission =
    inputValue.trim().length > 0 || inputFiles.length > 0;
  const displayedPlaceholder = inputDisabled
    ? inputDisabledPlaceholder
    : isInputBlocked
      ? CONFIRMATION_PENDING_PLACEHOLDER
      : inputPlaceholder;

  const handleSend = useCallback((): void => {
    if (inputIsDisabled || !hasPendingSubmission) {
      return;
    }

    const submission: InputSubmission = {
      text: inputValue,
      files: inputFiles,
    };
    const didSend = onSend(inputValue, submission);
    if (didSend) {
      setInputFieldValue('');
      setInputFieldFiles([]);
      setFileValidationMessage(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [
    hasPendingSubmission,
    inputFiles,
    inputIsDisabled,
    inputValue,
    onSend,
    setInputFieldFiles,
    setInputFieldValue,
  ]);
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

  useEffect(() => {
    setFileValidationMessage(null);
  }, [
    displayedPlaceholder,
    fileUploadEnabled,
    inputDescription,
    inputFileValidator,
    inputFiles,
    inputType,
  ]);

  const handleKeyPress = (event: KeyboardEvent<ChatInputElement>): void => {
    if (inputIsDisabled) {
      return;
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitInput();
    }
  };

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>): void => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0) {
      return;
    }

    const mergedFiles = mergeSelectedFiles(inputFiles, selectedFiles);

    if (inputFileValidator) {
      const submission: InputSubmission = {
        text: inputValue,
        files: mergedFiles,
      };

      for (const file of mergedFiles) {
        const validationResult = inputFileValidator(file, submission);

        if (validationResult !== true) {
          setFileValidationMessage(
            typeof validationResult === 'string'
              ? validationResult
              : resolveInvalidFileMessage(mergedFiles.length)
          );
          event.target.value = '';
          return;
        }
      }
    }

    setFileValidationMessage(null);
    setInputFieldFiles(mergedFiles);
    event.target.value = '';
  };

  const removeSelectedFile = (fileToRemove: File): void => {
    setInputFieldFiles(
      inputFiles.filter(candidate => candidate !== fileToRemove)
    );

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
      <input
        ref={fileInputRef}
        type='file'
        multiple
        aria-label='Chat file upload'
        data-asc-role='chat-file-input'
        className='hidden'
        onChange={handleFileSelection}
      />
      <div className='flex flex-col gap-4'>
        <div className='flex items-stretch gap-3'>
          {fileUploadEnabled ? (
            <Button
              type='button'
              onClick={() => {
                if (!inputIsDisabled) {
                  fileInputRef.current?.click();
                }
              }}
              disabled={inputIsDisabled}
              aria-label='Upload files'
              className='h-auto shrink-0 rounded-lg px-3 py-3 disabled:opacity-40'
              style={{
                backgroundColor: `${theme.inputBackgroundColor}80`,
                color: theme.inputTextColor,
              }}
            >
              <Paperclip className='h-5 w-5' />
            </Button>
          ) : null}
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
              aria-describedby={
                inputDescription ? inputDescriptionId : undefined
              }
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
              aria-describedby={
                inputDescription ? inputDescriptionId : undefined
              }
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
            disabled={inputIsDisabled || !hasPendingSubmission}
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
        {inputFiles.length > 0 ? (
          <div
            className='flex flex-wrap gap-2'
            aria-label='Selected files'
            data-asc-role='chat-selected-files'
          >
            {inputFiles.map(file => (
              <div
                key={`${file.name}-${file.lastModified}-${file.size}`}
                className='flex items-center gap-2 rounded-full px-3 py-1.5 text-sm'
                style={{
                  backgroundColor: `${theme.inputBackgroundColor}a6`,
                  color: theme.inputTextColor,
                }}
              >
                <span className='max-w-[180px] truncate'>{file.name}</span>
                <span className='text-xs opacity-70'>
                  {formatFileSize(file.size)}
                </span>
                <button
                  type='button'
                  onClick={() => {
                    removeSelectedFile(file);
                  }}
                  aria-label={`Remove ${file.name}`}
                  className='rounded-full p-0.5 transition-opacity hover:opacity-80'
                  style={{ color: theme.inputTextColor }}
                >
                  <X className='h-3.5 w-3.5' />
                </button>
              </div>
            ))}
          </div>
        ) : null}
        {fileValidationMessage ? (
          <div
            id={fileValidationMessageId}
            role='alert'
            aria-live='polite'
            data-asc-role='chat-file-validation-message'
            className='text-sm font-medium'
            style={{ color: '#b42318' }}
          >
            {fileValidationMessage}
          </div>
        ) : null}
      </div>
    </div>
  );
}
