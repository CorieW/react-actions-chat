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
  createOpenTicketButtonDef,
} from './buttonDefs';

type CustomizeUserButtons = (
  context: Omit<SupportUserFlowButtonContext, 'customer'>
) => readonly MessageButton[];

interface UserTicketButtonEnvironment {
  readonly customer: SupportUserIdentity;
  readonly labels: SupportUserFlowLabels;
  readonly formatterContext: SupportUserFormatterContext;
  readonly formatters: SupportUserFlowConfig['formatters'];
  readonly requestInputs: SupportUserFlowConfig['requestInputs'];
  readonly ticketSummaryValidation: SupportInputValidationSettings;
  readonly ticketDetailValidation: SupportInputValidationSettings;
  readonly createTicket: SupportUserFlowServices['createTicket'];
  readonly appendTicketMessage: SupportUserFlowServices['appendTicketMessage'];
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
}

interface CreateUserTicketActionButtonOptions extends UserTicketButtonEnvironment {
  readonly ticket: SupportTicket;
}

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

interface CreateViewTicketsButtonOptions {
  readonly labels: SupportUserFlowLabels;
  readonly showMyTickets: () => void;
}

export function createViewTicketsButton({
  labels,
  showMyTickets,
}: CreateViewTicketsButtonOptions): MessageButton {
  return createButton({
    label: labels.viewTickets,
    onClick: showMyTickets,
  });
}

interface CreateUserTicketButtonsOptions {
  readonly ticket: SupportTicket;
  readonly labels: SupportUserFlowLabels;
  readonly canAppendTicketMessage: boolean;
  readonly canListTickets: boolean;
  readonly createAddDetailButton: (ticket: SupportTicket) => MessageButton;
  readonly createBackToSupportOptionsButton: () => MessageButton;
  readonly showTicket: (reference: string) => void;
  readonly showFullActivity: (reference: string) => void;
  readonly showMyTickets: () => void;
  readonly customizeButtons: CustomizeUserButtons;
}

export function createUserTicketButtons({
  ticket,
  labels,
  canAppendTicketMessage,
  canListTickets,
  createAddDetailButton,
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

interface CreateUserTicketReferenceButtonsOptions {
  readonly tickets: readonly SupportTicket[];
  readonly showTicket: (reference: string) => void;
}

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

interface CreateUserTicketPaginationButtonsOptions {
  readonly page: SupportPaginationPage<SupportTicket>;
  readonly labels: SupportUserFlowLabels;
  readonly showPage: (pageIndex: number) => void;
}

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
