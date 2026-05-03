import {
  createRequestConfirmationButtonDef,
  createRequestInputButtonDef,
  type RequestConfirmationButtonDefinition,
  type RequestInputButtonDefinition,
} from 'react-actions-chat';
import type {
  SupportInputValidationSettings,
  SupportTicket,
  SupportTicketPriority,
} from '../../supportFlowTypes';
import {
  createRequestInputValidator,
  resolveConfirmationButtonOverrides,
  resolveRequestInputButtonOverrides,
} from '../../supportFlowUtils';
import type {
  SupportAdminFlowConfirmations,
  SupportAdminFlowLabels,
  SupportAdminFlowRequestInputs,
  SupportAdminReviewTicketInputContext,
  SupportAdminTicketInputContext,
} from '../types';

/**
 * Options used to create the assign-to-agent request button definition.
 */
interface CreateAssignToAgentButtonDefOptions {
  /**
   * Support ticket handled by this flow or helper.
   */
  readonly ticket: SupportTicket;
  /**
   * Resolved labels used by this flow or helper.
   */
  readonly labels: SupportAdminFlowLabels;
  /**
   * Validation settings applied while collecting input.
   */
  readonly validation: SupportInputValidationSettings;
  /**
   * Request-input override settings for this button definition.
   */
  readonly inputOverrides:
    | SupportAdminFlowRequestInputs['assignTicket']
    | undefined;
  /**
   * Context passed to request-input override resolvers.
   */
  readonly inputContext: SupportAdminTicketInputContext;
}

/**
 * Creates the assign-to-agent request button definition.
 *
 * @param options - Options for creating the assign-to-agent button definition.
 */
export function createAssignToAgentButtonDef({
  ticket,
  labels,
  validation,
  inputOverrides,
  inputContext,
}: CreateAssignToAgentButtonDefOptions): RequestInputButtonDefinition {
  const assignmentValidator = createRequestInputValidator(validation);

  return createRequestInputButtonDef({
    initialLabel: labels.assignToAgent,
    inputPromptMessage: `Assign ${ticket.reference} to an agent.`,
    placeholder: 'Avery Specialist or avery@example.com',
    inputDescription: 'Enter the assignee name or email.',
    minMessageLength: validation.minMessageLength,
    minMessageLengthMessage: validation.minMessageLengthMessage,
    validator: (value, submission) => {
      const assignmentResult = assignmentValidator?.(value, submission) ?? true;

      if (assignmentResult !== true) {
        return assignmentResult;
      }

      return value.trim() ? true : 'Enter an agent name or email.';
    },
    ...resolveRequestInputButtonOverrides(inputOverrides, inputContext),
  });
}

/**
 * Options used to create the set priority request button definition.
 */
interface CreateSetPriorityButtonDefOptions {
  /**
   * Support ticket handled by this flow or helper.
   */
  readonly ticket: SupportTicket;
  /**
   * Resolved labels used by this flow or helper.
   */
  readonly labels: SupportAdminFlowLabels;
  /**
   * Priority ordering used for queue sorting and select options.
   */
  readonly priorityOrder: readonly SupportTicketPriority[];
  /**
   * Request-input override settings for this button definition.
   */
  readonly inputOverrides:
    | SupportAdminFlowRequestInputs['setPriority']
    | undefined;
  /**
   * Context passed to request-input override resolvers.
   */
  readonly inputContext: SupportAdminTicketInputContext;
}

/**
 * Creates the set priority request button definition.
 *
 * @param options - Options for creating the set priority button definition.
 */
export function createSetPriorityButtonDef({
  ticket,
  labels,
  priorityOrder,
  inputOverrides,
  inputContext,
}: CreateSetPriorityButtonDefOptions): RequestInputButtonDefinition {
  return createRequestInputButtonDef({
    initialLabel: labels.setPriority,
    inputPromptMessage: labels.setPriorityPrompt(ticket),
    placeholder: labels.setPriorityPlaceholder,
    inputDescription: labels.setPriorityDescription,
    inputType: 'select',
    inputOptions: priorityOrder.map(priority => {
      return {
        value: priority,
        label: priority,
        disabled: priority === ticket.priority,
      };
    }),
    validator: value => {
      return priorityOrder.includes(value as SupportTicketPriority)
        ? true
        : 'Choose a valid priority.';
    },
    ...resolveRequestInputButtonOverrides(inputOverrides, inputContext),
  });
}

