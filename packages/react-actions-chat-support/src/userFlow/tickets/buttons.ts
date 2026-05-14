import { createButton, type MessageButton } from 'react-actions-chat';
import type {
  SupportInputValidationSettings,
  SupportTicket,
  SupportUserIdentity,
} from '../../supportFlowTypes';
import {
  deriveCustomerLabel,
  escapeMarkdown,
  joinMarkdownLines,
  type SupportPaginationPage,
} from '../../supportFlowUtils';
import type { SupportUserFlowServices } from '../services';
import type {
  SupportUserFlowButtonContext,
  SupportUserFlowConfig,
  SupportUserFlowLabels,
  SupportUserFormatterContext,
} from '../types';
import {
  createAddTicketDetailButtonDef,
  createDeleteTicketButtonDef,
  createOpenTicketButtonDef,
} from './buttonDefs';

/**
 * Button customization hook scoped to customer flow internals.
 *
 * @param context - Context object available to this resolver.
 */
type CustomizeUserButtons = (
  context: Omit<SupportUserFlowButtonContext, 'customer'>
) => readonly MessageButton[];

/**
 * Shared dependencies used while building customer ticket button.
 */
interface UserTicketButtonEnvironment {
  /**
   * Customer identity associated with the flow or record.
   */
  readonly customer: SupportUserIdentity;
  /**
   * Resolved labels used by this flow or helper.
   */
  readonly labels: SupportUserFlowLabels;
  /**
   * Shared context passed to formatter functions.
   */
  readonly formatterContext: SupportUserFormatterContext;
  /**
   * Formatter overrides used by this flow or helper.
   */
  readonly formatters: SupportUserFlowConfig['formatters'];
  /**
   * Request-input override settings used by the flow.
   */
  readonly requestInputs: SupportUserFlowConfig['requestInputs'];
  /**
   * Validation settings for ticket-summary input.
   */
  readonly ticketSummaryValidation: SupportInputValidationSettings;
  /**
   * Validation settings for additional ticket details.
   */
  readonly ticketDetailValidation: SupportInputValidationSettings;
  /**
   * Service used to create a support ticket.
   */
  readonly createTicket: SupportUserFlowServices['createTicket'];
  /**
   * Service used to append a message to a support ticket.
   */
  readonly appendTicketMessage: SupportUserFlowServices['appendTicketMessage'];
  /**
   * Service used to delete a support ticket.
   */
  readonly deleteTicket: SupportUserFlowServices['deleteTicket'];
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
}

/**
 * Options used to create customer ticket action button.
 */
interface CreateUserTicketActionButtonOptions extends UserTicketButtonEnvironment {
  /**
   * Support ticket handled by this flow or helper.
   */
  readonly ticket: SupportTicket;
}

/**
 * Creates a customer add-detail button.
 *
 * @param options - Options for creating the customer add-detail button.
 */
export function createUserAddDetailButton({
  ticket,
  customer,
  labels,
  formatterContext,
  formatters,
  requestInputs,
  ticketDetailValidation,
  appendTicketMessage,
  addSupportMessage,
  addAbortRecoveryMessage,
  createTicketButtons,
}: CreateUserTicketActionButtonOptions): MessageButton {
  const inputContext = {
    customer,
    ticket,
  };

  return createButton(
    createAddTicketDetailButtonDef({
      ticket,
      labels,
      validation: ticketDetailValidation,
      inputOverrides: requestInputs?.addTicketDetail,
      inputContext,
    }),
    {
      onValidInput: async detail => {
        const updatedTicket = await appendTicketMessage({
          reference: ticket.reference,
          author: 'customer',
          authorLabel: deriveCustomerLabel(customer),
          body: detail,
        });

        addSupportMessage(
          formatters?.ticketDetailAdded?.({
            ...formatterContext,
            ticket: updatedTicket,
            detail,
          }) ??
            joinMarkdownLines([
              `## Added your note to ${escapeMarkdown(updatedTicket.reference)}`,
              '',
              'The support team will see the new detail the next time they review the ticket.',
              '',
              '### New detail',
              '',
              escapeMarkdown(detail),
            ]),
          createTicketButtons(updatedTicket)
        );
      },
      abortCallback: () => {
        addAbortRecoveryMessage(
          `No new detail was added to ${ticket.reference}. You can return to the ticket whenever you are ready.`,
          createTicketButtons(ticket)
        );
      },
    }
  );
}

