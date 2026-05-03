/**
 * @fileoverview
 * This file contains the store, used for interacting and managing the input field.
 */

import { create } from 'zustand';

/**
 * Default input placeholder used when callers do not override it.
 */
const DEFAULT_INPUT_PLACEHOLDER = 'Type your message...';
/**
 * Default disabled input placeholder used when callers do not override it.
 */
const DEFAULT_DISABLED_INPUT_PLACEHOLDER = 'Input disabled.';
/**
 * Default input type used when callers do not override it.
 */
const DEFAULT_INPUT_TYPE: InputType = 'textarea';

/**
 * Supported shared input modes for the chat input field.
 */
export type InputType =
  | 'textarea'
  | 'select'
  | 'text'
  | 'password'
  | 'email'
  | 'number'
  | 'tel'
  | 'url'
  | 'search';

/**
 * Option shown by the shared input bar when it is configured as a select.
 */
export interface InputSelectOption {
  /**
   * Submitted value for this option.
   */
  readonly value: string;
  /**
   * Visible label shown for this option or button.
   */
  readonly label: string;
  /**
   * Whether the option or input control is disabled.
   */
  readonly disabled?: boolean | undefined;
}

/**
 * Input element types that can be controlled by the shared input store.
 */
type RegisteredInputElement =
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement;

/**
 * Applies the active input type to the registered input element.
 *
 * @param element - Registered input element to inspect or update.
 * @param type - Input type to apply to the element.
 */
function applyInputElementType(
  element: RegisteredInputElement | null,
  type: InputType
): void {
  if (!element || element.tagName !== 'INPUT' || type === 'select') {
    return;
  }

  const inputElement = element as HTMLInputElement;
  inputElement.type = type === 'textarea' ? 'text' : type;
}

/**
 * Submitted shared-input payload passed through validators and callbacks.
 */
export interface InputSubmission {
  /**
   * Text content carried by this value.
   */
  readonly text: string;
  /**
   * Files currently selected for submission.
   */
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
  /**
   * Whether the option or input control is disabled.
   */
  readonly disabled?: boolean | undefined;
  /**
   * Default disabled state restored when the input resets.
   */
  readonly disabledDefault?: boolean | undefined;
  /**
   * Placeholder shown while the input is disabled.
   */
  readonly disabledPlaceholder?: string | undefined;
  /**
   * Default disabled placeholder restored when the input resets.
   */
  readonly disabledPlaceholderDefault?: string | undefined;
  /**
   * Descriptive text shown to users or sent to a provider.
   */
  readonly description?: string | undefined;
  /**
   * Input element currently bound to the store.
   */
  readonly element?: RegisteredInputElement | null | undefined;
  /**
   * Validator applied to uploaded files.
   */
  readonly fileValidator?: InputFileValidator | null | undefined;
  /**
   * Whether file upload is enabled for the input field.
   */
  readonly fileUploadEnabled?: boolean | undefined;
  /**
   * Files currently selected for submission.
   */
  readonly files?: readonly File[] | undefined;
  /**
   * Options available to the select input or operation.
   */
  readonly options?: readonly InputSelectOption[] | undefined;
  /**
   * Placeholder text shown by the input.
   */
  readonly placeholder?: string | undefined;
  /**
   * Submit handler currently bound to the input field.
   */
  readonly submitFunc?: (() => void) | null | undefined;
  /**
   * Guard that can block an input submission.
   */
  readonly submitGuard?: InputSubmitGuard | null | undefined;
  /**
   * Discriminant or input type for this value.
   */
  readonly type?: InputType | undefined;
  /**
   * Validator applied to text submissions.
   */
  readonly validator?: InputValidator | null | undefined;
  /**
   * Submitted value for this option.
   */
  readonly value?: string | undefined;
}

/**
 * Partial input field resets applied in one store call.
 *
 * Each provided property resets that field back to its default store value.
 */
