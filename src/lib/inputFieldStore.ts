import { create } from 'zustand';

interface InputFieldState {
  readonly inputFieldElement: HTMLInputElement | null;
  readonly inputFieldSubmitFunc: (() => void) | null;
  readonly inputFieldDescription: string;

  // Getters
  readonly getInputFieldElement: () => HTMLInputElement | null;
  readonly getInputFieldDescription: () => string;

  // Setters
  readonly setInputFieldElement: (element: HTMLInputElement | null) => void;
  readonly setInputFieldSubmitFunc: (submitFunc: (() => void) | null) => void;
  readonly setInputFieldDescription: (description: string) => void;

  // Resetters
  readonly resetInputField: () => void;
  readonly resetInputFieldDescription: () => void;
}

export const useInputFieldStore = create<InputFieldState>((set, get) => ({
  inputFieldElement: null,
  inputFieldSubmitFunc: null,
  inputFieldDescription: '',

  getInputFieldElement: () => {
    return get().inputFieldElement;
  },

  getInputFieldDescription: () => {
    return get().inputFieldDescription;
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

  resetInputField: () => {
    set({
      inputFieldElement: null,
      inputFieldSubmitFunc: null,
    });
  },

  resetInputFieldDescription: () => {
    set({ inputFieldDescription: '' });
  },
}));
