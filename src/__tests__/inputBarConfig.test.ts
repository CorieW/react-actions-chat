import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useInputFieldStore } from '../lib/inputFieldStore';
import {
  configureInputBarBehavior,
  resetInputBarBehavior,
} from '../components/InputBar/behavior/configureInputBarBehavior';
import {
  configureInputBarMode,
  resetInputBarMode,
} from '../components/InputBar/modes/configureInputBarMode';
import {
  configureInputBarValidation,
  resetInputBarValidation,
} from '../components/InputBar/validation/configureInputBarValidation';

describe('input bar configuration modules', () => {
  beforeEach(() => {
    const store = useInputFieldStore.getState();
    store.resetInputFieldParams({
      value: true,
      description: true,
      type: true,
      placeholder: true,
      disabledPlaceholder: true,
      validator: true,
      submitGuard: true,
      disabledDefault: true,
      disabledPlaceholderDefault: true,
      disabled: true,
    });
  });

  it('applies and resets input bar mode settings', () => {
    const store = useInputFieldStore.getState();

    configureInputBarMode(store, {
      type: 'email',
      placeholder: 'you@example.com',
      description: 'Enter your email address',
    });

    expect(store.getInputFieldType()).toBe('email');
    expect(store.getInputFieldPlaceholder()).toBe('you@example.com');
    expect(store.getInputFieldDescription()).toBe('Enter your email address');

    resetInputBarMode(store);

    expect(store.getInputFieldType()).toBe('text');
    expect(store.getInputFieldPlaceholder()).toBe('Type your message...');
    expect(store.getInputFieldDescription()).toBe('');
  });

  it('applies and resets input bar validation settings', () => {
    const store = useInputFieldStore.getState();
    const validator = vi.fn((value: string) => value.length > 3 || 'Too short');
    const submitGuard = vi.fn((value: string) => value !== 'blocked');

    configureInputBarValidation(store, {
      validator,
      submitGuard,
    });

    expect(store.getInputFieldValidator()).toBe(validator);
    expect(store.getInputFieldSubmitGuard()).toBe(submitGuard);

    resetInputBarValidation(store);

    expect(store.getInputFieldValidator()).toBeNull();
    expect(store.getInputFieldSubmitGuard()).toBeNull();
  });

  it('applies and resets input bar behavior settings', () => {
    const store = useInputFieldStore.getState();

    configureInputBarBehavior(store, {
      disabled: true,
      disabledPlaceholder: 'Waiting for the next step...',
      shouldWaitForTurn: true,
      timeoutMs: 1_000,
    });

    expect(store.getInputFieldDisabled()).toBe(true);
    expect(store.getInputFieldDisabledPlaceholder()).toBe(
      'Waiting for the next step...'
    );

    resetInputBarBehavior(store);

    expect(store.getInputFieldDisabled()).toBe(true);
    expect(store.getInputFieldDisabledPlaceholder()).toBe('Input disabled.');
  });
});
