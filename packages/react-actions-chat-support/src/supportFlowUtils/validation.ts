import type {
  InputSubmission,
  InputValidationResult,
  InputValidator,
} from 'react-actions-chat';
import type { SupportInputValidationSettings } from '../supportFlowTypes';

/**
 * Builds the default validation message for too-short input.
 *
 * @param minMessageLength - Minimum required message length.
 */
function createTooShortMessage(minMessageLength: number): string {
  return `Please enter at least ${minMessageLength} character${minMessageLength === 1 ? '' : 's'}.`;
}

/**
 * Builds the default validation message for too-long input.
 *
 * @param maxMessageLength - Maximum allowed message length.
 */
function createTooLongMessage(maxMessageLength: number): string {
  return `Please keep your message to ${maxMessageLength} character${maxMessageLength === 1 ? '' : 's'} or fewer.`;
}

/**
 * Validates support input against length settings and custom validators.
 *
 * @param value - Value to inspect or resolve.
 * @param validation - Support input validation rules to apply.
 * @param submission - Full input submission, including text and files.
 */
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

/**
 * Creates a request input validator.
 *
 * @param validation - Support input validation rules to wrap in an input validator.
 */
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