/**
 * Options used to create the reply to customer request button definition.
 */
interface CreateReplyToCustomerButtonDefOptions {
  /**
   * Support ticket handled by this flow or helper.
   */
  readonly ticket: SupportTicket;
  /**
   * Resolved labels used by this flow or helper.
   */
  readonly labels: SupportAdminFlowLabels;
  /**
   * Validation settings applied while collecting input.
   */
  readonly validation: SupportInputValidationSettings;
  /**
   * Request-input override settings for this button definition.
   */
  readonly inputOverrides:
    | SupportAdminFlowRequestInputs['replyToCustomer']
    | undefined;
  /**
   * Context passed to request-input override resolvers.
   */
  readonly inputContext: SupportAdminTicketInputContext;
}

/**
 * Creates the reply to customer request button definition.
 *
 * @param options - Options for creating the reply to customer button definition.
 */
export function createReplyToCustomerButtonDef({
  ticket,
  labels,
  validation,
  inputOverrides,
  inputContext,
}: CreateReplyToCustomerButtonDefOptions): RequestInputButtonDefinition {
  return createRequestInputButtonDef({
    initialLabel: labels.replyToCustomer,
    inputPromptMessage: `Send an update to the customer on ${ticket.reference}.`,
    placeholder: 'We reproduced the issue and are working on a fix.',
    inputDescription:
      'This adds a public-facing support response and moves the ticket to pending customer.',
    minMessageLength: validation.minMessageLength,
    minMessageLengthMessage: validation.minMessageLengthMessage,
    validator: createRequestInputValidator(validation),
    ...resolveRequestInputButtonOverrides(inputOverrides, inputContext),
  });
}

/**
 * Options used to create the resolve ticket confirmation button definition.
 */
interface CreateResolveTicketButtonDefOptions {
  /**
   * Support ticket handled by this flow or helper.
   */
  readonly ticket: SupportTicket;
  /**
   * Resolved labels used by this flow or helper.
   */
  readonly labels: SupportAdminFlowLabels;
  /**
   * Confirmation override settings for the resolve-ticket button.
   */
  readonly confirmationOverrides:
    | SupportAdminFlowConfirmations['resolveTicket']
    | undefined;
  /**
   * Context passed to request-input override resolvers.
   */
  readonly inputContext: SupportAdminTicketInputContext;
}

/**
 * Creates the resolve ticket confirmation button definition.
 *
 * @param options - Options for creating the resolve ticket button definition.
 */
export function createResolveTicketButtonDef({
  ticket,
  labels,
  confirmationOverrides,
  inputContext,
}: CreateResolveTicketButtonDefOptions): RequestConfirmationButtonDefinition {
  return createRequestConfirmationButtonDef({
    initialLabel: labels.resolveTicket,
    confirmationMessage: `Resolve ${ticket.reference} and mark the work complete?`,
    confirmLabel: labels.resolveConfirm,
    rejectLabel: labels.resolveReject,
    ...resolveConfirmationButtonOverrides(confirmationOverrides, inputContext),
  });
}

/**
 * Options used to create the review ticket request button definition.
 */
interface CreateReviewTicketButtonDefOptions {
  /**
   * Resolved labels used by this flow or helper.
   */
  readonly labels: SupportAdminFlowLabels;
  /**
   * Request-input override settings for this button definition.
   */
  readonly inputOverrides:
    | SupportAdminFlowRequestInputs['reviewTicket']
    | undefined;
  /**
   * Context passed to request-input override resolvers.
   */
  readonly inputContext: SupportAdminReviewTicketInputContext;
}

/**
 * Creates the review ticket request button definition.
 *
 * @param options - Options for creating the review ticket button definition.
 */
export function createReviewTicketButtonDef({
  labels,
  inputOverrides,
  inputContext,
}: CreateReviewTicketButtonDefOptions): RequestInputButtonDefinition {
  return createRequestInputButtonDef({
    initialLabel: labels.reviewTicket,
    inputPromptMessage:
      'Share the support ticket reference you want to review.',
    placeholder: 'SUP-1000',
    inputDescription: 'Ticket references are usually formatted like SUP-1000.',
    validator: value => {
      return /^SUP-\d{4}$/i.test(value.trim())
        ? true
        : 'Use a ticket reference like SUP-1000.';
    },
    ...resolveRequestInputButtonOverrides(inputOverrides, inputContext),
  });
}
