import type {
  InputBarBehaviorConfig,
  InputBarModeConfig,
  InputBarValidationConfig,
} from '../../js/types';
import type {
  InputSubmitGuard,
  useInputFieldStore,
} from '../../lib/inputFieldStore';
import { configureInputBarBehavior } from '../InputBar/behavior/configureInputBarBehavior';
import { configureInputBarMode } from '../InputBar/modes/configureInputBarMode';
import { configureInputBarValidation } from '../InputBar/validation/configureInputBarValidation';
import { WAITING_FOR_TURN_PLACEHOLDER } from './constants';
import {
  resolveCooldownMessage,
  resolveTooLongMessageMessage,
  resolveTooManyMessagesMessage,
  resolveTooShortMessageMessage,
} from './messageFormatter';
import type { RequestInputRateLimit } from './types';

type RequestInputFieldStore = ReturnType<typeof useInputFieldStore.getState>;

interface RequestInputSubmitGuardOptions {
  readonly cooldownMessage?: string | undefined;
  readonly cooldownMs?: number | undefined;
  readonly minMessageLength?: number | undefined;
  readonly minMessageLengthMessage?: string | undefined;
  readonly onInvalidInput: (inputValue: string, errorMessage: string) => void;
  readonly rateLimit?: RequestInputRateLimit | undefined;
}

/**
 * Applies the full input configuration for an active request-input flow.
 *
 * @param store Shared input field store state.
 * @param modeConfig Mode settings for the active flow.
 * @param behaviorConfig Behavior settings for the active flow.
 * @param validationConfig Validation settings for the active flow.
 */
export function configureRequestInputField(
  store: RequestInputFieldStore,
  modeConfig: InputBarModeConfig,
  behaviorConfig: InputBarBehaviorConfig,
  validationConfig: InputBarValidationConfig
): void {
  configureInputBarBehavior(store, behaviorConfig);
  configureInputBarMode(store, modeConfig);
  configureInputBarValidation(store, validationConfig);
}

/**
 * Restores the shared input field back to its default chat state.
 *
 * @param store Shared input field store state.
 */
export function resetRequestInputField(store: RequestInputFieldStore): void {
  store.resetInputFieldParams({
    value: true,
    type: true,
    placeholder: true,
    description: true,
    files: true,
    fileValidator: true,
    fileUploadEnabled: true,
    validator: true,
    submitGuard: true,
    disabled: true,
  });
}

/**
 * Disables the shared input while an async reply is still pending.
 *
 * @param store Shared input field store state.
 * @param behaviorConfig Base behavior settings for the request-input flow.
 */
export function disableRequestInputWhileWaiting(
  store: RequestInputFieldStore,
  behaviorConfig: InputBarBehaviorConfig
): void {
  configureInputBarBehavior(store, {
    ...behaviorConfig,
    disabled: true,
    disabledPlaceholder: WAITING_FOR_TURN_PLACEHOLDER,
  });
}

/**
 * Builds the optional submit guard used to block invalid sends before they are
 * added to the chat transcript.
 *
 * @param options Guard rules and invalid-input callback for the active flow.
 */
export function createRequestInputSubmitGuard(
  options: RequestInputSubmitGuardOptions
): InputSubmitGuard | null {
  const {
    cooldownMessage,
    cooldownMs,
    minMessageLength,
    minMessageLengthMessage,
    onInvalidInput,
    rateLimit,
  } = options;

  if (
    rateLimit === undefined &&
    minMessageLength === undefined &&
    cooldownMs === undefined
  ) {
    return null;
  }

  const recentSubmissionTimestamps: number[] = [];
  let lastSubmissionAt: number | undefined;

  return (inputValue, _submission) => {
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
      onInvalidInput(
        inputValue,
        minMessageLengthMessage ??
          resolveTooShortMessageMessage(minMessageLength)
      );
      return false;
    }

    if (
      cooldownMs !== undefined &&
      lastSubmissionAt !== undefined &&
      now - lastSubmissionAt < cooldownMs
    ) {
      onInvalidInput(
        inputValue,
        cooldownMessage ?? resolveCooldownMessage(cooldownMs)
      );
      return false;
    }

    if (
      rateLimit &&
      rateLimit.maxMessageLength !== undefined &&
      inputValue.length > rateLimit.maxMessageLength
    ) {
      onInvalidInput(inputValue, resolveTooLongMessageMessage(rateLimit));
      return false;
    }

    if (
      rateLimit &&
      recentSubmissionTimestamps.length >= rateLimit.maxMessages
    ) {
      onInvalidInput(inputValue, resolveTooManyMessagesMessage(rateLimit));
      return false;
    }

    lastSubmissionAt = now;
    recentSubmissionTimestamps.push(now);
    return true;
  };
}
