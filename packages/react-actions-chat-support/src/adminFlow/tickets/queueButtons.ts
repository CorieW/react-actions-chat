import { createButton, type MessageButton } from 'react-actions-chat';
import type { SupportTicket } from '../../supportFlowTypes';
import type { SupportAdminTicketPage } from './queue';
import type { SupportAdminFlowLabels } from '../types';

/**
 * Options used to create ticket reference buttons.
 */
interface CreateTicketReferenceButtonsOptions {
  /**
   * Support tickets in the current list or queue.
   */
  readonly tickets: readonly SupportTicket[];
  /**
   * Returns variant.
   *
   * @param ticket - Support ticket to inspect or render.
   */
  readonly getVariant: (ticket: SupportTicket) => MessageButton['variant'];
  /**
   * Shows a support ticket.
   *
   * @param reference - Ticket reference to look up.
   */
  readonly showTicket: (reference: string) => void;
}

/**
 * Creates ticket reference buttons.
 *
 * @param options - Options for creating the ticket reference buttons.
 */
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

/**
 * Options used to create ticket pagination buttons.
 */
interface CreateTicketPaginationButtonsOptions {
  /**
   * Page of records returned by the pagination helper.
   */
  readonly page: SupportAdminTicketPage;
  /**
   * Resolved labels used by this flow or helper.
   */
  readonly labels: SupportAdminFlowLabels;
  /**
   * Shows a requested list page.
   *
   * @param pageIndex - Zero-based page index to show.
   */
  readonly showPage: (pageIndex: number) => void;
}

/**
 * Creates ticket pagination buttons.
 *
 * @param options - Options for creating the ticket pagination buttons.
 */
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

/**
 * Options used to create refresh ticket queue button.
 */
interface CreateRefreshTicketQueueButtonOptions {
  /**
   * Resolved labels used by this flow or helper.
   */
  readonly labels: SupportAdminFlowLabels;
  /**
   * Zero-based page index currently being rendered.
   */
  readonly pageIndex: number;
  /**
   * Shows the ticket queue.
   *
   * @param pageIndex - Zero-based page index to show.
   */
  readonly showTicketQueue: (pageIndex: number) => void;
}

/**
 * Creates a refresh ticket queue button.
 *
 * @param options - Options for creating the refresh ticket queue button.
 */
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

/**
 * Options used to create view ticket queue button.
 */
interface CreateViewTicketQueueButtonOptions {
  /**
   * Resolved labels used by this flow or helper.
   */
  readonly labels: SupportAdminFlowLabels;
  /**
   * Handler used to render the ticket queue.
   */
  readonly showTicketQueue: () => void;
}

/**
 * Creates a view ticket queue button.
 *
 * @param options - Options for creating the view ticket queue button.
 */
export function createViewTicketQueueButton({
  labels,
  showTicketQueue,
}: CreateViewTicketQueueButtonOptions): MessageButton {
  return createButton({
    label: labels.viewTicketQueue,
    onClick: showTicketQueue,
  });
}
