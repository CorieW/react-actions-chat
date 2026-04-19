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
import { useInputFieldStore } from '../../lib/inputFieldStore';
import { ABORT_BUTTON_ID } from './constants';
import { applyRequestInputGlobals } from './config';
import {
  createRequestInputSubmitGuard,
  disableRequestInputWhileWaiting,
  configureRequestInputField,
  resetRequestInputField,
} from './inputField';
import { resolveInputTimeoutMessage } from './messageFormatter';
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
        disabled: false,
        shouldWaitForTurn,
        ...(cooldownMs !== undefined ? { cooldownMs } : {}),
        ...(inputTimeoutMs !== undefined ? { timeoutMs: inputTimeoutMs } : {}),
        showAbort,
      };
      const validationConfig: InputBarValidationConfig = {
        ...(validator ? { validator } : {}),
      };

      const clearInputTimeout = (): void => {
        if (inputTimeoutTimer !== undefined) {
          globalThis.clearTimeout(inputTimeoutTimer);
          inputTimeoutTimer = undefined;
        }
      };

      const removeAbortButtonAndReset = (): void => {
        clearInputTimeout();
        removeButton(ABORT_BUTTON_ID);
        resetRequestInputField(inputFieldStore);
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

      const createValidationCallback = (): (() => void) => {
        return () => {
          void (async () => {
            const lastSelfMessage = getLatestSelfMessage();
            if (!lastSelfMessage) {
              return;
            }

            const inputValue = lastSelfMessage.rawContent;
            let errorMessage: string | undefined;

            if (validator) {
              const validationResult = validator(inputValue);
              if (validationResult !== true) {
                errorMessage =
                  typeof validationResult === 'string'
                    ? validationResult
                    : 'Invalid input. Please try again.';
              }
            }

            if (errorMessage) {
              scheduleInputTimeout();
              onInvalidInput?.(inputValue, errorMessage);
              addValidationFailureToMessageList(
                errorMessage,
                createValidationCallback()
              );
              return;
            }

            clearInputTimeout();
            removeAbortButtonAndReset();

            if (shouldWaitForTurn) {
              disableRequestInputWhileWaiting(inputFieldStore, behaviorConfig);
            }

            try {
              await onValidInput?.(inputValue);
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
          onInvalidInput?.(inputValue, errorMessage);
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