export interface InputFieldResetParams {
  /**
   * Descriptive text shown to users or sent to a provider.
   */
  readonly description?: true | undefined;
  /**
   * Whether the option or input control is disabled.
   */
  readonly disabled?: true | undefined;
  /**
   * Default disabled state restored when the input resets.
   */
  readonly disabledDefault?: true | undefined;
  /**
   * Placeholder shown while the input is disabled.
   */
  readonly disabledPlaceholder?: true | undefined;
  /**
   * Default disabled placeholder restored when the input resets.
   */
  readonly disabledPlaceholderDefault?: true | undefined;
  /**
   * Input element currently bound to the store.
   */
  readonly element?: true | undefined;
  /**
   * Validator applied to uploaded files.
   */
  readonly fileValidator?: true | undefined;
  /**
   * Whether file upload is enabled for the input field.
   */
  readonly fileUploadEnabled?: true | undefined;
  /**
   * Files currently selected for submission.
   */
  readonly files?: true | undefined;
  /**
   * Options available to the select input or operation.
   */
  readonly options?: true | undefined;
  /**
   * Placeholder text shown by the input.
   */
  readonly placeholder?: true | undefined;
  /**
   * Submit handler currently bound to the input field.
   */
  readonly submitFunc?: true | undefined;
  /**
   * Guard that can block an input submission.
   */
  readonly submitGuard?: true | undefined;
  /**
   * Discriminant or input type for this value.
   */
  readonly type?: true | undefined;
  /**
   * Validator applied to text submissions.
   */
  readonly validator?: true | undefined;
  /**
   * Submitted value for this option.
   */
  readonly value?: true | undefined;
}

/**
 * Internal partial state patch applied to the input field store.
 */