/**
 * Creates a customer open-ticket button.
 *
 * @param options - Options for creating the customer open ticket button.
 */
export function createUserOpenTicketButton({
  customer,
  labels,
  formatterContext,
  formatters,
  requestInputs,
  ticketSummaryValidation,
  createTicket,
  addSupportMessage,
  addAbortRecoveryMessage,
  createTicketButtons,
  createPrimaryButtons,
}: UserTicketButtonEnvironment): MessageButton {
  const inputContext = {
    customer,
  };

  return createButton(
    createOpenTicketButtonDef({
      labels,
      validation: ticketSummaryValidation,
      inputOverrides: requestInputs?.createTicket,
      inputContext,
    }),
    {
      onValidInput: async summary => {
        const ticket = await createTicket({
          customer,
          summary,
        });

        addSupportMessage(
          formatters?.ticketCreated?.({
            ...formatterContext,
            ticket,
          }) ??
            joinMarkdownLines([
              `## ${escapeMarkdown(ticket.reference)} is open for ${escapeMarkdown(deriveCustomerLabel(customer))}`,
              '',
              `- **Subject:** ${escapeMarkdown(ticket.subject)}`,
              `- **Priority:** ${escapeMarkdown(ticket.priority)}`,
              '',
              '### Request details',
              '',
              escapeMarkdown(ticket.summary),
              '',
              'Add more detail or review status from here.',
            ]),
          createTicketButtons(ticket)
        );
      },
      abortCallback: () => {
        addAbortRecoveryMessage(
          'Ticket creation cancelled. You can open a new ticket whenever you are ready.',
          createPrimaryButtons()
        );
      },
    }
  );
}

/**
 * Creates a customer delete-ticket button.
 *
 * @param options - Options for creating the customer delete-ticket button.
 */
export function createUserDeleteTicketButton({
  ticket,
  customer,
  labels,
  deleteTicket,
  addSupportMessage,
  createTicketButtons,
  createPrimaryButtons,
}: CreateUserTicketActionButtonOptions): MessageButton {
  return createButton(
    createDeleteTicketButtonDef({
      ticket,
      labels,
    }),
    {
      onConfirm: () => {
        void (async () => {
          const didDelete = await deleteTicket({
            reference: ticket.reference,
            customer,
          });

          addSupportMessage(
            didDelete
              ? joinMarkdownLines([
                  `## Deleted ticket ${escapeMarkdown(ticket.reference)}`,
                  '',
                  'It no longer appears in your ticket list.',
                ])
              : `Ticket ${escapeMarkdown(ticket.reference)} could not be deleted. It may have already been removed.`,
            createPrimaryButtons()
          );
        })();
      },
      onReject: () => {
        addSupportMessage(
          `Ticket ${escapeMarkdown(ticket.reference)} was not deleted.`,
          createTicketButtons(ticket)
        );
      },
    }
  );
}

/**
 * Options used to create view tickets button.
 */
interface CreateViewTicketsButtonOptions {
  /**
   * Resolved labels used by this flow or helper.
   */
  readonly labels: SupportUserFlowLabels;
  /**
   * Handler used to render the customer ticket list.
   */
  readonly showMyTickets: () => void;
}

/**
 * Creates a view tickets button.
 *
 * @param options - Options for creating the view tickets button.
 */
export function createViewTicketsButton({
  labels,
  showMyTickets,
}: CreateViewTicketsButtonOptions): MessageButton {
  return createButton({
    label: labels.viewTickets,
    onClick: showMyTickets,
  });
}

/**
 * Options used to create customer ticket buttons.
 */
