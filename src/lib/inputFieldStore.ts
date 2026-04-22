/**
 * @fileoverview
 * This file contains the store, used for interacting and managing the input field.
 */

import { create } from 'zustand';

const DEFAULT_INPUT_PLACEHOLDER = 'Type your message...';
const DEFAULT_DISABLED_INPUT_PLACEHOLDER = 'Input disabled.';
const DEFAULT_INPUT_TYPE: InputType = 'textarea';

/**
 * Supported shared input modes for the chat input field.
 */
export type InputType =
  | 'textarea'
  | 'text'
  | 'password'
  | 'email'
  | 'number'
  | 'tel'
  | 'url'
  | 'search';

type RegisteredInputElement = HTMLInputElement | HTMLTextAreaElement;

function applyInputElementType(
  element: RegisteredInputElement | null,
  type: InputType
): void {
  if (!element || element.tagName !== 'INPUT') {
    return;
  }

  const inputElement = element as HTMLInputElement;
  inputElement.type = type === 'textarea' ? 'text' : type;
}

/**
 * Submitted shared-input payload passed through validators and callbacks.
 */
export interface InputSubmission {
  readonly text: string;
  readonly files: readonly File[];
}

/**
 * Result returned by an input validator.
 */
export type InputValidationResult = boolean | string;

/**
 * Validates a selected file before it is accepted by an active flow.
 *
 * @param file The selected file to validate.
 * @param submission The full submitted payload, including all selected files.
 * @returns `true` when the file is valid, or an error message when it is not.
 */
export type InputFileValidator = (
  file: File,
  submission?: InputSubmission
) => InputValidationResult;

/**
 * Validates a submitted input value before it is accepted.
 *
 * @param value The submitted input value to validate.
 * @param submission The full submitted payload, including selected files.
 * @returns `true` when the value is valid, or an error message when it is not.
 */
export type InputValidator = (
  value: string,
  submission?: InputSubmission
) => InputValidationResult;

/**
 * Runs before a message is sent and returns whether the submission should be
 * allowed.
 *
 * @param value The input value about to be submitted.
 * @param submission The full submitted payload, including selected files.
 * @returns `true` when the send should continue, or `false` to block it.
 */
export type InputSubmitGuard = (
  value: string,
  submission?: InputSubmission
) => boolean;

/**
 * Partial input field updates applied in one store call.
 *
 * Only the provided properties are changed.
 */
export interface InputFieldParams {
  readonly disabled?: boolean | undefined;
  readonly disabledDefault?: boolean | undefined;
  readonly disabledPlaceholder?: string | undefined;
  readonly disabledPlaceholderDefault?: string | undefined;
  readonly description?: string | undefined;
  readonly element?: RegisteredInputElement | null | undefined;
  readonly fileValidator?: InputFileValidator | null | undefined;
  readonly fileUploadEnabled?: boolean | undefined;
  readonly files?: readonly File[] | undefined;
  readonly placeholder?: string | undefined;
  readonly submitFunc?: (() => void) | null | undefined;
  readonly submitGuard?: InputSubmitGuard | null | undefined;
  readonly type?: InputType | undefined;
  readonly validator?: InputValidator | null | undefined;
  readonly value?: string | undefined;
}

/**
 * Partial input field resets applied in one store call.
 *
 * Each provided property resets that field back to its default store value.
 */
export interface InputFieldResetParams {
  readonly description?: true | undefined;
  readonly disabled?: true | undefined;
  readonly disabledDefault?: true | undefined;
  readonly disabledPlaceholder?: true | undefined;
  readonly disabledPlaceholderDefault?: true | undefined;
  readonly element?: true | undefined;
  readonly fileValidator?: true | undefined;
  readonly fileUploadEnabled?: true | undefined;
  readonly files?: true | undefined;
  readonly placeholder?: true | undefined;
  readonly submitFunc?: true | undefined;
  readonly submitGuard?: true | undefined;
  readonly type?: true | undefined;
  readonly validator?: true | undefined;
  readonly value?: true | undefined;
}

