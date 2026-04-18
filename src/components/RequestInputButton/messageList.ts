import { createTextPart, type Message } from '../../js/types';
import { useChatStore } from '../../lib';

/**
 * Adds the initial prompt message for an input-request flow to the transcript.
 *
 * @param promptMessage Message asking the user for input.
 * @param validationCallback Callback that processes the user's response.
 */
export function addPromptMessage(
  promptMessage: string,
  validationCallback: () => void
): void {
  useChatStore.getState().addMessage({
    type: 'other',
    parts: [createTextPart(promptMessage)],
    userResponseCallback: validationCallback,
  });
}

/**
 * Adds a validation failure message to the transcript while keeping the flow active.
 *
 * @param errorMessage Validation message shown to the user.
 * @param validationCallback Callback that retries validation for the next reply.
 */
export function addValidationFailureMessage(
  errorMessage: string,
  validationCallback: () => void
): void {
  useChatStore.getState().addMessage({
    type: 'other',
    parts: [createTextPart(errorMessage)],
    userResponseCallback: validationCallback,
  });
}

/**
 * Adds a timeout message to the transcript when the input-request flow expires.
 *
 * @param timeoutMessage Message shown after the request times out.
 */
export function addTimeoutMessage(timeoutMessage: string): void {
  useChatStore.getState().addMessage({
    type: 'other',
    parts: [createTextPart(timeoutMessage)],
  });
}

/**
 * Returns the newest self-authored message in the transcript, if present.
 */
export function getLatestSelfMessage(): Message | undefined {
  const { getMessages } = useChatStore.getState();
  const messages = getMessages();

  return [...messages].reverse().find(message => message.type === 'self');
}
