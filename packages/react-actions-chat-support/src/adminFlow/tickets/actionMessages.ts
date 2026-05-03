import type { SupportTicket } from '../../supportFlowTypes';
import {
  escapeMarkdown,
  formatTicketStatusLabel,
  joinMarkdownLines,
} from '../../supportFlowUtils';

/**
 * Formats assigned work empty message for display in chat messages.
 *
 * @param agentLabel - Display label for the current support agent.
 */
export function formatAssignedWorkEmptyMessage(agentLabel: string): string {
  return joinMarkdownLines([
    `## ${escapeMarkdown(agentLabel)} does not have any assigned tickets right now`,
    '',
    'View the full queue to pick up the next request.',
  ]);
}

/**
 * Formats ticket unassigned message for display in chat messages.
 *
 * @param ticket - Support ticket to inspect, format, or update.
 */
export function formatTicketUnassignedMessage(ticket: SupportTicket): string {
  return joinMarkdownLines([
    `## ${escapeMarkdown(ticket.reference)} is now unassigned`,
    '',
    `- **Status:** ${escapeMarkdown(formatTicketStatusLabel(ticket.status))}`,
    `- **Priority:** ${escapeMarkdown(ticket.priority)}`,
  ]);
}

/**
 * Formats ticket assigned message for display in chat messages.
 *
 * @param ticket - Support ticket to inspect, format, or update.
 * @param assignee - Agent name or email assigned to the ticket.
 */
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

/**
 * Formats ticket priority changed message for display in chat messages.
 *
 * @param ticket - Support ticket to inspect, format, or update.
 */
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

/**
 * Formats ticket reply sent message for display in chat messages.
 *
 * @param ticket - Support ticket to inspect, format, or update.
 * @param agentLabel - Display label for the current support agent.
 * @param body - Message body being formatted or appended.
 */
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

/**
 * Formats ticket reopened message for display in chat messages.
 *
 * @param ticket - Support ticket to inspect, format, or update.
 * @param agentLabel - Display label for the current support agent.
 */
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

/**
 * Formats ticket resolved message for display in chat messages.
 *
 * @param ticket - Support ticket to inspect, format, or update.
 * @param agentLabel - Display label for the current support agent.
 */
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