type InputFieldStatePatch = {
  inputFieldDescription?: string;
  inputFieldDisabled?: boolean;
  inputFieldDisabledDefault?: boolean;
  inputFieldDisabledPlaceholder?: string;
  inputFieldDisabledPlaceholderDefault?: string;
  inputFieldElement?: RegisteredInputElement | null;
  inputFieldFileValidator?: InputFileValidator | null;
  inputFieldFileUploadEnabled?: boolean;
  inputFieldFiles?: readonly File[];
  inputFieldPlaceholder?: string;
  inputFieldSubmitFunc?: (() => void) | null;
  inputFieldSubmitGuard?: InputSubmitGuard | null;
  inputFieldType?: InputType;
  inputFieldValidator?: InputValidator | null;
  inputFieldValue?: string;
};

/**
 * Internal input field store shape.
 *
 * @property inputFieldElement Registered input element instance.
 * @property inputFieldValue Current input field value.
 * @property inputFieldSubmitFunc Registered submit callback for the input field.
 * @property inputFieldDescription Helper text shown above the input field.
 * @property inputFieldType Current shared input mode.
 * @property inputFieldPlaceholder Current placeholder text.
 * @property inputFieldFiles Current files selected through the optional upload button.
 * @property inputFieldFileValidator Current validator applied when files are attached.
 * @property inputFieldFileUploadEnabled Whether the optional upload button is visible.
 * @property inputFieldDisabledPlaceholder Placeholder text shown while the shared input is disabled.
 * @property inputFieldValidator Current validator applied to submitted input.
 * @property inputFieldSubmitGuard Current pre-submit guard used to block sends.
 * @property inputFieldDisabledDefault Default disabled state restored after an input-request flow ends.
 * @property inputFieldDisabledPlaceholderDefault Default disabled placeholder restored after an input-request flow ends.
 * @property inputFieldDisabled Whether the shared input is currently disabled.
 * @property getInputFieldElement Returns the registered input element instance.
 * @property getInputFieldValue Returns the current input field value.
 * @property getInputFieldSubmitFunc Returns the registered submit callback.
 * @property getInputFieldDescription Returns the helper text shown above the input field.
 * @property getInputFieldType Returns the current shared input mode.
 * @property getInputFieldPlaceholder Returns the current placeholder text.
 * @property getInputFieldFiles Returns the selected files.
 * @property getInputFieldFileValidator Returns the current file validator.
 * @property getInputFieldFileUploadEnabled Returns whether the upload button is enabled.
 * @property getInputFieldDisabledPlaceholder Returns the placeholder text shown while disabled.
 * @property getInputFieldValidator Returns the current validator.
 * @property getInputFieldSubmitGuard Returns the current pre-submit guard.
 * @property getInputFieldDisabledDefault Returns the default disabled state.
 * @property getInputFieldDisabledPlaceholderDefault Returns the default disabled placeholder.
 * @property getInputFieldDisabled Returns whether the shared input is disabled.
 * @property setInputFieldElement Registers the input element instance.
 * @property setInputFieldValue Updates the current input field value.
 * @property setInputFieldSubmitFunc Registers the submit callback.
 * @property setInputFieldDescription Updates the helper text shown above the input field.
 * @property setInputFieldType Updates the current shared input mode.
 * @property setInputFieldPlaceholder Updates the current placeholder text.
 * @property setInputFieldFiles Updates the selected files.
 * @property setInputFieldFileValidator Updates the current file validator.
 * @property setInputFieldFileUploadEnabled Shows or hides the upload button.
 * @property setInputFieldDisabledPlaceholder Updates the placeholder text shown while disabled.
 * @property setInputFieldValidator Updates the current validator.
 * @property setInputFieldSubmitGuard Updates the current pre-submit guard.
 * @property setInputFieldDisabledDefault Updates the default disabled state.
 * @property setInputFieldDisabledPlaceholderDefault Updates the default disabled placeholder.
 * @property setInputFieldDisabled Enables or disables the shared input.
 * @property setInputFieldParams Applies multiple input field updates in one call.
 * @property resetInputFieldParams Resets multiple input field values in one call.
 * @property resetInputField Clears the registered element and submit callback.
 * @property resetInputFieldValue Clears the current input field value.
 * @property resetInputFieldDescription Clears the helper text.
 * @property resetInputFieldType Resets the input type to its default mode.
 * @property resetInputFieldPlaceholder Resets the placeholder text.
 * @property resetInputFieldDisabledPlaceholder Resets the disabled placeholder text.
 * @property resetInputFieldFileValidator Clears the file validator.
 * @property resetInputFieldValidator Clears the validator.
 * @property resetInputFieldSubmitGuard Clears the pre-submit guard.
 * @property resetInputFieldDisabledDefault Resets the default disabled state.
 * @property resetInputFieldDisabledPlaceholderDefault Resets the default disabled placeholder.
 * @property resetInputFieldDisabled Resets the shared input to the default disabled state.
 * @property resetInputFieldFiles Clears the selected files.
 * @property resetInputFieldFileUploadEnabled Hides the upload button.
 */
