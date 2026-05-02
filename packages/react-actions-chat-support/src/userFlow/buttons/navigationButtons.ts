import { createButton, type MessageButton } from 'react-actions-chat';
import type { SupportUserFlowLabels } from '../types';

interface CreateBackToSupportOptionsButtonOptions {
  readonly labels: SupportUserFlowLabels;
  readonly showInitialOptions: () => void;
}

export function createBackToSupportOptionsButton({
  labels,
  showInitialOptions,
}: CreateBackToSupportOptionsButtonOptions): MessageButton {
  return createButton({
    label: labels.backToSupportOptions,
    onClick: showInitialOptions,
  });
}

interface CreateRefreshLiveChatButtonOptions {
  readonly labels: SupportUserFlowLabels;
  readonly sessionId: string;
  readonly showLiveChatSession: (sessionId: string) => void;
}

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
