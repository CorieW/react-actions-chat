import type { SupportAdminFlowLabels } from '../types';

export const DEFAULT_PRIORITY_ORDER = [
  'low',
  'normal',
  'high',
  'urgent',
] as const;

type AdminTicketLabels = Pick<
  SupportAdminFlowLabels,
  | 'viewTicketQueue'
  | 'reviewTicket'
  | 'myAssignedWork'
  | 'previousTickets'
  | 'nextTickets'
  | 'refreshTicketQueue'
  | 'assignToMe'
  | 'assignedToMe'
  | 'assignToAgent'
  | 'setPriority'
  | 'setPriorityPrompt'
  | 'setPriorityPlaceholder'
  | 'setPriorityDescription'
  | 'viewFullActivity'
  | 'replyToCustomer'
  | 'reopenTicket'
  | 'resolveTicket'
  | 'resolveConfirm'
  | 'resolveReject'
>;

export const DEFAULT_ADMIN_TICKET_LABELS: AdminTicketLabels = {
  viewTicketQueue: 'View ticket queue',
  reviewTicket: 'Review a ticket',
  myAssignedWork: 'My assigned work',
  previousTickets: 'Previous tickets',
  nextTickets: 'Next tickets',
  refreshTicketQueue: 'Refresh ticket queue',
  assignToMe: 'Assign to me',
  assignedToMe: 'Unassign from me',
  assignToAgent: 'Assign to agent',
  setPriority: 'Set priority',
  setPriorityPrompt: ticket => `Choose a priority for ${ticket.reference}.`,
  setPriorityPlaceholder: 'Select priority',
  setPriorityDescription: 'Choose the urgency level for this ticket.',
  viewFullActivity: 'View full activity',
  replyToCustomer: 'Reply to customer',
  reopenTicket: 'Re-open ticket',
  resolveTicket: 'Resolve ticket',
  resolveConfirm: 'Resolve',
  resolveReject: 'Keep open',
};
