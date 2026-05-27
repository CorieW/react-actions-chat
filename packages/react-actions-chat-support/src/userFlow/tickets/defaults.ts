import type { SupportUserFlowLabels } from '../types';

/**
 * Defaultable label contract for the customer ticket.
 */
type UserTicketLabels = Pick<
  SupportUserFlowLabels,
  | 'startTicket'
  | 'viewTickets'
  | 'previousTickets'
  | 'nextTickets'
  | 'refreshStatus'
  | 'viewFullActivity'
  | 'addDetail'
  | 'deleteTicket'
  | 'deleteConfirm'
  | 'deleteReject'
>;

/**
 * Default customer ticket labels used when callers do not override it.
 */
export const DEFAULT_USER_TICKET_LABELS: UserTicketLabels = {
  startTicket: 'Start ticket',
  viewTickets: 'View tickets',
  previousTickets: 'Previous tickets',
  nextTickets: 'Next tickets',
  refreshStatus: 'Refresh status',
  viewFullActivity: 'View full activity',
  addDetail: 'Add detail',
  deleteTicket: 'Delete ticket',
  deleteConfirm: 'Delete',
  deleteReject: 'Keep ticket',
};
