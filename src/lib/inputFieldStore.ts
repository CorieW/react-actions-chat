/**
 * @fileoverview
 * This file contains the store, used for interacting and managing the input field.
 */

import { create } from 'zustand';

/**
 * Supported HTML input types for the shared chat input field.
 */
export type InputType =
  | 'text'
  | 'password'
  | 'email'
  | 'number'
  | 'tel'
  | 'url'
  | 'search';

/**
 * Result returned by an input validator.
 */
export type InputValidationResult = boolean | string;

/**
 * Validates a submitted input value before it is accepted.
 *
 * @param value The submitted input value to validate.
 * @returns `true` when the value is valid, or an error message when it is not.
 */
export type InputValidator = (value: string) => InputValidationResult;

/**
 * Internal input field store shape.
 *
 * @property inputFieldElement Registered input element instance.
 * @property inputFieldValue Current input field value.
 * @property inputFieldSubmitFunc Registered submit callback for the input field.
 * @property inputFieldDescription Helper text shown above the input field.
 * @property inputFieldType Current HTML input type.
 * @property inputFieldPlaceholder Current placeholder text.
 * @property inputFieldDisabled Whether the input field is disabled.
 * @property inputFieldValidator Current validator applied to submitted input.
 * @property getInputFieldElement Returns the registered input element instance.
 * @property getInputFieldValue Returns the current input field value.
 * @property getInputFieldSubmitFunc Returns the registered submit callback.
 * @property getInputFieldDescription Returns the helper text shown above the input field.
 * @property getInputFieldType Returns the current HTML input type.
 * @property getInputFieldPlaceholder Returns the current placeholder text.
 * @property getInputFieldDisabled Returns whether the input field is disabled.
 * @property getInputFieldValidator Returns the current validator.
 * @property setInputFieldElement Registers the input element instance.
 * @property setInputFieldValue Updates the current input field value.
 * @property setInputFieldSubmitFunc Registers the submit callback.
 * @property setInputFieldDescription Updates the helper text shown above the input field.
 * @property setInputFieldType Updates the current HTML input type.
 * @property setInputFieldPlaceholder Updates the current placeholder text.
 * @property setInputFieldDisabled Updates whether the input field is disabled.
 * @property setInputFieldValidator Updates the current validator.
 * @property resetInputField Clears the registered element and submit callback.
 * @property resetInputFieldValue Clears the current input field value.
 * @property resetInputFieldDescription Clears the helper text.
 * @property resetInputFieldType Resets the input type to `text`.
 * @property resetInputFieldPlaceholder Resets the placeholder text.
 * @property resetInputFieldDisabled Re-enables the input field.
 * @property resetInputFieldValidator Clears the validator.
 */
interface InputFieldState {
  readonly inputFieldElement: HTMLInputElement | null;
  readonly inputFieldValue: string;
  readonly inputFieldSubmitFunc: (() => void) | null;
  readonly inputFieldDescription: string;
  readonly inputFieldType: InputType;
  readonly inputFieldPlaceholder: string;
  readonly inputFieldDisabled: boolean;
  readonly inputFieldValidator: InputValidator | null;

  readonly getInputFieldElement: () => HTMLInputElement | null;
  readonly getInputFieldValue: () => string;
  readonly getInputFieldSubmitFunc: () => (() => void) | null;
  readonly getInputFieldDescription: () => string;
  readonly getInputFieldType: () => InputType;
  readonly getInputFieldPlaceholder: () => string;
  readonly getInputFieldDisabled: () => boolean;
  readonly getInputFieldValidator: () => InputValidator | null;

  readonly setInputFieldElement: (element: HTMLInputElement | null) => void;
  readonly setInputFieldValue: (value: string) => void;
  readonly setInputFieldSubmitFunc: (submitFunc: (() => void) | null) => void;
  readonly setInputFieldDescription: (description: string) => void;
  readonly setInputFieldType: (type: InputType) => void;
  readonly setInputFieldPlaceholder: (placeholder: string) => void;
  readonly setInputFieldDisabled: (disabled: boolean) => void;
  readonly setInputFieldValidator: (validator: InputValidator | null) => void;

  readonly resetInputField: () => void;
  readonly resetInputFieldValue: () => void;
  readonly resetInputFieldDescription: () => void;
  readonly resetInputFieldType: () => void;
  readonly resetInputFieldPlaceholder: () => void;
  readonly resetInputFieldDisabled: () => void;
  readonly resetInputFieldValidator: () => void;
}

/**
 * Shared input field state store used by input-request flows.
 */
export const useInputFieldStore = create<InputFieldState>((set, get) => ({
  inputFieldElement: null,
  inputFieldValue: '',
  inputFieldSubmitFunc: null,
  inputFieldDescription: '',
  inputFieldType: 'text',
  inputFieldPlaceholder: 'Type your message...',
  inputFieldDisabled: false,
  inputFieldValidator: null,

  getInputFieldElement: () => {
    return get().inputFieldElement;
  },

  getInputFieldValue: () => {
    return get().inputFieldValue;
  },

  getInputFieldSubmitFunc: () => {
    return get().inputFieldSubmitFunc;
  },

  getInputFieldDescription: () => {
    return get().inputFieldDescription;
  },

  getInputFieldType: () => {
    return get().inputFieldType;
  },

  getInputFieldPlaceholder: () => {
    return get().inputFieldPlaceholder;
  },

  getInputFieldDisabled: () => {
    return get().inputFieldDisabled;
  },

  getInputFieldValidator: () => {
    return get().inputFieldValidator;
  },

  setInputFieldElement: element => {
    set({ inputFieldElement: element });
  },

  setInputFieldValue: value => {
    set({ inputFieldValue: value });
  },

  setInputFieldSubmitFunc: submitFunc => {
    set({ inputFieldSubmitFunc: submitFunc });
  },

  setInputFieldDescription: description => {
    set({ inputFieldDescription: description });
  },

  setInputFieldType: type => {
    set({ inputFieldType: type });
    // Update the actual input element if it exists
    const element = get().inputFieldElement;
    if (element) {
      element.type = type;
    }
  },

  setInputFieldPlaceholder: placeholder => {
    set({ inputFieldPlaceholder: placeholder });
  },

  setInputFieldDisabled: disabled => {
    set({ inputFieldDisabled: disabled });
  },

  setInputFieldValidator: validator => {
    set({ inputFieldValidator: validator });
  },

  resetInputField: () => {
    set({
      inputFieldElement: null,
      inputFieldSubmitFunc: null,
    });
  },

  resetInputFieldValue: () => {
    set({ inputFieldValue: '' });
  },

  resetInputFieldDescription: () => {
    set({ inputFieldDescription: '' });
  },

  resetInputFieldType: () => {
    set({ inputFieldType: 'text' });
    const element = get().inputFieldElement;
    if (element) {
      element.type = 'text';
    }
  },

  resetInputFieldPlaceholder: () => {
    set({ inputFieldPlaceholder: 'Type your message...' });
  },

  resetInputFieldDisabled: () => {
    set({ inputFieldDisabled: false });
  },

  resetInputFieldValidator: () => {
    set({ inputFieldValidator: null });
  },
}));
