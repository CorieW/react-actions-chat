import type { SupportLiveChatSession } from '../../supportFlowTypes';
import {
  escapeMarkdown,
  formatLiveChatStatusLabel,
  joinMarkdownLines,
} from '../../supportFlowUtils';

/**
 * Formats live chat details for display in chat messages.
 *
 * @param session - Live chat session to inspect, format, or update.
 */
export function formatLiveChatDetails(session: SupportLiveChatSession): string {
  return joinMarkdownLines([
    '## Live chat',
    '',
    `- **Status:** ${escapeMarkdown(formatLiveChatStatusLabel(session.status))}`,
    `- **Estimated wait:** ${session.estimatedWaitMinutes} minutes`,
  ]);
}

/**
 * Formats live chat ended for display in chat messages.
 *
 * @param session - Live chat session to inspect, format, or update.
 */
export function formatLiveChatEnded(session: SupportLiveChatSession): string {
  return joinMarkdownLines([
    '## Ended live chat',
    '',
    `- **Status:** ${escapeMarkdown(formatLiveChatStatusLabel(session.status))}`,
  ]);
}
