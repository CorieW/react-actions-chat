import type {
  InputBarBehaviorConfig,
  InputBarModeConfig,
  InputBarValidationConfig,
  MessageButton,
} from '../../js/types';
import {
  useChatGlobalsStore,
  useChatStore,
  usePersistentButtonStore,
} from '../../lib';
import {
  useInputFieldStore,
  type InputSubmission,
} from '../../lib/inputFieldStore';
import { ABORT_BUTTON_ID } from './constants';
import { applyRequestInputGlobals } from './config';
import {
  createRequestInputSubmitGuard,
  disableRequestInputWhileWaiting,
  configureRequestInputField,
  resetRequestInputField,
} from './inputField';
import {
  resolveInputTimeoutMessage,
  resolveInvalidFileMessage,
} from './messageFormatter';
import {
  addPromptMessage,
  addTimeoutMessage,
  addValidationFailureMessage,
  getLatestSelfMessage,
} from './messageList';
import type { RequestInputButtonConfig } from './types';

type InputRequestTimer = ReturnType<typeof globalThis.setTimeout>;

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
export function createRequestInputButton(
  config: RequestInputButtonConfig
): MessageButton {
  return {
    label: config.initialLabel,
    variant: config.variant,
    className: config.className,
    style: config.style,
    onClick: () => {
      const resolvedConfig = applyRequestInputGlobals(
        config,
        useChatGlobalsStore.getState().getChatGlobals().requestInputDefaults
      );
      const {
        inputPromptMessage,
        placeholder = 'Type your message...',
        inputDescription,
        inputType = 'textarea',
        allowFileUpload = false,
        fileValidator,
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
        abortLabel,
        abortCallback,
        showAbort = true,
        shouldWaitForTurn = false,
        rateLimit,
      } = resolvedConfig;
      const { clearPreviousMessageCallback } = useChatStore.getState();
      const inputFieldStore = useInputFieldStore.getState();
      const { addButton, removeButton } = usePersistentButtonStore.getState();
      let inputTimeoutTimer: InputRequestTimer | undefined;

      const modeConfig: InputBarModeConfig = {
        type: inputType,
        placeholder,
        ...(inputDescription ? { description: inputDescription } : {}),
      };
      const behaviorConfig: InputBarBehaviorConfig = {
        allowFileUpload,
        disabled: false,
        shouldWaitForTurn,
        ...(cooldownMs !== undefined ? { cooldownMs } : {}),
        ...(inputTimeoutMs !== undefined ? { timeoutMs: inputTimeoutMs } : {}),
        showAbort,
      };
      const validationConfig: InputBarValidationConfig = {
        ...(fileValidator ? { fileValidator } : {}),
        ...(validator ? { validator } : {}),
      };

      const clearInputTimeout = (): void => {
        if (inputTimeoutTimer !== undefined) {
          globalThis.clearTimeout(inputTimeoutTimer);
          inputTimeoutTimer = undefined;
        }
      };

      const clearRequestInputControls = (): void => {
        clearInputTimeout();
        removeButton(ABORT_BUTTON_ID);
      };

      const removeAbortButtonAndReset = (): void => {
        clearRequestInputControls();
        resetRequestInputField(inputFieldStore);
      };

      const removeAbortButtonAndPrepareForPendingResponse = (): void => {
        clearRequestInputControls();
        inputFieldStore.resetInputFieldParams({
          value: true,
          description: true,
          files: true,
          fileValidator: true,
          validator: true,
          submitGuard: true,
        });
      };

      const handleDefaultAbort = (): void => {
        removeAbortButtonAndReset();
        clearPreviousMessageCallback();
      };

      const handleAbort = (): void => {
        handleDefaultAbort();
        abortCallback?.();
      };

      const addAbortButton = (): void => {
        if (!showAbort) {
          return;
        }

        addButton({
          id: ABORT_BUTTON_ID,
          label: abortLabel ?? 'Abort',
          variant: 'error',
          onClick: handleAbort,
        });
      };

      const addValidationFailureToMessageList = (
        errorMessage: string,
        validationCallback: () => void
      ): void => {
        if (suppressValidationFailureMessage) {
          return;
        }

        addValidationFailureMessage(errorMessage, validationCallback);
        addAbortButton();
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

          addTimeoutMessage(
            inputTimeoutMessage ?? resolveInputTimeoutMessage(inputTimeoutMs)
          );
        }, inputTimeoutMs);
      };

      const createValidationCallback = (): ((
        submission?: InputSubmission
      ) => void) => {
        return submission => {
          void (async () => {
            const lastSelfMessage = getLatestSelfMessage();
            if (!lastSelfMessage) {
              return;
            }

            const resolvedSubmission: InputSubmission = submission ?? {
              text: lastSelfMessage.rawContent,
              files: [],
            };
            const inputValue = resolvedSubmission.text;
            let errorMessage: string | undefined;

            if (validator) {
              const validationResult = validator(
                inputValue,
                resolvedSubmission
              );
              if (validationResult !== true) {
                errorMessage =
                  typeof validationResult === 'string'
                    ? validationResult
                    : 'Invalid input. Please try again.';
              }
            }

            if (!errorMessage && fileValidator) {
              for (const file of resolvedSubmission.files) {
                const validationResult = fileValidator(
                  file,
                  resolvedSubmission
                );

                if (validationResult !== true) {
                  errorMessage =
                    typeof validationResult === 'string'
                      ? validationResult
                      : resolveInvalidFileMessage(
                          resolvedSubmission.files.length
                        );
                  break;
                }
              }
            }

            if (errorMessage) {
              scheduleInputTimeout();
              onInvalidInput?.(inputValue, errorMessage, resolvedSubmission);
              addValidationFailureToMessageList(
                errorMessage,
                createValidationCallback()
              );
              return;
            }

            clearInputTimeout();
            if (shouldWaitForTurn) {
              removeAbortButtonAndPrepareForPendingResponse();
              disableRequestInputWhileWaiting(inputFieldStore, behaviorConfig);
            } else {
              removeAbortButtonAndReset();
            }

            try {
              await onValidInput?.(inputValue, resolvedSubmission);
            } finally {
              if (shouldWaitForTurn) {
                resetRequestInputField(inputFieldStore);
              }
            }
          })();
        };
      };

      const validationCallback = createValidationCallback();
      const submitGuard = createRequestInputSubmitGuard({
        cooldownMessage,
        cooldownMs,
        minMessageLength,
        minMessageLengthMessage,
        onInvalidInput: (inputValue, errorMessage) => {
          scheduleInputTimeout();
          onInvalidInput?.(inputValue, errorMessage, {
            text: inputValue,
            files: [],
          });
          addValidationFailureToMessageList(errorMessage, validationCallback);
        },
        rateLimit,
      });

      configureRequestInputField(inputFieldStore, modeConfig, behaviorConfig, {
        ...validationConfig,
        submitGuard,
      });
      scheduleInputTimeout();

      addPromptMessage(inputPromptMessage, validationCallback);
      addAbortButton();
    },
  };
}
