import type { MessageButton, MessageButtonVariant } from '../js/types';
import { useChatStore, usePersistentButtonStore } from '../lib';
import {
  useInputFieldStore,
  type InputSubmitGuard,
  type InputType,
  type InputValidator,
} from '../lib/inputFieldStore';

type MaybePromise<T> = T | Promise<T>;

/**
 * Limits how frequently the shared input can be submitted while an input
 * request flow is active.
 */
export interface RequestInputRateLimit {
  /**
   * Maximum number of messages allowed during the rolling window.
   */
  readonly maxMessages: number;

  /**
   * Rolling time window used to count recent submissions, in milliseconds.
   */
  readonly windowMs: number;

  /**
   * Optional maximum length for any single submitted message.
   */
  readonly maxMessageLength?: number | undefined;

  /**
   * Optional custom message shown when the submission count limit is reached.
   */
  readonly tooManyMessagesMessage?: string | undefined;

  /**
   * Optional custom message shown when a submitted message is too long.
   */
  readonly tooLongMessageMessage?: string | undefined;
}

type InputRequestTimer = ReturnType<typeof globalThis.setTimeout>;

/**
 * Configuration for a button that asks the user to submit a follow-up input.
 *
 * @property initialLabel Label for the initial button that triggers the input request flow.
 * @property inputPromptMessage Message displayed when requesting input from the user.
 * @property placeholder Placeholder text for the input field.
 * @property inputDescription Description text shown above the input field.
 * @property inputType Type of input field used for the request flow.
 * @property validator Validation function used to accept or reject submitted input.
 * @property minMessageLength Minimum trimmed message length required before a send is accepted.
 * @property minMessageLengthMessage Optional custom message shown when the input is too short.
 * @property cooldownMs Minimum wait time between accepted submissions while the flow is active.
 * @property cooldownMessage Optional custom message shown when the flow is cooling down.
 * @property inputTimeoutMs How long the flow should wait for input before timing out.
 * @property inputTimeoutMessage Optional custom message shown when the flow times out.
 * @property onInvalidInput Callback function executed when the user provides invalid input.
 * @property onValidInput Callback function executed when the user provides valid input.
 * @property suppressValidationFailureMessage When true, skips the default validation failure message.
 * @property variant Optional variant for the initial button.
 * @property className Optional className for the initial button.
 * @property style Optional style for the initial button.
 * @property abortLabel Custom label for the abort button.
 * @property abortCallback Custom callback function executed when the abort button is clicked.
 * @property showAbort Whether to show the abort button during the flow.
 * @property shouldWaitForTurn Whether the input should stay disabled until the async response finishes.
 * @property rateLimit Optional rolling limits for how often input can be submitted.
 */
