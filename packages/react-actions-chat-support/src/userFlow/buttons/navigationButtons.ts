import { createButton, type MessageButton } from 'react-actions-chat';
import type { SupportUserFlowLabels } from '../types';

/**
 * Options used to create back-to-support-options button.
 */
interface CreateBackToSupportOptionsButtonOptions {
  /**
   * Resolved labels used by this flow or helper.
   */
  readonly labels: SupportUserFlowLabels;
  /**
   * Handler used to render the initial flow options.
   */
  readonly showInitialOptions: () => void;
}

/**
 * Creates a back-to-support-options button.
 *
 * @param options - Options for creating the back-to-support-options button.
 */
export function createBackToSupportOptionsButton({
  labels,
  showInitialOptions,
}: CreateBackToSupportOptionsButtonOptions): MessageButton {
  return createButton({
    label: labels.backToSupportOptions,
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
  readonly labels: SupportUserFlowLabels;
  /**
   * Identifier for the live-chat session.
   */
  readonly sessionId: string;
  /**
   * Shows a customer live chat session.
   *
   * @param sessionId - Live chat session ID to look up.
   */
  readonly showLiveChatSession: (sessionId: string) => void;
}

/**
 * Creates a refresh live chat button.
 *
 * @param options - Options for creating the refresh live chat button.
 */
export function createRefreshLiveChatButton({
  labels,
  sessionId,
  showLiveChatSession,
}: CreateRefreshLiveChatButtonOptions): MessageButton {
  return createButton({
    label: labels.refreshChat,
    onClick: () => {
      showLiveChatSession(sessionId);
    },
  });
}
