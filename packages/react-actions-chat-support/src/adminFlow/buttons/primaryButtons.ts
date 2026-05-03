import { createButton, type MessageButton } from 'react-actions-chat';
import type {
  SupportAdminFlowButtonContext,
  SupportAdminFlowLabels,
} from '../types';

/**
 * Button customization hook scoped to admin flow internals.
 *
 * @param context - Context object available to this resolver.
 */
type CustomizeAdminButtons = (
  context: Omit<SupportAdminFlowButtonContext, 'agent' | 'agentLabel'>
) => readonly MessageButton[];

/**
 * Options used to create admin primary buttons.
 */
interface CreateAdminPrimaryButtonsOptions {
  /**
   * Resolved labels used by this flow or helper.
   */
  readonly labels: SupportAdminFlowLabels;
  /**
   * Whether ticket queue listing is available.
   */
  readonly canListTicketQueue: boolean;
  /**
   * Whether opening the live-chat queue is available.
   */
  readonly canOpenLiveChatQueue: boolean;
  /**
   * Whether individual ticket lookup is available.
   */
  readonly canGetTicket: boolean;
  /**
   * Factory used to create the review-ticket action button.
   */
  readonly createReviewTicketButton: () => MessageButton;
  /**
   * Handler used to render the ticket queue.
   */
  readonly showTicketQueue: () => void;
  /**
   * Handler used to render the live-chat queue.
   */
  readonly showLiveChatQueue: () => void;
  /**
   * Shows the assigned work.
   */
  readonly showAssignedWork: () => void;
  /**
   * Hook used to customize admin primary buttons before rendering.
   */
  readonly customizeButtons: CustomizeAdminButtons;
}

/**
 * Creates admin primary buttons.
 *
 * @param options - Options for creating the admin primary buttons.
 */
export function createAdminPrimaryButtons({
  labels,
  canListTicketQueue,
  canOpenLiveChatQueue,
  canGetTicket,
  createReviewTicketButton,
  showTicketQueue,
  showLiveChatQueue,
  showAssignedWork,
  customizeButtons,
}: CreateAdminPrimaryButtonsOptions): readonly MessageButton[] {
  const defaultButtons = [
    ...(canListTicketQueue
      ? [
          createButton({
            label: labels.viewTicketQueue,
            onClick: showTicketQueue,
          }),
        ]
      : []),
    ...(canOpenLiveChatQueue
      ? [
          createButton({
            label: labels.viewLiveChatQueue,
            onClick: showLiveChatQueue,
          }),
        ]
      : []),
    ...(canGetTicket ? [createReviewTicketButton()] : []),
    ...(canListTicketQueue
      ? [
          createButton({
            label: labels.myAssignedWork,
            onClick: showAssignedWork,
          }),
        ]
      : []),
  ];

  return customizeButtons({
    slot: 'primary',
    defaultButtons,
  });
}
