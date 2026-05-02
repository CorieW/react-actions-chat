import {
  createRequestInputButtonDef,
  type RequestInputButtonDefinition,
} from 'react-actions-chat';
import type {
  SupportInputValidationSettings,
  SupportTicket,
} from '../../supportFlowTypes';
import {
  createRequestInputValidator,
  resolveRequestInputButtonOverrides,
} from '../../supportFlowUtils';
import type {
  SupportUserCreateTicketInputContext,
  SupportUserFlowLabels,
  SupportUserFlowRequestInputs,
  SupportUserTicketInputContext,
} from '../types';

interface CreateAddTicketDetailButtonDefOptions {
  readonly ticket: SupportTicket;
  readonly labels: SupportUserFlowLabels;
  readonly validation: SupportInputValidationSettings;
  readonly inputOverrides:
    | SupportUserFlowRequestInputs['addTicketDetail']
    | undefined;
  readonly inputContext: SupportUserTicketInputContext;
}

export function createAddTicketDetailButtonDef({
  ticket,
  labels,
  validation,
  inputOverrides,
  inputContext,
}: CreateAddTicketDetailButtonDefOptions): RequestInputButtonDefinition {
  return createRequestInputButtonDef({
    initialLabel: labels.addDetail,
    inputPromptMessage: `Share the next detail you want added to ${ticket.reference}.`,
    placeholder: 'The error started after we rotated SSO certificates...',
    inputDescription:
      'Use this to add reproduction steps, screenshots, timing, or business impact.',
    minMessageLength: validation.minMessageLength,
    minMessageLengthMessage: validation.minMessageLengthMessage,
    validator: createRequestInputValidator(validation),
    ...resolveRequestInputButtonOverrides(inputOverrides, inputContext),
  });
}

interface CreateOpenTicketButtonDefOptions {
  readonly labels: SupportUserFlowLabels;
  readonly validation: SupportInputValidationSettings;
  readonly inputOverrides:
    | SupportUserFlowRequestInputs['createTicket']
    | undefined;
  readonly inputContext: SupportUserCreateTicketInputContext;
}

export function createOpenTicketButtonDef({
  labels,
  validation,
  inputOverrides,
  inputContext,
}: CreateOpenTicketButtonDefOptions): RequestInputButtonDefinition {
  return createRequestInputButtonDef({
    initialLabel: labels.startTicket,
    inputPromptMessage:
      'Describe the issue and I will create a tracked support ticket.',
    placeholder: 'Our team cannot invite new users after enabling SSO.',
    inputDescription:
      'Include the symptom, impact, and any troubleshooting you have already tried.',
    minMessageLength: validation.minMessageLength,
    minMessageLengthMessage: validation.minMessageLengthMessage,
    validator: createRequestInputValidator(validation),
    ...resolveRequestInputButtonOverrides(inputOverrides, inputContext),
  });
}
