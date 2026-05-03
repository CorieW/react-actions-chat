import { escapeMarkdown, joinMarkdownLines } from '../supportFlowUtils';
import type { SupportAdminFormatterContext } from './types';

/**
 * Formats admin opening message for display in chat messages.
 *
 * @param context - Context object available to this resolver.
 */
export function formatAdminOpeningMessage(
  context: SupportAdminFormatterContext
): string {
  const { brandName, labels, capabilities } = context;
  const actions = [
    capabilities.canListTicketQueue
      ? `- ${escapeMarkdown(labels.viewTicketQueue)}`
      : undefined,
    capabilities.canGetTicket
      ? `- ${escapeMarkdown(labels.reviewTicket)}`
      : undefined,
    capabilities.canListTicketQueue
      ? `- ${escapeMarkdown(labels.myAssignedWork)}`
      : undefined,
    capabilities.canOpenLiveChatQueue
      ? `- ${escapeMarkdown(labels.viewLiveChatQueue)}`
      : undefined,
    capabilities.canOpenLiveChatQueue &&
    capabilities.canUpdateLiveChat &&
    capabilities.canAppendLiveChatMessage
      ? `- ${escapeMarkdown(labels.joinLiveChat)} and reply to active live chats`
      : undefined,
  ];

  return joinMarkdownLines([
    `## ${escapeMarkdown(brandName)} is ready`,
    '',
    actions.some(Boolean)
      ? 'You can work from here:'
      : 'No admin support actions are configured yet.',
    '',
    ...actions,
  ]);
}
