import type { RequestInputRateLimit } from './types';

/**
 * Builds the rate-limit message shown when too many submissions happen in the
 * active rolling window.
 */
export function resolveTooManyMessagesMessage(
  rateLimit: RequestInputRateLimit
): string {
  return (
    rateLimit.tooManyMessagesMessage ??
    `Please wait before sending more than ${rateLimit.maxMessages} message${rateLimit.maxMessages === 1 ? '' : 's'} in ${rateLimit.windowMs}ms.`
  );
}

/**
 * Builds the message shown when a submitted input exceeds the configured max length.
 */
export function resolveTooLongMessageMessage(
  rateLimit: RequestInputRateLimit
): string {
  return (
    rateLimit.tooLongMessageMessage ??
    `Please keep your message to ${rateLimit.maxMessageLength ?? 0} characters or fewer.`
  );
}

/**
 * Builds the message shown when a submitted input is shorter than required.
 */
export function resolveTooShortMessageMessage(
  minMessageLength: number
): string {
  return `Please enter at least ${minMessageLength} character${minMessageLength === 1 ? '' : 's'}.`;
}

/**
 * Builds the message shown when the current input flow is cooling down.
 */
export function resolveCooldownMessage(cooldownMs: number): string {
  return `Please wait ${cooldownMs}ms before trying again.`;
}

/**
 * Builds the message shown when the input flow times out before a valid reply arrives.
 */
export function resolveInputTimeoutMessage(inputTimeoutMs: number): string {
  return `This request timed out after ${inputTimeoutMs}ms. Please start again.`;
}
