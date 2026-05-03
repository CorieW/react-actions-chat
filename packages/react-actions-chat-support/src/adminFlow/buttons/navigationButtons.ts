import { createButton, type MessageButton } from 'react-actions-chat';
import type { SupportAdminFlowLabels } from '../types';

/**
 * Options used to create back-to-admin-options button.
 */
interface CreateBackToAdminOptionsButtonOptions {
  /**
   * Resolved labels used by this flow or helper.
   */
  readonly labels: SupportAdminFlowLabels;
  /**
   * Handler used to render the initial flow options.
   */
  readonly showInitialOptions: () => void;
}

/**
 * Creates a back-to-admin-options button.
 *
 * @param options - Options for creating the back-to-admin-options button.
 */
export function createBackToAdminOptionsButton({
  labels,
  showInitialOptions,
}: CreateBackToAdminOptionsButtonOptions): MessageButton {
  return createButton({
    label: labels.backToAdminOptions,
    onClick: showInitialOptions,
  });
}

/**
 * Options used to create refresh live chat button.
 */
interface CreateRefreshLiveChatButtonOptions {
  /**
   * Resolved labels used by this flow or helper.
   */
  readonly labels: SupportAdminFlowLabels;
  /**
   * Identifier for the live-chat session.
   */
  readonly sessionId: string;
  /**
   * Shows a live chat session.
   *
   * @param sessionId - Live chat session ID to look up.
   */
  readonly showLiveChat: (sessionId: string) => void;
}

/**
 * Creates a refresh live chat button.
 *
 * @param options - Options for creating the refresh live chat button.
 */
export function createRefreshLiveChatButton({
  labels,
  sessionId,
  showLiveChat,
}: CreateRefreshLiveChatButtonOptions): MessageButton {
  return createButton({
    label: labels.refreshChat,
    onClick: () => {
      showLiveChat(sessionId);
    },
  });
}
