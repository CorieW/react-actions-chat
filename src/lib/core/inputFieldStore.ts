import { createStore } from 'zustand/vanilla';

export type InputType =
  | 'text'
  | 'password'
  | 'email'
  | 'number'
  | 'tel'
  | 'url'
  | 'search';

export type InputValidator = (value: string) => boolean | string;

export interface InputFieldStoreState {
  readonly inputFieldElement: HTMLInputElement | null;
  readonly inputFieldSubmitFunc: (() => void) | null;
  readonly inputFieldDescription: string;
  readonly inputFieldType: InputType;
  readonly inputFieldPlaceholder: string;
  readonly inputFieldValidator: InputValidator | null;
}

export interface InputFieldStoreActions {
  // Getters
  readonly getInputFieldElement: () => HTMLInputElement | null;
  readonly getInputFieldDescription: () => string;
  readonly getInputFieldType: () => InputType;
  readonly getInputFieldPlaceholder: () => string;
  readonly getInputFieldValidator: () => InputValidator | null;

  // Setters
  readonly setInputFieldElement: (element: HTMLInputElement | null) => void;
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

export type InputFieldStore = InputFieldStoreState & InputFieldStoreActions;

const DEFAULT_PLACEHOLDER = 'Type your message...';

/**
 * Creates a vanilla Zustand store for managing input field state.
 * This is framework-agnostic and can be used with any framework or vanilla JS.
 */
export const createInputFieldStore = () =>
  createStore<InputFieldStore>((set, get) => ({
    inputFieldElement: null,
    inputFieldSubmitFunc: null,
    inputFieldDescription: '',
    inputFieldType: 'text',
    inputFieldPlaceholder: DEFAULT_PLACEHOLDER,
    inputFieldValidator: null,

    getInputFieldElement: () => {
      return get().inputFieldElement;
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
      set({ inputFieldPlaceholder: DEFAULT_PLACEHOLDER });
    },

    resetInputFieldValidator: () => {
      set({ inputFieldValidator: null });
    },
  }));

/**
 * Default singleton instance of the input field store.
 * Use this for simple cases where a single store is needed.
 */
export const inputFieldStore = createInputFieldStore();
