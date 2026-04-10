import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequestInputButton } from '../components/RequestInputButton';
import { useChatStore } from '../lib/chatStore';
import { useInputFieldStore } from '../lib/inputFieldStore';
import { usePersistentButtonStore } from '../lib/persistentButtonStore';

const ABORT_BUTTON_ID = 'input-request-abort';

describe('Request input button integration tests', () => {
  beforeEach(() => {
    useChatStore.getState().clearMessages();
    usePersistentButtonStore.getState().clearButtons();

    const inputFieldStore = useInputFieldStore.getState();
    inputFieldStore.resetInputField();
    inputFieldStore.resetInputFieldValue();
    inputFieldStore.resetInputFieldDescription();
    inputFieldStore.resetInputFieldType();
    inputFieldStore.resetInputFieldPlaceholder();
    inputFieldStore.resetInputFieldValidator();
  });

  it('starts input-request mode by configuring the field and adding an abort button', () => {
    const button = createRequestInputButton({
      initialLabel: 'Request email',
      inputPromptMessage: 'Please provide your email',
      inputType: 'email',
      placeholder: 'name@example.com',
      inputDescription: 'We use this for account recovery',
      validator: value => (value.includes('@') ? true : 'Invalid email'),
    });

    button.onClick?.();

    const inputStore = useInputFieldStore.getState();
    expect(inputStore.getInputFieldType()).toBe('email');
    expect(inputStore.getInputFieldPlaceholder()).toBe('name@example.com');
    expect(inputStore.getInputFieldDescription()).toBe(
      'We use this for account recovery'
    );
    expect(inputStore.getInputFieldValidator()).not.toBeNull();

    const latestMessage = useChatStore.getState().getPreviousMessage();
    expect(latestMessage).toMatchObject({
      type: 'other',
      content: 'Please provide your email',
    });
    expect(typeof latestMessage?.userResponseCallback).toBe('function');

    const abortButton = usePersistentButtonStore
      .getState()
      .getButtons()
      .find(buttonConfig => buttonConfig.id === ABORT_BUTTON_ID);
    expect(abortButton?.label).toBe('Abort');
  });

  it('handles a valid response by invoking onValidInput and resetting input-request state', () => {
    const onValidInput = vi.fn();

    const button = createRequestInputButton({
      initialLabel: 'Request email',
      inputPromptMessage: 'Please provide your email',
      inputType: 'email',
      validator: value => (value.includes('@') ? true : 'Must include @'),
      onValidInput,
    });

    button.onClick?.();

    const promptMessage = useChatStore.getState().getPreviousMessage();

    useChatStore.getState().addMessage({
      type: 'self',
      content: 'user@example.com',
      rawContent: 'user@example.com',
    });

    promptMessage?.userResponseCallback?.();

    expect(onValidInput).toHaveBeenCalledWith('user@example.com');

    const inputStore = useInputFieldStore.getState();
    expect(inputStore.getInputFieldValue()).toBe('');
    expect(inputStore.getInputFieldType()).toBe('text');
    expect(inputStore.getInputFieldPlaceholder()).toBe('Type your message...');
    expect(inputStore.getInputFieldDescription()).toBe('');
    expect(inputStore.getInputFieldValidator()).toBeNull();

    const abortButton = usePersistentButtonStore
      .getState()
      .getButtons()
      .find(buttonConfig => buttonConfig.id === ABORT_BUTTON_ID);
    expect(abortButton).toBeUndefined();
  });

  it('handles invalid responses with retry messaging and keeps abort available', () => {
    const onInvalidInput = vi.fn();

    const button = createRequestInputButton({
      initialLabel: 'Request email',
      inputPromptMessage: 'Please provide your email',
      validator: value => (value.includes('@') ? true : 'Must include @'),
      onInvalidInput,
    });

    button.onClick?.();

    const promptMessage = useChatStore.getState().getPreviousMessage();

    useChatStore.getState().addMessage({
      type: 'self',
      content: 'invalid',
      rawContent: 'invalid',
    });

    promptMessage?.userResponseCallback?.();

    expect(onInvalidInput).toHaveBeenCalledWith('invalid', 'Must include @');

    const latestMessage = useChatStore.getState().getPreviousMessage();
    expect(latestMessage).toMatchObject({
      type: 'other',
      content: 'Must include @',
    });
    expect(typeof latestMessage?.userResponseCallback).toBe('function');

    const abortButton = usePersistentButtonStore
      .getState()
      .getButtons()
      .find(buttonConfig => buttonConfig.id === ABORT_BUTTON_ID);
    expect(abortButton).toBeDefined();
  });

  it('default abort behavior resets input configuration and clears pending callback', () => {
    const button = createRequestInputButton({
      initialLabel: 'Request secret',
      inputPromptMessage: 'Provide a secret',
      inputType: 'password',
      inputDescription: 'This should stay private',
      placeholder: 'Enter secret',
      validator: value => value.length > 0 || 'Required',
    });

    button.onClick?.();

    const abortButton = usePersistentButtonStore
      .getState()
      .getButtons()
      .find(buttonConfig => buttonConfig.id === ABORT_BUTTON_ID);

    abortButton?.onClick?.();

    const inputStore = useInputFieldStore.getState();
    expect(inputStore.getInputFieldType()).toBe('text');
    expect(inputStore.getInputFieldPlaceholder()).toBe('Type your message...');
    expect(inputStore.getInputFieldDescription()).toBe('');
    expect(inputStore.getInputFieldValidator()).toBeNull();

    const promptMessage = useChatStore.getState().getPreviousMessage();
    expect(promptMessage?.userResponseCallback).toBeUndefined();

    const remainingAbort = usePersistentButtonStore
      .getState()
      .getButtons()
      .find(buttonConfig => buttonConfig.id === ABORT_BUTTON_ID);
    expect(remainingAbort).toBeUndefined();
  });
});
