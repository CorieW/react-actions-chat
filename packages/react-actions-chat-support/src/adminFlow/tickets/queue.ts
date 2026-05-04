import type { MessageButton } from 'react-actions-chat';
import type { SupportTicket } from '../../supportFlowTypes';
import {
  paginateItems,
  type SupportPaginationPage,
} from '../../supportFlowUtils';

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
   * Zero-based ticket offset for the first visible ticket.
   */
  readonly offset: number;
  /**
   * Total number of support tickets before pagination.
   */
  readonly totalTickets: number;
  /**
   * Whether totalTickets is the exact total rather than a lower bound.
   */
  readonly isTotalTicketsExact: boolean;
  /**
   * Whether another ticket page is available after the current page.
   */
  readonly hasMoreTickets: boolean;
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
 * Converts a shared pagination page into the admin ticket page shape.
 *
 * @param page - Shared pagination page to adapt for admin ticket queues.
 */
export function createAdminTicketPage(
  page: SupportPaginationPage<SupportTicket>
): SupportAdminTicketPage {
  return {
    visibleTickets: page.visibleItems,
    pageIndex: page.pageIndex,
    currentPage: page.currentPage,
    pageCount: page.pageCount,
    pageSize: page.pageSize,
    offset: page.offset,
    totalTickets: page.totalItems,
    isTotalTicketsExact: page.isTotalItemsExact,
    hasMoreTickets: page.hasMoreItems,
    firstVisibleTicketNumber: page.firstVisibleItemNumber,
    lastVisibleTicketNumber: page.lastVisibleItemNumber,
  };
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
  return createAdminTicketPage(paginateItems(tickets, pageIndex, pageSize));
}
