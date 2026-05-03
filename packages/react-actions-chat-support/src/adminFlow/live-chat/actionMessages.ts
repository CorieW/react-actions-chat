import type { SupportLiveChatSession } from '../../supportFlowTypes';
import {
  escapeMarkdown,
  formatLiveChatStatusLabel,
  joinMarkdownLines,
} from '../../supportFlowUtils';

/**
 * Formats live chat ended message for display in chat messages.
 *
 * @param session - Live chat session to inspect, format, or update.
 */
export function formatLiveChatEndedMessage(
  session: SupportLiveChatSession
): string {
  return joinMarkdownLines([
    `## Ended live chat ${escapeMarkdown(session.id)}`,
    '',
    `- **Status:** ${escapeMarkdown(formatLiveChatStatusLabel(session.status))}`,
  ]);
}

/**
 * Formats live chat left message for display in chat messages.
 *
 * @param session - Live chat session to inspect, format, or update.
 */
export function formatLiveChatLeftMessage(
  session: SupportLiveChatSession
): string {
  return joinMarkdownLines([
    `## Left live chat ${escapeMarkdown(session.id)}`,
    '',
    `- **Status:** ${escapeMarkdown(formatLiveChatStatusLabel(session.status))}`,
    `- **Queue position:** ${session.queuePosition}`,
  ]);
}

/**
 * Formats live chat joined message for display in chat messages.
 *
 * @param session - Live chat session to inspect, format, or update.
 * @param agentLabel - Display label for the current support agent.
 */
export function formatLiveChatJoinedMessage(
  session: SupportLiveChatSession,
  agentLabel: string
): string {
  return joinMarkdownLines([
    `## Joined live chat ${escapeMarkdown(session.id)}`,
    '',
    `- **Status:** ${escapeMarkdown(formatLiveChatStatusLabel(session.status))}`,
    `- **Agent:** ${escapeMarkdown(agentLabel)}`,
  ]);
}
