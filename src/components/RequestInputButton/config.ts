import type { RequestInputGlobalDefaults } from '../../lib';
import type { RequestInputButtonConfig } from './types';

function resolveRequestInputGlobalValue<T>(
  value: T | undefined,
  globalValue: T | undefined
): T | undefined {
  return value ?? globalValue;
}

/**
 * Merges per-button input-request config with chat-level defaults.
 *
 * Explicit button config always wins over chat globals.
 *
 * @param config The button config supplied by the caller.
 * @param requestInputDefaults Chat-level defaults for input-request flows.
 */
export function applyRequestInputGlobals(
  config: RequestInputButtonConfig,
  requestInputDefaults: RequestInputGlobalDefaults | undefined
): RequestInputButtonConfig {
  if (!requestInputDefaults) {
    return config;
  }

  const mergedConfig = {
    initialLabel: config.initialLabel,
    inputPromptMessage: config.inputPromptMessage,
    placeholder: resolveRequestInputGlobalValue(
      config.placeholder,
      requestInputDefaults.placeholder
    ),
    inputDescription: resolveRequestInputGlobalValue(
      config.inputDescription,
      requestInputDefaults.inputDescription
    ),
    inputType: resolveRequestInputGlobalValue(
      config.inputType,
      requestInputDefaults.inputType
    ),
    allowFileUpload: resolveRequestInputGlobalValue(
      config.allowFileUpload,
      requestInputDefaults.allowFileUpload
    ),
    fileValidator: resolveRequestInputGlobalValue(
      config.fileValidator,
      requestInputDefaults.fileValidator
    ),
    validator: resolveRequestInputGlobalValue(
      config.validator,
      requestInputDefaults.validator
    ),
    minMessageLength: resolveRequestInputGlobalValue(
      config.minMessageLength,
      requestInputDefaults.minMessageLength
    ),
    minMessageLengthMessage: resolveRequestInputGlobalValue(
      config.minMessageLengthMessage,
      requestInputDefaults.minMessageLengthMessage
    ),
    cooldownMs: resolveRequestInputGlobalValue(
      config.cooldownMs,
      requestInputDefaults.cooldownMs
    ),
    cooldownMessage: resolveRequestInputGlobalValue(
      config.cooldownMessage,
      requestInputDefaults.cooldownMessage
    ),
    inputTimeoutMs: resolveRequestInputGlobalValue(
      config.inputTimeoutMs,
      requestInputDefaults.inputTimeoutMs
    ),
    inputTimeoutMessage: resolveRequestInputGlobalValue(
      config.inputTimeoutMessage,
      requestInputDefaults.inputTimeoutMessage
    ),
    onInvalidInput: config.onInvalidInput,
    onValidInput: config.onValidInput,
    suppressValidationFailureMessage: resolveRequestInputGlobalValue(
      config.suppressValidationFailureMessage,
      requestInputDefaults.suppressValidationFailureMessage
    ),
    variant: config.variant,
    className: config.className,
    style: config.style,
    abortLabel: resolveRequestInputGlobalValue(
      config.abortLabel,
      requestInputDefaults.abortLabel
    ),
    abortCallback: config.abortCallback,
    showAbort: resolveRequestInputGlobalValue(
      config.showAbort,
      requestInputDefaults.showAbort
    ),
    shouldWaitForTurn: resolveRequestInputGlobalValue(
      config.shouldWaitForTurn,
      requestInputDefaults.shouldWaitForTurn
    ),
    rateLimit: resolveRequestInputGlobalValue(
      config.rateLimit,
      requestInputDefaults.rateLimit
    ),
  };

  return Object.fromEntries(
    Object.entries(mergedConfig).filter(([, value]) => value !== undefined)
  ) as unknown as RequestInputButtonConfig;
}
