import type { MessageButton } from 'react-actions-chat';
import type { SupportTicket } from '../../supportFlowTypes';
import { paginateItems } from '../../supportFlowUtils';

/**
 * Paginated result shape for support admin ticket.
 */
export interface SupportAdminTicketPage {
  /**
   * Support tickets visible on the current page.
   */
  readonly visibleTickets: readonly SupportTicket[];
  /**
   * Zero-based page index currently being rendered.
   */
  readonly pageIndex: number;
  /**
   * One-based page number currently being rendered.
   */
  readonly currentPage: number;
  /**
   * Total number of pages available.
   */
  readonly pageCount: number;
  /**
   * Number of items shown per page.
   */
  readonly pageSize: number;
  /**
   * Total number of support tickets before pagination.
   */
  readonly totalTickets: number;
  /**
   * One-based ticket number for the first visible ticket on the page.
   */
  readonly firstVisibleTicketNumber: number;
  /**
   * One-based ticket number for the last visible ticket on the page.
   */
  readonly lastVisibleTicketNumber: number;
}

/**
 * Returns ticket queue button variant.
 *
 * @param ticket - Support ticket to inspect, format, or update.
 */
export function getTicketQueueButtonVariant(
  ticket: SupportTicket
): MessageButton['variant'] {
  return ticket.assignedTo ? 'error' : 'success';
}

/**
 * Sorts tickets by assignment.
 *
 * @param tickets - Support tickets to sort, paginate, or render.
 */
export function sortTicketsByAssignment(
  tickets: readonly SupportTicket[]
): readonly SupportTicket[] {
  const unassignedTickets = tickets.filter(ticket => !ticket.assignedTo);
  const assignedTickets = tickets.filter(ticket => ticket.assignedTo);

  return [...unassignedTickets, ...assignedTickets];
}

/**
 * Paginates tickets into a bounded page result.
 *
 * @param tickets - Support tickets to sort, paginate, or render.
 * @param pageIndex - Zero-based page index to display.
 * @param pageSize - Optional number of items to show per page.
 */
export function paginateTickets(
  tickets: readonly SupportTicket[],
  pageIndex: number,
  pageSize?: number
): SupportAdminTicketPage {
  const page = paginateItems(tickets, pageIndex, pageSize);

  return {
    visibleTickets: page.visibleItems,
    pageIndex: page.pageIndex,
    currentPage: page.currentPage,
    pageCount: page.pageCount,
    pageSize: page.pageSize,
    totalTickets: page.totalItems,
    firstVisibleTicketNumber: page.firstVisibleItemNumber,
    lastVisibleTicketNumber: page.lastVisibleItemNumber,
  };
}
