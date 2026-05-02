import { createButton, type MessageButton } from 'react-actions-chat';
import type {
  SupportAgentIdentity,
  SupportInputValidationSettings,
  SupportTicket,
  SupportTicketPriority,
} from '../../supportFlowTypes';
import {
  formatTicketAssignedMessage,
  formatTicketPriorityChangedMessage,
  formatTicketReopenedMessage,
  formatTicketReplySentMessage,
  formatTicketResolvedMessage,
  formatTicketUnassignedMessage,
} from './actionMessages';
import type { SupportAdminFlowServices } from '../services';
import type {
  SupportAdminFlowButtonContext,
  SupportAdminFlowConfig,
  SupportAdminFlowLabels,
  SupportAdminFormatterContext,
  SupportAdminStatusTransitions,
} from '../types';
import {
  createAssignToAgentButtonDef,
  createReplyToCustomerButtonDef,
  createResolveTicketButtonDef,
  createReviewTicketButtonDef,
  createSetPriorityButtonDef,
} from './buttonDefs';

type CustomizeAdminButtons = (
  context: Omit<SupportAdminFlowButtonContext, 'agent' | 'agentLabel'>
) => readonly MessageButton[];

interface AdminTicketButtonEnvironment {
  readonly agent: SupportAgentIdentity;
  readonly agentLabel: string;
  readonly labels: SupportAdminFlowLabels;
  readonly formatterContext: SupportAdminFormatterContext;
  readonly formatters: SupportAdminFlowConfig['formatters'];
  readonly requestInputs: SupportAdminFlowConfig['requestInputs'];
  readonly confirmations: SupportAdminFlowConfig['confirmations'];
  readonly statusTransitions: SupportAdminStatusTransitions;
  readonly priorityOrder: readonly SupportTicketPriority[];
  readonly ticketAssignmentValidation: SupportInputValidationSettings;
  readonly ticketReplyValidation: SupportInputValidationSettings;
  readonly isTicketResolved: (ticket: SupportTicket) => boolean;
  readonly updateTicket: SupportAdminFlowServices['updateTicket'];
  readonly appendTicketMessage: SupportAdminFlowServices['appendTicketMessage'];
  readonly addSupportMessage: (
    markdown: string,
    buttons: readonly MessageButton[]
  ) => void;
  readonly addAbortRecoveryMessage: (
    markdown: string,
    buttons: readonly MessageButton[]
  ) => void;
  readonly createTicketButtons: (
    ticket: SupportTicket
  ) => readonly MessageButton[];
  readonly createPrimaryButtons: () => readonly MessageButton[];
  readonly showTicket: (reference: string) => void | Promise<void>;
}

interface CreateAdminTicketActionButtonOptions extends AdminTicketButtonEnvironment {
  readonly ticket: SupportTicket;
}

export function createAdminAssignButton({
  ticket,
  labels,
  agentLabel,
  statusTransitions,
  formatters,
  formatterContext,
  updateTicket,
  addSupportMessage,
  createTicketButtons,
}: CreateAdminTicketActionButtonOptions): MessageButton {
  const isAssignedToCurrentAgent = ticket.assignedTo === agentLabel;

  return createButton({
    label: isAssignedToCurrentAgent ? labels.assignedToMe : labels.assignToMe,
    onClick: () => {
      void (async () => {
        const updatedTicket = await updateTicket({
          reference: ticket.reference,
          assignedTo: isAssignedToCurrentAgent ? null : agentLabel,
          status:
            ticket.status === 'new'
              ? (statusTransitions.assignedTicketStatus ?? 'open')
              : ticket.status,
        });

        addSupportMessage(
          formatters?.ticketAssigned?.({
            ...formatterContext,
            ticket: updatedTicket,
          }) ??
            (isAssignedToCurrentAgent
              ? formatTicketUnassignedMessage(updatedTicket)
              : formatTicketAssignedMessage(updatedTicket, agentLabel)),
          createTicketButtons(updatedTicket)
        );
      })();
    },
  });
}

