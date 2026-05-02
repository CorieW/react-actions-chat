import { createButton, type MessageButton } from 'react-actions-chat';
import type { SupportTicket } from '../../supportFlowTypes';
import type { SupportAdminTicketPage } from './queue';
import type { SupportAdminFlowLabels } from '../types';

interface CreateTicketReferenceButtonsOptions {
  readonly tickets: readonly SupportTicket[];
  readonly getVariant: (ticket: SupportTicket) => MessageButton['variant'];
  readonly showTicket: (reference: string) => void;
}

export function createTicketReferenceButtons({
  tickets,
  getVariant,
  showTicket,
}: CreateTicketReferenceButtonsOptions): readonly MessageButton[] {
  return tickets.map(ticket => {
    return createButton({
      label: ticket.reference,
      variant: getVariant(ticket),
      onClick: () => {
        showTicket(ticket.reference);
      },
    });
  });
}

interface CreateTicketPaginationButtonsOptions {
  readonly page: SupportAdminTicketPage;
  readonly labels: SupportAdminFlowLabels;
  readonly showPage: (pageIndex: number) => void;
}

export function createTicketPaginationButtons({
  page,
  labels,
  showPage,
}: CreateTicketPaginationButtonsOptions): readonly MessageButton[] {
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

interface CreateRefreshTicketQueueButtonOptions {
  readonly labels: SupportAdminFlowLabels;
  readonly pageIndex: number;
  readonly showTicketQueue: (pageIndex: number) => void;
}

export function createRefreshTicketQueueButton({
  labels,
  pageIndex,
  showTicketQueue,
}: CreateRefreshTicketQueueButtonOptions): MessageButton {
  return createButton({
    label: labels.refreshTicketQueue,
    onClick: () => {
      showTicketQueue(pageIndex);
    },
  });
}

interface CreateViewTicketQueueButtonOptions {
  readonly labels: SupportAdminFlowLabels;
  readonly showTicketQueue: () => void;
}

export function createViewTicketQueueButton({
  labels,
  showTicketQueue,
}: CreateViewTicketQueueButtonOptions): MessageButton {
  return createButton({
    label: labels.viewTicketQueue,
    onClick: showTicketQueue,
  });
}
