import { beforeEach, describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import {
  createButton,
  createRequestConfirmationButtonDef,
  createRequestInputButtonDef,
  createTextPart,
  useChatGlobalsStore,
  type Message,
} from '../index';
import { useChatStore } from '../lib/chatStore';
import { useInputFieldStore } from '../lib/inputFieldStore';
import { usePersistentButtonStore } from '../lib/persistentButtonStore';

function getMessageText(message: Message | undefined): string {
  const firstPart = message?.parts[0];
  if (!firstPart || firstPart.type !== 'text') {
    return '';
  }

  return firstPart.text;
}

describe('request button definitions', () => {
  beforeEach(() => {
    useChatStore.getState().clearMessages();
    usePersistentButtonStore.getState().clearButtons();
    useChatGlobalsStore.getState().resetChatGlobals();
    useInputFieldStore.getState().resetInputFieldValue();
    useInputFieldStore.getState().resetInputFieldDescription();
    useInputFieldStore.getState().resetInputFieldType();
    useInputFieldStore.getState().resetInputFieldPlaceholder();
    useInputFieldStore.getState().resetInputFieldDisabledPlaceholder();
    useInputFieldStore.getState().resetInputFieldValidator();
    useInputFieldStore.getState().resetInputFieldSubmitGuard();
    useInputFieldStore.getState().resetInputFieldDisabledDefault();
    useInputFieldStore.getState().resetInputFieldDisabledPlaceholderDefault();
    useInputFieldStore.getState().resetInputFieldDisabled();
  });

  it('creates an input button from a reusable definition', () => {
    const onValidInput = vi.fn();
    const definition = createRequestInputButtonDef({
      initialLabel: 'Change Email',
      inputPromptMessage: 'Enter your new email address.',
      inputType: 'email',
      placeholder: 'email@example.com',
      inputDescription: 'We will send a verification link to this address.',
    });

    const button = createButton(definition, {
      onValidInput,
    });

    expect(button.label).toBe('Change Email');

    button.onClick?.();

    const [message] = useChatStore.getState().getMessages();
    expect(getMessageText(message)).toBe('Enter your new email address.');
    expect(useInputFieldStore.getState().getInputFieldType()).toBe('email');
    expect(useInputFieldStore.getState().getInputFieldPlaceholder()).toBe(
      'email@example.com'
    );
    expect(useInputFieldStore.getState().getInputFieldDescription()).toBe(
      'We will send a verification link to this address.'
    );
    expect(useInputFieldStore.getState().getInputFieldDisabled()).toBe(false);
    expect(usePersistentButtonStore.getState().getButtons()).toHaveLength(1);
  });

  it('lets explicit input-request config override chat globals', () => {
    useChatGlobalsStore.getState().setChatGlobals({
      requestInputDefaults: {
        placeholder: 'Global placeholder',
        shouldWaitForTurn: true,
      },
    });

    const button = createButton(
      createRequestInputButtonDef({
        initialLabel: 'Change Email',
        inputPromptMessage: 'Enter your new email address.',
        placeholder: 'Definition placeholder',
        shouldWaitForTurn: false,
      })
    );

    button.onClick?.();

    expect(useInputFieldStore.getState().getInputFieldPlaceholder()).toBe(
      'Definition placeholder'
    );
    expect(useInputFieldStore.getState().getInputFieldDisabled()).toBe(false);
  });

  it('runs input success callbacks defined on the button definition', async () => {
    const onSuccess = vi.fn();
    const onValidInput = vi.fn();
    const definition = createRequestInputButtonDef({
      initialLabel: 'Change Email',
      inputPromptMessage: 'Enter your new email address.',
      onSuccess,
    });

    const button = createButton(definition, {
      onValidInput,
    });

    button.onClick?.();

    useChatStore.getState().addMessage({
      type: 'self',
      parts: [createTextPart('new@example.com')],
      rawContent: 'new@example.com',
    });

    const messages = useChatStore.getState().getMessages();
    const promptMessage = messages.find(message => message.type === 'other');
    promptMessage?.userResponseCallback?.();

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('new@example.com');
      expect(onValidInput).toHaveBeenCalledWith('new@example.com');
    });
  });

  it('creates a confirmation button from a reusable definition', () => {
    const onConfirm = vi.fn();
    const onReject = vi.fn();
    const definition = createRequestConfirmationButtonDef({
      initialLabel: 'Logout',
      confirmationMessage: 'Are you sure you want to logout?',
      confirmLabel: 'Yes, Logout',
      rejectLabel: 'Cancel',
      variant: 'error',
    });

    const button = createButton(definition, {
      onConfirm,
      onReject,
    });

    expect(button.label).toBe('Logout');
    expect(button.variant).toBe('error');

    button.onClick?.();

    const [message] = useChatStore.getState().getMessages();
    expect(getMessageText(message)).toBe('Are you sure you want to logout?');
    expect(message?.buttons).toHaveLength(2);
    expect(message?.buttons?.map(candidate => candidate.label)).toEqual([
      'Yes, Logout',
      'Cancel',
    ]);
  });

  it('runs confirmation reject callbacks defined at runtime', () => {
    const onReject = vi.fn();
    const definition = createRequestConfirmationButtonDef({
      initialLabel: 'Logout',
      confirmationMessage: 'Are you sure you want to logout?',
      rejectLabel: 'Cancel',
      onSuccess: vi.fn(),
    });

    const button = createButton(definition, {
      onReject,
    });

    button.onClick?.();

    const [message] = useChatStore.getState().getMessages();
    const rejectButton = message?.buttons?.[1];
    rejectButton?.onClick?.();

    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it('times out an active input request and resets the shared input', async () => {
    vi.useFakeTimers();

    const button = createButton(
      createRequestInputButtonDef({
        initialLabel: 'Enter code',
        inputPromptMessage: 'Enter the verification code.',
        inputTimeoutMs: 1_000,
        inputTimeoutMessage: 'This request timed out.',
      })
    );

    button.onClick?.();

    await vi.advanceTimersByTimeAsync(1_000);

    expect(getMessageText(useChatStore.getState().getPreviousMessage())).toBe(
      'This request timed out.'
    );
    expect(
      useChatStore.getState().getPreviousMessage()?.userResponseCallback
    ).toBeUndefined();
    expect(useInputFieldStore.getState().getInputFieldPlaceholder()).toBe(
      'Type your message...'
    );
    expect(useInputFieldStore.getState().getInputFieldDisabled()).toBe(true);
    expect(usePersistentButtonStore.getState().getButtons()).toHaveLength(0);

    vi.useRealTimers();
  });

  it('cleans up the shared input before running a custom abort callback', () => {
    const abortCallback = vi.fn(() => {
      expect(useInputFieldStore.getState().getInputFieldType()).toBe(
        'textarea'
      );
      expect(useInputFieldStore.getState().getInputFieldPlaceholder()).toBe(
        'Type your message...'
      );
      expect(useInputFieldStore.getState().getInputFieldDescription()).toBe('');
      expect(useInputFieldStore.getState().getInputFieldDisabled()).toBe(true);
      expect(
        useChatStore.getState().getPreviousMessage()?.userResponseCallback
      ).toBeUndefined();
    });

    const button = createButton(
      createRequestInputButtonDef({
        initialLabel: 'Change Email',
        inputPromptMessage: 'Enter your new email address.',
        inputType: 'email',
        placeholder: 'email@example.com',
        inputDescription: 'We will send a verification link to this address.',
      }),
      {
        abortCallback,
      }
    );

    button.onClick?.();

    const [abortButton] = usePersistentButtonStore.getState().getButtons();
    abortButton?.onClick?.();

    expect(abortCallback).toHaveBeenCalledTimes(1);
    expect(usePersistentButtonStore.getState().getButtons()).toHaveLength(0);
  });

  it('runs confirmation success callbacks defined on the button definition', () => {
    const onSuccess = vi.fn();
    const onConfirm = vi.fn();
    const definition = createRequestConfirmationButtonDef({
      initialLabel: 'Logout',
      confirmationMessage: 'Are you sure you want to logout?',
      onSuccess,
    });

    const button = createButton(definition, {
      onConfirm,
    });

    button.onClick?.();

    const [message] = useChatStore.getState().getMessages();
    const confirmButton = message?.buttons?.[0];
    confirmButton?.onClick?.();

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('keeps an id from createButton or the definition', () => {
    const definedIdButton = createButton(
      createRequestInputButtonDef({
        id: 'change-email',
        initialLabel: 'Change Email',
        inputPromptMessage: 'Enter your new email address.',
      }),
      {}
    );
    const runtimeIdButton = createButton(
      {
        label: 'Open help',
      },
      {
        id: 'open-help',
      }
    );

    expect(definedIdButton).toHaveProperty('id', 'change-email');
    expect(runtimeIdButton).toHaveProperty('id', 'open-help');
  });
});
