import type { SupportLiveChatSession } from '../../supportFlowTypes';
import {
  escapeMarkdown,
  formatLiveChatStatusLabel,
  formatTimestamp,
  joinMarkdownLines,
  type SupportPaginationPage,
} from '../../supportFlowUtils';

/**
 * Formats live chat message author for display in chat messages.
 *
 * @param message - Message to inspect, format, or clone.
 */
function formatLiveChatMessageAuthor(
  message: NonNullable<SupportLiveChatSession['messages']>[number]
): string {
  if (message.author === 'customer') {
    return message.authorLabel ?? 'Customer';
  }

  if (message.author === 'agent') {
    return message.authorLabel ?? 'Support agent';
  }

  return message.authorLabel ?? 'System';
}

/**
 * Formats live chat queue summary for display in chat messages.
 *
 * @param page - Pagination state used to render the current view.
 */
export function formatLiveChatQueueSummary(
  page: SupportPaginationPage<SupportLiveChatSession>
): string {
  return joinMarkdownLines([
    '## Live chat queue',
    '',
    page.pageCount > 1
      ? `_Showing live chats ${page.firstVisibleItemNumber}-${page.lastVisibleItemNumber} of ${page.totalItems}._`
      : undefined,
    ...page.visibleItems.map(session => {
      const customerText =
        session.customer?.name ?? session.customer?.email ?? 'Unknown customer';
      const ticketText = session.ticketReference
        ? `linked to ${escapeMarkdown(session.ticketReference)}`
        : 'not linked to a ticket';

      return `- **${escapeMarkdown(session.id)}:** ${escapeMarkdown(formatLiveChatStatusLabel(session.status))}, position ${session.queuePosition}, ${session.estimatedWaitMinutes} min wait, ${ticketText}, ${escapeMarkdown(customerText)}`;
    }),
  ]);
}

/**
 * Formats live chat details for display in chat messages.
 *
 * @param session - Live chat session to inspect, format, or update.
 * @param transcriptLimit - Optional maximum number of transcript messages to include.
 */
export function formatLiveChatDetails(
  session: SupportLiveChatSession,
  transcriptLimit?: number
): string {
  const messages = session.messages ?? [];
  const safeTranscriptLimit =
    transcriptLimit === undefined
      ? messages.length
      : Math.max(0, Math.floor(transcriptLimit));
  const visibleMessages =
    safeTranscriptLimit === 0 ? [] : messages.slice(-safeTranscriptLimit);

  return joinMarkdownLines([
    `## Live chat ${escapeMarkdown(session.id)}`,
    '',
    `- **Status:** ${escapeMarkdown(formatLiveChatStatusLabel(session.status))}`,
    `- **Requested by:** ${escapeMarkdown(session.requestedBy)}`,
    `- **Queue position:** ${session.queuePosition}`,
    `- **Estimated wait:** ${session.estimatedWaitMinutes} minutes`,
    session.ticketReference
      ? `- **Linked ticket:** ${escapeMarkdown(session.ticketReference)}`
      : '- **Linked ticket:** None',
    session.customer
      ? `- **Customer:** ${escapeMarkdown(session.customer.name ?? session.customer.email ?? 'Unknown customer')}`
      : '- **Customer:** Unknown customer',
    session.agent
      ? `- **Agent:** ${escapeMarkdown(session.agent.name ?? session.agent.email ?? 'Unknown agent')}`
      : undefined,
    `- **Requested:** ${escapeMarkdown(formatTimestamp(session.createdAt))}`,
    '',
    '### Handoff summary',
    '',
    escapeMarkdown(session.summary),
    '',
    visibleMessages.length ? '### Chat transcript' : undefined,
    '',
    ...visibleMessages.map(message => {
      return `- **${escapeMarkdown(formatLiveChatMessageAuthor(message))}** (${escapeMarkdown(formatTimestamp(message.createdAt))}): ${escapeMarkdown(message.body)}`;
    }),
    messages.length > safeTranscriptLimit
      ? `_Showing the ${safeTranscriptLimit} most recent messages._`
      : undefined,
  ]);
}
