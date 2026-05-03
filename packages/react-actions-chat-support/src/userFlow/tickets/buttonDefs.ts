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

/**
 * Options used to create the add ticket detail request button definition.
 */
interface CreateAddTicketDetailButtonDefOptions {
  /**
   * Support ticket handled by this flow or helper.
   */
  readonly ticket: SupportTicket;
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
    | SupportUserFlowRequestInputs['addTicketDetail']
    | undefined;
  /**
   * Context passed to request-input override resolvers.
   */
  readonly inputContext: SupportUserTicketInputContext;
}

/**
 * Creates the add ticket detail request button definition.
 *
 * @param options - Options for creating the add ticket detail button definition.
 */
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

/**
 * Options used to create the open ticket request button definition.
 */
interface CreateOpenTicketButtonDefOptions {
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
    | SupportUserFlowRequestInputs['createTicket']
    | undefined;
  /**
   * Context passed to request-input override resolvers.
   */
  readonly inputContext: SupportUserCreateTicketInputContext;
}

/**
 * Creates the open ticket request button definition.
 *
 * @param options - Options for creating the open ticket button definition.
 */
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
