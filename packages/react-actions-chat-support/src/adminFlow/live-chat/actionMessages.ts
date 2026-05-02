import type { SupportLiveChatSession } from '../../supportFlowTypes';
import {
  escapeMarkdown,
  formatLiveChatStatusLabel,
  joinMarkdownLines,
} from '../../supportFlowUtils';

export function formatLiveChatEndedMessage(
  session: SupportLiveChatSession
): string {
  return joinMarkdownLines([
    `## Ended live chat ${escapeMarkdown(session.id)}`,
    '',
    `- **Status:** ${escapeMarkdown(formatLiveChatStatusLabel(session.status))}`,
  ]);
}

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
