import type { MessageButton } from 'react-actions-chat';
import type { SupportTicket } from '../../supportFlowTypes';
import { paginateItems } from '../../supportFlowUtils';

export interface SupportAdminTicketPage {
  readonly visibleTickets: readonly SupportTicket[];
  readonly pageIndex: number;
  readonly currentPage: number;
  readonly pageCount: number;
  readonly pageSize: number;
  readonly totalTickets: number;
  readonly firstVisibleTicketNumber: number;
  readonly lastVisibleTicketNumber: number;
}

export function getTicketQueueButtonVariant(
  ticket: SupportTicket
): MessageButton['variant'] {
  return ticket.assignedTo ? 'error' : 'success';
}

export function sortTicketsByAssignment(
  tickets: readonly SupportTicket[]
): readonly SupportTicket[] {
  const unassignedTickets = tickets.filter(ticket => !ticket.assignedTo);
  const assignedTickets = tickets.filter(ticket => ticket.assignedTo);

  return [...unassignedTickets, ...assignedTickets];
}

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
