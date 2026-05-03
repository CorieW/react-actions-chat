import type { SupportTicket } from '../../supportFlowTypes';
import {
  escapeMarkdown,
  formatTicketRecentActivity,
  formatTicketStatusLabel,
  formatTimestamp,
  joinMarkdownLines,
  type SupportPaginationPage,
} from '../../supportFlowUtils';

/**
 * Formats ticket summary for display in chat messages.
 *
 * @param ticket - Support ticket to inspect, format, or update.
 * @param recentActivityLimit - Optional maximum number of recent activity entries to include.
 */
export function formatTicketSummary(
  ticket: SupportTicket,
  recentActivityLimit?: number
): string {
  const latestMessage = ticket.messages[ticket.messages.length - 1];
  return joinMarkdownLines([
    `## Ticket ${escapeMarkdown(ticket.reference)}`,
    '',
    `- **Status:** ${escapeMarkdown(formatTicketStatusLabel(ticket.status))}`,
    `- **Priority:** ${escapeMarkdown(ticket.priority)}`,
    `- **Subject:** ${escapeMarkdown(ticket.subject)}`,
    ticket.assignedTo
      ? `- **Assigned to:** ${escapeMarkdown(ticket.assignedTo)}`
      : '- **Assigned to:** No agent assigned yet',
    `- **Last updated:** ${escapeMarkdown(formatTimestamp(ticket.updatedAt))}`,
    latestMessage
      ? `- **Latest update:** ${escapeMarkdown(latestMessage.body)}`
      : undefined,
    '',
    formatTicketRecentActivity(ticket, recentActivityLimit),
  ]);
}

/**
 * Formats ticket list for display in chat messages.
 *
 * @param page - Pagination state used to render the current view.
 */
export function formatTicketList(
  page: SupportPaginationPage<SupportTicket>
): string {
  const ticketLines = page.visibleItems
    .map(ticket => {
      return `- **${escapeMarkdown(ticket.reference)} (${escapeMarkdown(ticket.priority)}):** ${escapeMarkdown(ticket.subject)} (${escapeMarkdown(formatTicketStatusLabel(ticket.status))})`;
    })
    .join('\n');

  return joinMarkdownLines([
    '## Here are your latest tickets:',
    '',
    page.pageCount > 1
      ? `_Showing tickets ${page.firstVisibleItemNumber}-${page.lastVisibleItemNumber} of ${page.totalItems}._`
      : undefined,
    ticketLines,
  ]);
}