interface CreateUserTicketButtonsOptions {
  /**
   * Support ticket handled by this flow or helper.
   */
  readonly ticket: SupportTicket;
  /**
   * Resolved labels used by this flow or helper.
   */
  readonly labels: SupportUserFlowLabels;
  /**
   * Whether ticket message append actions are available.
   */
  readonly canAppendTicketMessage: boolean;
  /**
   * Whether ticket deletion is available.
   */
  readonly canDeleteTicket: boolean;
  /**
   * Whether ticket listing is available.
   */
  readonly canListTickets: boolean;
  /**
   * Creates the customer add-detail button for a ticket.
   *
   * @param ticket - Support ticket to inspect or render.
   */
  readonly createAddDetailButton: (ticket: SupportTicket) => MessageButton;
  /**
   * Creates the customer delete button for a ticket.
   *
   * @param ticket - Support ticket to inspect or render.
   */
  readonly createDeleteTicketButton: (ticket: SupportTicket) => MessageButton;
  /**
   * Factory used to create the support options navigation button.
   */
  readonly createBackToSupportOptionsButton: () => MessageButton;
  /**
   * Shows a support ticket.
   *
   * @param reference - Ticket reference to look up.
   */
  readonly showTicket: (reference: string) => void;
  /**
   * Shows full ticket activity.
   *
   * @param reference - Ticket reference to look up.
   */
  readonly showFullActivity: (reference: string) => void;
  /**
   * Handler used to render the customer ticket list.
   */
  readonly showMyTickets: () => void;
  /**
   * Hook used to customize customer ticket buttons before rendering.
   */
  readonly customizeButtons: CustomizeUserButtons;
}

/**
 * Creates customer ticket buttons.
 *
 * @param options - Options for creating the customer ticket buttons.
 */
export function createUserTicketButtons({
  ticket,
  labels,
  canAppendTicketMessage,
  canDeleteTicket,
  canListTickets,
  createAddDetailButton,
  createDeleteTicketButton,
  createBackToSupportOptionsButton,
  showTicket,
  showFullActivity,
  showMyTickets,
  customizeButtons,
}: CreateUserTicketButtonsOptions): readonly MessageButton[] {
  const defaultButtons = [
    createButton({
      label: labels.refreshStatus,
      onClick: () => {
        showTicket(ticket.reference);
      },
    }),
    createButton({
      label: labels.viewFullActivity,
      onClick: () => {
        showFullActivity(ticket.reference);
      },
    }),
    ...(canAppendTicketMessage ? [createAddDetailButton(ticket)] : []),
    ...(canDeleteTicket ? [createDeleteTicketButton(ticket)] : []),
    ...(canListTickets
      ? [
          createButton({
            label: labels.viewTickets,
            onClick: showMyTickets,
          }),
        ]
      : []),
    createBackToSupportOptionsButton(),
  ];

  return customizeButtons({
    slot: 'ticket',
    defaultButtons,
    ticket,
  });
}

/**
 * Options used to create customer ticket reference buttons.
 */
interface CreateUserTicketReferenceButtonsOptions {
  /**
   * Support tickets in the current list or queue.
   */
  readonly tickets: readonly SupportTicket[];
  /**
   * Shows a support ticket.
   *
   * @param reference - Ticket reference to look up.
   */
  readonly showTicket: (reference: string) => void;
}

/**
 * Creates customer ticket reference buttons.
 *
 * @param options - Options for creating the customer ticket reference buttons.
 */
export function createUserTicketReferenceButtons({
  tickets,
  showTicket,
}: CreateUserTicketReferenceButtonsOptions): readonly MessageButton[] {
  return tickets.map(ticket => {
    return createButton({
      label: ticket.reference,
      onClick: () => {
        showTicket(ticket.reference);
      },
    });
  });
}

/**
 * Options used to create customer ticket pagination buttons.
 */
interface CreateUserTicketPaginationButtonsOptions {
  /**
   * Page of records returned by the pagination helper.
   */
  readonly page: SupportPaginationPage<SupportTicket>;
  /**
   * Resolved labels used by this flow or helper.
   */
  readonly labels: SupportUserFlowLabels;
  /**
   * Shows a requested list page.
   *
   * @param pageIndex - Zero-based page index to show.
   */
  readonly showPage: (pageIndex: number) => void;
}

/**
 * Creates customer ticket pagination buttons.
 *
 * @param options - Options for creating the customer ticket pagination buttons.
 */
export function createUserTicketPaginationButtons({
  page,
  labels,
  showPage,
}: CreateUserTicketPaginationButtonsOptions): readonly MessageButton[] {
  return [
    ...(page.pageIndex > 0
      ? [
          createButton({
            label: labels.previousTickets,
            onClick: () => {
              showPage(page.pageIndex - 1);
            },
          }),
        ]
      : []),
    ...(page.pageIndex < page.pageCount - 1
      ? [
          createButton({
            label: labels.nextTickets,
            onClick: () => {
              showPage(page.pageIndex + 1);
            },
          }),
        ]
      : []),
  ];
}
