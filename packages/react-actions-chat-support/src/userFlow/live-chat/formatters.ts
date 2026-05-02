import type { SupportLiveChatSession } from '../../supportFlowTypes';
import {
  escapeMarkdown,
  formatLiveChatStatusLabel,
  joinMarkdownLines,
} from '../../supportFlowUtils';

export function formatLiveChatDetails(session: SupportLiveChatSession): string {
  return joinMarkdownLines([
    '## Live chat',
    '',
    `- **Status:** ${escapeMarkdown(formatLiveChatStatusLabel(session.status))}`,
    `- **Estimated wait:** ${session.estimatedWaitMinutes} minutes`,
  ]);
}

export function formatLiveChatEnded(session: SupportLiveChatSession): string {
  return joinMarkdownLines([
    '## Ended live chat',
    '',
    `- **Status:** ${escapeMarkdown(formatLiveChatStatusLabel(session.status))}`,
  ]);
}
