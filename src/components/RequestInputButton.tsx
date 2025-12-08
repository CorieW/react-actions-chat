import type { MessageButton, MessageButtonVariant } from '../js/types';
import {
  useChatStore,
  usePersistentButtonStore,
  useInputFieldStore,
  type InputType,
  type InputValidator,
} from '../lib';

export interface RequestInputButtonConfig {
  /**
   * Label for the initial button that triggers the input request flow.
   */
  readonly initialLabel: string;

  /**
   * Message displayed when requesting input from the user.
   */
  readonly inputPromptMessage: string;

  /**
   * Placeholder text for the input field. Defaults to "Type your message...".
   */
  readonly placeholder?: string | undefined;

  /**
   * Description text shown above the input field. Optional.
   */
  readonly inputDescription?: string | undefined;

  /**
   * Type of input field (text, password, email, etc.). Defaults to 'text'.
   */
  readonly inputType?: InputType | undefined;

  /**
   * Validation function for the input. Returns true if valid, or an error message string if invalid.
   * If validation fails, the input will not be processed.
   */
  readonly validator?: InputValidator | undefined;

  /**
   * Callback function executed when the user provides valid input.
   * @param inputValue The validated input value provided by the user
   */
  readonly onInput: (inputValue: string) => void;

  /**
   * Optional variant for the initial button. Defaults to 'default'.
   */
  readonly variant?: MessageButtonVariant | undefined;

  /**
   * Optional className for the initial button.
   */
  readonly className?: string | undefined;

  /**
   * Optional style for the initial button.
   */
  readonly style?: React.CSSProperties | undefined;

  /**
   * Custom label for the abort button. Defaults to 'Abort'.
   */
  readonly abortLabel?: string | undefined;

  /**
   * Custom callback function executed when the abort button is clicked.
   * If not provided, the default abort behavior will be used (resets input field and clears callback).
   */
  readonly abortCallback?: () => void | undefined;

  /**
   * Whether to show the abort button. Defaults to true.
   */
  readonly showAbort?: boolean | undefined;
}

/**
 * Creates a MessageButton configuration that implements an input request flow.
 *
 * When clicked, the initial button adds a message prompting for input and configures
 * the input field with the specified type, placeholder, description, and validator.
 * Once the user provides valid input, the onInput callback is executed.
 *
 * @param config Configuration options for the input request button
 * @returns A MessageButton configuration that can be used in a Message's buttons array
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
    onInput,
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
        setInputFieldType,
        setInputFieldPlaceholder,
        setInputFieldDescription,
        setInputFieldValidator,
        resetInputFieldType,
        resetInputFieldPlaceholder,
        resetInputFieldDescription,
        resetInputFieldValidator,
      } = useInputFieldStore.getState();
      const { addButton, removeButton } = usePersistentButtonStore.getState();

      // Configure the input field
      setInputFieldType(inputType);
      setInputFieldPlaceholder(placeholder);
      if (inputDescription) {
        setInputFieldDescription(inputDescription);
      }
      if (validator) {
        setInputFieldValidator(validator);
      }

      // Helper function to remove the abort button and reset input field
      const removeAbortButtonAndReset = (): void => {
        removeButton(ABORT_BUTTON_ID);
        resetInputFieldType();
        resetInputFieldPlaceholder();
        resetInputFieldDescription();
        resetInputFieldValidator();
      };

      // Default abort handler that resets input field configuration and clears the callback
      const handleDefaultAbort = (): void => {
        removeAbortButtonAndReset();
        // Clear the callback from the message so it won't trigger on user input
        clearPreviousMessageCallback();
      };

      // Use custom abort callback if provided, otherwise use default
      const handleAbort = (): void => {
        if (abortCallback) {
          abortCallback();
        } else {
          handleDefaultAbort();
        }
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
            const inputValue = lastSelfMessage.content;

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
              onInput(inputValue);
            } else {
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