interface InputFieldState {
  readonly inputFieldElement: RegisteredInputElement | null;
  readonly inputFieldValue: string;
  readonly inputFieldSubmitFunc: (() => void) | null;
  readonly inputFieldDescription: string;
  readonly inputFieldType: InputType;
  readonly inputFieldPlaceholder: string;
  readonly inputFieldFiles: readonly File[];
  readonly inputFieldFileValidator: InputFileValidator | null;
  readonly inputFieldFileUploadEnabled: boolean;
  readonly inputFieldDisabledPlaceholder: string;
  readonly inputFieldValidator: InputValidator | null;
  readonly inputFieldSubmitGuard: InputSubmitGuard | null;
  readonly inputFieldDisabledDefault: boolean;
  readonly inputFieldDisabledPlaceholderDefault: string;
  readonly inputFieldDisabled: boolean;

  readonly getInputFieldElement: () => RegisteredInputElement | null;
  readonly getInputFieldValue: () => string;
  readonly getInputFieldSubmitFunc: () => (() => void) | null;
  readonly getInputFieldDescription: () => string;
  readonly getInputFieldType: () => InputType;
  readonly getInputFieldPlaceholder: () => string;
  readonly getInputFieldFiles: () => readonly File[];
  readonly getInputFieldFileValidator: () => InputFileValidator | null;
  readonly getInputFieldFileUploadEnabled: () => boolean;
  readonly getInputFieldDisabledPlaceholder: () => string;
  readonly getInputFieldValidator: () => InputValidator | null;
  readonly getInputFieldSubmitGuard: () => InputSubmitGuard | null;
  readonly getInputFieldDisabledDefault: () => boolean;
  readonly getInputFieldDisabledPlaceholderDefault: () => string;
  readonly getInputFieldDisabled: () => boolean;

  readonly setInputFieldElement: (
    element: RegisteredInputElement | null
  ) => void;
  readonly setInputFieldValue: (value: string) => void;
  readonly setInputFieldSubmitFunc: (submitFunc: (() => void) | null) => void;
  readonly setInputFieldDescription: (description: string) => void;
  readonly setInputFieldType: (type: InputType) => void;
  readonly setInputFieldPlaceholder: (placeholder: string) => void;
  readonly setInputFieldFiles: (files: readonly File[]) => void;
  readonly setInputFieldFileValidator: (
    validator: InputFileValidator | null
  ) => void;
  readonly setInputFieldFileUploadEnabled: (enabled: boolean) => void;
  readonly setInputFieldDisabledPlaceholder: (placeholder: string) => void;
  readonly setInputFieldValidator: (validator: InputValidator | null) => void;
  readonly setInputFieldSubmitGuard: (guard: InputSubmitGuard | null) => void;
  readonly setInputFieldDisabledDefault: (disabled: boolean) => void;
  readonly setInputFieldDisabledPlaceholderDefault: (
    placeholder: string
  ) => void;
  readonly setInputFieldDisabled: (disabled: boolean) => void;
  readonly setInputFieldParams: (params: InputFieldParams) => void;
  readonly resetInputFieldParams: (params: InputFieldResetParams) => void;

  readonly resetInputField: () => void;
  readonly resetInputFieldValue: () => void;
  readonly resetInputFieldDescription: () => void;
  readonly resetInputFieldType: () => void;
  readonly resetInputFieldPlaceholder: () => void;
  readonly resetInputFieldDisabledPlaceholder: () => void;
  readonly resetInputFieldFileValidator: () => void;
  readonly resetInputFieldValidator: () => void;
  readonly resetInputFieldSubmitGuard: () => void;
  readonly resetInputFieldDisabledDefault: () => void;
  readonly resetInputFieldDisabledPlaceholderDefault: () => void;
  readonly resetInputFieldDisabled: () => void;
  readonly resetInputFieldFiles: () => void;
  readonly resetInputFieldFileUploadEnabled: () => void;
}

/**
 * Shared input field state store used by input-request flows.
 */