export function createAdminAssignToAgentButton({
  ticket,
  agent,
  agentLabel,
  labels,
  ticketAssignmentValidation,
  requestInputs,
  statusTransitions,
  formatters,
  formatterContext,
  updateTicket,
  addSupportMessage,
  addAbortRecoveryMessage,
  createTicketButtons,
}: CreateAdminTicketActionButtonOptions): MessageButton {
  const inputContext = {
    agent,
    agentLabel,
    ticket,
  };

  return createButton(
    createAssignToAgentButtonDef({
      ticket,
      labels,
      validation: ticketAssignmentValidation,
      inputOverrides: requestInputs?.assignTicket,
      inputContext,
    }),
    {
      onValidInput: async assigneeInput => {
        const assignee = assigneeInput.trim();
        const updatedTicket = await updateTicket({
          reference: ticket.reference,
          assignedTo: assignee,
          status:
            ticket.status === 'new'
              ? (statusTransitions.assignedTicketStatus ?? 'open')
              : ticket.status,
        });

        addSupportMessage(
          formatters?.ticketAssigned?.({
            ...formatterContext,
            ticket: updatedTicket,
          }) ?? formatTicketAssignedMessage(updatedTicket, assignee),
          createTicketButtons(updatedTicket)
        );
      },
      abortCallback: () => {
        addAbortRecoveryMessage(
          `Assignment cancelled for ${ticket.reference}. You can keep reviewing the ticket or return to admin options.`,
          createTicketButtons(ticket)
        );
      },
    }
  );
}

export function createAdminSetPriorityButton({
  ticket,
  agent,
  agentLabel,
  labels,
  priorityOrder,
  requestInputs,
  formatters,
  formatterContext,
  updateTicket,
  addSupportMessage,
  addAbortRecoveryMessage,
  createTicketButtons,
}: CreateAdminTicketActionButtonOptions): MessageButton {
  const inputContext = {
    agent,
    agentLabel,
    ticket,
  };

  return createButton(
    createSetPriorityButtonDef({
      ticket,
      labels,
      priorityOrder,
      inputOverrides: requestInputs?.setPriority,
      inputContext,
    }),
    {
      onValidInput: async priority => {
        const updatedTicket = await updateTicket({
          reference: ticket.reference,
          priority: priority as SupportTicketPriority,
        });

        addSupportMessage(
          formatters?.ticketPriorityChanged?.({
            ...formatterContext,
            ticket: updatedTicket,
          }) ?? formatTicketPriorityChangedMessage(updatedTicket),
          createTicketButtons(updatedTicket)
        );
      },
      abortCallback: () => {
        addAbortRecoveryMessage(
          `Priority update cancelled for ${ticket.reference}. You can keep reviewing the ticket or return to admin options.`,
          createTicketButtons(ticket)
        );
      },
    }
  );
}

export function createAdminReplyButton({
  ticket,
  agent,
  agentLabel,
  labels,
  ticketReplyValidation,
  requestInputs,
  statusTransitions,
  formatters,
  formatterContext,
  updateTicket,
  appendTicketMessage,
  addSupportMessage,
  addAbortRecoveryMessage,
  createTicketButtons,
}: CreateAdminTicketActionButtonOptions): MessageButton {
  const inputContext = {
    agent,
    agentLabel,
    ticket,
  };

  return createButton(
    createReplyToCustomerButtonDef({
      ticket,
      labels,
      validation: ticketReplyValidation,
      inputOverrides: requestInputs?.replyToCustomer,
      inputContext,
    }),
    {
      onValidInput: async body => {
        await appendTicketMessage({
          reference: ticket.reference,
          author: 'agent',
          authorLabel: agentLabel,
          body,
        });
        const updatedTicket = await updateTicket({
          reference: ticket.reference,
          status: statusTransitions.repliedTicketStatus ?? 'pending-customer',
          assignedTo: ticket.assignedTo ?? agentLabel,
        });

        addSupportMessage(
          formatters?.ticketReplySent?.({
            ...formatterContext,
            ticket: updatedTicket,
            body,
          }) ?? formatTicketReplySentMessage(updatedTicket, agentLabel, body),
          createTicketButtons(updatedTicket)
        );
      },
      abortCallback: () => {
        addAbortRecoveryMessage(
          `Reply cancelled for ${ticket.reference}. You can update the customer later or keep triaging the ticket.`,
          createTicketButtons(ticket)
        );
      },
    }
  );
}

