import type { MessageButton, MessageButtonVariant } from '../js/types';
import { useChatStore } from '../lib';
import {
  useInputFieldStore,
  type InputType,
  type InputValidator,
} from '../lib/inputFieldStore';

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
  } = config;

  return {
    label: initialLabel,
    variant,
    className,
    style,
    onClick: () => {
      const { addMessage, getPreviousMessage } = useChatStore.getState();
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

      // Configure the input field
      setInputFieldType(inputType);
      setInputFieldPlaceholder(placeholder);
      if (inputDescription) {
        setInputFieldDescription(inputDescription);
      }
      if (validator) {
        setInputFieldValidator(validator);
      }

      // Create a reusable validation callback that can be attached to error messages
      const createValidationCallback = (): (() => void) => {
        return () => {
          const { addMessage: addMessageCallback, getMessages } = useChatStore.getState();
          // Get the user's input from the most recent user message
          const messages = getMessages();
          const lastUserMessage = [...messages]
            .reverse()
            .find(msg => msg.type === 'user');
          if (lastUserMessage) {
            const inputValue = lastUserMessage.content;

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
              // Reset input field settings
              resetInputFieldType();
              resetInputFieldPlaceholder();
              resetInputFieldDescription();
              resetInputFieldValidator();

              // Call the onInput callback with the validated input
              onInput(inputValue);
            } else {
              // If validation failed, add an error message with the same callback
              // so the user can try again
              addMessageCallback({
                type: 'agent',
                content: errorMessage ?? 'Invalid input. Please try again.',
                userResponseCallback: createValidationCallback(),
              });
            }
          }
        };
      };

      // Add a message prompting for input with userResponseCallback to capture the input
      addMessage({
        type: 'agent',
        content: inputPromptMessage,
        userResponseCallback: createValidationCallback(),
      });
    },
  };
}

