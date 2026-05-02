import type {
  InputSubmission,
  InputValidationResult,
  InputValidator,
} from 'react-actions-chat';
import type { SupportInputValidationSettings } from '../supportFlowTypes';

function createTooShortMessage(minMessageLength: number): string {
  return `Please enter at least ${minMessageLength} character${minMessageLength === 1 ? '' : 's'}.`;
}

function createTooLongMessage(maxMessageLength: number): string {
  return `Please keep your message to ${maxMessageLength} character${maxMessageLength === 1 ? '' : 's'} or fewer.`;
}

export function resolveValidationSettings(
  defaults: SupportInputValidationSettings,
  override: SupportInputValidationSettings | undefined
): SupportInputValidationSettings {
  return {
    minMessageLength: override?.minMessageLength ?? defaults.minMessageLength,
    minMessageLengthMessage:
      override?.minMessageLengthMessage ?? defaults.minMessageLengthMessage,
    maxMessageLength: override?.maxMessageLength ?? defaults.maxMessageLength,
    maxMessageLengthMessage:
      override?.maxMessageLengthMessage ?? defaults.maxMessageLengthMessage,
    validator: override?.validator ?? defaults.validator,
  };
}

export function validateSupportInput(
  value: string,
  validation: SupportInputValidationSettings,
  submission?: InputSubmission
): InputValidationResult {
  const trimmedValue = value.trim();

  if (
    validation.minMessageLength !== undefined &&
    trimmedValue.length < validation.minMessageLength
  ) {
    return (
      validation.minMessageLengthMessage ??
      createTooShortMessage(validation.minMessageLength)
    );
  }

  if (
    validation.maxMessageLength !== undefined &&
    value.length > validation.maxMessageLength
  ) {
    return (
      validation.maxMessageLengthMessage ??
      createTooLongMessage(validation.maxMessageLength)
    );
  }

  return validation.validator?.(value, submission) ?? true;
}

export function createRequestInputValidator(
  validation: SupportInputValidationSettings
): InputValidator | undefined {
  if (
    validation.maxMessageLength === undefined &&
    validation.validator === undefined
  ) {
    return undefined;
  }

  return (value, submission) => {
    if (
      validation.maxMessageLength !== undefined &&
      value.length > validation.maxMessageLength
    ) {
      return (
        validation.maxMessageLengthMessage ??
        createTooLongMessage(validation.maxMessageLength)
      );
    }

    return validation.validator?.(value, submission) ?? true;
  };
}
