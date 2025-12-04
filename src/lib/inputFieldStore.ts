/**
 * @fileoverview
 * This file contains the store, used for interacting and managing the input field.
 */

import { create } from 'zustand';

export type InputType =
  | 'text'
  | 'password'
  | 'email'
  | 'number'
  | 'tel'
  | 'url'
  | 'search';

export type InputValidationResult = boolean | string;
export type InputValidator = (value: string) => InputValidationResult;

interface InputFieldState {
  readonly inputFieldElement: HTMLInputElement | null;
  readonly inputFieldValue: string;
  readonly inputFieldSubmitFunc: (() => void) | null;
  readonly inputFieldDescription: string;
  readonly inputFieldType: InputType;
  readonly inputFieldPlaceholder: string;
  readonly inputFieldValidator: InputValidator | null;

  // Getters
  readonly getInputFieldElement: () => HTMLInputElement | null;
  readonly getInputFieldValue: () => string;
  readonly getInputFieldSubmitFunc: () => (() => void) | null;
  readonly getInputFieldDescription: () => string;
  readonly getInputFieldType: () => InputType;
  readonly getInputFieldPlaceholder: () => string;
  readonly getInputFieldValidator: () => InputValidator | null;

  // Setters
  readonly setInputFieldElement: (element: HTMLInputElement | null) => void;
  readonly setInputFieldValue: (value: string) => void;
  readonly setInputFieldSubmitFunc: (submitFunc: (() => void) | null) => void;
  readonly setInputFieldDescription: (description: string) => void;
  readonly setInputFieldType: (type: InputType) => void;
  readonly setInputFieldPlaceholder: (placeholder: string) => void;
  readonly setInputFieldValidator: (validator: InputValidator | null) => void;

  // Resetters
  readonly resetInputField: () => void;
  readonly resetInputFieldDescription: () => void;
  readonly resetInputFieldType: () => void;
  readonly resetInputFieldPlaceholder: () => void;
  readonly resetInputFieldValidator: () => void;
}

export const useInputFieldStore = create<InputFieldState>((set, get) => ({
  inputFieldElement: null,
  inputFieldValue: '',
  inputFieldSubmitFunc: null,
  inputFieldDescription: '',
  inputFieldType: 'text',
  inputFieldPlaceholder: 'Type your message...',
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

  setInputFieldValidator: validator => {
    set({ inputFieldValidator: validator });
  },

  resetInputField: () => {
    set({
      inputFieldElement: null,
      inputFieldSubmitFunc: null,
    });
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

  resetInputFieldValidator: () => {
    set({ inputFieldValidator: null });
  },
}));
