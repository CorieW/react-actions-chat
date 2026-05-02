import type { SupportUserFlowLabels } from '../types';

type UserTicketLabels = Pick<
  SupportUserFlowLabels,
  | 'startTicket'
  | 'viewTickets'
  | 'previousTickets'
  | 'nextTickets'
  | 'refreshStatus'
  | 'viewFullActivity'
  | 'addDetail'
>;

export const DEFAULT_USER_TICKET_LABELS: UserTicketLabels = {
  startTicket: 'Start ticket',
  viewTickets: 'View tickets',
  previousTickets: 'Previous tickets',
  nextTickets: 'Next tickets',
  refreshStatus: 'Refresh status',
  viewFullActivity: 'View full activity',
  addDetail: 'Add detail',
};
