import type { SupportTicket } from '../../supportFlowTypes';
import {
  escapeMarkdown,
  formatTicketStatusLabel,
  joinMarkdownLines,
} from '../../supportFlowUtils';

export function formatAssignedWorkEmptyMessage(agentLabel: string): string {
  return joinMarkdownLines([
    `## ${escapeMarkdown(agentLabel)} does not have any assigned tickets right now`,
    '',
    'View the full queue to pick up the next request.',
  ]);
}

export function formatTicketUnassignedMessage(ticket: SupportTicket): string {
  return joinMarkdownLines([
    `## ${escapeMarkdown(ticket.reference)} is now unassigned`,
    '',
    `- **Status:** ${escapeMarkdown(formatTicketStatusLabel(ticket.status))}`,
    `- **Priority:** ${escapeMarkdown(ticket.priority)}`,
  ]);
}

export function formatTicketAssignedMessage(
  ticket: SupportTicket,
  assignee: string
): string {
  return joinMarkdownLines([
    `## ${escapeMarkdown(ticket.reference)} is now assigned to ${escapeMarkdown(assignee)}`,
    '',
    `- **Status:** ${escapeMarkdown(formatTicketStatusLabel(ticket.status))}`,
    `- **Priority:** ${escapeMarkdown(ticket.priority)}`,
  ]);
}

export function formatTicketPriorityChangedMessage(
  ticket: SupportTicket
): string {
  return joinMarkdownLines([
    `## ${escapeMarkdown(ticket.reference)} is now ${escapeMarkdown(ticket.priority)} priority`,
    '',
    `- **Assigned to:** ${escapeMarkdown(ticket.assignedTo ?? 'No agent assigned yet')}`,
    `- **Status:** ${escapeMarkdown(formatTicketStatusLabel(ticket.status))}`,
  ]);
}

export function formatTicketReplySentMessage(
  ticket: SupportTicket,
  agentLabel: string,
  body: string
): string {
  return joinMarkdownLines([
    `## Sent your reply on ${escapeMarkdown(ticket.reference)}`,
    '',
    `- **Assigned to:** ${escapeMarkdown(ticket.assignedTo ?? agentLabel)}`,
    `- **Next status:** ${escapeMarkdown(formatTicketStatusLabel(ticket.status))}`,
    '',
    '### Reply sent',
    '',
    escapeMarkdown(body),
  ]);
}

export function formatTicketReopenedMessage(
  ticket: SupportTicket,
  agentLabel: string
): string {
  return joinMarkdownLines([
    `## ${escapeMarkdown(ticket.reference)} is open again`,
    '',
    `- **Assigned to:** ${escapeMarkdown(ticket.assignedTo ?? agentLabel)}`,
    `- **Priority:** ${escapeMarkdown(ticket.priority)}`,
  ]);
}

export function formatTicketResolvedMessage(
  ticket: SupportTicket,
  agentLabel: string
): string {
  return joinMarkdownLines([
    `## ${escapeMarkdown(ticket.reference)} has been resolved`,
    '',
    `- **Assigned to:** ${escapeMarkdown(ticket.assignedTo ?? agentLabel)}`,
    `- **Priority:** ${escapeMarkdown(ticket.priority)}`,
  ]);
}