type InputFieldStatePatch = {
  /**
   * Current description shown alongside the shared input field.
   */
  inputFieldDescription?: string;
  /**
   * Current disabled state of the shared input field.
   */
  inputFieldDisabled?: boolean;
  /**
   * Default disabled state for the shared input field.
   */
  inputFieldDisabledDefault?: boolean;
  /**
   * Current placeholder shown while the shared input field is disabled.
   */
  inputFieldDisabledPlaceholder?: string;
  /**
   * Default disabled placeholder for the shared input field.
   */
  inputFieldDisabledPlaceholderDefault?: string;
  /**
   * Current DOM element for the shared input field.
   */
  inputFieldElement?: RegisteredInputElement | null;
  /**
   * Current file validator for the shared input field.
   */
  inputFieldFileValidator?: InputFileValidator | null;
  /**
   * Whether file upload is currently enabled for the shared input field.
   */
  inputFieldFileUploadEnabled?: boolean;
  /**
   * Files currently selected in the shared input field.
   */
  inputFieldFiles?: readonly File[];
  /**
   * Current select options for the shared input field.
   */
  inputFieldOptions?: readonly InputSelectOption[];
  /**
   * Current placeholder for the shared input field.
   */
  inputFieldPlaceholder?: string;
  /**
   * Current submit handler for the shared input field.
   */
  inputFieldSubmitFunc?: (() => void) | null;
  /**
   * Current submit guard for the shared input field.
   */
  inputFieldSubmitGuard?: InputSubmitGuard | null;
  /**
   * Current input mode for the shared input field.
   */
  inputFieldType?: InputType;
  /**
   * Current text validator for the shared input field.
   */
  inputFieldValidator?: InputValidator | null;
  /**
   * Current text value of the shared input field.
   */
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
 * @property inputFieldOptions Current options used when the input type is select.
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
 * @property getInputFieldOptions Returns the current select options.
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
 * @property setInputFieldOptions Updates the current select options.
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
 * @property resetInputFieldOptions Clears the select options.
 * @property resetInputFieldFileUploadEnabled Hides the upload button.
 */
interface InputFieldState {
  /**
   * Current DOM element for the shared input field.
   */
  readonly inputFieldElement: RegisteredInputElement | null;
  /**
   * Current text value of the shared input field.
   */
  readonly inputFieldValue: string;
  /**
   * Current submit handler for the shared input field.
   */
  readonly inputFieldSubmitFunc: (() => void) | null;
  /**
   * Current description shown alongside the shared input field.
   */
  readonly inputFieldDescription: string;
  /**
   * Current input mode for the shared input field.
   */
  readonly inputFieldType: InputType;
  /**
   * Current placeholder for the shared input field.
   */
  readonly inputFieldPlaceholder: string;
  /**
   * Files currently selected in the shared input field.
   */
  readonly inputFieldFiles: readonly File[];
  /**
   * Current select options for the shared input field.
   */
  readonly inputFieldOptions: readonly InputSelectOption[];
  /**
   * Current file validator for the shared input field.
   */
  readonly inputFieldFileValidator: InputFileValidator | null;
  /**
   * Whether file upload is currently enabled for the shared input field.
   */
  readonly inputFieldFileUploadEnabled: boolean;
  /**
   * Current placeholder shown while the shared input field is disabled.
   */
  readonly inputFieldDisabledPlaceholder: string;
  /**
   * Current text validator for the shared input field.
   */
  readonly inputFieldValidator: InputValidator | null;
  /**
   * Current submit guard for the shared input field.
   */
  readonly inputFieldSubmitGuard: InputSubmitGuard | null;
  /**
   * Default disabled state for the shared input field.
   */
  readonly inputFieldDisabledDefault: boolean;
  /**
   * Default disabled placeholder for the shared input field.
   */
  readonly inputFieldDisabledPlaceholderDefault: string;
  /**
   * Current disabled state of the shared input field.
   */
  readonly inputFieldDisabled: boolean;

  /**
   * Returns the input field element.
   */
  readonly getInputFieldElement: () => RegisteredInputElement | null;
  /**
   * Returns the input field value.
   */
  readonly getInputFieldValue: () => string;
  /**
   * Returns the input field submit handler.
   */
  readonly getInputFieldSubmitFunc: () => (() => void) | null;
  /**
   * Returns the input field description.
   */
  readonly getInputFieldDescription: () => string;
  /**
   * Returns the input field type.
   */
  readonly getInputFieldType: () => InputType;
  /**
   * Returns the input field placeholder.
   */
  readonly getInputFieldPlaceholder: () => string;
  /**
   * Returns the input field files.
   */
  readonly getInputFieldFiles: () => readonly File[];
  /**
   * Returns the input field options.
   */
  readonly getInputFieldOptions: () => readonly InputSelectOption[];
  /**
   * Returns the input field file validator.
   */
  readonly getInputFieldFileValidator: () => InputFileValidator | null;
  /**
   * Returns the input field file upload enabled.
   */
  readonly getInputFieldFileUploadEnabled: () => boolean;
  /**
   * Returns the input field disabled placeholder.
   */
  readonly getInputFieldDisabledPlaceholder: () => string;
  /**
   * Returns the input field validator.
   */
  readonly getInputFieldValidator: () => InputValidator | null;
  /**
   * Returns the input field submit guard.
   */
  readonly getInputFieldSubmitGuard: () => InputSubmitGuard | null;
  /**
   * Returns the input field disabled default.
   */
  readonly getInputFieldDisabledDefault: () => boolean;
  /**
   * Returns the input field disabled placeholder default.
   */
  readonly getInputFieldDisabledPlaceholderDefault: () => string;
  /**
   * Returns the input field disabled.
   */
  readonly getInputFieldDisabled: () => boolean;

  /**
   * Sets input field element.
   *
   * @param element - Input element to register.
   */
  readonly setInputFieldElement: (
    element: RegisteredInputElement | null
  ) => void;
  /**
   * Sets input field value.
   *
   * @param value - Input value to apply.
   */
  readonly setInputFieldValue: (value: string) => void;
  /**
   * Sets the input field submit handler.
   *
   * @param submitFunc - Submit handler to register.
   */
  readonly setInputFieldSubmitFunc: (submitFunc: (() => void) | null) => void;
  /**
   * Sets input field description.
   *
   * @param description - Input description to apply.
   */
  readonly setInputFieldDescription: (description: string) => void;
  /**
   * Sets input field type.
   *
   * @param type - Input type to apply.
   */
  readonly setInputFieldType: (type: InputType) => void;
  /**
   * Sets input field placeholder.
   *
   * @param placeholder - Placeholder text to apply.
   */
  readonly setInputFieldPlaceholder: (placeholder: string) => void;
  /**
   * Sets input field files.
   *
   * @param files - Files selected in the input.
   */
  readonly setInputFieldFiles: (files: readonly File[]) => void;
  /**
   * Sets input field options.
   *
   * @param options - Select options to apply.
   */
  readonly setInputFieldOptions: (
    options: readonly InputSelectOption[]
  ) => void;
  /**
   * Sets input field file validator.
   *
   * @param validator - Validator to apply.
   */
  readonly setInputFieldFileValidator: (
    validator: InputFileValidator | null
  ) => void;
  /**
   * Sets input field file upload enabled.
   *
   * @param enabled - Whether the feature should be enabled.
   */
  readonly setInputFieldFileUploadEnabled: (enabled: boolean) => void;
  /**
   * Sets input field disabled placeholder.
   *
   * @param placeholder - Placeholder text to apply.
   */
  readonly setInputFieldDisabledPlaceholder: (placeholder: string) => void;
  /**
   * Sets input field validator.
   *
   * @param validator - Validator to apply.
   */
  readonly setInputFieldValidator: (validator: InputValidator | null) => void;
  /**
   * Sets input field submit guard.
   *
   * @param guard - Submit guard to apply.
   */
  readonly setInputFieldSubmitGuard: (guard: InputSubmitGuard | null) => void;
  /**
   * Sets input field disabled default.
   *
   * @param disabled - Disabled state to apply.
   */
  readonly setInputFieldDisabledDefault: (disabled: boolean) => void;
  /**
   * Sets input field disabled placeholder default.
   *
   * @param placeholder - Placeholder text to apply.
   */
  readonly setInputFieldDisabledPlaceholderDefault: (
    placeholder: string
  ) => void;
  /**
   * Sets input field disabled.
   *
   * @param disabled - Disabled state to apply.
   */
  readonly setInputFieldDisabled: (disabled: boolean) => void;
  /**
   * Applies multiple input field updates.
   *
   * @param params - Partial state parameters to apply.
   */
  readonly setInputFieldParams: (params: InputFieldParams) => void;
  /**
   * Handles reset input field params.
   *
   * @param params - Partial state parameters to apply.
   */
  readonly resetInputFieldParams: (params: InputFieldResetParams) => void;

  /**
   * Resets the input field.
   */
  readonly resetInputField: () => void;
  /**
   * Resets the input field value.
   */
  readonly resetInputFieldValue: () => void;
  /**
   * Resets the input field description.
   */
  readonly resetInputFieldDescription: () => void;
  /**
   * Resets the input field type.
   */
  readonly resetInputFieldType: () => void;
  /**
   * Resets the input field placeholder.
   */
  readonly resetInputFieldPlaceholder: () => void;
  /**
   * Resets the input field options.
   */
  readonly resetInputFieldOptions: () => void;
  /**
   * Resets the input field disabled placeholder.
   */
  readonly resetInputFieldDisabledPlaceholder: () => void;
  /**
   * Resets the input field file validator.
   */
  readonly resetInputFieldFileValidator: () => void;
  /**
   * Resets the input field validator.
   */
  readonly resetInputFieldValidator: () => void;
  /**
   * Resets the input field submit guard.
   */
  readonly resetInputFieldSubmitGuard: () => void;
  /**
   * Resets the input field disabled default.
   */
  readonly resetInputFieldDisabledDefault: () => void;
  /**
   * Resets the input field disabled placeholder default.
   */
  readonly resetInputFieldDisabledPlaceholderDefault: () => void;
  /**
   * Resets the input field disabled.
   */
  readonly resetInputFieldDisabled: () => void;
  /**
   * Resets the input field files.
   */
  readonly resetInputFieldFiles: () => void;
  /**
   * Resets the input field file upload enabled.
   */
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
  inputFieldOptions: [],
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

  getInputFieldOptions: () => {
    return get().inputFieldOptions;
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

  setInputFieldOptions: options => {
    set({ inputFieldOptions: options });
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

    if (params.options !== undefined) {
      nextState.inputFieldOptions = params.options;
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

    if (params.options) {
      nextState.inputFieldOptions = [];
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

  resetInputFieldOptions: () => {
    set({ inputFieldOptions: [] });
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
