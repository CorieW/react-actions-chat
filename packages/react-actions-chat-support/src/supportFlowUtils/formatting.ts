import type {
  SupportAgentIdentity,
  SupportLiveChatSession,
  SupportTicket,
  SupportUserIdentity,
} from '../supportFlowTypes';

/**
 * Formats timestamp for display in chat messages.
 *
 * @param timestamp - Timestamp to format for display.
 */
export function formatTimestamp(timestamp: Date): string {
  return timestamp.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/**
 * Escapes markdown control characters in user- or adapter-provided text.
 *
 * @param text - Text value to embed, escape, or inspect.
 */
export function escapeMarkdown(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/([`*_{}[\]()#+!|>])/g, '\\$1');
}

/**
 * Formats ticket status label for display in chat messages.
 *
 * @param status - Status value to format for display.
 */
export function formatTicketStatusLabel(
  status: SupportTicket['status']
): string {
  return status.replace('-', ' ');
}

/**
 * Formats live chat status label for display in chat messages.
 *
 * @param status - Status value to format for display.
 */
export function formatLiveChatStatusLabel(
  status: SupportLiveChatSession['status']
): string {
  return status.replace('-', ' ');
}

/**
 * Joins optional markdown lines while dropping empty entries.
 *
 * @param lines - Optional markdown lines to join.
 */
export function joinMarkdownLines(
  lines: ReadonlyArray<string | undefined>
): string {
  return lines.filter((line): line is string => Boolean(line)).join('\n');
}

/**
 * Formats the visible author label for a ticket activity entry.
 *
 * @param ticket - Support ticket to inspect, format, or update.
 * @param message - Message to inspect, format, or clone.
 */
function formatTicketMessageAuthor(
  ticket: SupportTicket,
  message: SupportTicket['messages'][number]
): string {
  if (message.author === 'customer') {
    return (
      message.authorLabel ??
      ticket.customer.name ??
      ticket.customer.email ??
      'Customer'
    );
  }

  if (message.author === 'agent') {
    return message.authorLabel ?? 'Support agent';
  }

  return message.authorLabel ?? 'System';
}

/**
 * Formats ticket recent activity for display in chat messages.
 *
 * @param ticket - Support ticket to inspect, format, or update.
 * @param limit - Optional maximum number of entries to include.
 */
export function formatTicketRecentActivity(
  ticket: SupportTicket,
  limit?: number
): string | undefined {
  const safeLimit =
    limit === undefined ? ticket.messages.length : Math.max(0, Math.floor(limit));

  if (safeLimit === 0) {
    return undefined;
  }

  const recentMessages = ticket.messages.slice(-safeLimit);

  if (!recentMessages.length) {
    return undefined;
  }

  return joinMarkdownLines([
    '### Recent activity',
    '',
    ...recentMessages.map(message => {
      return `- **${escapeMarkdown(formatTicketMessageAuthor(ticket, message))}** (${escapeMarkdown(formatTimestamp(message.createdAt))}): ${escapeMarkdown(message.body)}`;
    }),
    ticket.messages.length > safeLimit
      ? `_Showing the ${safeLimit} most recent updates._`
      : undefined,
  ]);
}

/**
 * Formats ticket full activity for display in chat messages.
 *
 * @param ticket - Support ticket to inspect, format, or update.
 */
export function formatTicketFullActivity(ticket: SupportTicket): string {
  return joinMarkdownLines([
    `## Full activity for ${escapeMarkdown(ticket.reference)}`,
    '',
    ...ticket.messages.map(message => {
      return `- **${escapeMarkdown(formatTicketMessageAuthor(ticket, message))}** (${escapeMarkdown(formatTimestamp(message.createdAt))}): ${escapeMarkdown(message.body)}`;
    }),
  ]);
}

/**
 * Derives agent label from available support data.
 *
 * @param agent - Agent identity used for the admin support action.
 */
export function deriveAgentLabel(agent: SupportAgentIdentity): string {
  return agent.name ?? agent.email ?? 'Current agent';
}

/**
 * Derives customer label from available support data.
 *
 * @param customer - Customer identity used for the support action.
 */
export function deriveCustomerLabel(customer: SupportUserIdentity): string {
  return customer.name ?? customer.email ?? 'the customer';
}

/**
 * Normalizes reference for consistent lookups.
 *
 * @param reference - Ticket reference to normalize or look up.
 */
export function normalizeReference(reference: string): string {
  return reference.trim().toUpperCase();
}

/**
 * Returns whether open live chat.
 *
 * @param session - Live chat session to inspect, format, or update.
 */
export function isOpenLiveChat(session: SupportLiveChatSession): boolean {
  return session.status === 'queued' || session.status === 'active';
}
