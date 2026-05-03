import {
  createRequestInputButtonDef,
  type RequestInputButtonDefinition,
} from 'react-actions-chat';
import type { SupportInputValidationSettings } from '../../supportFlowTypes';
import {
  createRequestInputValidator,
  resolveRequestInputButtonOverrides,
} from '../../supportFlowUtils';
import type {
  SupportUserFlowLabels,
  SupportUserFlowRequestInputs,
  SupportUserLiveChatInputContext,
} from '../types';

/**
 * Options used to create the start-live-chat request button definition.
 */
interface CreateStartLiveChatButtonDefOptions {
  /**
   * Resolved labels used by this flow or helper.
   */
  readonly labels: SupportUserFlowLabels;
  /**
   * Validation settings applied while collecting input.
   */
  readonly validation: SupportInputValidationSettings;
  /**
   * Request-input override settings for this button definition.
   */
  readonly inputOverrides:
    | SupportUserFlowRequestInputs['startLiveChat']
    | undefined;
  /**
   * Context passed to request-input override resolvers.
   */
  readonly inputContext: SupportUserLiveChatInputContext;
}

/**
 * Creates the start-live-chat request button definition.
 *
 * @param options - Options for creating the start live chat button definition.
 */
export function createStartLiveChatButtonDef({
  labels,
  validation,
  inputOverrides,
  inputContext,
}: CreateStartLiveChatButtonDefOptions): RequestInputButtonDefinition {
  return createRequestInputButtonDef({
    initialLabel: labels.startLiveChat,
    inputPromptMessage:
      'What do you need help with right now? I will queue a live chat handoff.',
    placeholder: 'We are blocked from deploying to production...',
    inputDescription:
      'Mention urgency, customer impact, and what you have already tried.',
    minMessageLength: validation.minMessageLength,
    minMessageLengthMessage: validation.minMessageLengthMessage,
    validator: createRequestInputValidator(validation),
    ...resolveRequestInputButtonOverrides(inputOverrides, inputContext),
  });
}
