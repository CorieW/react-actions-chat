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

interface CreateAssignToAgentButtonDefOptions {
  readonly ticket: SupportTicket;
  readonly labels: SupportAdminFlowLabels;
  readonly validation: SupportInputValidationSettings;
  readonly inputOverrides:
    | SupportAdminFlowRequestInputs['assignTicket']
    | undefined;
  readonly inputContext: SupportAdminTicketInputContext;
}

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

interface CreateSetPriorityButtonDefOptions {
  readonly ticket: SupportTicket;
  readonly labels: SupportAdminFlowLabels;
  readonly priorityOrder: readonly SupportTicketPriority[];
  readonly inputOverrides:
    | SupportAdminFlowRequestInputs['setPriority']
    | undefined;
  readonly inputContext: SupportAdminTicketInputContext;
}

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

interface CreateReplyToCustomerButtonDefOptions {
  readonly ticket: SupportTicket;
  readonly labels: SupportAdminFlowLabels;
  readonly validation: SupportInputValidationSettings;
  readonly inputOverrides:
    | SupportAdminFlowRequestInputs['replyToCustomer']
    | undefined;
  readonly inputContext: SupportAdminTicketInputContext;
}

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

interface CreateResolveTicketButtonDefOptions {
  readonly ticket: SupportTicket;
  readonly labels: SupportAdminFlowLabels;
  readonly confirmationOverrides:
    | SupportAdminFlowConfirmations['resolveTicket']
    | undefined;
  readonly inputContext: SupportAdminTicketInputContext;
}

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

interface CreateReviewTicketButtonDefOptions {
  readonly labels: SupportAdminFlowLabels;
  readonly inputOverrides:
    | SupportAdminFlowRequestInputs['reviewTicket']
    | undefined;
  readonly inputContext: SupportAdminReviewTicketInputContext;
}

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
