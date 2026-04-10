import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useInputFieldStore,
  type InputType,
  type InputValidator,
} from '../lib/inputFieldStore';

describe('Input field store unit tests', () => {
  beforeEach(() => {
    const store = useInputFieldStore.getState();
    store.resetInputField();
    store.resetInputFieldValue();
    store.resetInputFieldDescription();
    store.resetInputFieldType();
    store.resetInputFieldPlaceholder();
    store.resetInputFieldValidator();
  });

  it('starts from the documented defaults', () => {
    const store = useInputFieldStore.getState();

    expect(store.getInputFieldElement()).toBeNull();
    expect(store.getInputFieldValue()).toBe('');
    expect(store.getInputFieldSubmitFunc()).toBeNull();
    expect(store.getInputFieldDescription()).toBe('');
    expect(store.getInputFieldType()).toBe('text');
    expect(store.getInputFieldPlaceholder()).toBe('Type your message...');
    expect(store.getInputFieldValidator()).toBeNull();
  });

  it('updates the input type and syncs the attached element', () => {
    const store = useInputFieldStore.getState();
    const element = document.createElement('input');

    store.setInputFieldElement(element);

    const supportedTypes: InputType[] = [
      'text',
      'password',
      'email',
      'number',
      'tel',
      'url',
      'search',
    ];

    supportedTypes.forEach(type => {
      store.setInputFieldType(type);
      expect(store.getInputFieldType()).toBe(type);
      expect(element.type).toBe(type);
    });

    store.resetInputFieldType();
    expect(store.getInputFieldType()).toBe('text');
    expect(element.type).toBe('text');
  });

  it('tracks input value and supports explicit reset', () => {
    const store = useInputFieldStore.getState();

    store.setInputFieldValue('first value');
    expect(store.getInputFieldValue()).toBe('first value');

    store.setInputFieldValue('second value');
    expect(store.getInputFieldValue()).toBe('second value');

    store.resetInputFieldValue();
    expect(store.getInputFieldValue()).toBe('');
  });

  it('stores placeholder and description and restores defaults on reset', () => {
    const store = useInputFieldStore.getState();

    store.setInputFieldPlaceholder('Enter your email');
    store.setInputFieldDescription('Used for account recovery');

    expect(store.getInputFieldPlaceholder()).toBe('Enter your email');
    expect(store.getInputFieldDescription()).toBe('Used for account recovery');

    store.resetInputFieldPlaceholder();
    store.resetInputFieldDescription();

    expect(store.getInputFieldPlaceholder()).toBe('Type your message...');
    expect(store.getInputFieldDescription()).toBe('');
  });

  it('executes validator functions and supports validator reset', () => {
    const store = useInputFieldStore.getState();
    const validator: InputValidator = value =>
      value.includes('@') ? true : 'Must include @ symbol';

    store.setInputFieldValidator(validator);
    const validatorFn = store.getInputFieldValidator();

    expect(validatorFn?.('test')).toBe('Must include @ symbol');
    expect(validatorFn?.('test@example.com')).toBe(true);

    store.resetInputFieldValidator();
    expect(store.getInputFieldValidator()).toBeNull();
  });

  it('stores submit handlers and allows replacing them', () => {
    const store = useInputFieldStore.getState();
    const firstSubmit = vi.fn();
    const secondSubmit = vi.fn();

    store.setInputFieldSubmitFunc(firstSubmit);
    store.getInputFieldSubmitFunc()?.();
    expect(firstSubmit).toHaveBeenCalledTimes(1);

    store.setInputFieldSubmitFunc(secondSubmit);
    store.getInputFieldSubmitFunc()?.();

    expect(firstSubmit).toHaveBeenCalledTimes(1);
    expect(secondSubmit).toHaveBeenCalledTimes(1);
  });

  it('resetInputField clears element and submit handler without clearing value', () => {
    const store = useInputFieldStore.getState();
    const element = document.createElement('input');

    store.setInputFieldElement(element);
    store.setInputFieldSubmitFunc(() => {});
    store.setInputFieldValue('keep me');

    store.resetInputField();

    expect(store.getInputFieldElement()).toBeNull();
    expect(store.getInputFieldSubmitFunc()).toBeNull();
    expect(store.getInputFieldValue()).toBe('keep me');
  });

  it('supports a full configuration and reset workflow used by request-input flows', () => {
    const store = useInputFieldStore.getState();
    const element = document.createElement('input');
    const validator: InputValidator = value => value.length > 3 || 'Too short';
    const submitFunc = vi.fn();

    store.setInputFieldElement(element);
    store.setInputFieldType('password');
    store.setInputFieldPlaceholder('Enter password');
    store.setInputFieldDescription('At least 4 characters');
    store.setInputFieldValidator(validator);
    store.setInputFieldSubmitFunc(submitFunc);
    store.setInputFieldValue('secret');

    expect(store.getInputFieldType()).toBe('password');
    expect(store.getInputFieldPlaceholder()).toBe('Enter password');
    expect(store.getInputFieldDescription()).toBe('At least 4 characters');
    expect(store.getInputFieldValidator()?.('abc')).toBe('Too short');
    expect(store.getInputFieldValue()).toBe('secret');

    store.resetInputField();
    store.resetInputFieldType();
    store.resetInputFieldPlaceholder();
    store.resetInputFieldDescription();
    store.resetInputFieldValidator();

    expect(store.getInputFieldElement()).toBeNull();
    expect(store.getInputFieldSubmitFunc()).toBeNull();
    expect(store.getInputFieldType()).toBe('text');
    expect(store.getInputFieldPlaceholder()).toBe('Type your message...');
    expect(store.getInputFieldDescription()).toBe('');
    expect(store.getInputFieldValidator()).toBeNull();
  });
});
