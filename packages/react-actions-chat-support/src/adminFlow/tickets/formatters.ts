import type { SupportTicket } from '../../supportFlowTypes';
import {
  escapeMarkdown,
  formatTicketRecentActivity,
  formatTicketStatusLabel,
  formatTimestamp,
  joinMarkdownLines,
} from '../../supportFlowUtils';
import type { SupportAdminTicketPage } from './queue';

/**
 * Formats queue summary for display in chat messages.
 *
 * @param tickets - Support tickets to sort, paginate, or render.
 * @param page - Pagination state used to render the current view.
 */
export function formatQueueSummary(
  tickets: readonly SupportTicket[],
  page: SupportAdminTicketPage
): string {
  const totalText = page.isTotalTicketsExact
    ? `${page.totalTickets}`
    : `at least ${page.totalTickets}`;

  return joinMarkdownLines([
    '## Ticket queue',
    '',
    page.pageCount > 1
      ? `_Showing tickets ${page.firstVisibleTicketNumber}-${page.lastVisibleTicketNumber} of ${totalText}._`
      : undefined,
    '',
    ...tickets.map(ticket => {
      const assignedText = ticket.assignedTo
        ? `assigned to ${escapeMarkdown(ticket.assignedTo)}`
        : 'unassigned';
      return `- **${escapeMarkdown(ticket.reference)} (${escapeMarkdown(ticket.priority)}):** ${escapeMarkdown(ticket.subject)} (${escapeMarkdown(formatTicketStatusLabel(ticket.status))}, ${assignedText})`;
    }),
  ]);
}

/**
 * Formats ticket details for display in chat messages.
 *
 * @param ticket - Support ticket to inspect, format, or update.
 * @param recentActivityLimit - Optional maximum number of recent activity entries to include.
 */
export function formatTicketDetails(
  ticket: SupportTicket,
  recentActivityLimit?: number
): string {
  const latestMessage = ticket.messages[ticket.messages.length - 1];
  return joinMarkdownLines([
    `## Ticket ${escapeMarkdown(ticket.reference)}`,
    '',
    `- **Status:** ${escapeMarkdown(formatTicketStatusLabel(ticket.status))}`,
    `- **Priority:** ${escapeMarkdown(ticket.priority)}`,
    `- **Customer:** ${escapeMarkdown(ticket.customer.name ?? ticket.customer.email ?? 'Unknown customer')}`,
    `- **Subject:** ${escapeMarkdown(ticket.subject)}`,
    ticket.assignedTo
      ? `- **Assigned to:** ${escapeMarkdown(ticket.assignedTo)}`
      : '- **Assigned to:** No agent assigned yet',
    `- **Updated:** ${escapeMarkdown(formatTimestamp(ticket.updatedAt))}`,
    latestMessage
      ? `- **Latest message:** ${escapeMarkdown(latestMessage.authorLabel ?? latestMessage.author)} said "${escapeMarkdown(latestMessage.body)}"`
      : undefined,
    '',
    formatTicketRecentActivity(ticket, recentActivityLimit),
  ]);
}
