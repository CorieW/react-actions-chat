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

/**
 * Button customization hook scoped to admin flow internals.
 *
 * @param context - Context object available to this resolver.
 */
type CustomizeAdminButtons = (
  context: Omit<SupportAdminFlowButtonContext, 'agent' | 'agentLabel'>
) => readonly MessageButton[];

/**
 * Shared dependencies used while building admin ticket button.
 */
interface AdminTicketButtonEnvironment {
  /**
   * Support agent identity used by this flow or helper.
   */
  readonly agent: SupportAgentIdentity;
  /**
   * Display label for the support agent in generated messages.
   */
  readonly agentLabel: string;
  /**
   * Resolved labels used by this flow or helper.
   */
  readonly labels: SupportAdminFlowLabels;
  /**
   * Shared context passed to formatter functions.
   */
  readonly formatterContext: SupportAdminFormatterContext;
  /**
   * Formatter overrides used by this flow or helper.
   */
  readonly formatters: SupportAdminFlowConfig['formatters'];
  /**
   * Request-input override settings used by the flow.
   */
  readonly requestInputs: SupportAdminFlowConfig['requestInputs'];
  /**
   * Confirmation-button override settings used by the flow.
   */
  readonly confirmations: SupportAdminFlowConfig['confirmations'];
  /**
   * Ticket status transitions applied by admin actions.
   */
  readonly statusTransitions: SupportAdminStatusTransitions;
  /**
   * Priority ordering used for queue sorting and select options.
   */
  readonly priorityOrder: readonly SupportTicketPriority[];
  /**
   * Validation settings for ticket-assignment input.
   */
  readonly ticketAssignmentValidation: SupportInputValidationSettings;
  /**
   * Validation settings for ticket-reply input.
   */
  readonly ticketReplyValidation: SupportInputValidationSettings;
  /**
   * Returns whether a ticket is considered resolved.
   *
   * @param ticket - Support ticket to inspect or render.
   */
  readonly isTicketResolved: (ticket: SupportTicket) => boolean;
  /**
   * Service used to update a support ticket.
   */
  readonly updateTicket: SupportAdminFlowServices['updateTicket'];
  /**
   * Service used to append a message to a support ticket.
   */
  readonly appendTicketMessage: SupportAdminFlowServices['appendTicketMessage'];
  /**
   * Adds a support markdown message to the transcript.
   *
   * @param markdown - Markdown message body to add.
   * @param buttons - Buttons to render, store, or customize.
   */
  readonly addSupportMessage: (
    markdown: string,
    buttons: readonly MessageButton[]
  ) => void;
  /**
   * Adds a recovery message after a request-input flow is aborted.
   *
   * @param markdown - Markdown message body to add.
   * @param buttons - Buttons to render, store, or customize.
   */
  readonly addAbortRecoveryMessage: (
    markdown: string,
    buttons: readonly MessageButton[]
  ) => void;
  /**
   * Creates ticket action buttons.
   *
   * @param ticket - Support ticket to inspect or render.
   */
  readonly createTicketButtons: (
    ticket: SupportTicket
  ) => readonly MessageButton[];
  /**
   * Factory used to create the primary flow action buttons.
   */
  readonly createPrimaryButtons: () => readonly MessageButton[];
  /**
   * Shows a support ticket.
   *
   * @param reference - Ticket reference to look up.
   */
  readonly showTicket: (reference: string) => void | Promise<void>;
}

/**
 * Options used to create admin ticket action button.
 */
interface CreateAdminTicketActionButtonOptions extends AdminTicketButtonEnvironment {
  /**
   * Support ticket handled by this flow or helper.
   */
  readonly ticket: SupportTicket;
}

/**
 * Creates an admin assign button.
 *
 * @param options - Options for creating the admin assign button.
 */
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

/**
 * Creates an admin assign-to-agent button.
 *
 * @param options - Options for creating the admin assign-to-agent button.
 */
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

/**
 * Creates an admin set priority button.
 *
 * @param options - Options for creating the admin set priority button.
 */
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

/**
 * Creates an admin reply button.
 *
 * @param options - Options for creating the admin reply button.
 */
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

/**
 * Creates an admin resolve button.
 *
 * @param options - Options for creating the admin resolve button.
 */
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

/**
 * Creates an admin review ticket button.
 *
 * @param options - Options for creating the admin review ticket button.
 */
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

/**
 * Options used to create admin ticket buttons.
 */
interface CreateAdminTicketButtonsOptions {
  /**
   * Support ticket handled by this flow or helper.
   */
  readonly ticket: SupportTicket;
  /**
   * Resolved labels used by this flow or helper.
   */
  readonly labels: SupportAdminFlowLabels;
  /**
   * Whether ticket updates are available.
   */
  readonly canUpdateTicket: boolean;
  /**
   * Whether ticket message append actions are available.
   */
  readonly canAppendTicketMessage: boolean;
  /**
   * Creates the admin assign-to-me button for a ticket.
   *
   * @param ticket - Support ticket to inspect or render.
   */
  readonly createAssignButton: (ticket: SupportTicket) => MessageButton;
  /**
   * Creates the admin assign-to-agent button for a ticket.
   *
   * @param ticket - Support ticket to inspect or render.
   */
  readonly createAssignToAgentButton: (ticket: SupportTicket) => MessageButton;
  /**
   * Creates the admin set-priority button for a ticket.
   *
   * @param ticket - Support ticket to inspect or render.
   */
  readonly createSetPriorityButton: (ticket: SupportTicket) => MessageButton;
  /**
   * Creates the admin reply button for a ticket.
   *
   * @param ticket - Support ticket to inspect or render.
   */
  readonly createReplyButton: (ticket: SupportTicket) => MessageButton;
  /**
   * Creates the admin resolve button for a ticket.
   *
   * @param ticket - Support ticket to inspect or render.
   */
  readonly createResolveButton: (ticket: SupportTicket) => MessageButton;
  /**
   * Factory used to create the admin options navigation button.
   */
  readonly createBackToAdminOptionsButton: () => MessageButton;
  /**
   * Shows full ticket activity.
   *
   * @param reference - Ticket reference to look up.
   */
  readonly showFullActivity: (reference: string) => void;
  /**
   * Hook used to customize admin ticket buttons before rendering.
   */
  readonly customizeButtons: CustomizeAdminButtons;
}

/**
 * Creates admin ticket buttons.
 *
 * @param options - Options for creating the admin ticket buttons.
 */
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
