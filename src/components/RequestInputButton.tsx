import type { MessageButton, MessageButtonVariant } from '../js/types';
import { useChatStore, usePersistentButtonStore } from '../lib';
import {
  useInputFieldStore,
  type InputType,
  type InputValidator,
} from '../lib/inputFieldStore';

/**
 * Configuration for a button that asks the user to submit a follow-up input.
 *
 * @property initialLabel Label for the initial button that triggers the input request flow.
 * @property inputPromptMessage Message displayed when requesting input from the user.
 * @property placeholder Placeholder text for the input field.
 * @property inputDescription Description text shown above the input field.
 * @property inputType Type of input field used for the request flow.
 * @property validator Validation function used to accept or reject submitted input.
 * @property onInvalidInput Callback function executed when the user provides invalid input.
 * @property onValidInput Callback function executed when the user provides valid input.
 * @property suppressValidationFailureMessage When true, skips the default validation failure message.
 * @property variant Optional variant for the initial button.
 * @property className Optional className for the initial button.
 * @property style Optional style for the initial button.
 * @property abortLabel Custom label for the abort button.
 * @property abortCallback Custom callback function executed when the abort button is clicked.
 * @property showAbort Whether to show the abort button during the flow.
 */
export interface RequestInputButtonConfig {
  readonly initialLabel: string;
  readonly inputPromptMessage: string;
  readonly placeholder?: string | undefined;
  readonly inputDescription?: string | undefined;
  readonly inputType?: InputType | undefined;
  readonly validator?: InputValidator | undefined;
  readonly onInvalidInput?:
    | undefined
    | ((inputValue: string, errorMessage: string) => void);
  readonly onValidInput?: undefined | ((inputValue: string) => void);
  readonly suppressValidationFailureMessage?: boolean | undefined;
  readonly variant?: MessageButtonVariant | undefined;
  readonly className?: string | undefined;
  readonly style?: React.CSSProperties | undefined;
  readonly abortLabel?: string | undefined;
  readonly abortCallback?: () => void | undefined;
  readonly showAbort?: boolean | undefined;
}

/**
 * Runtime overrides that can be added when building an input request button.
 *
 * @property id Optional persistent button id.
 * @property abortCallback Custom callback function executed when the abort button is clicked.
 * @property onInvalidInput Callback function executed when the user provides invalid input.
 * @property onValidInput Callback function executed when the user provides valid input.
 */
export interface RequestInputButtonRuntimeConfig {
  readonly id?: string | undefined;
  readonly abortCallback?: () => void | undefined;
  readonly onInvalidInput?:
    | undefined
    | ((inputValue: string, errorMessage: string) => void);
  readonly onValidInput?: undefined | ((inputValue: string) => void);
}

/**
 * Static configuration for an input request button before runtime callbacks
 * are attached by the app.
 *
 * @property kind Discriminator used by createButton to detect this definition type.
 * @property id Optional id used when reusing the button in persistent button collections.
 * @property onSuccess Optional success callback attached directly to the definition.
 */
export interface RequestInputButtonDefinition extends Omit<
  RequestInputButtonConfig,
  'abortCallback' | 'onInvalidInput' | 'onValidInput'
> {
  readonly kind: 'request-input';
  readonly id?: string | undefined;
  readonly onSuccess?: ((inputValue: string) => void) | undefined;
}

/**
 * Creates a reusable definition for an input request button. Apps can pass
 * this definition to createButton and provide runtime callbacks there.
 *
 * @param definition The `Omit<RequestInputButtonDefinition, 'kind'>` object.
 */
export function createRequestInputButtonDef(
  definition: Omit<RequestInputButtonDefinition, 'kind'>
): RequestInputButtonDefinition {
  return {
    ...definition,
    kind: 'request-input',
  };
}

/**
 * Creates a MessageButton configuration that implements an input request flow.
 *
 * When clicked, the initial button adds a message prompting for input and configures
 * the input field with the specified type, placeholder, description, and validator.
 * Once the user provides valid input, the onInput callback is executed.
 *
 * @param config The `RequestInputButtonConfig` object.
 * @returns A MessageButton configuration that can be used in a Message's buttons array.
 */
const ABORT_BUTTON_ID = 'input-request-abort';