export interface RequestInputButtonConfig {
  readonly initialLabel: string;
  readonly inputPromptMessage: string;
  readonly placeholder?: string | undefined;
  readonly inputDescription?: string | undefined;
  readonly inputType?: InputType | undefined;
  readonly validator?: InputValidator | undefined;
  readonly minMessageLength?: number | undefined;
  readonly minMessageLengthMessage?: string | undefined;
  readonly cooldownMs?: number | undefined;
  readonly cooldownMessage?: string | undefined;
  readonly inputTimeoutMs?: number | undefined;
  readonly inputTimeoutMessage?: string | undefined;
  readonly onInvalidInput?:
    | undefined
    | ((inputValue: string, errorMessage: string) => void);
  readonly onValidInput?:
    | undefined
    | ((inputValue: string) => MaybePromise<void>);
  readonly suppressValidationFailureMessage?: boolean | undefined;
  readonly variant?: MessageButtonVariant | undefined;
  readonly className?: string | undefined;
  readonly style?: React.CSSProperties | undefined;
  readonly abortLabel?: string | undefined;
  readonly abortCallback?: () => void | undefined;
  readonly showAbort?: boolean | undefined;
  readonly shouldWaitForTurn?: boolean | undefined;
  readonly rateLimit?: RequestInputRateLimit | undefined;
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
  readonly onValidInput?:
    | undefined
    | ((inputValue: string) => MaybePromise<void>);
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
  readonly onSuccess?: undefined | ((inputValue: string) => MaybePromise<void>);
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

function resolveTooManyMessagesMessage(
  rateLimit: RequestInputRateLimit
): string {
  return (
    rateLimit.tooManyMessagesMessage ??
    `Please wait before sending more than ${rateLimit.maxMessages} message${rateLimit.maxMessages === 1 ? '' : 's'} in ${rateLimit.windowMs}ms.`
  );
}

function resolveTooLongMessageMessage(
  rateLimit: RequestInputRateLimit
): string {
  return (
    rateLimit.tooLongMessageMessage ??
    `Please keep your message to ${rateLimit.maxMessageLength ?? 0} characters or fewer.`
  );
}

function resolveTooShortMessageMessage(minMessageLength: number): string {
  return `Please enter at least ${minMessageLength} character${minMessageLength === 1 ? '' : 's'}.`;
}

function resolveCooldownMessage(cooldownMs: number): string {
  return `Please wait ${cooldownMs}ms before trying again.`;
}

function resolveInputTimeoutMessage(inputTimeoutMs: number): string {
  return `This request timed out after ${inputTimeoutMs}ms. Please start again.`;
}

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
    minMessageLength,
    minMessageLengthMessage,
    cooldownMs,
    cooldownMessage,
    inputTimeoutMs,
    inputTimeoutMessage,
    onValidInput,
    onInvalidInput,
    suppressValidationFailureMessage = false,
    variant,
    className,
    style,
    abortLabel,
    abortCallback,
    showAbort = true,
    shouldWaitForTurn = false,
    rateLimit,
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
        setInputFieldValidator,
        setInputFieldSubmitGuard,
        setInputFieldDisabled,
        resetInputFieldType,
        resetInputFieldPlaceholder,
        resetInputFieldDescription,
        resetInputFieldValidator,
        resetInputFieldSubmitGuard,
        resetInputFieldDisabled,
      } = useInputFieldStore.getState();
      const { addButton, removeButton } = usePersistentButtonStore.getState();
      const recentSubmissionTimestamps: number[] = [];
      let lastSubmissionAt: number | undefined;
      let inputTimeoutTimer: InputRequestTimer | undefined;

      const clearInputTimeout = (): void => {
        if (inputTimeoutTimer !== undefined) {
          globalThis.clearTimeout(inputTimeoutTimer);
          inputTimeoutTimer = undefined;
        }
      };

      const addValidationFailureMessage = (
        errorMessage: string,
        validationCallback: () => void
      ): void => {
        if (suppressValidationFailureMessage) {
          return;
        }

        addMessage({
          type: 'other',
          content: errorMessage,
          userResponseCallback: validationCallback,
        });

        if (showAbort) {
          addButton({
            id: ABORT_BUTTON_ID,
            label: abortLabel ?? 'Abort',
            variant: 'error',
            onClick: handleAbort,
          });
        }
      };

      const handleInvalidInput = (
        inputValue: string,
        errorMessage: string,
        validationCallback: () => void
      ): void => {
        onInvalidInput?.(inputValue, errorMessage);
        addValidationFailureMessage(errorMessage, validationCallback);
      };

      const scheduleInputTimeout = (): void => {
        clearInputTimeout();
        if (inputTimeoutMs === undefined) {
          return;
        }

        inputTimeoutTimer = globalThis.setTimeout(() => {
          clearInputTimeout();
          removeAbortButtonAndReset();
          clearPreviousMessageCallback();

          if (suppressValidationFailureMessage) {
            return;
          }

          addMessage({
            type: 'other',
            content:
              inputTimeoutMessage ?? resolveInputTimeoutMessage(inputTimeoutMs),
          });
        }, inputTimeoutMs);
      };

      // Configure the input field
      setInputFieldDisabled(false);
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
        clearInputTimeout();
        // Remove the abort button
        removeButton(ABORT_BUTTON_ID);
        // Reset input field stuff
        setInputFieldValue('');
        resetInputFieldType();
        resetInputFieldPlaceholder();
        resetInputFieldDescription();
        resetInputFieldValidator();
        resetInputFieldSubmitGuard();
        resetInputFieldDisabled();
      };

      // Default abort handler that resets input field configuration and clears the callback
      const handleDefaultAbort = (): void => {
        // Remove the abort button and reset the input field configuration
        removeAbortButtonAndReset();
        // Clear the callback from the message so it won't trigger on user input
        clearPreviousMessageCallback();
      };

      // Use custom abort callback if provided, otherwise use default
      const handleAbort = (): void => {
        clearInputTimeout();
        if (abortCallback) {
          abortCallback();
        } else {
          handleDefaultAbort();
        }
      };

      // Create a reusable validation callback that can be attached to error messages
      const createValidationCallback = (): (() => void) => {
        return () => {
          void (async () => {
            const { getMessages } = useChatStore.getState();
            // Get the self's input from the most recent self message
            const messages = getMessages();
            const lastSelfMessage = [...messages]
              .reverse()
              .find(msg => msg.type === 'self');
            if (!lastSelfMessage) {
              return;
            }

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

            if (!isValid) {
              scheduleInputTimeout();
              handleInvalidInput(
                inputValue,
                errorMessage ?? 'Invalid input. Please try again.',
                createValidationCallback()
              );
              return;
            }

            clearInputTimeout();
            removeAbortButtonAndReset();

            if (shouldWaitForTurn) {
              setInputFieldDisabled(true);
            }

            try {
              await onValidInput?.(inputValue);
            } finally {
              if (shouldWaitForTurn) {
                resetInputFieldDisabled();
              }
            }
          })();
        };
      };

      const validationCallback = createValidationCallback();

      const createSubmitGuard = (): InputSubmitGuard | null => {
        if (
          rateLimit === undefined &&
          minMessageLength === undefined &&
          cooldownMs === undefined
        ) {
          return null;
        }

        return inputValue => {
          const now = Date.now();
          const trimmedInputValue = inputValue.trim();
          if (rateLimit) {
            const activeTimestamps = recentSubmissionTimestamps.filter(
              timestamp => now - timestamp < rateLimit.windowMs
            );

            recentSubmissionTimestamps.splice(
              0,
              recentSubmissionTimestamps.length,
              ...activeTimestamps
            );
          }

          if (
            minMessageLength !== undefined &&
            trimmedInputValue.length < minMessageLength
          ) {
            scheduleInputTimeout();
            handleInvalidInput(
              inputValue,
              minMessageLengthMessage ??
                resolveTooShortMessageMessage(minMessageLength),
              validationCallback
            );
            return false;
          }

          if (
            cooldownMs !== undefined &&
            lastSubmissionAt !== undefined &&
            now - lastSubmissionAt < cooldownMs
          ) {
            scheduleInputTimeout();
            handleInvalidInput(
              inputValue,
              cooldownMessage ?? resolveCooldownMessage(cooldownMs),
              validationCallback
            );
            return false;
          }

          if (
            rateLimit &&
            rateLimit.maxMessageLength !== undefined &&
            inputValue.length > rateLimit.maxMessageLength
          ) {
            scheduleInputTimeout();
            handleInvalidInput(
              inputValue,
              resolveTooLongMessageMessage(rateLimit),
              validationCallback
            );
            return false;
          }

          if (
            rateLimit &&
            recentSubmissionTimestamps.length >= rateLimit.maxMessages
          ) {
            scheduleInputTimeout();
            handleInvalidInput(
              inputValue,
              resolveTooManyMessagesMessage(rateLimit),
              validationCallback
            );
            return false;
          }

          lastSubmissionAt = now;
          recentSubmissionTimestamps.push(now);
          return true;
        };
      };

      setInputFieldSubmitGuard(createSubmitGuard());
      scheduleInputTimeout();

      // Add a message prompting for input with userResponseCallback to capture the input
      addMessage({
        type: 'other',
        content: inputPromptMessage,
        userResponseCallback: validationCallback,
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
