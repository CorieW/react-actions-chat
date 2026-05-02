import type {
  SupportAgentIdentity,
  SupportLiveChatSession,
  SupportTicket,
  SupportUserIdentity,
} from '../supportFlowTypes';

export function formatTimestamp(timestamp: Date): string {
  return timestamp.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function escapeMarkdown(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/([`*_{}[\]()#+!|>])/g, '\\$1');
}

export function formatTicketStatusLabel(
  status: SupportTicket['status']
): string {
  return status.replace('-', ' ');
}

export function formatLiveChatStatusLabel(
  status: SupportLiveChatSession['status']
): string {
  return status.replace('-', ' ');
}

export function joinMarkdownLines(
  lines: ReadonlyArray<string | undefined>
): string {
  return lines.filter((line): line is string => Boolean(line)).join('\n');
}

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

export function formatTicketRecentActivity(
  ticket: SupportTicket,
  limit: number
): string | undefined {
  const recentMessages = ticket.messages.slice(-limit);

  if (!recentMessages.length) {
    return undefined;
  }

  return joinMarkdownLines([
    '### Recent activity',
    '',
    ...recentMessages.map(message => {
      return `- **${escapeMarkdown(formatTicketMessageAuthor(ticket, message))}** (${escapeMarkdown(formatTimestamp(message.createdAt))}): ${escapeMarkdown(message.body)}`;
    }),
    ticket.messages.length > limit
      ? `_Showing the ${limit} most recent updates._`
      : undefined,
  ]);
}

export function formatTicketFullActivity(ticket: SupportTicket): string {
  return joinMarkdownLines([
    `## Full activity for ${escapeMarkdown(ticket.reference)}`,
    '',
    ...ticket.messages.map(message => {
      return `- **${escapeMarkdown(formatTicketMessageAuthor(ticket, message))}** (${escapeMarkdown(formatTimestamp(message.createdAt))}): ${escapeMarkdown(message.body)}`;
    }),
  ]);
}

export function deriveAgentLabel(agent: SupportAgentIdentity): string {
  return agent.name ?? agent.email ?? 'Current agent';
}

export function deriveCustomerLabel(customer: SupportUserIdentity): string {
  return customer.name ?? customer.email ?? 'the customer';
}

export function normalizeReference(reference: string): string {
  return reference.trim().toUpperCase();
}

export function isOpenLiveChat(session: SupportLiveChatSession): boolean {
  return session.status === 'queued' || session.status === 'active';
}