export function createRequestInputButton(
  config: RequestInputButtonConfig
): MessageButton {
  const {
    initialLabel,
    inputPromptMessage,
    placeholder = 'Type your message...',
    inputDescription,
    inputType = 'text',
    validator,
    onValidInput,
    onInvalidInput,
    suppressValidationFailureMessage = false,
    variant,
    className,
    style,
    abortLabel,
    abortCallback,
    showAbort = true,
  } = config;

  return {
    label: initialLabel,
    variant,
    className,
    style,
    onClick: () => {
      const { addMessage, clearPreviousMessageCallback } =
        useChatStore.getState();
      const {
        setInputFieldValue,
        setInputFieldType,
        setInputFieldPlaceholder,
        setInputFieldDescription,
        setInputFieldDisabled,
        setInputFieldValidator,
        resetInputFieldType,
        resetInputFieldPlaceholder,
        resetInputFieldDescription,
        resetInputFieldDisabled,
        resetInputFieldValidator,
      } = useInputFieldStore.getState();
      const { addButton, removeButton } = usePersistentButtonStore.getState();

      // Configure the input field
      setInputFieldType(inputType);
      setInputFieldPlaceholder(placeholder);
      setInputFieldDisabled(false);
      if (inputDescription) {
        setInputFieldDescription(inputDescription);
      }
      if (validator) {
        setInputFieldValidator(validator);
      }

      // Helper function to remove the abort button and reset input field
      const removeAbortButtonAndReset = (): void => {
        // Remove the abort button
        removeButton(ABORT_BUTTON_ID);
        // Reset input field stuff
        setInputFieldValue('');
        resetInputFieldType();
        resetInputFieldPlaceholder();
        resetInputFieldDescription();
        resetInputFieldDisabled();
        resetInputFieldValidator();
      };

      // Default abort handler that resets input field configuration and clears the callback
      const handleDefaultAbort = (): void => {
        // Remove the abort button and reset the input field configuration
        removeAbortButtonAndReset();
        // Clear the callback from the message so it won't trigger on user input
        clearPreviousMessageCallback();
      };

      // Always reset the shared input flow before running custom abort logic.
      const handleAbort = (): void => {
        handleDefaultAbort();
        abortCallback?.();
      };

      // Create a reusable validation callback that can be attached to error messages
      const createValidationCallback = (): (() => void) => {
        return () => {
          const { addMessage: addMessageCallback, getMessages } =
            useChatStore.getState();
          // Get the self's input from the most recent self message
          const messages = getMessages();
          const lastSelfMessage = [...messages]
            .reverse()
            .find(msg => msg.type === 'self');
          if (lastSelfMessage) {
            const inputValue = lastSelfMessage.rawContent;

            // Validate the input if a validator is set
            let isValid = true;
            let errorMessage: string | undefined;
            if (validator) {
              const validationResult = validator(inputValue);
              if (validationResult === true) {
                isValid = true;
              } else {
                isValid = false;
                errorMessage =
                  typeof validationResult === 'string'
                    ? validationResult
                    : 'Invalid input. Please try again.';
              }
            }

            if (isValid) {
              // Remove abort button and reset input field settings
              removeAbortButtonAndReset();

              // Call the onInput callback with the validated input
              onValidInput?.(inputValue);
            } else {
              onInvalidInput?.(
                inputValue,
                errorMessage ?? 'Invalid input. Please try again.'
              );

              if (!suppressValidationFailureMessage) {
                // If validation failed, add an error message with the same callback
                // so the self can try again. The abort button will be cleared by addMessage,
                // so we need to re-add it.
                addMessageCallback({
                  type: 'other',
                  content: errorMessage ?? 'Invalid input. Please try again.',
                  userResponseCallback: createValidationCallback(),
                });
                // Re-add abort button after error message since addMessage clears it
                if (showAbort) {
                  addButton({
                    id: ABORT_BUTTON_ID,
                    label: abortLabel ?? 'Abort',
                    variant: 'error',
                    onClick: handleAbort,
                  });
                }
              }
            }
          }
        };
      };

      // Add a message prompting for input with userResponseCallback to capture the input
      addMessage({
        type: 'other',
        content: inputPromptMessage,
        userResponseCallback: createValidationCallback(),
      });

      // Add abort button to persistent buttons after addMessage (since addMessage clears it)
      // Add it after the message is added so it doesn't get immediately cleared
      if (showAbort) {
        addButton({
          id: ABORT_BUTTON_ID,
          label: abortLabel ?? 'Abort',
          variant: 'error',
          onClick: handleAbort,
        });
      }
    },
  };
}