export const useInputFieldStore = create<InputFieldState>((set, get) => ({
  inputFieldElement: null,
  inputFieldValue: '',
  inputFieldSubmitFunc: null,
  inputFieldDescription: '',
  inputFieldType: DEFAULT_INPUT_TYPE,
  inputFieldPlaceholder: DEFAULT_INPUT_PLACEHOLDER,
  inputFieldFiles: [],
  inputFieldFileValidator: null,
  inputFieldFileUploadEnabled: false,
  inputFieldDisabledPlaceholder: DEFAULT_DISABLED_INPUT_PLACEHOLDER,
  inputFieldValidator: null,
  inputFieldSubmitGuard: null,
  inputFieldDisabledDefault: true,
  inputFieldDisabledPlaceholderDefault: DEFAULT_DISABLED_INPUT_PLACEHOLDER,
  inputFieldDisabled: true,

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

  getInputFieldFiles: () => {
    return get().inputFieldFiles;
  },

  getInputFieldFileValidator: () => {
    return get().inputFieldFileValidator;
  },

  getInputFieldFileUploadEnabled: () => {
    return get().inputFieldFileUploadEnabled;
  },

  getInputFieldDisabledPlaceholder: () => {
    return get().inputFieldDisabledPlaceholder;
  },

  getInputFieldValidator: () => {
    return get().inputFieldValidator;
  },

  getInputFieldSubmitGuard: () => {
    return get().inputFieldSubmitGuard;
  },

  getInputFieldDisabledDefault: () => {
    return get().inputFieldDisabledDefault;
  },

  getInputFieldDisabledPlaceholderDefault: () => {
    return get().inputFieldDisabledPlaceholderDefault;
  },

  getInputFieldDisabled: () => {
    return get().inputFieldDisabled;
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
    applyInputElementType(get().inputFieldElement, type);
  },

  setInputFieldPlaceholder: placeholder => {
    set({ inputFieldPlaceholder: placeholder });
  },

  setInputFieldFiles: files => {
    set({ inputFieldFiles: files });
  },

  setInputFieldFileValidator: validator => {
    set({ inputFieldFileValidator: validator });
  },

  setInputFieldFileUploadEnabled: enabled => {
    set({ inputFieldFileUploadEnabled: enabled });
  },

  setInputFieldDisabledPlaceholder: placeholder => {
    set({ inputFieldDisabledPlaceholder: placeholder });
  },

  setInputFieldValidator: validator => {
    set({ inputFieldValidator: validator });
  },

  setInputFieldSubmitGuard: guard => {
    set({ inputFieldSubmitGuard: guard });
  },

  setInputFieldDisabledDefault: disabled => {
    set({ inputFieldDisabledDefault: disabled });
  },

  setInputFieldDisabledPlaceholderDefault: placeholder => {
    set({ inputFieldDisabledPlaceholderDefault: placeholder });
  },

  setInputFieldDisabled: disabled => {
    set({ inputFieldDisabled: disabled });
  },

  setInputFieldParams: params => {
    const nextState: InputFieldStatePatch = {};

    if (params.element !== undefined) {
      nextState.inputFieldElement = params.element;
    }

    if (params.value !== undefined) {
      nextState.inputFieldValue = params.value;
    }

    if (params.submitFunc !== undefined) {
      nextState.inputFieldSubmitFunc = params.submitFunc;
    }

    if (params.description !== undefined) {
      nextState.inputFieldDescription = params.description;
    }

    if (params.type !== undefined) {
      nextState.inputFieldType = params.type;
    }

    if (params.placeholder !== undefined) {
      nextState.inputFieldPlaceholder = params.placeholder;
    }

    if (params.files !== undefined) {
      nextState.inputFieldFiles = params.files;
    }

    if (params.fileValidator !== undefined) {
      nextState.inputFieldFileValidator = params.fileValidator;
    }

    if (params.fileUploadEnabled !== undefined) {
      nextState.inputFieldFileUploadEnabled = params.fileUploadEnabled;
    }

    if (params.disabledPlaceholder !== undefined) {
      nextState.inputFieldDisabledPlaceholder = params.disabledPlaceholder;
    }

    if (params.validator !== undefined) {
      nextState.inputFieldValidator = params.validator;
    }

    if (params.submitGuard !== undefined) {
      nextState.inputFieldSubmitGuard = params.submitGuard;
    }

    if (params.disabledDefault !== undefined) {
      nextState.inputFieldDisabledDefault = params.disabledDefault;
    }

    if (params.disabledPlaceholderDefault !== undefined) {
      nextState.inputFieldDisabledPlaceholderDefault =
        params.disabledPlaceholderDefault;
    }

    if (params.disabled !== undefined) {
      nextState.inputFieldDisabled = params.disabled;
    }

    set(nextState);

    if (params.type !== undefined) {
      const element = params.element ?? get().inputFieldElement;
      applyInputElementType(element, params.type);
    }
  },

  resetInputFieldParams: params => {
    const nextState: InputFieldStatePatch = {};
    const nextDisabledDefault = params.disabledDefault
      ? true
      : get().inputFieldDisabledDefault;
    const nextDisabledPlaceholderDefault = params.disabledPlaceholderDefault
      ? DEFAULT_DISABLED_INPUT_PLACEHOLDER
      : get().inputFieldDisabledPlaceholderDefault;

    if (params.element) {
      nextState.inputFieldElement = null;
    }

    if (params.value) {
      nextState.inputFieldValue = '';
    }

    if (params.submitFunc) {
      nextState.inputFieldSubmitFunc = null;
    }

    if (params.description) {
      nextState.inputFieldDescription = '';
    }

    if (params.type) {
      nextState.inputFieldType = DEFAULT_INPUT_TYPE;
    }

    if (params.placeholder) {
      nextState.inputFieldPlaceholder = DEFAULT_INPUT_PLACEHOLDER;
    }

    if (params.files) {
      nextState.inputFieldFiles = [];
    }

    if (params.fileValidator) {
      nextState.inputFieldFileValidator = null;
    }

    if (params.fileUploadEnabled) {
      nextState.inputFieldFileUploadEnabled = false;
    }

    if (params.disabledPlaceholder) {
      nextState.inputFieldDisabledPlaceholder = nextDisabledPlaceholderDefault;
    }

    if (params.validator) {
      nextState.inputFieldValidator = null;
    }

    if (params.submitGuard) {
      nextState.inputFieldSubmitGuard = null;
    }

    if (params.disabledDefault) {
      nextState.inputFieldDisabledDefault = true;
    }

    if (params.disabledPlaceholderDefault) {
      nextState.inputFieldDisabledPlaceholderDefault =
        DEFAULT_DISABLED_INPUT_PLACEHOLDER;
    }

    if (params.disabled) {
      nextState.inputFieldDisabled = nextDisabledDefault;
      nextState.inputFieldDisabledPlaceholder = nextDisabledPlaceholderDefault;
    }

    set(nextState);

    if (params.type) {
      applyInputElementType(get().inputFieldElement, DEFAULT_INPUT_TYPE);
    }
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
    set({ inputFieldType: DEFAULT_INPUT_TYPE });
    applyInputElementType(get().inputFieldElement, DEFAULT_INPUT_TYPE);
  },

  resetInputFieldPlaceholder: () => {
    set({ inputFieldPlaceholder: DEFAULT_INPUT_PLACEHOLDER });
  },

  resetInputFieldDisabledPlaceholder: () => {
    set({
      inputFieldDisabledPlaceholder: get().inputFieldDisabledPlaceholderDefault,
    });
  },

  resetInputFieldFileValidator: () => {
    set({ inputFieldFileValidator: null });
  },

  resetInputFieldValidator: () => {
    set({ inputFieldValidator: null });
  },

  resetInputFieldSubmitGuard: () => {
    set({ inputFieldSubmitGuard: null });
  },

  resetInputFieldDisabledDefault: () => {
    set({ inputFieldDisabledDefault: true });
  },

  resetInputFieldDisabledPlaceholderDefault: () => {
    set({
      inputFieldDisabledPlaceholderDefault: DEFAULT_DISABLED_INPUT_PLACEHOLDER,
    });
  },

  resetInputFieldDisabled: () => {
    set({
      inputFieldDisabled: get().inputFieldDisabledDefault,
      inputFieldDisabledPlaceholder: get().inputFieldDisabledPlaceholderDefault,
    });
  },

  resetInputFieldFiles: () => {
    set({ inputFieldFiles: [] });
  },

  resetInputFieldFileUploadEnabled: () => {
    set({ inputFieldFileUploadEnabled: false });
  },
}));