export function createAdminResolveButton({
  ticket,
  agent,
  agentLabel,
  labels,
  confirmations,
  statusTransitions,
  isTicketResolved,
  formatters,
  formatterContext,
  updateTicket,
  addSupportMessage,
  createTicketButtons,
}: CreateAdminTicketActionButtonOptions): MessageButton {
  const inputContext = {
    agent,
    agentLabel,
    ticket,
  };

  if (isTicketResolved(ticket)) {
    return createButton({
      label: labels.reopenTicket,
      onClick: () => {
        void (async () => {
          const updatedTicket = await updateTicket({
            reference: ticket.reference,
            status: statusTransitions.reopenedTicketStatus ?? 'open',
            assignedTo: ticket.assignedTo ?? agentLabel,
          });

          addSupportMessage(
            formatters?.ticketReopened?.({
              ...formatterContext,
              ticket: updatedTicket,
            }) ?? formatTicketReopenedMessage(updatedTicket, agentLabel),
            createTicketButtons(updatedTicket)
          );
        })();
      },
    });
  }

  return createButton(
    createResolveTicketButtonDef({
      ticket,
      labels,
      confirmationOverrides: confirmations?.resolveTicket,
      inputContext,
    }),
    {
      onConfirm: () => {
        void (async () => {
          const updatedTicket = await updateTicket({
            reference: ticket.reference,
            status: statusTransitions.resolvedTicketStatus ?? 'resolved',
            assignedTo: ticket.assignedTo ?? agentLabel,
          });

          addSupportMessage(
            formatters?.ticketResolved?.({
              ...formatterContext,
              ticket: updatedTicket,
            }) ?? formatTicketResolvedMessage(updatedTicket, agentLabel),
            createTicketButtons(updatedTicket)
          );
        })();
      },
    }
  );
}

export function createAdminReviewTicketButton({
  agent,
  agentLabel,
  labels,
  requestInputs,
  addAbortRecoveryMessage,
  createPrimaryButtons,
  showTicket,
}: AdminTicketButtonEnvironment): MessageButton {
  const inputContext = {
    agent,
    agentLabel,
  };

  return createButton(
    createReviewTicketButtonDef({
      labels,
      inputOverrides: requestInputs?.reviewTicket,
      inputContext,
    }),
    {
      onValidInput: async reference => {
        await showTicket(reference);
      },
      abortCallback: () => {
        addAbortRecoveryMessage(
          'Ticket review cancelled. You can inspect the queue, try another reference, or jump back into your assigned work.',
          createPrimaryButtons()
        );
      },
    }
  );
}

interface CreateAdminTicketButtonsOptions {
  readonly ticket: SupportTicket;
  readonly labels: SupportAdminFlowLabels;
  readonly canUpdateTicket: boolean;
  readonly canAppendTicketMessage: boolean;
  readonly createAssignButton: (ticket: SupportTicket) => MessageButton;
  readonly createAssignToAgentButton: (ticket: SupportTicket) => MessageButton;
  readonly createSetPriorityButton: (ticket: SupportTicket) => MessageButton;
  readonly createReplyButton: (ticket: SupportTicket) => MessageButton;
  readonly createResolveButton: (ticket: SupportTicket) => MessageButton;
  readonly createBackToAdminOptionsButton: () => MessageButton;
  readonly showFullActivity: (reference: string) => void;
  readonly customizeButtons: CustomizeAdminButtons;
}

export function createAdminTicketButtons({
  ticket,
  labels,
  canUpdateTicket,
  canAppendTicketMessage,
  createAssignButton,
  createAssignToAgentButton,
  createSetPriorityButton,
  createReplyButton,
  createResolveButton,
  createBackToAdminOptionsButton,
  showFullActivity,
  customizeButtons,
}: CreateAdminTicketButtonsOptions): readonly MessageButton[] {
  const defaultButtons = [
    ...(canUpdateTicket
      ? [
          createAssignButton(ticket),
          createAssignToAgentButton(ticket),
          createSetPriorityButton(ticket),
        ]
      : []),
    createButton({
      label: labels.viewFullActivity,
      onClick: () => {
        showFullActivity(ticket.reference);
      },
    }),
    ...(canAppendTicketMessage && canUpdateTicket
      ? [createReplyButton(ticket)]
      : []),
    ...(canUpdateTicket ? [createResolveButton(ticket)] : []),
    createBackToAdminOptionsButton(),
  ];

  return customizeButtons({
    slot: 'ticket',
    defaultButtons,
    ticket,
  });
}
