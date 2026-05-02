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

interface CreateStartLiveChatButtonDefOptions {
  readonly labels: SupportUserFlowLabels;
  readonly validation: SupportInputValidationSettings;
  readonly inputOverrides:
    | SupportUserFlowRequestInputs['startLiveChat']
    | undefined;
  readonly inputContext: SupportUserLiveChatInputContext;
}

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
